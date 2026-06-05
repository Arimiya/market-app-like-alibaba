import { supabase, supabaseConfigurationMessage } from "./supabaseClient";

export type CatalogMedia = {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  storagePath: string;
  publicUrl: string;
  sortOrder: number;
};

export type CatalogProduct = {
  databaseId: string;
  sellerUserId: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  vendor: string;
  retailPrice: number;
  discountPrice?: number;
  wholesalePrice?: number;
  minimumOrderQuantity?: number;
  quantity: number;
  sku: string;
  condition: "New" | "Used";
  deliveryOptions: string[];
  status: "Draft" | "Published" | "Out of Stock" | "Suspended" | "Removed";
  images: string[];
  videoUrl?: string;
  media: CatalogMedia[];
};

type ProductMediaRow = {
  id: string;
  media_type: "IMAGE" | "VIDEO";
  storage_path: string;
  public_url: string;
  sort_order: number;
};

type ProductRow = {
  id: string;
  name: string;
  description: string;
  subcategory: string | null;
  brand: string | null;
  sku: string | null;
  condition: "NEW" | "USED";
  price: number | string;
  discount_price: number | string | null;
  wholesale_price: number | string | null;
  minimum_order_quantity: number | null;
  quantity: number;
  delivery_options: string[] | null;
  status: "DRAFT" | "PUBLISHED" | "OUT_OF_STOCK" | "SUSPENDED" | "REMOVED";
  vendor_user_id: string;
  stores: { name: string } | null;
  categories: { name: string } | null;
  product_media: ProductMediaRow[] | null;
};

export type SellerProductInput = {
  databaseId?: string;
  sellerUserId: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  condition: "New" | "Used";
  retailPrice: number;
  discountPrice?: number;
  wholesalePrice?: number;
  minimumOrderQuantity?: number;
  quantity: number;
  deliveryOptions: string[];
  status: "Draft" | "Published";
  imageFiles: File[];
  videoFile?: File;
};

const productSelect = `
  id, name, description, subcategory, brand, sku, condition, price, discount_price,
  wholesale_price, minimum_order_quantity, quantity, delivery_options, status, vendor_user_id,
  stores(name), categories(name),
  product_media(id, media_type, storage_path, public_url, sort_order)
`;

function requireClient() {
  if (!supabase) throw new Error(supabaseConfigurationMessage);
  return supabase;
}

function mapStatus(status: ProductRow["status"]): CatalogProduct["status"] {
  if (status === "OUT_OF_STOCK") return "Out of Stock";
  if (status === "SUSPENDED") return "Suspended";
  if (status === "REMOVED") return "Removed";
  if (status === "PUBLISHED") return "Published";
  return "Draft";
}

function mapProduct(row: ProductRow): CatalogProduct {
  const media = [...(row.product_media ?? [])]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item) => ({
      id: item.id,
      mediaType: item.media_type,
      storagePath: item.storage_path,
      publicUrl: item.public_url,
      sortOrder: item.sort_order
    }));
  return {
    databaseId: row.id,
    sellerUserId: row.vendor_user_id,
    name: row.name,
    description: row.description,
    category: row.categories?.name ?? "Uncategorised",
    subcategory: row.subcategory ?? "",
    brand: row.brand ?? "",
    vendor: row.stores?.name ?? "MarketHub Seller",
    retailPrice: Number(row.price),
    discountPrice: row.discount_price == null ? undefined : Number(row.discount_price),
    wholesalePrice: row.wholesale_price == null ? undefined : Number(row.wholesale_price),
    minimumOrderQuantity: row.minimum_order_quantity ?? undefined,
    quantity: row.quantity,
    sku: row.sku ?? "",
    condition: row.condition === "USED" ? "Used" : "New",
    deliveryOptions: row.delivery_options ?? [],
    status: mapStatus(row.status),
    images: media.filter((item) => item.mediaType === "IMAGE").map((item) => item.publicUrl),
    videoUrl: media.find((item) => item.mediaType === "VIDEO")?.publicUrl,
    media
  };
}

export async function loadPublishedProducts() {
  const client = requireClient();
  const { data, error } = await client
    .from("products")
    .select(productSelect)
    .eq("status", "PUBLISHED")
    .gt("quantity", 0)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
}

export async function loadSellerProducts(sellerUserId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from("products")
    .select(productSelect)
    .eq("vendor_user_id", sellerUserId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
}

function safeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

async function uploadPublicFile(bucket: string, path: string, file: File) {
  const client = requireClient();
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadSellerApplicationAssets(userId: string, logo: File, verificationDocument: File) {
  const client = requireClient();
  const token = crypto.randomUUID();
  const logoPath = `${userId}/${token}-${safeFileName(logo.name)}`;
  const documentPath = `${userId}/${token}-${safeFileName(verificationDocument.name)}`;
  const logoUrl = await uploadPublicFile("store-assets", logoPath, logo);
  const { error } = await client.storage.from("vendor-verification").upload(documentPath, verificationDocument, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) {
    await client.storage.from("store-assets").remove([logoPath]);
    throw error;
  }
  return { logoPath, logoUrl, verificationDocumentPath: documentPath };
}

export async function saveSellerProduct(input: SellerProductInput) {
  const client = requireClient();
  const { data: store, error: storeError } = await client
    .from("stores")
    .select("id")
    .eq("vendor_user_id", input.sellerUserId)
    .eq("status", "ACTIVE")
    .single<{ id: string }>();
  if (storeError || !store) throw new Error("Your approved seller store could not be found.");

  const { data: category, error: categoryError } = await client
    .from("categories")
    .select("id")
    .eq("name", input.category)
    .eq("status", "ACTIVE")
    .single<{ id: string }>();
  if (categoryError || !category) throw new Error("Select a valid active category.");

  const payload = {
    store_id: store.id,
    vendor_user_id: input.sellerUserId,
    category_id: category.id,
    name: input.name,
    slug: `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${input.sku.toLowerCase()}`,
    description: input.description,
    subcategory: input.subcategory,
    brand: input.brand || null,
    sku: input.sku,
    condition: input.condition.toUpperCase(),
    price: input.retailPrice,
    discount_price: input.discountPrice ?? null,
    wholesale_price: input.wholesalePrice ?? null,
    minimum_order_quantity: input.minimumOrderQuantity ?? null,
    quantity: input.quantity,
    delivery_options: input.deliveryOptions,
    status: input.quantity === 0 ? "OUT_OF_STOCK" : input.status.toUpperCase()
  };

  const productQuery = input.databaseId
    ? client.from("products").update(payload).eq("id", input.databaseId).select(productSelect).single()
    : client.from("products").insert(payload).select(productSelect).single();
  const { data, error } = await productQuery;
  if (error || !data) throw error ?? new Error("Could not save product.");
  const productId = (data as unknown as ProductRow).id;

  const mediaRows: Array<{
    product_id: string;
    media_type: "IMAGE" | "VIDEO";
    storage_path: string;
    public_url: string;
    sort_order: number;
  }> = [];
  for (const [index, file] of input.imageFiles.entries()) {
    const path = `${input.sellerUserId}/${productId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const publicUrl = await uploadPublicFile("product-images", path, file);
    mediaRows.push({ product_id: productId, media_type: "IMAGE", storage_path: path, public_url: publicUrl, sort_order: index });
  }
  if (input.videoFile) {
    const path = `${input.sellerUserId}/${productId}/${crypto.randomUUID()}-${safeFileName(input.videoFile.name)}`;
    const publicUrl = await uploadPublicFile("product-videos", path, input.videoFile);
    mediaRows.push({ product_id: productId, media_type: "VIDEO", storage_path: path, public_url: publicUrl, sort_order: 0 });
  }
  if (mediaRows.length > 0) {
    const { error: mediaError } = await client.from("product_media").insert(mediaRows);
    if (mediaError) throw mediaError;
  }

  const { data: saved, error: reloadError } = await client.from("products").select(productSelect).eq("id", productId).single();
  if (reloadError || !saved) throw reloadError ?? new Error("Could not reload saved product.");
  return mapProduct(saved as unknown as ProductRow);
}

export async function setSellerProductStatus(databaseId: string, status: "DRAFT" | "PUBLISHED") {
  const client = requireClient();
  const { error } = await client.from("products").update({ status }).eq("id", databaseId);
  if (error) throw error;
}

export async function setAdminProductStatus(databaseId: string, status: "PUBLISHED" | "SUSPENDED" | "REMOVED") {
  const client = requireClient();
  const { error } = await client.from("products").update({ status }).eq("id", databaseId);
  if (error) throw error;
}

export type ProductReportInput = {
  productId: string;
  reporterUserId?: string;
  sellerUserId: string;
  reason: string;
  description: string;
};

export type ProductReportRecord = ProductReportInput & {
  id: string;
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED";
  createdAt: string;
};

export type SellerReportRecord = {
  id: string;
  sellerUserId: string;
  reporterUserId?: string;
  reason: string;
  description: string;
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED";
  createdAt: string;
};

export type AccountDeletionRequestRecord = {
  id: string;
  userId: string;
  reason: string;
  status: "PENDING" | "REVIEWED" | "COMPLETED" | "REJECTED";
  createdAt: string;
};

type ProductReportRow = {
  id: string;
  product_id: string;
  reporter_user_id: string | null;
  seller_user_id: string;
  reason: string;
  description: string | null;
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED";
  created_at: string;
};

type SellerReportRow = {
  id: string;
  reporter_user_id: string | null;
  seller_user_id: string;
  reason: string;
  description: string | null;
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED";
  created_at: string;
};

type AccountDeletionRequestRow = {
  id: string;
  user_id: string;
  reason: string | null;
  status: "PENDING" | "REVIEWED" | "COMPLETED" | "REJECTED";
  created_at: string;
};

export async function createProductReport(input: ProductReportInput) {
  const client = requireClient();
  const { error } = await client.from("product_reports").insert({
    product_id: input.productId,
    reporter_user_id: input.reporterUserId ?? null,
    seller_user_id: input.sellerUserId,
    reason: input.reason,
    description: input.description,
    status: "PENDING"
  });
  if (error) throw error;
}

export async function loadProductReports() {
  const client = requireClient();
  const { data, error } = await client
    .from("product_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as ProductReportRow[]).map((row) => ({
    id: row.id,
    productId: row.product_id,
    reporterUserId: row.reporter_user_id ?? undefined,
    sellerUserId: row.seller_user_id,
    reason: row.reason,
    description: row.description ?? "",
    status: row.status,
    createdAt: new Date(row.created_at).toLocaleString()
  }));
}

export async function updateProductReportStatus(id: string, status: "REVIEWED" | "ACTION_TAKEN" | "DISMISSED", adminUserId: string) {
  const client = requireClient();
  const { error } = await client
    .from("product_reports")
    .update({ status, reviewed_by: adminUserId, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function createSellerReport(input: {
  sellerUserId: string;
  reporterUserId?: string;
  reason: string;
  description: string;
}) {
  const client = requireClient();
  const { error } = await client.from("seller_reports").insert({
    seller_user_id: input.sellerUserId,
    reporter_user_id: input.reporterUserId ?? null,
    reason: input.reason,
    description: input.description,
    status: "PENDING"
  });
  if (error) throw error;
}

export async function loadSellerReports() {
  const client = requireClient();
  const { data, error } = await client
    .from("seller_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as SellerReportRow[]).map((row) => ({
    id: row.id,
    sellerUserId: row.seller_user_id,
    reporterUserId: row.reporter_user_id ?? undefined,
    reason: row.reason,
    description: row.description ?? "",
    status: row.status,
    createdAt: new Date(row.created_at).toLocaleString()
  }));
}

export async function updateSellerReportStatus(id: string, status: "REVIEWED" | "ACTION_TAKEN" | "DISMISSED", adminUserId: string) {
  const client = requireClient();
  const { error } = await client
    .from("seller_reports")
    .update({ status, reviewed_by: adminUserId, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function createAccountDeletionRequest(input: {
  userId: string;
  reason: string;
}) {
  const client = requireClient();
  const { error } = await client.from("account_deletion_requests").insert({
    user_id: input.userId,
    reason: input.reason,
    status: "PENDING"
  });
  if (error) throw error;
}

export async function loadAccountDeletionRequests() {
  const client = requireClient();
  const { data, error } = await client
    .from("account_deletion_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AccountDeletionRequestRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    reason: row.reason ?? "",
    status: row.status,
    createdAt: new Date(row.created_at).toLocaleString()
  }));
}

export async function deleteSellerProduct(databaseId: string, media: CatalogMedia[]) {
  const client = requireClient();
  const imagePaths = media.filter((item) => item.mediaType === "IMAGE").map((item) => item.storagePath);
  const videoPaths = media.filter((item) => item.mediaType === "VIDEO").map((item) => item.storagePath);
  if (imagePaths.length) await client.storage.from("product-images").remove(imagePaths);
  if (videoPaths.length) await client.storage.from("product-videos").remove(videoPaths);
  const { error } = await client.from("products").delete().eq("id", databaseId);
  if (error) throw error;
}
