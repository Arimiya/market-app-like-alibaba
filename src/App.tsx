import {
  Bell,
  BadgeCheck,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  Heart,
  Headphones,
  Home,
  LayoutDashboard,
  LineChart,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  PackageCheck,
  Percent,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Truck,
  User,
  Wallet,
  X,
  Zap
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createPendingPayment,
  PaymentRecord,
  simulateBackendPaymentVerification
} from "./paymentProvider";
import { supabase, supabaseConfigurationMessage } from "./supabaseClient";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import {
  CatalogMedia,
  CatalogProduct,
  AccountDeletionRequestRecord,
  createAccountDeletionRequest,
  createProductReport,
  createSellerReport,
  deleteSellerProduct,
  loadAccountDeletionRequests,
  loadPublishedProducts,
  loadProductReports,
  loadSellerReports,
  loadSellerProducts,
  saveSellerProduct,
  SellerReportRecord,
  setAdminProductStatus,
  setSellerProductStatus,
  updateProductReportStatus,
  updateSellerReportStatus,
  uploadSellerApplicationAssets
} from "./marketplaceData";

type Role = "ADMIN" | "VENDOR" | "CUSTOMER";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  address?: string;
  storeName?: string;
  storeDescription?: string;
  storeCategory?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  vendorStatus?: "PENDING" | "APPROVED" | "SUSPENDED";
};

type VendorApplication = {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  category: string;
  logoName: string;
  logoPreview: string;
  verificationDocumentName: string;
  logoPath?: string;
  verificationDocumentPath?: string;
  submittedAt: string;
};

type PageId =
  | "home"
  | "categories"
  | "retail"
  | "wholesale"
  | "buyer-protection"
  | "rfq"
  | "stores"
  | "deals"
  | "track"
  | "cart"
  | "checkout"
  | "wishlist"
  | "messages"
  | "vendor"
  | "admin"
  | "products"
  | "payments"
  | "logistics"
  | "reviews"
  | "notifications"
  | "analytics"
  | "ai"
  | "account"
  | "profile"
  | "login"
  | "signup"
  | "verify-email"
  | "forgot-password"
  | "reset-password"
  | "terms"
  | "privacy"
  | "delete-account"
  | "prohibited-items"
  | "seller-policy"
  | "about"
  | "help"
  | "contact"
  | "product"
  | "order-confirmation"
  | "payment-success"
  | "payment-failure";

type ProductStatus = "Draft" | "Published" | "Out of Stock" | "Suspended" | "Removed";

type Product = {
  id: number;
  databaseId?: string;
  sellerUserId?: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  vendor: string;
  price: number;
  discountPrice?: number;
  rating: number;
  stock: number;
  sku: string;
  condition: "New" | "Used";
  images: string[];
  videoUrl?: string;
  media: CatalogMedia[];
  wholesalePrice?: number;
  minimumOrderQuantity?: number;
  deliveryOptions: string[];
  status: ProductStatus;
  badge: string;
  image: string;
};

type ProductDraft = {
  name: string;
  description: string;
  sku: string;
  category: string;
  subcategory: string;
  brand: string;
  price: string;
  discountPrice: string;
  stock: string;
  condition: "New" | "Used";
  deliveryOptions: string[];
  status: ProductStatus;
  images: string[];
  wholesalePrice: string;
  minimumOrderQuantity: string;
};

type CartItem = {
  productId: number;
  quantity: number;
};

type VendorDeliveryStatus = "New" | "Confirmed" | "Preparing" | "Shipped" | "Delivered";

type Order = {
  id: number;
  orderNumber: string;
  customerId: string;
  customerName: string;
  phone: string;
  address: string;
  region: string;
  city: string;
  deliveryMethod: string;
  paymentMethod: string;
  items: Array<{
    productId: number;
    name: string;
    vendor: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    deliveryStatus: VendorDeliveryStatus;
  }>;
  productSubtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  status: "Pending" | "Paid" | "Processing";
  paymentReference?: string;
  createdAt: string;
};

type OrderItem = Order["items"][number];

type PayoutRequest = {
  id: number;
  vendor: string;
  amount: number;
  method: string;
  account: string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  requestedAt: string;
};

type ConversationMessage = {
  id: number;
  senderId: string;
  senderRole: Role;
  senderName: string;
  body: string;
  createdAt: string;
  readByCustomer: boolean;
  readByVendor: boolean;
};

type Conversation = {
  id: number;
  customerId: string;
  customerName: string;
  vendor: string;
  productId?: number;
  productName?: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
};

type StoreItem = {
  name: string;
  specialty: string;
  products: number;
  rating: number;
  location: string;
  logo: string;
  vendorUserId?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
  created_at: string;
  updated_at: string;
};

type StoreRow = {
  id: string;
  vendor_user_id: string;
  name: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  status: "ACTIVE" | "SUSPENDED";
};

type VendorApplicationRow = {
  id: string;
  user_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  business_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  category: string;
  logo_path: string | null;
  verification_document_path: string | null;
  created_at: string;
};

type PlatformSettingRow = {
  id: string;
  commission_rate: number;
  currency: string;
  payments_enabled: boolean;
  payment_mode: "TEST" | "LIVE";
  updated_by: string | null;
  updated_at: string;
};

type SettlementAccountRow = {
  id: string;
  account_holder_name: string;
  bank_name: string;
  bank_code: string;
  account_number_masked: string;
  provider_recipient_code: string | null;
  provider_subaccount_code: string | null;
  currency: string;
  verification_status: "UNVERIFIED" | "VERIFIED" | "FAILED";
  is_active: boolean;
  updated_at: string;
};

type ProductReport = {
  id: string;
  productId: string;
  reporterUserId?: string;
  sellerUserId: string;
  reason: string;
  description: string;
  status: "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED";
  createdAt: string;
};

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0
});

const PLATFORM_SERVICE_FEE_ENABLED = true;
const STANDARD_DELIVERY_FEE_PER_VENDOR = 25;
const EXPRESS_DELIVERY_FEE_PER_VENDOR = 45;
const PICKUP_DELIVERY_FEE_PER_VENDOR = 10;
const PLATFORM_COMMISSION_RATE = 0.03;

const initialProducts: Product[] = [];

function catalogId(databaseId: string) {
  return databaseId.split("").reduce((value, character) => ((value * 31 + character.charCodeAt(0)) >>> 0), 7);
}

function mapCatalogProduct(product: CatalogProduct): Product {
  return {
    id: catalogId(product.databaseId),
    databaseId: product.databaseId,
    sellerUserId: product.sellerUserId,
    name: product.name,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory,
    brand: product.brand,
    vendor: product.vendor,
    price: product.retailPrice,
    discountPrice: product.discountPrice,
    wholesalePrice: product.wholesalePrice,
    minimumOrderQuantity: product.minimumOrderQuantity,
    rating: 0,
    stock: product.quantity,
    sku: product.sku,
    condition: product.condition,
    images: product.images,
    videoUrl: product.videoUrl,
    media: product.media,
    deliveryOptions: product.deliveryOptions,
    status: product.status,
    badge: product.wholesalePrice ? "Wholesale available" : product.status === "Published" ? "Live" : product.status,
    image: product.images[0] ?? ""
  };
}

function mapProfileToUser(profile: ProfileRow, store?: StoreRow | null): AuthUser {
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    storeName: store?.name,
    storeDescription: store?.description,
    storeLogoUrl: store?.logo_url ?? undefined,
    storeBannerUrl: store?.banner_url ?? undefined,
    vendorStatus: profile.role === "VENDOR" ? (store?.status === "SUSPENDED" ? "SUSPENDED" : "APPROVED") : undefined
  };
}

function mapAuthUserToCustomer(user: SupabaseAuthUser): AuthUser {
  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const email = user.email ?? "";
  return {
    id: user.id,
    name: metadataName || email.split("@")[0] || "MarketHub Customer",
    email,
    role: "CUSTOMER"
  };
}

function mapVendorApplication(row: VendorApplicationRow): VendorApplication {
  const logoPreview = row.logo_path && supabase
    ? supabase.storage.from("store-assets").getPublicUrl(row.logo_path).data.publicUrl
    : "";
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    businessName: row.business_name,
    ownerName: row.owner_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    description: row.description,
    category: row.category,
    logoName: row.logo_path?.split("/").at(-1) ?? "No logo",
    logoPreview,
    verificationDocumentName: row.verification_document_path?.split("/").at(-1) ?? "No verification document",
    logoPath: row.logo_path ?? undefined,
    verificationDocumentPath: row.verification_document_path ?? undefined,
    submittedAt: new Date(row.created_at).toLocaleString()
  };
}

const categories = [
  ["Electronics", "0 products", "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=500&q=80"],
  ["Phones & Tablets", "0 products", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80"],
  ["Fashion", "0 products", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80"],
  ["Beauty", "0 products", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80"],
  ["Home & Kitchen", "0 products", "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=500&q=80"],
  ["Groceries", "0 products", "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"],
  ["Automotive", "0 products", "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=500&q=80"],
  ["Computers", "0 products", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80"],
  ["Baby Products", "0 products", "https://images.unsplash.com/photo-1546015720-b8b30df5aa27?auto=format&fit=crop&w=500&q=80"],
  ["Industrial Supplies", "0 products", "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=500&q=80"]
];

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  VENDOR: "Vendor",
  CUSTOMER: "Customer"
};

const reportReasons = [
  "Fake product",
  "Scam or fraud",
  "Prohibited item",
  "Offensive content",
  "Wrong category",
  "Copyright/trademark issue",
  "Other"
];

const prohibitedTerms = [
  "weapon",
  "gun",
  "ammunition",
  "drug",
  "cocaine",
  "stolen",
  "counterfeit",
  "fake id",
  "adult explicit",
  "hate",
  "violent",
  "dangerous chemical"
];

const navSections = [
  {
    title: "Marketplace",
    items: [
      ["home", "Home", Home],
      ["categories", "Categories", Boxes],
      ["stores", "Stores", Store],
      ["deals", "Deals", Percent],
      ["track", "Track Order", Truck],
      ["wishlist", "Wishlist", Heart]
    ]
  },
  {
    title: "Shopping",
    items: [
      ["cart", "Cart", ShoppingCart],
      ["checkout", "Checkout", CreditCard],
      ["messages", "Messages", MessageSquare]
    ]
  },
  {
    title: "Operations",
    items: [
      ["vendor", "Vendor Dashboard", LayoutDashboard],
      ["products", "Products", Package],
      ["payments", "Payments & Payouts", Wallet],
      ["logistics", "Logistics", Truck],
      ["reviews", "Reviews", Star],
      ["notifications", "Notifications", Bell],
      ["analytics", "Analytics", LineChart],
      ["admin", "Admin Dashboard", ShieldCheck],
      ["ai", "AI Features", Sparkles]
    ]
  }
] as const;

const policyPages: PageId[] = ["terms", "privacy", "delete-account", "prohibited-items", "seller-policy", "about", "help", "contact"];
const publicPages: PageId[] = ["home", "categories", "retail", "wholesale", "buyer-protection", "rfq", "stores", "deals", "product", "login", "signup", "verify-email", "forgot-password", "reset-password", ...policyPages];

const rolePages: Record<Role, PageId[]> = {
  CUSTOMER: ["home", "categories", "retail", "wholesale", "buyer-protection", "rfq", "stores", "deals", "track", "cart", "checkout", "wishlist", "messages", "notifications", "account", "profile", "product", "order-confirmation", "payment-success", "payment-failure", ...policyPages],
  VENDOR: ["home", "categories", "retail", "wholesale", "buyer-protection", "rfq", "stores", "deals", "vendor", "products", "payments", "logistics", "reviews", "notifications", "analytics", "account", "profile", "product", ...policyPages],
  ADMIN: ["home", "categories", "retail", "wholesale", "buyer-protection", "rfq", "stores", "deals", "admin", "payments", "logistics", "reviews", "notifications", "analytics", "ai", "account", "profile", "product", ...policyPages]
};

const privateWorkspacePages: PageId[] = ["vendor", "admin", "products", "payments", "logistics", "reviews", "notifications", "analytics", "ai"];

function canAccessPage(page: PageId, user: AuthUser | null) {
  if (publicPages.includes(page)) return true;
  if (!user) return false;
  return rolePages[user.role].includes(page);
}

const pagePaths: Partial<Record<PageId, string>> = {
  home: "/",
  admin: "/admin",
  profile: "/profile",
  account: "/account",
  login: "/login",
  signup: "/signup",
  "verify-email": "/verify-email",
  "forgot-password": "/forgot-password",
  "reset-password": "/reset-password",
  terms: "/terms",
  privacy: "/privacy",
  "delete-account": "/delete-account",
  "prohibited-items": "/prohibited-items",
  "seller-policy": "/seller-policy",
  about: "/about",
  help: "/help",
  contact: "/contact",
  products: "/seller/products"
};

function pageFromPath(pathname: string): PageId {
  return (Object.entries(pagePaths).find(([, path]) => path === pathname)?.[0] as PageId | undefined) ?? "home";
}

function App() {
  const [page, setPage] = useState<PageId>(() => pageFromPath(window.location.pathname));
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [vendorApplications, setVendorApplications] = useState<VendorApplication[]>([]);
  const [productReports, setProductReports] = useState<ProductReport[]>([]);
  const [sellerReports, setSellerReports] = useState<SellerReportRecord[]>([]);
  const [accountDeletionRequests, setAccountDeletionRequests] = useState<AccountDeletionRequestRecord[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePaymentReference, setActivePaymentReference] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [filters, setFilters] = useState({ category: "All", maxPrice: "" });
  const [authLoading, setAuthLoading] = useState(true);
  const [authPrompt, setAuthPrompt] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState("");
  const [returnPage, setReturnPage] = useState<PageId>("home");
  const [verificationEmail, setVerificationEmail] = useState(() => window.localStorage.getItem("markethubPendingVerificationEmail") ?? "");
  const customerProducts = useMemo(
    () => products.filter((product) => product.status === "Published" && product.stock > 0),
    [products]
  );
  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase().trim();
    return customerProducts.filter((product) => {
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.subcategory.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        product.vendor.toLowerCase().includes(q);
      const matchesCategory = filters.category === "All" || product.category === filters.category;
      const maxPrice = Number(filters.maxPrice);
      const activePrice = product.discountPrice || product.price;
      const matchesPrice = !filters.maxPrice || activePrice <= maxPrice;
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [customerProducts, filters.category, filters.maxPrice, query]);
  const stores = useMemo(
    () =>
      users
        .filter((user) => user.role === "VENDOR" && user.vendorStatus === "APPROVED" && user.storeName)
        .map((vendor) => ({
          name: vendor.storeName ?? vendor.name,
          specialty: vendor.storeCategory ?? "Marketplace Store",
          products: products.filter((product) => product.vendor === (vendor.storeName ?? vendor.name) && product.status === "Published" && product.stock > 0).length,
          rating: 0,
          location: vendor.address ?? "Not set",
          logo: (vendor.storeName ?? vendor.name).slice(0, 2).toUpperCase(),
          vendorUserId: vendor.id,
          logoUrl: vendor.storeLogoUrl,
          bannerUrl: vendor.storeBannerUrl,
          description: vendor.storeDescription
        })),
    [products, users]
  );
  const rememberAuthenticatedUser = (mappedUser: AuthUser, redirect = false) => {
    setAuthPrompt("");
    setCurrentUser(mappedUser);
    setUsers((currentUsers) => {
      const existing = currentUsers.some((user) => user.id === mappedUser.id);
      return existing
        ? currentUsers.map((user) => (user.id === mappedUser.id ? mappedUser : user))
        : [...currentUsers, mappedUser];
    });
    if (redirect) setPage(mappedUser.role === "ADMIN" ? "admin" : returnPage);
  };
  const loadProfile = async (authUser: SupabaseAuthUser, redirect = false) => {
    const fallbackUser = mapAuthUserToCustomer(authUser);
    if (!supabase) {
      rememberAuthenticatedUser(fallbackUser, redirect);
      return fallbackUser;
    }
    const client = supabase;
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single<ProfileRow>();

    if (profileError || !profile) {
      rememberAuthenticatedUser(fallbackUser, redirect);
      return fallbackUser;
    }

    const { data: store } = await client
      .from("stores")
      .select("*")
      .eq("vendor_user_id", authUser.id)
      .maybeSingle<StoreRow>();

    const mappedUser = mapProfileToUser(profile, store);
    rememberAuthenticatedUser(mappedUser, redirect);
    return mappedUser;
  };
  const loadVendorApplications = async (user: AuthUser | null) => {
    if (!user || !supabase) {
      setVendorApplications([]);
      return;
    }
    const query = supabase
      .from("vendor_applications")
      .select("*")
      .order("created_at", { ascending: false });
    const { data, error } = user.role === "ADMIN"
      ? await query.returns<VendorApplicationRow[]>()
      : await query.eq("user_id", user.id).returns<VendorApplicationRow[]>();

    if (!error && data) {
      setVendorApplications(data.map(mapVendorApplication));
      if (user.role === "CUSTOMER" && data.some((application) => application.status === "PENDING")) {
        setCurrentUser((current) => current?.id === user.id ? { ...current, vendorStatus: "PENDING" } : current);
      }
    }
  };
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    loadPublishedProducts()
      .then((catalog) => {
        if (active) setProducts(catalog.map(mapCatalogProduct));
      })
      .catch(() => {
        if (active) setCatalogMessage("Products could not be refreshed. Please try again shortly.");
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!supabase || currentUser?.role !== "ADMIN") return;
    Promise.all([loadProductReports(), loadSellerReports(), loadAccountDeletionRequests()])
      .then(([productReportData, sellerReportData, deletionRequestData]) => {
        setProductReports(productReportData);
        setSellerReports(sellerReportData);
        setAccountDeletionRequests(deletionRequestData);
      })
      .catch(() => {
        setProductReports([]);
        setSellerReports([]);
        setAccountDeletionRequests([]);
      });
  }, [currentUser?.role]);
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    const client = supabase;
    let active = true;
    const initializeAuth = async () => {
      const { data } = await client.auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        await loadProfile(data.session.user);
      }
      setAuthLoading(false);
    };

    initializeAuth();
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadProfile(session.user);
      } else {
        setCurrentUser(null);
        setVendorApplications([]);
      }
      setAuthLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    void loadVendorApplications(currentUser);
  }, [currentUser?.id, currentUser?.role]);
  useEffect(() => {
    if (authLoading) return;
    if (page === "admin" && !currentUser) {
      setAuthPrompt("Admin access requires an authorised administrator account.");
      setPage("login");
      window.history.replaceState({}, "", "/login");
      return;
    }
    if (!currentUser && !publicPages.includes(page)) {
      setAuthPrompt("Please log in or create an account to continue.");
      setReturnPage(page);
      setPage("login");
      window.history.replaceState({}, "", "/login");
      return;
    }
    const nextPath = pagePaths[page] ?? "/";
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, [authLoading, currentUser, page]);
  useEffect(() => {
    const handlePopState = () => setPage(pageFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const visibleNavSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(([id]) => canAccessPage(id as PageId, currentUser))
    }))
    .filter((section) => section.items.length > 0);
  const changePage = (nextPage: PageId) => {
    setMobileMenuOpen(false);
    if (canAccessPage(nextPage, currentUser)) {
      setPage(nextPage);
      return;
    }
    if (!currentUser) {
      setReturnPage(page);
      setAuthPrompt("Please log in or create an account to continue.");
      setPage("login");
      return;
    }
    setPage("account");
  };
  const requestAuthentication = () => {
    setReturnPage(page);
    setAuthPrompt("Please log in or create an account to continue.");
    setPage("login");
  };
  const openProduct = (productId: number) => {
    setSelectedProductId(productId);
    setPage("product");
  };
  const addToCart = (productId: number, quantity = 1) => {
    if (!currentUser || currentUser.role !== "CUSTOMER") {
      requestAuthentication();
      return "Please log in as a customer before adding products to cart.";
    }

    const product = products.find((item) => item.id === productId);
    if (!product || product.status !== "Published" || product.stock <= 0) {
      return "This product is not available.";
    }

    let result = "Product added to cart.";
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === productId);
      const currentQuantity = existingItem?.quantity ?? 0;
      const nextQuantity = currentQuantity + quantity;

      if (nextQuantity > product.stock) {
        result = `Only ${product.stock} item(s) available.`;
        return currentItems;
      }

      if (existingItem) {
        return currentItems.map((item) => item.productId === productId ? { ...item, quantity: nextQuantity } : item);
      }

      return [...currentItems, { productId, quantity }];
    });
    return result;
  };
  const updateCartQuantity = (productId: number, quantity: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return "Product no longer exists.";
    if (quantity < 1) {
      setCartItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
      return "Item removed from cart.";
    }
    if (quantity > product.stock) return `Only ${product.stock} item(s) available.`;
    setCartItems((currentItems) => currentItems.map((item) => item.productId === productId ? { ...item, quantity } : item));
    return "Cart updated.";
  };
  const removeCartItem = (productId: number) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  };
  const createOrder = (checkout: {
    name: string;
    phone: string;
    address: string;
    region: string;
    city: string;
    deliveryMethod: string;
    paymentMethod: string;
    deliveryFee: number;
    serviceFee: number;
  }) => {
    if (!currentUser || currentUser.role !== "CUSTOMER") {
      return { error: "Please log in as a customer before checkout." };
    }

    if (cartItems.length === 0) return { error: "Your cart is empty." };

    const orderItems = cartItems.map((item) => {
      const product = products.find((productItem) => productItem.id === item.productId);
      return { cartItem: item, product };
    });
    const missingProduct = orderItems.find(({ product }) => !product || product.status !== "Published");
    if (missingProduct) return { error: "One or more cart products are no longer available." };
    const stockProblem = orderItems.find(({ cartItem, product }) => product && cartItem.quantity > product.stock);
    if (stockProblem?.product) return { error: `${stockProblem.product.name} only has ${stockProblem.product.stock} item(s) available.` };

    const items = orderItems.map(({ cartItem, product }) => {
      const safeProduct = product as Product;
      const unitPrice = safeProduct.discountPrice || safeProduct.price;
      return {
        productId: safeProduct.id,
        name: safeProduct.name,
        vendor: safeProduct.vendor,
        quantity: cartItem.quantity,
        unitPrice,
        subtotal: unitPrice * cartItem.quantity,
        deliveryStatus: "New" as VendorDeliveryStatus
      };
    });
    const productSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const nextOrder: Order = {
      id: Date.now(),
      orderNumber: `MH-${Date.now().toString().slice(-6)}`,
      customerId: currentUser.id,
      customerName: checkout.name.trim(),
      phone: checkout.phone.trim(),
      address: checkout.address.trim(),
      region: checkout.region,
      city: checkout.city.trim(),
      deliveryMethod: checkout.deliveryMethod,
      paymentMethod: checkout.paymentMethod,
      items,
      productSubtotal,
      deliveryFee: checkout.deliveryFee,
      serviceFee: checkout.serviceFee,
      total: productSubtotal + checkout.deliveryFee + checkout.serviceFee,
      status: "Pending",
      createdAt: new Date().toLocaleString()
    };
    const pendingPayment = createPendingPayment({
      orderId: nextOrder.id,
      orderNumber: nextOrder.orderNumber,
      customerId: currentUser.id,
      amount: nextOrder.total,
      method: checkout.paymentMethod === "Mobile Money" ? "MOBILE_MONEY" : "CARD"
    });
    nextOrder.paymentReference = pendingPayment.reference;

    setOrders((currentOrders) => [nextOrder, ...currentOrders]);
    setPayments((currentPayments) => [pendingPayment, ...currentPayments]);
    setCartItems([]);
    setConfirmedOrderId(nextOrder.id);
    setActivePaymentReference(pendingPayment.reference);
    return { order: nextOrder, payment: pendingPayment };
  };
  const completePayment = async (reference: string, outcome: "success" | "failed") => {
    const payment = payments.find((paymentRecord) => paymentRecord.reference === reference);
    if (!payment) return "Payment record not found.";
    if (payment.status === "SUCCESSFUL") return "Payment already verified successfully.";

    const verification = await simulateBackendPaymentVerification(payment, outcome);
    if (verification.status === "SUCCESSFUL") {
      const paidOrder = orders.find((order) => order.id === payment.orderId);
      if (paidOrder) {
        setProducts((currentProducts) =>
          currentProducts.map((product) => {
            const orderedItem = paidOrder.items.find((item) => item.productId === product.id);
            if (!orderedItem) return product;
            const nextStock = Math.max(0, product.stock - orderedItem.quantity);
            return {
              ...product,
              stock: nextStock,
              status: nextStock === 0 ? "Out of Stock" : product.status
            };
          })
        );
      }
    }
    setPayments((currentPayments) =>
      currentPayments.map((paymentRecord) =>
        paymentRecord.reference === reference
          ? {
              ...paymentRecord,
              status: verification.status,
              providerStatus: verification.providerStatus,
              paidAt: verification.status === "SUCCESSFUL" ? new Date().toLocaleString() : paymentRecord.paidAt
            }
          : paymentRecord
      )
    );
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === payment.orderId
          ? { ...order, status: verification.status === "SUCCESSFUL" ? "Paid" : order.status }
          : order
      )
    );
    return verification.status === "SUCCESSFUL" ? "Payment verified successfully." : "Payment verification failed.";
  };
  const updateVendorOrderItemStatus = (
    orderId: number,
    productId: number,
    nextStatus: VendorDeliveryStatus
  ) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map((item) =>
                item.productId === productId ? { ...item, deliveryStatus: nextStatus } : item
              )
            }
          : order
      )
    );
  };
  const createPayoutRequest = (vendor: string, amount: number, method: string, account: string) => {
    if (!vendor.trim()) return "Vendor store is required.";
    if (!Number.isFinite(amount) || amount <= 0) return "Enter a valid payout amount.";
    if (!method.trim()) return "Select a payout method.";
    if (!account.trim()) return "Enter the payout account or mobile money number.";

    const payoutRequest: PayoutRequest = {
      id: Date.now(),
      vendor,
      amount,
      method,
      account: account.trim(),
      status: "PENDING",
      requestedAt: new Date().toLocaleString()
    };
    setPayoutRequests((currentRequests) => [payoutRequest, ...currentRequests]);
    return "Payout request submitted for admin review.";
  };
  const sendConversationMessage = (conversationId: number, body: string) => {
    if (!currentUser) return "Please log in before sending a message.";
    const safeBody = sanitizeMessage(body);
    if (!safeBody) return "Type a message before sending.";
    if (safeBody.length > 800) return "Message must be 800 characters or fewer.";

    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation || !canAccessConversation(conversation, currentUser)) {
      return "You do not have access to this conversation.";
    }

    const nextMessage: ConversationMessage = {
      id: Date.now(),
      senderId: currentUser.id,
      senderRole: currentUser.role,
      senderName: currentUser.name,
      body: safeBody,
      createdAt: new Date().toLocaleString(),
      readByCustomer: currentUser.role === "CUSTOMER",
      readByVendor: currentUser.role === "VENDOR"
    };
    setConversations((currentConversations) =>
      currentConversations.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              updatedAt: nextMessage.createdAt,
              messages: [...item.messages, nextMessage]
            }
          : item
      )
    );
    return "Message sent.";
  };
  const messageVendorFromProduct = (productId: number, body: string) => {
    if (!currentUser || currentUser.role !== "CUSTOMER") {
      requestAuthentication();
      return "Please sign up or log in as a customer before messaging a vendor.";
    }
    const product = products.find((item) => item.id === productId);
    if (!product || product.status !== "Published") return "Product is not available for messaging.";
    const safeBody = sanitizeMessage(body);
    if (!safeBody) return "Type a message before sending.";
    if (safeBody.length > 800) return "Message must be 800 characters or fewer.";

    const existingConversation = conversations.find(
      (conversation) =>
        conversation.customerId === currentUser.id &&
        conversation.vendor === product.vendor &&
        conversation.productId === product.id
    );
    if (existingConversation) {
      return sendConversationMessage(existingConversation.id, safeBody);
    }

    const timestamp = new Date().toLocaleString();
    const nextConversation: Conversation = {
      id: Date.now(),
      customerId: currentUser.id,
      customerName: currentUser.name,
      vendor: product.vendor,
      productId: product.id,
      productName: product.name,
      createdAt: timestamp,
      updatedAt: timestamp,
      messages: [
        {
          id: Date.now() + 1,
          senderId: currentUser.id,
          senderRole: "CUSTOMER",
          senderName: currentUser.name,
          body: safeBody,
          createdAt: timestamp,
          readByCustomer: true,
          readByVendor: false
        }
      ]
    };
    setConversations((currentConversations) => [nextConversation, ...currentConversations]);
    return "Message sent to vendor.";
  };
  const markConversationRead = (conversationId: number) => {
    if (!currentUser) return;
    setConversations((currentConversations) =>
      currentConversations.map((conversation) => {
        if (conversation.id !== conversationId || !canAccessConversation(conversation, currentUser)) return conversation;
        return {
          ...conversation,
          messages: conversation.messages.map((message) => ({
            ...message,
            readByCustomer: currentUser.role === "CUSTOMER" ? true : message.readByCustomer,
            readByVendor: currentUser.role === "VENDOR" ? true : message.readByVendor
          }))
        };
      })
    );
  };
  const unreadMessageCount = getUnreadMessageCount(currentUser, conversations);
  const usesDashboardShell = Boolean(
    currentUser &&
    ["VENDOR", "ADMIN"].includes(currentUser.role) &&
    privateWorkspacePages.includes(page)
  );
  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setCartItems([]);
    setPage("home");
  };

  return (
    <div className={usesDashboardShell ? "app-shell" : "marketplace-shell"}>
      {usesDashboardShell ? <aside className="sidebar">
        <button className="brand" onClick={() => changePage("home")}>
          <span className="brand-mark">M</span>
          <span>
            <strong>MarketHub</strong>
            <small>Africa marketplace</small>
          </span>
        </button>

        <nav>
          {visibleNavSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <p>{section.title}</p>
              {section.items.map(([id, label, Icon]) => (
                <button
                  className={page === id ? "active" : ""}
                  key={id}
                  onClick={() => changePage(id as PageId)}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  {id === "messages" && unreadMessageCount > 0 ? <span className="nav-badge">{unreadMessageCount}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-callout">
          <Sparkles size={20} />
          <strong>Grow more with MarketHub</strong>
          <span>Vendor tools, mobile money, analytics, and regional commerce.</span>
          {!currentUser ? <button onClick={requestAuthentication}>Become a Vendor</button> : null}
        </div>
      </aside> : null}

      <main className="main-area">
        {usesDashboardShell ? (
          <TopBar query={query} setQuery={setQuery} setPage={changePage} user={currentUser} onLogout={logout} cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} unreadMessageCount={unreadMessageCount} authLoading={authLoading} />
        ) : (
          <MarketplaceHeader
            query={query}
            setQuery={setQuery}
            setPage={changePage}
            user={currentUser}
            onLogout={logout}
            cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
        )}
        <div className="content">
          {catalogMessage ? <FormMessage error={catalogMessage} success="" /> : null}
          {renderPage({
            page,
            setPage: changePage,
            filteredProducts,
            products,
            setProducts,
            stores,
            users,
            setUsers,
            currentUser,
            setCurrentUser,
            onAuthenticated: (authUser) => loadProfile(authUser, true),
            authPrompt,
            setAuthPrompt,
            verificationEmail,
            setVerificationEmail,
            vendorApplications,
            setVendorApplications,
            productReports,
            setProductReports,
            sellerReports,
            setSellerReports,
            accountDeletionRequests,
            selectedProductId,
            setSelectedProductId,
            cartItems,
            orders,
            payments,
            payoutRequests,
            conversations,
            activePaymentReference,
            confirmedOrderId,
            filters,
            setFilters,
            openProduct,
            addToCart,
            updateCartQuantity,
            removeCartItem,
            createOrder,
            completePayment,
            updateVendorOrderItemStatus,
            createPayoutRequest,
            messageVendorFromProduct,
            sendConversationMessage,
            markConversationRead
          })}
        </div>
        {!usesDashboardShell ? <MarketplaceFooter setPage={changePage} /> : null}
        {!usesDashboardShell ? <MobileMarketplaceNav page={page} setPage={changePage} user={currentUser} /> : null}
      </main>
    </div>
  );
}

function MarketplaceHeader({
  query,
  setQuery,
  setPage,
  user,
  onLogout,
  cartCount,
  mobileMenuOpen,
  setMobileMenuOpen
}: {
  query: string;
  setQuery: (query: string) => void;
  setPage: (page: PageId) => void;
  user: AuthUser | null;
  onLogout: () => void;
  cartCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const publicLinks: Array<[PageId, string]> = [
    ["categories", "Categories"],
    ["retail", "Retail"],
    ["wholesale", "Wholesale"],
    ["deals", "Deals"],
    ["buyer-protection", "Buyer Protection"],
    ["stores", "Stores"]
  ];

  return (
    <header className="marketplace-header">
      <div className="marketplace-header-main">
        <button className="mobile-menu-button" title="Open menu" onClick={() => setMobileMenuOpen((open) => !open)}>
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <button className="marketplace-logo" onClick={() => setPage("home")}>
          <span className="brand-mark">M</span>
          <span><strong>MarketHub</strong><small>Ghana to Africa</small></span>
        </button>
        <label className="marketplace-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, suppliers and stores" />
          <button type="button" onClick={() => setPage("retail")}>Search</button>
        </label>
        <button className="delivery-selector" title="Delivery location">
          <MapPin size={18} />
          <span><small>Deliver to</small><strong>Ghana / Accra</strong></span>
        </button>
        <div className="marketplace-account-actions">
          {user ? (
            <>
              <div className="marketplace-account-menu">
                <button className="account-button" onClick={() => setPage("profile")} aria-haspopup="true">
                  <span className="account-avatar-small">{user.name.slice(0, 2).toUpperCase()}</span>
                  <span><small>Hello,</small><strong>{user.name}</strong></span>
                </button>
                <div className="account-dropdown" role="menu">
                  <div className="account-dropdown-head">
                    <span className="account-avatar-small large">{user.name.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{roleLabels[user.role]} account</small>
                    </div>
                  </div>
                  <button onClick={() => setPage("profile")}><User size={16} /> Profile Information</button>
                  <button onClick={() => setPage("account")}><LayoutDashboard size={16} /> My Account Center</button>
                  {user.role === "CUSTOMER" ? <button onClick={() => setPage("track")}><PackageCheck size={16} /> My Orders</button> : null}
                  {user.role === "VENDOR" && user.vendorStatus === "APPROVED" ? <button onClick={() => setPage("vendor")}><Store size={16} /> Seller Dashboard</button> : null}
                  {user.role === "ADMIN" ? <button onClick={() => setPage("admin")}><ShieldCheck size={16} /> Admin Dashboard</button> : null}
                  <button onClick={onLogout}><LogOut size={16} /> Log Out</button>
                </div>
              </div>
              {user.role === "CUSTOMER" ? <button className="text-action" onClick={() => setPage("track")}>My Orders</button> : null}
              {user.role === "VENDOR" && user.vendorStatus === "APPROVED" ? <button className="text-action" onClick={() => setPage("vendor")}>Seller Dashboard</button> : null}
              {user.role === "ADMIN" ? <button className="text-action" onClick={() => setPage("admin")}>Admin Dashboard</button> : null}
              <button className="icon-action" title="Wishlist" onClick={() => setPage("wishlist")}><Heart size={19} /></button>
              <button className="icon-action" title="Cart" onClick={() => setPage("cart")}><ShoppingCart size={19} />{cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}</button>
            </>
          ) : (
            <>
              <button className="text-action" onClick={() => setPage("login")}>Log In</button>
              <button className="create-account-action" onClick={() => setPage("signup")}>Create Account</button>
              <button className="icon-action" title="Wishlist" onClick={() => setPage("wishlist")}><Heart size={19} /></button>
              <button className="icon-action" title="Cart" onClick={() => setPage("cart")}><ShoppingCart size={19} /></button>
            </>
          )}
        </div>
      </div>
      <nav className={mobileMenuOpen ? "marketplace-nav open" : "marketplace-nav"}>
        {publicLinks.map(([id, label]) => <button key={id} onClick={() => setPage(id)}>{label}</button>)}
        <button className="sell-link" onClick={() => setPage(user ? (user.role === "VENDOR" ? "vendor" : "account") : "login")}><Store size={16} /> Sell on MarketHub</button>
        <button className="rfq-link" onClick={() => setPage("rfq")}><Send size={16} /> Request a Quote</button>
      </nav>
    </header>
  );
}

function MobileMarketplaceNav({ page, setPage, user }: { page: PageId; setPage: (page: PageId) => void; user: AuthUser | null }) {
  const items: Array<[PageId, string, typeof Home]> = [
    ["home", "Home", Home],
    ["categories", "Categories", Boxes],
    [user?.role === "VENDOR" && user.vendorStatus === "APPROVED" ? "vendor" : user ? "account" : "login", "Sell", Store],
    ["cart", "Cart", ShoppingCart],
    ["account", "Account", User]
  ];
  return (
    <nav className="marketplace-bottom-nav">
      {items.map(([id, label, Icon]) => (
        <button className={page === id ? "active" : ""} key={id} onClick={() => setPage(id)}>
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function MarketplaceFooter({ setPage }: { setPage: (page: PageId) => void }) {
  const links: Array<[PageId, string]> = [
    ["about", "About MarketHub"],
    ["help", "Help Center"],
    ["contact", "Contact"],
    ["terms", "Terms"],
    ["privacy", "Privacy Policy"],
    ["delete-account", "Delete Account"],
    ["seller-policy", "Seller Policy"],
    ["prohibited-items", "Prohibited Items"]
  ];
  return (
    <footer className="marketplace-footer">
      <div>
        <strong>MarketHub</strong>
        <p>Ghana-focused retail and wholesale marketplace for trusted buyers and approved sellers.</p>
      </div>
      <nav>
        {links.map(([id, label]) => <button key={id} onClick={() => setPage(id)}>{label}</button>)}
      </nav>
    </footer>
  );
}

function TopBar({
  query,
  setQuery,
  setPage,
  user,
  onLogout,
  cartCount,
  unreadMessageCount,
  authLoading
}: {
  query: string;
  setQuery: (query: string) => void;
  setPage: (page: PageId) => void;
  user: AuthUser | null;
  onLogout: () => void;
  cartCount: number;
  unreadMessageCount: number;
  authLoading: boolean;
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Multi-vendor e-commerce platform</p>
        <h1>MarketHub</h1>
      </div>
      <label className="search-box">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products, brands, stores..."
        />
      </label>
      <div className="top-actions">
        {user ? (
          <>
            <button title="Wishlist" onClick={() => setPage("wishlist")}>
              <Heart size={18} />
            </button>
            <button title="Cart" onClick={() => setPage("cart")}>
              <ShoppingCart size={18} />
              {cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}
            </button>
            <button title="Messages" onClick={() => setPage(user.role === "VENDOR" ? "vendor" : "messages")}>
              <MessageSquare size={18} />
              {unreadMessageCount > 0 ? <span className="cart-badge">{unreadMessageCount}</span> : null}
            </button>
            <button title="Notifications" onClick={() => setPage("notifications")}>
              <Bell size={18} />
            </button>
          </>
        ) : null}
        {user ? (
          <button title="Log out" onClick={onLogout}>
            <LogOut size={18} />
          </button>
        ) : (
          <>
            <button className="auth-action-button" disabled={authLoading} onClick={() => setPage("login")}>Log In</button>
            <button className="auth-action-button primary" disabled={authLoading} onClick={() => setPage("signup")}>Create Account</button>
          </>
        )}
      </div>
    </header>
  );
}

function renderPage({
  page,
  setPage,
  filteredProducts,
  products,
  setProducts,
  stores,
  users,
  setUsers,
  currentUser,
  setCurrentUser,
  onAuthenticated,
  authPrompt,
  setAuthPrompt,
  verificationEmail,
  setVerificationEmail,
  vendorApplications,
  setVendorApplications,
  productReports,
  setProductReports,
  sellerReports,
  setSellerReports,
  accountDeletionRequests,
  selectedProductId,
  setSelectedProductId,
  cartItems,
  orders,
  payments,
  payoutRequests,
  conversations,
  activePaymentReference,
  confirmedOrderId,
  filters,
  setFilters,
  openProduct,
  addToCart,
  updateCartQuantity,
  removeCartItem,
  createOrder,
  completePayment,
  updateVendorOrderItemStatus,
  createPayoutRequest,
  messageVendorFromProduct,
  sendConversationMessage,
  markConversationRead
}: {
  page: PageId;
  setPage: (page: PageId) => void;
  filteredProducts: Product[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  stores: StoreItem[];
  users: AuthUser[];
  setUsers: React.Dispatch<React.SetStateAction<AuthUser[]>>;
  currentUser: AuthUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onAuthenticated: (authUser: SupabaseAuthUser) => Promise<AuthUser>;
  authPrompt: string;
  setAuthPrompt: React.Dispatch<React.SetStateAction<string>>;
  verificationEmail: string;
  setVerificationEmail: React.Dispatch<React.SetStateAction<string>>;
  vendorApplications: VendorApplication[];
  setVendorApplications: React.Dispatch<React.SetStateAction<VendorApplication[]>>;
  productReports: ProductReport[];
  setProductReports: React.Dispatch<React.SetStateAction<ProductReport[]>>;
  sellerReports: SellerReportRecord[];
  setSellerReports: React.Dispatch<React.SetStateAction<SellerReportRecord[]>>;
  accountDeletionRequests: AccountDeletionRequestRecord[];
  selectedProductId: number | null;
  setSelectedProductId: React.Dispatch<React.SetStateAction<number | null>>;
  cartItems: CartItem[];
  orders: Order[];
  payments: PaymentRecord[];
  payoutRequests: PayoutRequest[];
  conversations: Conversation[];
  activePaymentReference: string | null;
  confirmedOrderId: number | null;
  filters: { category: string; maxPrice: string };
  setFilters: React.Dispatch<React.SetStateAction<{ category: string; maxPrice: string }>>;
  openProduct: (productId: number) => void;
  addToCart: (productId: number, quantity?: number) => string;
  updateCartQuantity: (productId: number, quantity: number) => string;
  removeCartItem: (productId: number) => void;
  createOrder: (checkout: {
    name: string;
    phone: string;
    address: string;
    region: string;
    city: string;
    deliveryMethod: string;
    paymentMethod: string;
    deliveryFee: number;
    serviceFee: number;
  }) => { error: string } | { order: Order; payment: PaymentRecord };
  completePayment: (reference: string, outcome: "success" | "failed") => Promise<string>;
  updateVendorOrderItemStatus: (orderId: number, productId: number, nextStatus: VendorDeliveryStatus) => void;
  createPayoutRequest: (vendor: string, amount: number, method: string, account: string) => string;
  messageVendorFromProduct: (productId: number, body: string) => string;
  sendConversationMessage: (conversationId: number, body: string) => string;
  markConversationRead: (conversationId: number) => void;
}) {
  if (!canAccessPage(page, currentUser)) {
    return <AccessDeniedPage requiredRole="an authorized role" setPage={setPage} />;
  }

  switch (page) {
    case "home":
      return <HomePage setPage={setPage} onBecomeVendor={() => { setAuthPrompt("Please log in or create an account to continue."); setPage(currentUser ? "account" : "login"); }} products={filteredProducts} filters={filters} setFilters={setFilters} onOpenProduct={openProduct} onAddToCart={addToCart} />;
    case "categories":
      return <CategoriesPage setPage={setPage} products={filteredProducts} filters={filters} setFilters={setFilters} onOpenProduct={openProduct} onAddToCart={addToCart} />;
    case "retail":
      return <RetailPage setPage={setPage} products={filteredProducts} filters={filters} setFilters={setFilters} onOpenProduct={openProduct} onAddToCart={addToCart} />;
    case "wholesale":
      return <WholesalePage products={filteredProducts} setPage={setPage} onOpenProduct={openProduct} />;
    case "buyer-protection":
      return <BuyerProtectionPage setPage={setPage} />;
    case "rfq":
      return <RequestQuotePage setPage={setPage} />;
    case "stores":
      return <StoresPage stores={stores} currentUser={currentUser} />;
    case "deals":
      return <DealsPage setPage={setPage} products={filteredProducts} filters={filters} setFilters={setFilters} onOpenProduct={openProduct} onAddToCart={addToCart} />;
    case "track":
      return <TrackOrderPage orders={orders} currentUser={currentUser} />;
    case "cart":
      return <CartPage setPage={setPage} cartItems={cartItems} products={products} updateCartQuantity={updateCartQuantity} removeCartItem={removeCartItem} />;
    case "checkout":
      return <CheckoutPage cartItems={cartItems} products={products} createOrder={createOrder} setPage={setPage} />;
    case "wishlist":
      return <WishlistPage products={filteredProducts} onOpenProduct={openProduct} onAddToCart={addToCart} />;
    case "messages":
      return <MessagesPage user={currentUser} conversations={conversations} sendConversationMessage={sendConversationMessage} markConversationRead={markConversationRead} />;
    case "vendor":
      return <RoleGuard user={currentUser} roles={["VENDOR"]} setPage={setPage}><VendorDashboard user={currentUser} setUsers={setUsers} setCurrentUser={setCurrentUser} products={products} orders={orders} payments={payments} payoutRequests={payoutRequests} conversations={conversations} updateVendorOrderItemStatus={updateVendorOrderItemStatus} sendConversationMessage={sendConversationMessage} markConversationRead={markConversationRead} setPage={setPage} /></RoleGuard>;
    case "admin":
      return (
        <RoleGuard user={currentUser} roles={["ADMIN"]} setPage={setPage}>
          <AdminDashboard
            adminUser={currentUser}
            users={users}
            setUsers={setUsers}
            products={products}
            setProducts={setProducts}
            orders={orders}
            payments={payments}
            payoutRequests={payoutRequests}
            vendorApplications={vendorApplications}
            setVendorApplications={setVendorApplications}
            productReports={productReports}
            setProductReports={setProductReports}
            sellerReports={sellerReports}
            setSellerReports={setSellerReports}
            accountDeletionRequests={accountDeletionRequests}
          />
        </RoleGuard>
      );
    case "products":
      return <RoleGuard user={currentUser} roles={["VENDOR"]} setPage={setPage}><ProductsPage user={currentUser} products={products} setProducts={setProducts} /></RoleGuard>;
    case "payments":
      return <RoleGuard user={currentUser} roles={["VENDOR", "ADMIN"]} setPage={setPage}><PaymentsPage user={currentUser} orders={orders} payments={payments} payoutRequests={payoutRequests} createPayoutRequest={createPayoutRequest} /></RoleGuard>;
    case "logistics":
      return <RoleGuard user={currentUser} roles={["VENDOR", "ADMIN"]} setPage={setPage}><LogisticsPage /></RoleGuard>;
    case "reviews":
      return <RoleGuard user={currentUser} roles={["VENDOR", "ADMIN"]} setPage={setPage}><ReviewsPage /></RoleGuard>;
    case "notifications":
      return <RoleGuard user={currentUser} roles={["CUSTOMER", "VENDOR", "ADMIN"]} setPage={setPage}><NotificationsPage /></RoleGuard>;
    case "analytics":
      return <RoleGuard user={currentUser} roles={["VENDOR", "ADMIN"]} setPage={setPage}><AnalyticsPage /></RoleGuard>;
    case "ai":
      return <RoleGuard user={currentUser} roles={["ADMIN"]} setPage={setPage}><AiPage /></RoleGuard>;
    case "account":
      return <ProfilePage user={currentUser} setCurrentUser={setCurrentUser} setPage={setPage} onAuthenticated={onAuthenticated} authPrompt={authPrompt} vendorApplications={vendorApplications} setVendorApplications={setVendorApplications} initialMode="login" />;
    case "login":
      return <ProfilePage user={currentUser} setCurrentUser={setCurrentUser} setPage={setPage} onAuthenticated={onAuthenticated} authPrompt={authPrompt} vendorApplications={vendorApplications} setVendorApplications={setVendorApplications} initialMode="login" />;
    case "signup":
      return <ProfilePage user={currentUser} setCurrentUser={setCurrentUser} setPage={setPage} onAuthenticated={onAuthenticated} authPrompt={authPrompt} vendorApplications={vendorApplications} setVendorApplications={setVendorApplications} initialMode="signup" setVerificationEmail={setVerificationEmail} />;
    case "verify-email":
      return <VerifyEmailCodePage initialEmail={verificationEmail} setVerificationEmail={setVerificationEmail} setPage={setPage} onAuthenticated={onAuthenticated} />;
    case "forgot-password":
      return <PasswordRecoveryPage mode="request" setPage={setPage} />;
    case "reset-password":
      return <PasswordRecoveryPage mode="reset" setPage={setPage} />;
    case "profile":
      return <UserProfilePage setUsers={setUsers} user={currentUser} setCurrentUser={setCurrentUser} setPage={setPage} />;
    case "product":
      return <ProductDetailsPage product={products.find((product) => product.id === selectedProductId) ?? null} products={filteredProducts} currentUser={currentUser} setPage={setPage} setSelectedProductId={setSelectedProductId} onAddToCart={addToCart} onMessageVendor={messageVendorFromProduct} />;
    case "terms":
    case "privacy":
    case "delete-account":
    case "prohibited-items":
    case "seller-policy":
    case "about":
    case "help":
    case "contact":
      return <PolicyPage page={page} user={currentUser} setPage={setPage} />;
    case "order-confirmation":
      return <OrderConfirmationPage order={orders.find((order) => order.id === confirmedOrderId) ?? null} payment={payments.find((payment) => payment.reference === activePaymentReference) ?? null} setPage={setPage} />;
    case "payment-success":
      return <PaymentResultPage outcome="success" reference={activePaymentReference} payments={payments} completePayment={completePayment} setPage={setPage} />;
    case "payment-failure":
      return <PaymentResultPage outcome="failed" reference={activePaymentReference} payments={payments} completePayment={completePayment} setPage={setPage} />;
  }
}

function PageIntro({
  kicker,
  title,
  copy,
  actions
}: {
  kicker: string;
  title: string;
  copy: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="page-intro">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h2>{title}</h2>
        {copy ? <p className="page-intro-copy">{copy}</p> : null}
      </div>
      {actions ? <div className="intro-actions">{actions}</div> : null}
    </section>
  );
}

function HomePage({
  setPage,
  onBecomeVendor,
  products,
  filters,
  setFilters,
  onOpenProduct,
  onAddToCart
}: {
  setPage: (page: PageId) => void;
  onBecomeVendor: () => void;
  products: Product[];
  filters: { category: string; maxPrice: string };
  setFilters: React.Dispatch<React.SetStateAction<{ category: string; maxPrice: string }>>;
  onOpenProduct: (productId: number) => void;
  onAddToCart: (productId: number, quantity?: number) => string;
}) {
  const hasProducts = products.length > 0;
  const trendingProducts = products.slice(0, 4);
  const newArrivals = [...products].slice(-4).reverse();
  const dealProducts = products.filter((product) => product.discountPrice).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p>Ghana's retail and wholesale marketplace</p>
          <h2>Shop Ghana. Source Africa. Trade with confidence.</h2>
          <span>Buy trusted products or connect with verified suppliers for wholesale orders.</span>
          <div className="hero-actions">
            <button onClick={() => setPage("retail")}>Shop Retail <ChevronRight size={17} /></button>
            <button className="hero-secondary" onClick={() => setPage("wholesale")}>Buy Wholesale</button>
            <button className="hero-secondary" onClick={onBecomeVendor}>Start Selling</button>
          </div>
        </div>
        <div className="hero-products">
          {hasProducts ? (
            products.slice(0, 3).map((product) => <img src={product.image} alt={product.name} key={product.id} />)
          ) : (
            <div className="upload-placeholder">
              <Store size={42} />
              <strong>Launching soon</strong>
            </div>
          )}
        </div>
      </section>
      {!hasProducts ? <MarketplaceLaunchMessage setPage={setPage} onBecomeVendor={onBecomeVendor} /> : null}
      <SectionHeader title="Featured Categories" action="View all" onClick={() => setPage("categories")} />
      <CategoryStrip setPage={setPage} />
      <SectionHeader title="Flash Deals" action="View deals" onClick={() => setPage("deals")} />
      <ProductFilters filters={filters} setFilters={setFilters} />
      <ProductGrid products={dealProducts} onOpenProduct={onOpenProduct} onAddToCart={onAddToCart} onWishlist={() => setPage("wishlist")} emptyTitle="Flash deals are warming up" emptyCopy="Limited-time offers will appear here when verified vendors publish them." />
      <SectionHeader title="Top Selling Products" action="Shop retail" onClick={() => setPage("retail")} />
      <ProductGrid products={trendingProducts} onOpenProduct={onOpenProduct} onAddToCart={onAddToCart} onWishlist={() => setPage("wishlist")} emptyTitle="The marketplace is opening soon" emptyCopy="Popular products will appear as customers begin shopping." />
      <SectionHeader title="New Arrivals" />
      <ProductGrid products={newArrivals} onOpenProduct={onOpenProduct} onAddToCart={onAddToCart} onWishlist={() => setPage("wishlist")} emptyTitle="No new arrivals yet" emptyCopy="Fresh vendor products will appear here." />
      <SectionHeader title="Featured Vendors" action="Stores" onClick={() => setPage("stores")} />
      <FeaturedVendorStrip />
      <SectionHeader title="Wholesale Deals" action="Source products" onClick={() => setPage("wholesale")} />
      <WholesalePreview setPage={setPage} />
      <SectionHeader title="Recommended For You" />
      <ProductGrid products={products.slice(0, 4)} onOpenProduct={onOpenProduct} onAddToCart={onAddToCart} onWishlist={() => setPage("wishlist")} emptyTitle="Recommendations will grow with the marketplace" emptyCopy="Browse categories now and return as vendors publish new products." />
      <TrustSection />
    </>
  );
}

function MarketplaceLaunchMessage({ setPage, onBecomeVendor }: { setPage: (page: PageId) => void; onBecomeVendor: () => void }) {
  return (
    <section className="launch-panel">
      <div>
        <p className="eyebrow">Marketplace opening</p>
        <h3>Products are coming soon</h3>
        <p>MarketHub is ready for vendors to set up stores and start publishing products.</p>
      </div>
      <div>
        <button onClick={onBecomeVendor}>Become a Vendor</button>
        <button className="ghost-button" onClick={() => setPage("categories")}>Explore Categories</button>
      </div>
    </section>
  );
}

function FeaturedVendorStrip() {
  return (
    <section className="vendor-strip">
      {["Verified sellers", "Mobile money planned", "Local delivery", "Secure marketplace"].map((item) => (
        <article key={item}>
          <Store size={20} />
          <strong>{item}</strong>
          <span>Coming soon</span>
        </article>
      ))}
    </section>
  );
}

function WholesalePreview({ setPage }: { setPage: (page: PageId) => void }) {
  return (
    <section className="wholesale-preview">
      <div>
        <p className="eyebrow">Business sourcing</p>
        <h3>Buy in bulk from Ghanaian and African suppliers</h3>
        <p>Compare minimum order quantities, request supplier quotations, and plan bulk delivery from one sourcing workspace.</p>
      </div>
      <div className="wholesale-preview-actions">
        <button onClick={() => setPage("wholesale")}>Explore Wholesale</button>
        <button className="ghost-button" onClick={() => setPage("rfq")}>Request a Quote</button>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="trust-grid">
      {[
        ["Verified Vendors", BadgeCheck],
        ["Mobile Money Payments", CreditCard],
        ["Buyer Protection", ShieldCheck],
        ["Nationwide Delivery", Truck],
        ["Easy Returns", RotateCcw],
        ["Customer Support", Headphones]
      ].map(([label, Icon]) => (
        <article key={label as string}>
          <Icon size={22} />
          <strong>{label as string}</strong>
        </article>
      ))}
    </section>
  );
}

function Metric({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{delta}</small>
    </article>
  );
}

function CategoryStrip({ setPage }: { setPage: (page: PageId) => void }) {
  return (
    <section className="category-strip">
      {categories.slice(0, 8).map(([name, count, image]) => (
        <button key={name} onClick={() => setPage("categories")}>
          <img src={image} alt="" />
          <span>{name}</span>
          <small>{count}</small>
        </button>
      ))}
    </section>
  );
}

function SectionHeader({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) {
  return (
    <div className="section-header">
      <h3>{title}</h3>
      {action ? <button onClick={onClick}>{action}</button> : null}
    </div>
  );
}

function ProductFilters({
  filters,
  setFilters
}: {
  filters: { category: string; maxPrice: string };
  setFilters: React.Dispatch<React.SetStateAction<{ category: string; maxPrice: string }>>;
}) {
  return (
    <section className="filter-panel">
      <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
        <option value="All">All categories</option>
        {categories.map(([name]) => <option key={name} value={name}>{name}</option>)}
      </select>
      <input value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))} placeholder="Max price" inputMode="decimal" />
      <button onClick={() => setFilters({ category: "All", maxPrice: "" })}>Clear Filters</button>
    </section>
  );
}

function ProductGrid({
  products,
  onOpenProduct,
  onAddToCart,
  onWishlist,
  emptyTitle = "No products uploaded yet",
  emptyCopy = "Vendor uploads will appear here."
}: {
  products: Product[];
  onOpenProduct: (productId: number) => void;
  onAddToCart: (productId: number, quantity?: number) => string;
  onWishlist?: () => void;
  emptyTitle?: string;
  emptyCopy?: string;
}) {
  const [message, setMessage] = useState({ error: "", success: "" });

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package size={42} />}
        title={emptyTitle}
        copy={emptyCopy}
      />
    );
  }

  return (
    <>
      <FormMessage error={message.error} success={message.success} />
      <section className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <span className="badge">{product.badge}</span>
            <button className="heart-btn" title="Save product" onClick={onWishlist}>
              <Heart size={17} />
            </button>
            <button className="product-image-button" onClick={() => onOpenProduct(product.id)}>
              <img src={product.image} alt={product.name} />
            </button>
            <div>
              <p>{product.vendor}</p>
              <button className="product-title-button" onClick={() => onOpenProduct(product.id)}>{product.name}</button>
              <span className="rating">
                <Star size={14} fill="currentColor" />
                {product.rating}
              </span>
              <strong>{currency.format(product.discountPrice || product.price)}</strong>
              {product.discountPrice ? <del>{currency.format(product.price)}</del> : null}
              <button
                className="primary-mini"
                onClick={() => {
                  const result = onAddToCart(product.id);
                  setMessage(result.includes("added") ? { error: "", success: result } : { error: result, success: "" });
                }}
              >
                Add to cart
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function ProductDetailsPage({
  product,
  products,
  currentUser,
  setPage,
  setSelectedProductId,
  onAddToCart,
  onMessageVendor
}: {
  product: Product | null;
  products: Product[];
  currentUser: AuthUser | null;
  setPage: (page: PageId) => void;
  setSelectedProductId: React.Dispatch<React.SetStateAction<number | null>>;
  onAddToCart: (productId: number, quantity?: number) => string;
  onMessageVendor: (productId: number, body: string) => string;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [message, setMessage] = useState({ error: "", success: "" });
  const [vendorMessage, setVendorMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [selectedColour, setSelectedColour] = useState("Standard");
  const [selectedSize, setSelectedSize] = useState("Standard");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: "Fake product", description: "" });
  const [reportWorking, setReportWorking] = useState(false);

  if (!product || product.status !== "Published" || product.stock <= 0) {
    return (
      <>
        <PageIntro kicker="Product" title="Product Unavailable" copy="" />
        <EmptyState icon={<Package size={42} />} title="Product not available" copy="This product may be unpublished, out of stock, or removed." />
      </>
    );
  }

  const addToCart = () => {
    if (product.stock <= 0) {
      setMessage({ error: "This product is out of stock.", success: "" });
      return;
    }
    const result = onAddToCart(product.id);
    setMessage(result.includes("added") ? { error: "", success: result } : { error: result, success: "" });
  };
  const sendVendorMessage = (event: FormEvent) => {
    event.preventDefault();
    setIsSendingMessage(true);
    const result = onMessageVendor(product.id, vendorMessage);
    setIsSendingMessage(false);
    if (result.includes("sent")) {
      setVendorMessage("");
      setMessage({ error: "", success: result });
      return;
    }
    setMessage({ error: result, success: "" });
  };
  const relatedProducts = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4);
  const submitReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!product.databaseId || !product.sellerUserId) {
      setMessage({ error: "This product cannot be reported yet because it is missing marketplace records.", success: "" });
      return;
    }
    setReportWorking(true);
    try {
      await createProductReport({
        productId: product.databaseId,
        sellerUserId: product.sellerUserId,
        reporterUserId: currentUser?.id,
        reason: reportForm.reason,
        description: reportForm.description.trim()
      });
      setReportOpen(false);
      setReportForm({ reason: "Fake product", description: "" });
      setMessage({ error: "", success: "Thank you. This product has been reported for admin review." });
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Could not submit report.", success: "" });
    } finally {
      setReportWorking(false);
    }
  };

  return (
    <>
      <PageIntro
        kicker={product.category}
        title={product.name}
        copy=""
        actions={<button className="ghost-button" onClick={() => { setSelectedProductId(null); setPage("home"); }}>Back to Products</button>}
      />
      <section className="product-detail-layout">
        <div className="gallery-panel">
          <img className="gallery-main" src={product.images[activeImage] || product.image} alt={product.name} />
          <div className="gallery-thumbs">
            {product.images.map((image, index) => (
              <button className={activeImage === index ? "active" : ""} key={image} onClick={() => setActiveImage(index)}>
                <img src={image} alt="" />
              </button>
            ))}
          </div>
          {product.videoUrl ? <video className="product-video" controls preload="metadata" src={product.videoUrl} /> : null}
        </div>
        <aside className="product-info-panel">
          <p className="eyebrow">{product.brand} | {product.condition}</p>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <strong>{currency.format(product.discountPrice || product.price)}</strong>
          {product.discountPrice ? <del>{currency.format(product.price)}</del> : null}
          {product.wholesalePrice ? <SummaryLine label="Wholesale price" value={`${currency.format(product.wholesalePrice)} from ${product.minimumOrderQuantity ?? 1} units`} /> : null}
          <SummaryLine label="Stock" value={`${product.stock} available`} />
          <SummaryLine label="SKU" value={product.sku} />
          <SummaryLine label="Vendor" value={product.vendor} />
          <SummaryLine label="Delivery" value={product.deliveryOptions.join(", ")} />
          <div className="variant-group">
            <span>Colour</span>
            {["Standard", "Black", "White"].map((colour) => <button className={selectedColour === colour ? "active" : ""} key={colour} onClick={() => setSelectedColour(colour)}>{colour}</button>)}
          </div>
          <div className="variant-group">
            <span>Size</span>
            {["Standard", "Small", "Large"].map((size) => <button className={selectedSize === size ? "active" : ""} key={size} onClick={() => setSelectedSize(size)}>{size}</button>)}
          </div>
          <div className="delivery-estimate"><Truck size={20} /><div><strong>Delivery estimate</strong><span>Calculated when Ghana delivery integrations are active.</span></div></div>
          <FormMessage error={message.error} success={message.success} />
          <div className="product-purchase-actions">
            <button onClick={addToCart}>Add to Cart</button>
            <button onClick={() => { const result = onAddToCart(product.id); if (result.includes("added")) setPage("checkout"); else setMessage({ error: result, success: "" }); }}>Buy Now</button>
            <button className="ghost-button" onClick={() => setPage("wishlist")}>Save to Wishlist</button>
          </div>
          <section className="seller-card">
            <Store size={23} />
            <div><small>Sold by</small><strong>{product.vendor}</strong><span>Verification badge will appear only after vendor approval.</span></div>
            <button className="ghost-button" onClick={() => setPage("stores")}>View Store</button>
          </section>
          <section className="report-card">
            <ShieldCheck size={22} />
            <div>
              <strong>Marketplace safety</strong>
              <span>Report suspicious, prohibited, counterfeit, or misleading listings.</span>
            </div>
            <button className="ghost-button" type="button" onClick={() => setReportOpen((open) => !open)}>Report Product</button>
          </section>
          {reportOpen ? (
            <form className="report-form" onSubmit={submitReport}>
              <select value={reportForm.reason} onChange={(event) => setReportForm((current) => ({ ...current, reason: event.target.value }))}>
                {reportReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
              </select>
              <textarea value={reportForm.description} onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))} placeholder="Tell us what looks unsafe or misleading..." maxLength={700} />
              <button disabled={reportWorking}>{reportWorking ? "Submitting..." : "Submit Report"}</button>
            </form>
          ) : null}
          <form className="vendor-message-box" onSubmit={sendVendorMessage}>
            <h4>Message {product.vendor}</h4>
            <textarea
              value={vendorMessage}
              onChange={(event) => setVendorMessage(event.target.value)}
              placeholder="Ask about delivery, stock, warranty, or product details..."
              maxLength={800}
            />
            <small>{vendorMessage.length}/800 characters</small>
            <button disabled={isSendingMessage}>{isSendingMessage ? "Sending..." : "Message Vendor"}</button>
            <button className="ghost-button" type="button" onClick={() => setPage("messages")}>View Messages</button>
          </form>
          <section className="buyer-protection-card">
            <ShieldCheck size={24} />
            <div><strong>MarketHub Buyer Protection</strong><p>Order, return, and dispute safeguards are being prepared. Online payments are not active yet.</p></div>
            <button className="ghost-button" onClick={() => setPage("buyer-protection")}>Learn More</button>
          </section>
          <section className="returns-card"><RotateCcw size={22} /><div><strong>Returns and refunds</strong><span>Return eligibility and refund rules will be shown before real checkout launches.</span></div></section>
        </aside>
      </section>
      <SectionHeader title="Related Products" action="Browse retail" onClick={() => setPage("retail")} />
      <ProductGrid products={relatedProducts} onOpenProduct={(productId) => setSelectedProductId(productId)} onAddToCart={onAddToCart} onWishlist={() => setPage("wishlist")} emptyTitle="More products are on the way" emptyCopy="Related items will appear as vendors publish their catalogues." />
    </>
  );
}

function CategoriesPage({
  setPage,
  products,
  filters,
  setFilters,
  onOpenProduct,
  onAddToCart
}: {
  setPage: (page: PageId) => void;
  products: Product[];
  filters: { category: string; maxPrice: string };
  setFilters: React.Dispatch<React.SetStateAction<{ category: string; maxPrice: string }>>;
  onOpenProduct: (productId: number) => void;
  onAddToCart: (productId: number, quantity?: number) => string;
}) {
  return (
    <>
      <PageIntro
        kicker="Browse"
        title="All Categories"
        copy="Explore products by department, from electronics and fashion to wholesale goods, baby products, books, and home essentials."
      />
      <section className="category-grid">
        {categories.map(([name, count, image]) => (
          <button className="category-card" key={name} onClick={() => setFilters((current) => ({ ...current, category: name }))}>
            <img src={image} alt={name} />
            <strong>{name}</strong>
            <span>{count}</span>
          </button>
        ))}
      </section>
      <SectionHeader title="Filtered Products" action="Back home" onClick={() => setPage("home")} />
      <ProductFilters filters={filters} setFilters={setFilters} />
      <ProductGrid products={products} onOpenProduct={onOpenProduct} onAddToCart={onAddToCart} onWishlist={() => setPage("wishlist")} />
    </>
  );
}

function RetailPage({
  setPage,
  products,
  filters,
  setFilters,
  onOpenProduct,
  onAddToCart
}: {
  setPage: (page: PageId) => void;
  products: Product[];
  filters: { category: string; maxPrice: string };
  setFilters: React.Dispatch<React.SetStateAction<{ category: string; maxPrice: string }>>;
  onOpenProduct: (productId: number) => void;
  onAddToCart: (productId: number, quantity?: number) => string;
}) {
  return (
    <>
      <PageIntro kicker="Retail Marketplace" title="Everyday shopping from trusted sellers" copy="Browse products for personal and household use, with Ghana-focused delivery options and local vendor support." />
      <ProductFilters filters={filters} setFilters={setFilters} />
      <ProductGrid products={products} onOpenProduct={onOpenProduct} onAddToCart={onAddToCart} onWishlist={() => setPage("wishlist")} emptyTitle="Retail shelves are being prepared" emptyCopy="Explore categories while approved vendors prepare their first products." />
    </>
  );
}

function WholesalePage({ products, setPage, onOpenProduct }: { products: Product[]; setPage: (page: PageId) => void; onOpenProduct: (productId: number) => void }) {
  return (
    <>
      <PageIntro
        kicker="Wholesale Marketplace"
        title="Source products for your business"
        copy="Discover suppliers, compare indicative bulk pricing, and prepare quotation requests for larger orders."
        actions={<button onClick={() => setPage("rfq")}>Request for Quotation</button>}
      />
      {products.length > 0 ? (
        <section className="wholesale-grid">
          {products.map((product) => (
            <article className="wholesale-card" key={product.id}>
              <img src={product.image} alt={product.name} />
              <div>
                <span className="supplier-label">Supplier verification pending</span>
                <h3>{product.name}</h3>
                <p>{product.vendor}</p>
                <strong>From {currency.format(product.discountPrice || product.price)} per unit</strong>
                <small>MOQ: Contact supplier</small>
                <small>Bulk delivery: Quote required</small>
                <div className="card-actions">
                  <button onClick={() => setPage("rfq")}>Request Quote</button>
                  <button className="ghost-button" onClick={() => onOpenProduct(product.id)}>Message Supplier</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="wholesale-empty">
          <Building2 size={48} />
          <div>
            <p className="eyebrow">Supplier network opening soon</p>
            <h3>Wholesale sourcing is being prepared</h3>
            <p>Approved suppliers and bulk products will appear here with MOQ, price tiers, and delivery information.</p>
          </div>
          <button onClick={() => setPage("rfq")}>Prepare a Quote Request</button>
        </section>
      )}
      <WholesalePreview setPage={setPage} />
    </>
  );
}

function BuyerProtectionPage({ setPage }: { setPage: (page: PageId) => void }) {
  return (
    <>
      <PageIntro kicker="MarketHub Buyer Protection" title="Confidence for every marketplace order" copy="Our buyer protection framework is being prepared to support transparent orders, seller accountability, returns, and dispute handling." />
      <section className="protection-grid">
        {[
          ["Clear order records", ClipboardList, "Keep delivery and item details connected to each order."],
          ["Verified vendor programme", BadgeCheck, "Vendor verification status will be shown only after review."],
          ["Returns and dispute support", RotateCcw, "Future tools will help buyers request returns and resolve issues."],
          ["Payment safeguards", ShieldCheck, "Online payments are not active yet. Protection workflows will launch with real payments."]
        ].map(([title, Icon, copy]) => (
          <article key={title as string}>
            <Icon size={25} />
            <h3>{title as string}</h3>
            <p>{copy as string}</p>
          </article>
        ))}
      </section>
      <section className="protection-cta">
        <div><p className="eyebrow">Shop with clarity</p><h3>Browse MarketHub while protection tools are prepared</h3></div>
        <button onClick={() => setPage("retail")}>Browse Retail</button>
      </section>
    </>
  );
}

function RequestQuotePage({ setPage }: { setPage: (page: PageId) => void }) {
  return (
    <>
      <PageIntro kicker="Coming Soon" title="Request for Quotation" copy="A professional sourcing form is being prepared for businesses that need supplier quotes and bulk delivery plans." />
      <section className="rfq-layout">
        <form className="form-panel" onSubmit={(event) => event.preventDefault()}>
          <div className="demo-notice"><strong>Coming soon</strong><span>Quotation requests are not saved or sent yet.</span></div>
          <input placeholder="Product or sourcing requirement" disabled />
          <select disabled><option>Select category</option></select>
          <input placeholder="Required quantity" disabled />
          <input placeholder="Delivery city or region" disabled />
          <textarea placeholder="Specifications, quality requirements, packaging and timeline" disabled />
          <button disabled>Submit Request Coming Soon</button>
        </form>
        <aside className="summary-panel">
          <Building2 size={35} />
          <h3>How supplier quotations will work</h3>
          <p>Describe what your business needs, compare responses from relevant suppliers, and discuss bulk delivery before placing an order.</p>
          <button className="ghost-button" onClick={() => setPage("wholesale")}>Explore Wholesale</button>
        </aside>
      </section>
    </>
  );
}

function PolicyPage({ page, user, setPage }: { page: PageId; user: AuthUser | null; setPage: (page: PageId) => void }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState({ error: "", success: "" });
  const [working, setWorking] = useState(false);
  const requestDeletion = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setMessage({ error: "Please log in before requesting account deletion.", success: "" });
      setPage("login");
      return;
    }
    if (!window.confirm("Request account deletion? Some order, dispute, tax, and legal transaction records may need to be retained.")) return;
    setWorking(true);
    try {
      await createAccountDeletionRequest({ userId: user.id, reason: reason.trim() });
      setMessage({ error: "", success: "Account deletion request submitted for admin processing." });
      setReason("");
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Could not submit deletion request.", success: "" });
    } finally {
      setWorking(false);
    }
  };

  if (page === "prohibited-items") {
    return (
      <>
        <PageIntro kicker="Marketplace Safety" title="Prohibited Items" copy="MarketHub sellers must follow Ghanaian law, platform rules, and app-store safety standards." />
        <section className="policy-grid">
          {["Illegal products", "Weapons", "Drugs", "Stolen goods", "Counterfeit goods", "Adult explicit content", "Hate or violent content", "Dangerous chemicals", "Fraudulent listings", "Products that violate Ghanaian law or platform rules"].map((item) => (
            <article className="policy-card" key={item}><ShieldCheck size={22} /><strong>{item}</strong><p>Sellers must not create or publish listings in this category.</p></article>
          ))}
        </section>
      </>
    );
  }

  if (page === "seller-policy") {
    return (
      <>
        <PageIntro kicker="Seller Policy" title="Seller Publishing Rules" copy="Approved sellers can publish immediately, but MarketHub uses post-publishing moderation to keep buyers safe." />
        <section className="policy-panel">
          <h3>Seller responsibilities</h3>
          <p>Sellers must upload accurate titles, real product images or videos, correct categories, honest pricing, clear delivery options, and lawful products only.</p>
          <p>Admins may suspend or remove products after review. Repeated violations may lead to seller suspension or banning.</p>
        </section>
      </>
    );
  }

  if (page === "delete-account") {
    return (
      <>
        <PageIntro kicker="Account Controls" title="Delete Account Request" copy="Users can request account deletion. Admins review requests to preserve legally required marketplace records." />
        <section className="split-layout">
          <form className="form-panel" onSubmit={requestDeletion}>
            <h3>Request account deletion</h3>
            <p className="privacy-note">Deleting an account may remove profile access, but completed orders, dispute records, payment references, and seller legal records may be retained where required.</p>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Optional reason for deletion" />
            <FormMessage error={message.error} success={message.success} />
            <button disabled={working}>{working ? "Submitting..." : "Request Account Deletion"}</button>
          </form>
          <aside className="summary-panel"><ShieldCheck size={34} /><h3>What happens next?</h3><p>Admins review the request, confirm identity where needed, and process deletion according to legal and marketplace safety requirements.</p></aside>
        </section>
      </>
    );
  }

  const content: Record<string, { title: string; kicker: string; copy: string; bullets: string[] }> = {
    terms: {
      kicker: "Legal",
      title: "Terms and Conditions",
      copy: "These marketplace terms explain acceptable use, seller responsibilities, buyer conduct, moderation, and test-mode checkout limitations.",
      bullets: ["Use MarketHub lawfully", "Do not upload prohibited content", "Payments are not live until secure backend verification is completed", "Admins may moderate unsafe listings"]
    },
    privacy: {
      kicker: "Privacy",
      title: "Privacy Policy",
      copy: "MarketHub collects account, seller, product, order, message, and report data to operate a safe marketplace.",
      bullets: ["We use data to provide accounts and marketplace features", "Verification documents are private", "Users can request account deletion", "Do not share sensitive credentials in messages"]
    },
    about: {
      kicker: "About",
      title: "About MarketHub",
      copy: "MarketHub is being built as a Ghana/Africa multi-vendor marketplace for retail shoppers, wholesale buyers, and approved local sellers.",
      bullets: ["Retail and wholesale discovery", "Approved seller uploads", "Buyer reporting and moderation", "Ghana-focused delivery and mobile commerce roadmap"]
    },
    help: {
      kicker: "Support",
      title: "Help Center",
      copy: "Find account, seller, product, and safety help for MarketHub.",
      bullets: ["Create an account", "Apply to become a seller", "Report unsafe products", "Contact support for account deletion or safety concerns"]
    },
    contact: {
      kicker: "Contact",
      title: "Contact MarketHub",
      copy: "Use this page as the support contact placeholder for Google Play, App Store, and marketplace users.",
      bullets: ["Support email: support@markethub.example", "Website: https://market-app-like-alibaba.vercel.app", "Response target: 2-3 business days", "Emergency safety reports should use product or seller report buttons"]
    }
  };
  const current = content[page] ?? content.about;
  return (
    <>
      <PageIntro kicker={current.kicker} title={current.title} copy={current.copy} />
      <section className="policy-panel">
        {current.bullets.map((bullet) => <p key={bullet}><BadgeCheck size={18} /> {bullet}</p>)}
      </section>
    </>
  );
}

function StoresPage({ stores, currentUser }: { stores: StoreItem[]; currentUser: AuthUser | null }) {
  const [activeReportStore, setActiveReportStore] = useState("");
  const [reportForm, setReportForm] = useState({ reason: "Scam or fraud", description: "" });
  const [message, setMessage] = useState({ error: "", success: "" });
  const [working, setWorking] = useState(false);
  const submitSellerReport = async (event: FormEvent, store: StoreItem) => {
    event.preventDefault();
    if (!store.vendorUserId) {
      setMessage({ error: "This store cannot be reported yet because it is missing marketplace records.", success: "" });
      return;
    }
    setWorking(true);
    try {
      await createSellerReport({
        sellerUserId: store.vendorUserId,
        reporterUserId: currentUser?.id,
        reason: reportForm.reason,
        description: reportForm.description.trim()
      });
      setActiveReportStore("");
      setReportForm({ reason: "Scam or fraud", description: "" });
      setMessage({ error: "", success: "Thank you. This seller report has been sent to admin moderation." });
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Could not submit seller report.", success: "" });
    } finally {
      setWorking(false);
    }
  };
  return (
    <>
      <PageIntro
        kicker="Vendors"
        title="Top Stores"
        copy="Discover verified vendors with strong ratings, clear locations, custom storefronts, and product catalogues."
        actions={<button className="ghost-button">Most popular</button>}
      />
      {stores.length === 0 ? (
        <EmptyState
          icon={<Store size={42} />}
          title="No vendor stores yet"
          copy="Verified stores will appear here."
        />
      ) : null}
      <FormMessage error={message.error} success={message.success} />
      <section className="store-grid">
        {stores.map((store) => (
          <article className="store-card" key={store.name}>
            {store.bannerUrl ? <img className="store-banner" src={store.bannerUrl} alt="" /> : null}
            <div className="store-logo">{store.logoUrl ? <img src={store.logoUrl} alt="" /> : store.logo}</div>
            <h3>{store.name}</h3>
            <p>{store.specialty} in {store.location}</p>
            {store.description ? <p>{store.description}</p> : null}
            <span className="rating">
              <Star size={14} fill="currentColor" />
              {store.rating}
            </span>
            <strong>{store.products.toLocaleString()} products</strong>
            <button className="primary-mini">Visit Store</button>
            <button className="ghost-button" onClick={() => setActiveReportStore(activeReportStore === store.name ? "" : store.name)}>Report Seller</button>
            {activeReportStore === store.name ? (
              <form className="report-form" onSubmit={(event) => void submitSellerReport(event, store)}>
                <select value={reportForm.reason} onChange={(event) => setReportForm((current) => ({ ...current, reason: event.target.value }))}>
                  {reportReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                </select>
                <textarea value={reportForm.description} onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the seller issue..." maxLength={700} />
                <button disabled={working}>{working ? "Submitting..." : "Submit Seller Report"}</button>
              </form>
            ) : null}
          </article>
        ))}
      </section>
    </>
  );
}

function DealsPage({
  setPage,
  products,
  filters,
  setFilters,
  onOpenProduct,
  onAddToCart
}: {
  setPage: (page: PageId) => void;
  products: Product[];
  filters: { category: string; maxPrice: string };
  setFilters: React.Dispatch<React.SetStateAction<{ category: string; maxPrice: string }>>;
  onOpenProduct: (productId: number) => void;
  onAddToCart: (productId: number, quantity?: number) => string;
}) {
  return (
    <>
      <PageIntro
        kicker="Promotions"
        title="Deals"
        copy="Flash sales, coupons, bundle deals, sponsored products, and seasonal campaigns will appear after vendors upload products."
      />
      <div className="tabs">
        {["All Deals", "Flash Deals", "Top Deals", "Upcoming"].map((tab, index) => (
          <button className={index === 0 ? "active" : ""} key={tab}>{tab}</button>
        ))}
      </div>
      <ProductFilters filters={filters} setFilters={setFilters} />
      <ProductGrid products={products.filter((product) => product.discountPrice)} onOpenProduct={onOpenProduct} onAddToCart={onAddToCart} onWishlist={() => setPage("wishlist")} />
    </>
  );
}

function TrackOrderPage({ orders, currentUser }: { orders: Order[]; currentUser: AuthUser | null }) {
  const customerOrders = currentUser ? orders.filter((order) => order.customerId === currentUser.id) : [];
  return (
    <>
      <PageIntro
        kicker="Orders"
        title="Track Your Order"
        copy="Customers can search by order number, view recent orders, track shipment progress, download invoices, and request returns."
      />
      <section className="tracking-search">
        <input placeholder="Enter your order number..." />
        <button>Track Order</button>
      </section>
      <section className="table-panel">
        <h3>Recent Orders</h3>
        {customerOrders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={38} />}
            title="No orders yet"
            copy="Customer orders will appear here."
          />
        ) : null}
        {customerOrders.map((order) => (
          <div className="table-row" key={order.id}>
            <span>{order.orderNumber}</span>
            <strong>{order.items.map((item) => item.name).join(", ")}</strong>
            <em className={order.status.toLowerCase().replace(" ", "-")}>{order.status}</em>
            <span>{currency.format(order.total)}</span>
            <button>View Details</button>
          </div>
        ))}
      </section>
    </>
  );
}

function CartPage({
  setPage,
  cartItems,
  products,
  updateCartQuantity,
  removeCartItem
}: {
  setPage: (page: PageId) => void;
  cartItems: CartItem[];
  products: Product[];
  updateCartQuantity: (productId: number, quantity: number) => string;
  removeCartItem: (productId: number) => void;
}) {
  const [message, setMessage] = useState({ error: "", success: "" });
  const cartDetails = getCartDetails(cartItems, products);
  const groupedItems = groupCartByVendor(cartDetails.items);
  const fees = calculateCheckoutFees(cartDetails.subtotal, groupedItems.length, "Standard delivery");
  const updateQuantity = (productId: number, quantity: number) => {
    const result = updateCartQuantity(productId, quantity);
    setMessage(result.includes("available") || result.includes("exists") ? { error: result, success: "" } : { error: "", success: result });
  };

  return (
    <>
      <PageIntro
        kicker="Shopping"
        title="Your Cart"
        copy="Multi-vendor cart with coupon support, shipping estimates, tax calculation, save for later, and stock checks."
      />
      <section className="split-layout">
        <div className="cart-list">
          <FormMessage error={message.error} success={message.success} />
          {cartDetails.items.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart size={38} />}
              title="Cart is empty"
              copy="Products added to cart will appear here."
            />
          ) : null}
          {groupedItems.map((group) => (
            <section className="vendor-cart-group" key={group.vendor}>
              <h3>{group.vendor}</h3>
              {group.items.map(({ product, quantity, unitPrice }) => (
                <article className="cart-item" key={product.id}>
                  <img src={product.image} alt={product.name} />
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.vendor}</p>
                    <span>{product.stock} available</span>
                  </div>
                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(product.id, quantity - 1)}>-</button>
                    <strong>{quantity}</strong>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                  </div>
                  <strong>{currency.format(unitPrice * quantity)}</strong>
                  <button className="ghost-button" onClick={() => removeCartItem(product.id)}>Remove</button>
                </article>
              ))}
            </section>
          ))}
        </div>
        <aside className="summary-panel">
          <h3>Order Summary</h3>
          <SummaryLine label="Product subtotal" value={currency.format(cartDetails.subtotal)} />
          <SummaryLine label="Delivery estimate" value={currency.format(fees.deliveryFee)} />
          <SummaryLine label="Platform service fee" value={currency.format(fees.serviceFee)} />
          <SummaryLine label="Total" value={currency.format(fees.total)} strong />
          <button disabled={cartDetails.items.length === 0} onClick={() => setPage("checkout")}>Proceed to Checkout</button>
        </aside>
      </section>
    </>
  );
}

function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "summary-line total" : "summary-line"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getCartDetails(cartItems: CartItem[], products: Product[]) {
  const items = cartItems
    .map((item) => {
      const product = products.find((productItem) => productItem.id === item.productId);
      if (!product) return null;
      return {
        product,
        quantity: item.quantity,
        unitPrice: product.discountPrice || product.price
      };
    })
    .filter((item): item is { product: Product; quantity: number; unitPrice: number } => Boolean(item));

  return {
    items,
    subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  };
}

function groupCartByVendor(items: Array<{ product: Product; quantity: number; unitPrice: number }>) {
  return Object.values(
    items.reduce<Record<string, { vendor: string; items: Array<{ product: Product; quantity: number; unitPrice: number }> }>>((groups, item) => {
      if (!groups[item.product.vendor]) {
        groups[item.product.vendor] = { vendor: item.product.vendor, items: [] };
      }
      groups[item.product.vendor].items.push(item);
      return groups;
    }, {})
  );
}

function calculateCheckoutFees(subtotal: number, vendorCount: number, deliveryMethod: string) {
  const perVendorFee =
    deliveryMethod === "Express delivery"
      ? EXPRESS_DELIVERY_FEE_PER_VENDOR
      : deliveryMethod === "Pickup point"
        ? PICKUP_DELIVERY_FEE_PER_VENDOR
        : STANDARD_DELIVERY_FEE_PER_VENDOR;
  const deliveryFee = subtotal > 0 ? vendorCount * perVendorFee : 0;
  const serviceFee = PLATFORM_SERVICE_FEE_ENABLED && subtotal > 0 ? Math.round(subtotal * 0.02) : 0;
  return {
    deliveryFee,
    serviceFee,
    total: subtotal + deliveryFee + serviceFee
  };
}

function CheckoutPage({
  cartItems,
  products,
  createOrder,
  setPage
}: {
  cartItems: CartItem[];
  products: Product[];
  createOrder: (checkout: {
    name: string;
    phone: string;
    address: string;
    region: string;
    city: string;
    deliveryMethod: string;
    paymentMethod: string;
    deliveryFee: number;
    serviceFee: number;
  }) => { error: string } | { order: Order; payment: PaymentRecord };
  setPage: (page: PageId) => void;
}) {
  const [delivery, setDelivery] = useState({
    name: "",
    phone: "",
    address: "",
    region: "Greater Accra",
    city: "",
    deliveryMethod: "Standard delivery",
    paymentMethod: "Mobile Money"
  });
  const [message, setMessage] = useState({ error: "", success: "" });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const cartDetails = getCartDetails(cartItems, products);
  const groupedItems = groupCartByVendor(cartDetails.items);
  const fees = calculateCheckoutFees(cartDetails.subtotal, groupedItems.length, delivery.deliveryMethod);
  const updateDelivery = (field: keyof typeof delivery, value: string) => {
    setDelivery((current) => ({ ...current, [field]: value }));
    setMessage({ error: "", success: "" });
  };
  const startCheckout = (outcome: "success" | "failed") => {
    setIsPlacingOrder(true);
    const validationError = validateCheckout(delivery, cartDetails.items);
    if (validationError) {
      setMessage({ error: validationError, success: "" });
      setIsPlacingOrder(false);
      return;
    }
    const result = createOrder({
      ...delivery,
      deliveryFee: fees.deliveryFee,
      serviceFee: fees.serviceFee
    });
    if ("error" in result) {
      setMessage({ error: result.error, success: "" });
      setIsPlacingOrder(false);
      return;
    }
    setMessage({
      error: "",
      success: outcome === "success"
        ? "Test order created. Opening the successful payment-flow test..."
        : "Test order created. Opening the failed payment-flow test..."
    });
    setIsPlacingOrder(false);
    setPage(outcome === "success" ? "payment-success" : "payment-failure");
  };
  const placeOrder = (event: FormEvent) => {
    event.preventDefault();
    startCheckout("success");
  };

  return (
    <>
      <PageIntro
        kicker="Demo Mode"
        title="Checkout Testing"
        copy="Online payment is not active yet. This checkout flow is currently for testing only."
      />
      <section className="split-layout checkout-layout">
        <form className="form-panel" onSubmit={placeOrder}>
          <div className="demo-notice">
            <strong>Demo mode</strong>
            <span>Online payment is not active yet. No real payment will be processed.</span>
          </div>
          <h3>Delivery Information</h3>
          <input value={delivery.name} onChange={(event) => updateDelivery("name", event.target.value)} placeholder="Full name" />
          <input value={delivery.phone} onChange={(event) => updateDelivery("phone", event.target.value)} placeholder="Phone number" />
          <input value={delivery.address} onChange={(event) => updateDelivery("address", event.target.value)} placeholder="Address" />
          <select value={delivery.region} onChange={(event) => updateDelivery("region", event.target.value)}>
            {["Greater Accra", "Ashanti", "Central", "Eastern", "Western", "Northern", "Volta", "Bono"].map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <input value={delivery.city} onChange={(event) => updateDelivery("city", event.target.value)} placeholder="City" />
          <select value={delivery.deliveryMethod} onChange={(event) => updateDelivery("deliveryMethod", event.target.value)}>
            <option value="Standard delivery">Standard delivery, 2-3 days</option>
            <option value="Pickup point">Pickup point</option>
            <option value="Express delivery">Express delivery</option>
          </select>
          <select value={delivery.paymentMethod} onChange={(event) => updateDelivery("paymentMethod", event.target.value)}>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Card payment">Card payment</option>
            <option value="Bank transfer">Bank transfer</option>
            <option value="Wallet balance">Wallet balance</option>
          </select>
          <FormMessage error={message.error} success={message.success} />
          <button disabled={isPlacingOrder || cartDetails.items.length === 0}>{isPlacingOrder ? "Creating test order..." : "Test Successful Payment Flow"}</button>
        </form>
        <aside className="summary-panel">
          <h3>Checkout Summary</h3>
          <p className="payment-provider-note">Testing only. Payment details are not collected or sent to a payment provider.</p>
          {groupedItems.length === 0 ? (
            <EmptyState icon={<ShoppingCart size={38} />} title="No items to checkout" copy="Add products to cart before checkout." />
          ) : null}
          {groupedItems.map((group) => (
            <div className="checkout-vendor-group" key={group.vendor}>
              <strong>{group.vendor}</strong>
              {group.items.map((item) => (
                <span key={item.product.id}>{item.quantity} x {item.product.name}</span>
              ))}
            </div>
          ))}
          <SummaryLine label="Product subtotal" value={currency.format(cartDetails.subtotal)} />
          <SummaryLine label="Delivery fee" value={currency.format(fees.deliveryFee)} />
          <SummaryLine label="Platform service fee" value={currency.format(fees.serviceFee)} />
          <SummaryLine label="Total due" value={currency.format(fees.total)} strong />
          <button className="ghost-button" type="button" onClick={() => startCheckout("failed")} disabled={isPlacingOrder || cartDetails.items.length === 0}>
            Test Failed Payment Flow
          </button>
        </aside>
      </section>
    </>
  );
}

function validateCheckout(delivery: {
  name: string;
  phone: string;
  address: string;
  region: string;
  city: string;
  deliveryMethod: string;
  paymentMethod: string;
}, items: Array<{ product: Product; quantity: number; unitPrice: number }>) {
  if (items.length === 0) return "Your cart is empty.";
  if (!delivery.name.trim()) return "Full name is required.";
  if (!delivery.phone.trim() || delivery.phone.trim().length < 8) return "Enter a valid phone number.";
  if (!delivery.address.trim()) return "Delivery address is required.";
  if (!delivery.region.trim()) return "Region is required.";
  if (!delivery.city.trim()) return "City is required.";
  if (!delivery.deliveryMethod.trim()) return "Delivery method is required.";
  if (!delivery.paymentMethod.trim()) return "Payment method is required.";
  return "";
}

function PaymentResultPage({
  outcome,
  reference,
  payments,
  completePayment,
  setPage
}: {
  outcome: "success" | "failed";
  reference: string | null;
  payments: PaymentRecord[];
  completePayment: (reference: string, outcome: "success" | "failed") => Promise<string>;
  setPage: (page: PageId) => void;
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });
  const payment = payments.find((paymentRecord) => paymentRecord.reference === reference);

  const verifyPayment = async () => {
    if (!reference) {
      setMessage({ error: "Missing payment reference.", success: "" });
      return;
    }
    setIsVerifying(true);
    const result = await completePayment(reference, outcome);
    setIsVerifying(false);
    if (result.includes("success")) {
      setMessage({ error: "", success: result });
      setPage("order-confirmation");
      return;
    }
    setMessage({ error: result, success: "" });
  };

  return (
    <>
      <PageIntro kicker="Demo Mode" title={outcome === "success" ? "Successful Payment Flow Test" : "Failed Payment Flow Test"} copy="" />
      <section className="confirmation-panel">
        {outcome === "success" ? <CheckCircle2 size={46} /> : <CreditCard size={46} />}
        <h3>{outcome === "success" ? "Complete successful-flow test" : "Complete failed-flow test"}</h3>
        <p>Online payment is not active yet. This screen changes temporary frontend test data only.</p>
        {payment ? (
          <div className="confirmation-grid">
            <SummaryLine label="Reference" value={payment.reference} />
            <SummaryLine label="Amount" value={currency.format(payment.amount)} />
            <SummaryLine label="Currency" value={payment.currency} />
            <SummaryLine label="Status" value={payment.status} />
          </div>
        ) : null}
        <FormMessage error={message.error} success={message.success} />
        <button onClick={verifyPayment} disabled={isVerifying || !payment}>
          {isVerifying ? "Running test..." : outcome === "success" ? "Complete Successful Payment Test" : "Complete Failed Payment Test"}
        </button>
        <button className="ghost-button" onClick={() => setPage("checkout")}>Back to Checkout</button>
      </section>
    </>
  );
}

function OrderConfirmationPage({ order, payment, setPage }: { order: Order | null; payment: PaymentRecord | null; setPage: (page: PageId) => void }) {
  if (!order) {
    return (
      <>
        <PageIntro kicker="Order" title="No Confirmation Available" copy="" />
        <EmptyState icon={<ClipboardList size={42} />} title="No recent order" copy="Confirmed orders will appear here after checkout." />
      </>
    );
  }

  return (
    <>
      <PageIntro kicker="Order Confirmed" title="Thank you for your order" copy="" />
      <section className="confirmation-panel">
        <CheckCircle2 size={46} />
        <h3>{order.orderNumber}</h3>
        <p>Your order has been created and vendors can begin processing it.</p>
        <div className="confirmation-grid">
          <SummaryLine label="Customer" value={order.customerName} />
          <SummaryLine label="Phone" value={order.phone} />
          <SummaryLine label="Delivery" value={`${order.city}, ${order.region}`} />
          <SummaryLine label="Payment" value={order.paymentMethod} />
          <SummaryLine label="Payment status" value={payment?.status ?? "PENDING"} />
          <SummaryLine label="Reference" value={payment?.reference ?? order.paymentReference ?? "Not available"} />
          <SummaryLine label="Total" value={currency.format(order.total)} strong />
        </div>
        <section className="table-panel">
          <h3>Order Items</h3>
          {order.items.map((item) => (
            <div className="table-row" key={item.productId}>
              <span>{item.vendor}</span>
              <strong>{item.name}</strong>
              <em>Qty {item.quantity}</em>
              <span>{currency.format(item.subtotal)}</span>
              <button onClick={() => setPage("track")}>Track</button>
            </div>
          ))}
        </section>
        <button onClick={() => setPage("track")}>Track Order</button>
      </section>
    </>
  );
}

function WishlistPage({ products, onOpenProduct, onAddToCart }: { products: Product[]; onOpenProduct: (productId: number) => void; onAddToCart: (productId: number, quantity?: number) => string }) {
  return (
    <>
      <PageIntro
        kicker="Saved"
        title="My Wishlist"
        copy="Saved products stay available for future shopping, sale alerts, sharing, and quick cart movement."
        actions={<button className="ghost-button">Share wishlist</button>}
      />
      <ProductGrid products={products} onOpenProduct={onOpenProduct} onAddToCart={onAddToCart} />
    </>
  );
}

function sanitizeMessage(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function canAccessConversation(conversation: Conversation, user: AuthUser | null) {
  if (!user) return false;
  if (user.role === "CUSTOMER") return conversation.customerId === user.id;
  if (user.role === "VENDOR") return conversation.vendor === (user.storeName || user.name);
  return false;
}

function getConversationUnreadCount(conversation: Conversation, user: AuthUser | null) {
  if (!user) return 0;
  return conversation.messages.filter((message) =>
    user.role === "CUSTOMER"
      ? !message.readByCustomer && message.senderRole !== "CUSTOMER"
      : user.role === "VENDOR"
        ? !message.readByVendor && message.senderRole !== "VENDOR"
        : false
  ).length;
}

function getUnreadMessageCount(user: AuthUser | null, conversations: Conversation[]) {
  return conversations
    .filter((conversation) => canAccessConversation(conversation, user))
    .reduce((sum, conversation) => sum + getConversationUnreadCount(conversation, user), 0);
}

function MessagesPage({
  user,
  conversations,
  sendConversationMessage,
  markConversationRead
}: {
  user: AuthUser | null;
  conversations: Conversation[];
  sendConversationMessage: (conversationId: number, body: string) => string;
  markConversationRead: (conversationId: number) => void;
}) {
  const accessibleConversations = conversations.filter((conversation) => canAccessConversation(conversation, user));
  const [activeConversationId, setActiveConversationId] = useState<number | null>(accessibleConversations[0]?.id ?? null);
  const activeConversation = accessibleConversations.find((conversation) => conversation.id === activeConversationId) ?? accessibleConversations[0] ?? null;

  useEffect(() => {
    if (activeConversation) markConversationRead(activeConversation.id);
  }, [activeConversation?.id]);

  return (
    <>
      <PageIntro
        kicker="Chat"
        title="Messages"
        copy="Customer and vendor conversations can include text, images, files, and order-linked support context."
      />
      {accessibleConversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={42} />}
          title="No conversations yet"
          copy="Open a product and use Message Vendor to start a secure buyer-to-vendor conversation."
        />
      ) : (
        <ConversationWorkspace
          user={user}
          conversations={accessibleConversations}
          activeConversation={activeConversation}
          setActiveConversationId={setActiveConversationId}
          sendConversationMessage={sendConversationMessage}
        />
      )}
    </>
  );
}

function ConversationWorkspace({
  user,
  conversations,
  activeConversation,
  setActiveConversationId,
  sendConversationMessage
}: {
  user: AuthUser | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversationId: React.Dispatch<React.SetStateAction<number | null>>;
  sendConversationMessage: (conversationId: number, body: string) => string;
}) {
  const [messageText, setMessageText] = useState("");
  const [message, setMessage] = useState({ error: "", success: "" });
  const [isSending, setIsSending] = useState(false);
  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!activeConversation) return;
    setIsSending(true);
    const result = sendConversationMessage(activeConversation.id, messageText);
    setIsSending(false);
    if (result.includes("sent")) {
      setMessageText("");
      setMessage({ error: "", success: result });
      return;
    }
    setMessage({ error: result, success: "" });
  };

  return (
    <section className="messages-layout conversation-layout">
      <aside>
        {conversations.map((conversation) => {
          const unreadCount = getConversationUnreadCount(conversation, user);
          return (
            <button
              className={activeConversation?.id === conversation.id ? "active" : ""}
              key={conversation.id}
              onClick={() => {
                setActiveConversationId(conversation.id);
                setMessage({ error: "", success: "" });
              }}
            >
              <MessageSquare size={17} />
              <span>
                <strong>{user?.role === "CUSTOMER" ? conversation.vendor : conversation.customerName}</strong>
                <small>{conversation.productName ?? "General marketplace chat"}</small>
              </span>
              {unreadCount > 0 ? <span className="thread-badge">{unreadCount}</span> : null}
            </button>
          );
        })}
      </aside>
      <article className="conversation-panel">
        {activeConversation ? (
          <>
            <div className="conversation-header">
              <div>
                <h3>{user?.role === "CUSTOMER" ? activeConversation.vendor : activeConversation.customerName}</h3>
                <p>{activeConversation.productName ? `Product: ${activeConversation.productName}` : "Marketplace conversation"}</p>
              </div>
              <span>Updated {activeConversation.updatedAt}</span>
            </div>
            <div className="message-thread">
              {activeConversation.messages.map((conversationMessage) => (
                <div
                  className={conversationMessage.senderId === user?.id ? "message-bubble mine" : "message-bubble"}
                  key={conversationMessage.id}
                >
                  <strong>{conversationMessage.senderName}</strong>
                  <p>{conversationMessage.body}</p>
                  <small>{conversationMessage.createdAt}</small>
                </div>
              ))}
            </div>
            <form className="composer" onSubmit={submitMessage}>
              <input
                value={messageText}
                onChange={(event) => {
                  setMessageText(event.target.value);
                  setMessage({ error: "", success: "" });
                }}
                placeholder="Write a safe plain text reply..."
                maxLength={800}
              />
              <button disabled={isSending}>{isSending ? "Sending..." : "Send"}</button>
            </form>
            <FormMessage error={message.error} success={message.success} />
          </>
        ) : (
          <EmptyState icon={<MessageSquare size={42} />} title="Select a conversation" copy="Choose a thread to read and reply." />
        )}
      </article>
    </section>
  );
}

function getPaymentForOrder(order: Order, payments: PaymentRecord[]) {
  return payments.find((payment) => payment.reference === order.paymentReference) ?? null;
}

function getVendorOrderLines(vendorName: string, orders: Order[], payments: PaymentRecord[]) {
  return orders.flatMap((order) => {
    const payment = getPaymentForOrder(order, payments);
    return order.items
      .filter((item) => item.vendor === vendorName)
      .map((item) => ({
        order,
        item,
        payment,
        paymentStatus: payment?.status ?? "PENDING"
      }));
  });
}

function getVendorFinance(vendorName: string, orders: Order[], payments: PaymentRecord[], payoutRequests: PayoutRequest[]) {
  const orderLines = getVendorOrderLines(vendorName, orders, payments);
  const completedLines = orderLines.filter(
    (line) => line.paymentStatus === "SUCCESSFUL" && line.item.deliveryStatus === "Delivered"
  );
  const grossCompletedSales = completedLines.reduce((sum, line) => sum + line.item.subtotal, 0);
  const platformCommission = Math.round(grossCompletedSales * PLATFORM_COMMISSION_RATE);
  const netEarnings = grossCompletedSales - platformCommission;
  const pendingPayouts = payoutRequests
    .filter((request) => request.vendor === vendorName && ["PENDING", "APPROVED"].includes(request.status))
    .reduce((sum, request) => sum + request.amount, 0);

  return {
    orderLines,
    completedLines,
    grossCompletedSales,
    platformCommission,
    netEarnings,
    pendingPayouts,
    availableEarnings: Math.max(0, netEarnings - pendingPayouts)
  };
}

function getNextDeliveryStatus(status: VendorDeliveryStatus): VendorDeliveryStatus | null {
  if (status === "New") return "Confirmed";
  if (status === "Confirmed") return "Preparing";
  if (status === "Preparing") return "Shipped";
  if (status === "Shipped") return "Delivered";
  return null;
}

function VendorDashboard({
  user,
  setUsers,
  setCurrentUser,
  products,
  orders,
  payments,
  payoutRequests,
  conversations,
  updateVendorOrderItemStatus,
  sendConversationMessage,
  markConversationRead,
  setPage
}: {
  user: AuthUser | null;
  setUsers: React.Dispatch<React.SetStateAction<AuthUser[]>>;
  setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  products: Product[];
  orders: Order[];
  payments: PaymentRecord[];
  payoutRequests: PayoutRequest[];
  conversations: Conversation[];
  updateVendorOrderItemStatus: (orderId: number, productId: number, nextStatus: VendorDeliveryStatus) => void;
  sendConversationMessage: (conversationId: number, body: string) => string;
  markConversationRead: (conversationId: number) => void;
  setPage: (page: PageId) => void;
}) {
  const vendorName = user?.storeName || user?.name || "Vendor";
  const vendorProducts = products.filter((product) => product.vendor === vendorName);
  const stockTotal = vendorProducts.reduce((sum, product) => sum + product.stock, 0);
  const finance = getVendorFinance(vendorName, orders, payments, payoutRequests);
  const vendorConversations = conversations.filter((conversation) => canAccessConversation(conversation, user));
  const unreadMessages = getUnreadMessageCount(user, conversations);
  const newOrders = finance.orderLines.filter((line) => line.paymentStatus === "SUCCESSFUL" && line.item.deliveryStatus === "New").length;
  const orderPreview = finance.orderLines.slice(0, 8);
  const [storeForm, setStoreForm] = useState({
    storeName: user?.storeName ?? "",
    description: user?.storeDescription ?? "",
    logoUrl: user?.storeLogoUrl ?? "",
    bannerUrl: user?.storeBannerUrl ?? ""
  });
  const [storeMessage, setStoreMessage] = useState({ error: "", success: "" });

  const updateStoreField = (field: keyof typeof storeForm, value: string) => {
    setStoreForm((current) => ({ ...current, [field]: value }));
    setStoreMessage({ error: "", success: "" });
  };

  const updateStoreFile = (field: "logoUrl" | "bannerUrl", file: File | undefined) => {
    if (!file) return;
    updateStoreField(field, URL.createObjectURL(file));
  };

  const updateStore = (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!storeForm.storeName.trim()) {
      setStoreMessage({ error: "Store name is required.", success: "" });
      return;
    }
    if (storeForm.description.trim().length < 20) {
      setStoreMessage({ error: "Store description must be at least 20 characters.", success: "" });
      return;
    }

    const updatedUser = {
      ...user,
      storeName: storeForm.storeName.trim(),
      storeDescription: storeForm.description.trim(),
      storeLogoUrl: storeForm.logoUrl,
      storeBannerUrl: storeForm.bannerUrl
    };

    setUsers((currentUsers) => currentUsers.map((currentUser) => (currentUser.id === user.id ? updatedUser : currentUser)));
    setCurrentUser(updatedUser);
    setStoreMessage({ error: "", success: "Store settings updated." });
  };

  return (
    <>
      <PageIntro
        kicker="Vendor"
        title="Vendor Dashboard"
        copy="Sellers manage products, orders, inventory, promotions, reviews, earnings, and store settings from one workspace."
      />
      <section className="stat-grid">
        <Metric label="Total products" value={String(vendorProducts.length)} delta={`Stock units: ${stockTotal}`} />
        <Metric label="New orders" value={String(newOrders)} delta="Paid orders waiting" />
        <Metric label="Completed sales" value={String(finance.completedLines.length)} delta={currency.format(finance.grossCompletedSales)} />
        <Metric label="Available earnings" value={currency.format(finance.availableEarnings)} delta={`${Math.round(PLATFORM_COMMISSION_RATE * 100)}% commission deducted`} />
        <Metric label="Pending payouts" value={currency.format(finance.pendingPayouts)} delta="Awaiting admin review" />
        <Metric label="Unread messages" value={String(unreadMessages)} delta="Buyer conversations" />
      </section>
      <section className="dashboard-grid">
        {finance.completedLines.length > 0 ? (
          <VendorSalesChart lines={finance.completedLines} />
        ) : (
          <EmptyState icon={<LineChart size={42} />} title="No sales chart yet" copy="Charts will appear after paid orders are delivered." />
        )}
        <ListPanel
          title="Recent Orders"
          items={orderPreview.map((line) => `${line.order.orderNumber}: ${line.item.name} - ${line.item.deliveryStatus}`)}
          emptyCopy="Customer orders containing your products will appear here."
        />
        <ListPanel title="Low Stock Alerts" items={vendorProducts.filter((product) => product.stock <= 5).map((product) => `${product.name}: ${product.stock} left`)} emptyCopy="No low stock alerts." />
      </section>
      <section className="table-panel vendor-orders-table">
        <div className="section-heading">
          <div>
            <h3>Vendor Orders</h3>
            <p>Only order lines containing products from {vendorName} are shown.</p>
          </div>
          <button className="ghost-button" onClick={() => setPage("payments")}>Request Payout</button>
        </div>
        {finance.orderLines.length === 0 ? (
          <EmptyState icon={<ClipboardList size={42} />} title="No vendor orders yet" copy="Paid customer orders for your products will appear here with delivery actions." />
        ) : null}
        {finance.orderLines.map((line) => (
          <VendorOrderRow
            key={`${line.order.id}-${line.item.productId}`}
            order={line.order}
            item={line.item}
            paymentStatus={line.paymentStatus}
            updateVendorOrderItemStatus={updateVendorOrderItemStatus}
          />
        ))}
      </section>
      <section className="table-panel vendor-messages-panel">
        <div className="section-heading">
          <div>
            <h3>Buyer Messages</h3>
            <p>Reply to customers who contacted {vendorName} from product pages.</p>
          </div>
        </div>
        {vendorConversations.length === 0 ? (
          <EmptyState icon={<MessageSquare size={42} />} title="No buyer messages yet" copy="Customer questions about your products will appear here." />
        ) : (
          <VendorConversationPanel
            user={user}
            conversations={vendorConversations}
            sendConversationMessage={sendConversationMessage}
            markConversationRead={markConversationRead}
          />
        )}
      </section>
      <section className="split-layout">
        <form className="form-panel" onSubmit={updateStore}>
          <h3>Store Setup</h3>
          <input value={storeForm.storeName} onChange={(event) => updateStoreField("storeName", event.target.value)} placeholder="Store name" />
          <textarea value={storeForm.description} onChange={(event) => updateStoreField("description", event.target.value)} placeholder="Store description" />
          <label className="file-input">
            <span>Store logo</span>
            <input type="file" accept="image/*" onChange={(event) => updateStoreFile("logoUrl", event.target.files?.[0])} />
            <small>{storeForm.logoUrl ? "Logo selected" : "No logo selected"}</small>
          </label>
          <label className="file-input">
            <span>Store banner</span>
            <input type="file" accept="image/*" onChange={(event) => updateStoreFile("bannerUrl", event.target.files?.[0])} />
            <small>{storeForm.bannerUrl ? "Banner selected" : "No banner selected"}</small>
          </label>
          <FormMessage error={storeMessage.error} success={storeMessage.success} />
          <button>Update Store</button>
        </form>
        <aside className="store-preview">
          {storeForm.bannerUrl ? <img className="store-banner" src={storeForm.bannerUrl} alt="" /> : null}
          <div className="store-logo">{storeForm.logoUrl ? <img src={storeForm.logoUrl} alt="" /> : vendorName.slice(0, 2).toUpperCase()}</div>
          <h3>{storeForm.storeName || vendorName}</h3>
          <p>{storeForm.description || "Store description will appear here."}</p>
        </aside>
      </section>
    </>
  );
}

function VendorConversationPanel({
  user,
  conversations,
  sendConversationMessage,
  markConversationRead
}: {
  user: AuthUser | null;
  conversations: Conversation[];
  sendConversationMessage: (conversationId: number, body: string) => string;
  markConversationRead: (conversationId: number) => void;
}) {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(conversations[0]?.id ?? null);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0] ?? null;

  useEffect(() => {
    if (activeConversation) markConversationRead(activeConversation.id);
  }, [activeConversation?.id]);

  return (
    <ConversationWorkspace
      user={user}
      conversations={conversations}
      activeConversation={activeConversation}
      setActiveConversationId={setActiveConversationId}
      sendConversationMessage={sendConversationMessage}
    />
  );
}

function VendorSalesChart({ lines }: { lines: Array<{ item: OrderItem }> }) {
  const maxAmount = Math.max(...lines.map((line) => line.item.subtotal), 1);
  return (
    <article className="chart-panel">
      <h3>Delivered Sales</h3>
      <div className="chart">
        {lines.slice(-12).map((line, index) => (
          <span
            style={{ height: Math.max(18, Math.round((line.item.subtotal / maxAmount) * 116)) }}
            title={`${line.item.name}: ${currency.format(line.item.subtotal)}`}
            key={`${line.item.productId}-${index}`}
          />
        ))}
      </div>
      <p className="panel-empty">Real delivered order values will appear after commission tracking is connected.</p>
    </article>
  );
}

function VendorOrderRow({
  order,
  item,
  paymentStatus,
  updateVendorOrderItemStatus
}: {
  order: Order;
  item: OrderItem;
  paymentStatus: string;
  updateVendorOrderItemStatus: (orderId: number, productId: number, nextStatus: VendorDeliveryStatus) => void;
}) {
  const isPaid = paymentStatus === "SUCCESSFUL";
  const nextStatus = getNextDeliveryStatus(item.deliveryStatus);
  const statusActions: Array<{ label: string; status: VendorDeliveryStatus }> = [
    { label: "Confirm order", status: "Confirmed" },
    { label: "Prepare order", status: "Preparing" },
    { label: "Mark as shipped", status: "Shipped" },
    { label: "Mark as delivered", status: "Delivered" }
  ];

  return (
    <article className="vendor-order-row">
      <div>
        <small>Order number</small>
        <strong>{order.orderNumber}</strong>
      </div>
      <div>
        <small>Product</small>
        <strong>{item.name}</strong>
        <span>{item.quantity} x {currency.format(item.unitPrice)}</span>
      </div>
      <div>
        <small>Customer delivery information</small>
        <strong>{order.customerName}</strong>
        <span>{order.phone}</span>
        <span>{order.address}, {order.city}, {order.region}</span>
        <span>{order.deliveryMethod}</span>
      </div>
      <div>
        <small>Amount</small>
        <strong>{currency.format(item.subtotal)}</strong>
        <span>Qty: {item.quantity}</span>
      </div>
      <div>
        <small>Payment status</small>
        <em className={isPaid ? "" : "processing"}>{paymentStatus}</em>
      </div>
      <div>
        <small>Delivery status</small>
        <em className={item.deliveryStatus === "Delivered" ? "" : "processing"}>{item.deliveryStatus}</em>
        <span>{order.createdAt}</span>
      </div>
      <div className="order-actions">
        {statusActions.map((action) => (
          <button
            type="button"
            key={action.status}
            disabled={!isPaid || nextStatus !== action.status}
            onClick={() => updateVendorOrderItemStatus(order.id, item.productId, action.status)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function AdminDashboard({
  adminUser,
  users,
  setUsers,
  products,
  setProducts,
  orders,
  payments,
  payoutRequests,
  vendorApplications,
  setVendorApplications,
  productReports,
  setProductReports,
  sellerReports,
  setSellerReports,
  accountDeletionRequests
}: {
  adminUser: AuthUser | null;
  users: AuthUser[];
  setUsers: React.Dispatch<React.SetStateAction<AuthUser[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  payments: PaymentRecord[];
  payoutRequests: PayoutRequest[];
  vendorApplications: VendorApplication[];
  setVendorApplications: React.Dispatch<React.SetStateAction<VendorApplication[]>>;
  productReports: ProductReport[];
  setProductReports: React.Dispatch<React.SetStateAction<ProductReport[]>>;
  sellerReports: SellerReportRecord[];
  setSellerReports: React.Dispatch<React.SetStateAction<SellerReportRecord[]>>;
  accountDeletionRequests: AccountDeletionRequestRecord[];
}) {
  type AdminSection =
    | "Overview"
    | "Vendor Applications"
    | "Vendors"
    | "Customers"
    | "Products"
    | "Categories"
    | "Orders"
    | "Payments"
    | "Payouts"
    | "Disputes"
    | "Reports"
    | "App Store Readiness"
    | "Finance Settings"
    | "Platform Settings";

  const adminSections: AdminSection[] = [
    "Overview",
    "Vendor Applications",
    "Vendors",
    "Customers",
    "Products",
    "Categories",
    "Orders",
    "Payments",
    "Payouts",
    "Disputes",
    "Reports",
    "App Store Readiness",
    "Finance Settings",
    "Platform Settings"
  ];
  const vendors = users.filter((user) => user.role === "VENDOR");
  const customers = users.filter((user) => user.role === "CUSTOMER");
  const pendingApplications = vendorApplications.filter((application) => application.status === "PENDING");
  const successfulPayments = payments.filter((payment) => payment.status === "SUCCESSFUL");
  const totalRevenue = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const platformCommissionEarned = getPlatformCommissionFromOrders(orders, payments);
  const pendingPayoutTotal = payoutRequests
    .filter((request) => ["PENDING", "APPROVED"].includes(request.status))
    .reduce((sum, request) => sum + request.amount, 0);
  const ordersToday = orders.filter((order) => isToday(order.createdAt)).length;
  const publishedProducts = products.filter((product) => product.status === "Published");
  const reportedProducts = products.filter((product) => product.status === "Suspended" || product.status === "Removed");
  const pendingProductReports = productReports.filter((report) => report.status === "PENDING");
  const pendingSellerReports = sellerReports.filter((report) => report.status === "PENDING");
  const pendingDeletionRequests = accountDeletionRequests.filter((request) => request.status === "PENDING");
  const [activeSection, setActiveSection] = useState<AdminSection>("Overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pageNumber, setPageNumber] = useState(1);
  const [categoryList, setCategoryList] = useState(categories.map(([name]) => name));
  const [newCategory, setNewCategory] = useState("");
  const [settings, setSettings] = useState({
    commissionRate: String(Math.round(PLATFORM_COMMISSION_RATE * 100)),
    serviceFeeEnabled: PLATFORM_SERVICE_FEE_ENABLED ? "Enabled" : "Disabled",
    marketplaceStatus: "Open"
  });
  const [financeSetting, setFinanceSetting] = useState<PlatformSettingRow | null>(null);
  const [settlementAccount, setSettlementAccount] = useState<SettlementAccountRow | null>(null);
  const [financeMessage, setFinanceMessage] = useState({ error: "", success: "" });
  const [settlementForm, setSettlementForm] = useState({
    accountHolderName: "",
    bankName: "",
    bankCode: "",
    accountNumber: ""
  });

  useEffect(() => {
    if (!supabase || adminUser?.role !== "ADMIN") return;
    const client = supabase;
    const loadFinanceSettings = async () => {
      const [{ data: setting }, { data: account }] = await Promise.all([
        client.from("platform_settings").select("*").limit(1).maybeSingle<PlatformSettingRow>(),
        client.from("platform_settlement_accounts").select("*").eq("is_active", true).limit(1).maybeSingle<SettlementAccountRow>()
      ]);
      if (setting) {
        setFinanceSetting(setting);
        setSettings((current) => ({ ...current, commissionRate: String(setting.commission_rate) }));
      }
      if (account) setSettlementAccount(account);
    };
    void loadFinanceSettings();
  }, [adminUser?.id, adminUser?.role]);

  const saveTestSettlementAccount = async (event: FormEvent) => {
    event.preventDefault();
    setFinanceMessage({ error: "", success: "" });
    if (!adminUser || adminUser.role !== "ADMIN") {
      setFinanceMessage({ error: "Only an authorised administrator can update Finance Settings.", success: "" });
      return;
    }
    if (!settlementForm.accountHolderName.trim() || !settlementForm.bankName.trim() || !settlementForm.bankCode.trim()) {
      setFinanceMessage({ error: "Account holder name, bank name, and bank code are required.", success: "" });
      return;
    }
    const digits = settlementForm.accountNumber.replace(/\D/g, "");
    if (digits.length < 6) {
      setFinanceMessage({ error: "Enter a valid account number for the masked test configuration.", success: "" });
      return;
    }
    if (!supabase) {
      setFinanceMessage({ error: "Finance database tables are not connected yet.", success: "" });
      return;
    }
    const masked = `${"*".repeat(Math.max(6, digits.length - 4))}${digits.slice(-4)}`;
    const { data, error } = await supabase
      .from("platform_settlement_accounts")
      .insert({
        account_holder_name: settlementForm.accountHolderName.trim(),
        bank_name: settlementForm.bankName.trim(),
        bank_code: settlementForm.bankCode.trim(),
        account_number_masked: masked,
        currency: "GHS",
        verification_status: "UNVERIFIED",
        is_active: false,
        created_by: adminUser.id
      })
      .select("*")
      .single<SettlementAccountRow>();
    if (error || !data) {
      setFinanceMessage({ error: error?.message ?? "Could not save the masked test configuration.", success: "" });
      return;
    }
    await supabase.from("admin_audit_logs").insert({
      admin_user_id: adminUser.id,
      action: "CREATE_TEST_SETTLEMENT_ACCOUNT",
      entity_type: "platform_settlement_accounts",
      entity_id: data.id,
      metadata: { bank_name: data.bank_name, bank_code: data.bank_code, account_number_masked: data.account_number_masked }
    });
    setSettlementAccount(data);
    setSettlementForm((current) => ({ ...current, accountNumber: "" }));
    setFinanceMessage({ error: "", success: "Masked test configuration saved. Verification and real settlement remain inactive." });
  };
  const saveFinanceSettings = async () => {
    const rate = Number(settings.commissionRate);
    if (!adminUser || adminUser.role !== "ADMIN" || !supabase) {
      setFinanceMessage({ error: "Finance settings require a connected database and authorised administrator.", success: "" });
      return;
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setFinanceMessage({ error: "Enter a commission rate between 0 and 100.", success: "" });
      return;
    }
    const settingId = financeSetting?.id ?? "00000000-0000-0000-0000-000000000001";
    const { data, error } = await supabase
      .from("platform_settings")
      .upsert({
        id: settingId,
        commission_rate: rate,
        currency: "GHS",
        payments_enabled: false,
        payment_mode: "TEST",
        updated_by: adminUser.id
      })
      .select("*")
      .single<PlatformSettingRow>();
    if (error || !data) {
      setFinanceMessage({ error: error?.message ?? "Could not update Finance Settings.", success: "" });
      return;
    }
    await supabase.from("admin_audit_logs").insert({
      admin_user_id: adminUser.id,
      action: "UPDATE_PLATFORM_FINANCE_SETTINGS",
      entity_type: "platform_settings",
      entity_id: data.id,
      metadata: { commission_rate: data.commission_rate, currency: data.currency, payment_mode: data.payment_mode }
    });
    setFinanceSetting(data);
    setFinanceMessage({ error: "", success: "Finance Settings saved in TEST MODE." });
  };

  const resetTableState = (section: AdminSection) => {
    setActiveSection(section);
    setSearch("");
    setStatusFilter("All");
    setPageNumber(1);
  };
  const updateVendorStatus = (vendorId: string, status: "APPROVED" | "SUSPENDED") => {
    const action = status === "SUSPENDED" ? "suspend this vendor" : "reactivate this vendor";
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === vendorId ? { ...user, vendorStatus: status } : user))
    );
  };
  const reviewApplication = async (application: VendorApplication, status: "APPROVED" | "REJECTED") => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} ${application.businessName}?`)) return;
    if (!supabase || !adminUser) return;
    const { error: applicationError } = await supabase
      .from("vendor_applications")
      .update({ status, reviewed_by: adminUser.id, reviewed_at: new Date().toISOString() })
      .eq("id", application.id);
    if (applicationError) {
      window.alert(applicationError.message);
      return;
    }
    if (status === "APPROVED") {
      const { error: profileError } = await supabase.from("profiles").update({ role: "VENDOR" }).eq("id", application.userId);
      if (profileError) {
        window.alert(profileError.message);
        return;
      }
      const { error: storeError } = await supabase.from("stores").upsert({
        vendor_user_id: application.userId,
        name: application.businessName,
        description: application.description,
        logo_url: application.logoPreview || null,
        status: "ACTIVE"
      }, { onConflict: "vendor_user_id" });
      if (storeError) {
        window.alert(storeError.message);
        return;
      }
    }
    setVendorApplications((currentApplications) =>
      currentApplications.map((currentApplication) =>
        currentApplication.id === application.id ? { ...currentApplication, status } : currentApplication
      )
    );

    setUsers((currentUsers) =>
      currentUsers.map((user) => {
        if (user.id !== application.userId) return user;
        if (status === "REJECTED") {
          return { ...user, vendorStatus: undefined };
        }
        return {
          ...user,
          role: "VENDOR",
          vendorStatus: "APPROVED",
          storeName: application.businessName,
          name: application.ownerName,
          phone: application.phone,
          email: application.email,
          address: application.address,
          storeDescription: application.description,
          storeCategory: application.category,
          storeLogoUrl: application.logoPreview
        };
      })
    );
  };
  const updateProductStatus = async (productId: number, status: ProductStatus) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (!window.confirm(`Are you sure you want to set ${product.name} to ${status}?`)) return;
    if (product.databaseId && ["Published", "Suspended", "Removed"].includes(status)) {
      try {
        await setAdminProductStatus(product.databaseId, status === "Published" ? "PUBLISHED" : status === "Suspended" ? "SUSPENDED" : "REMOVED");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Could not update product moderation status.");
        return;
      }
    }
    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === productId ? { ...item, status, badge: status === "Published" ? "Live" : status } : item
      )
    );
  };
  const removeProduct = async (productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (!window.confirm(`Remove ${product.name} from public marketplace visibility?`)) return;
    if (product.databaseId) {
      try {
        await setAdminProductStatus(product.databaseId, "REMOVED");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Could not remove product.");
        return;
      }
    }
    setProducts((currentProducts) => currentProducts.map((item) => item.id === productId ? { ...item, status: "Removed", badge: "Removed" } : item));
  };
  const reviewProductReport = async (report: ProductReport, status: "REVIEWED" | "ACTION_TAKEN" | "DISMISSED") => {
    if (!adminUser) return;
    try {
      await updateProductReportStatus(report.id, status, adminUser.id);
      setProductReports((currentReports) => currentReports.map((item) => item.id === report.id ? { ...item, status } : item));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not update report.");
    }
  };
  const reviewSellerReport = async (report: SellerReportRecord, status: "REVIEWED" | "ACTION_TAKEN" | "DISMISSED") => {
    if (!adminUser) return;
    try {
      await updateSellerReportStatus(report.id, status, adminUser.id);
      setSellerReports((currentReports) => currentReports.map((item) => item.id === report.id ? { ...item, status } : item));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not update seller report.");
    }
  };
  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    const categoryName = newCategory.trim();
    if (!categoryName || categoryList.some((category) => category.toLowerCase() === categoryName.toLowerCase())) return;
    setCategoryList((currentCategories) => [...currentCategories, categoryName]);
    setNewCategory("");
  };
  const removeCategory = (categoryName: string) => {
    if (!window.confirm(`Remove ${categoryName} from the admin category list?`)) return;
    setCategoryList((currentCategories) => currentCategories.filter((category) => category !== categoryName));
  };

  const filteredApplications = filterBySearchAndStatus(
    vendorApplications,
    search,
    statusFilter,
    (application) => `${application.businessName} ${application.ownerName} ${application.email} ${application.category}`,
    (application) => application.status
  );
  const filteredVendors = filterBySearchAndStatus(
    vendors,
    search,
    statusFilter,
    (vendor) => `${vendor.storeName ?? ""} ${vendor.name} ${vendor.email} ${vendor.storeCategory ?? ""}`,
    (vendor) => vendor.vendorStatus ?? "PENDING"
  );
  const filteredCustomers = filterBySearchAndStatus(
    customers,
    search,
    statusFilter,
    (customer) => `${customer.name} ${customer.email} ${customer.phone ?? ""} ${customer.address ?? ""}`,
    () => "ACTIVE"
  );
  const filteredProducts = filterBySearchAndStatus(
    products,
    search,
    statusFilter,
    (product) => `${product.name} ${product.vendor} ${product.category} ${product.brand} ${product.sku}`,
    (product) => product.status
  );
  const filteredOrders = filterBySearchAndStatus(
    orders,
    search,
    statusFilter,
    (order) => `${order.orderNumber} ${order.customerName} ${order.city} ${order.items.map((item) => item.name).join(" ")}`,
    (order) => order.status
  );
  const filteredPayments = filterBySearchAndStatus(
    payments,
    search,
    statusFilter,
    (payment) => `${payment.reference} ${payment.orderId} ${payment.provider} ${payment.method}`,
    (payment) => payment.status
  );
  const filteredPayouts = filterBySearchAndStatus(
    payoutRequests,
    search,
    statusFilter,
    (request) => `${request.vendor} ${request.method} ${request.account}`,
    (request) => request.status
  );

  return (
    <>
      <PageIntro
        kicker="Admin"
        title="Admin Dashboard"
        copy="Admin access is part of the authenticated account workspace and is only available to ADMIN users."
      />
      <section className="admin-nav">
        {adminSections.map((section) => (
          <button className={activeSection === section ? "active" : ""} key={section} onClick={() => resetTableState(section)}>
            {section}
          </button>
        ))}
      </section>
      <section className="stat-grid">
        <Metric label="Total vendors" value={String(vendors.length)} delta={`${vendors.filter((vendor) => vendor.vendorStatus === "APPROVED").length} approved`} />
        <Metric label="Pending vendor approvals" value={String(pendingApplications.length)} delta="Needs review" />
        <Metric label="Total customers" value={String(customers.length)} delta="Registered buyers" />
        <Metric label="Published products" value={String(publishedProducts.length)} delta={`${products.length} total products`} />
        <Metric label="Orders today" value={String(ordersToday)} delta={`${orders.length} total orders`} />
        <Metric label="Verified Sales" value="Not connected" delta="Payment persistence required" />
        <Metric label="Platform Commission" value="Not connected" delta="Backend verification required" />
        <Metric label="Pending Vendor Earnings" value="Not connected" delta="Payout persistence required" />
      </section>
      {activeSection === "Overview" ? (
        <>
          <section className="finance-mode-notice">
            <ShieldCheck size={26} />
            <div>
              <strong>Payment Settlement: TEST MODE</strong>
              <span>Payment settlement is in test mode. No real funds are transferred until live payment integration is completed.</span>
            </div>
          </section>
          <section className="stat-grid">
            <Metric label="Commission Rate" value={`${financeSetting?.commission_rate ?? 3}%`} delta={financeSetting ? "Database setting" : "Default test setting"} />
            <Metric label="Total Verified Sales" value="Not connected" delta="Requires persisted verified payments" />
            <Metric label="Platform Commission Earned" value="Not connected" delta="Requires backend commission records" />
            <Metric label="Pending Vendor Earnings" value="Not connected" delta="Requires persisted order earnings" />
            <Metric label="Settlement Account Status" value={settlementAccount?.verification_status ?? "Not Configured"} delta={settlementAccount?.account_number_masked ?? "No active verified account"} />
            <Metric label="Payment Mode" value={financeSetting?.payment_mode ?? "TEST"} delta="Real settlement disabled" />
          </section>
          <PlatformProgress settlementAccount={settlementAccount} financeSetting={financeSetting} />
          <section className="dashboard-grid">
            <ChartPanel title="Platform Sales Analytics" empty />
            <StatusPanel empty={orders.length === 0} />
            <ListPanel
              title="Admin Work Queue"
              items={[
                ...pendingApplications.map((application) => `Review vendor: ${application.businessName}`),
                ...reportedProducts.map((product) => `Moderate product: ${product.name}`),
                ...pendingProductReports.map((report) => `Product report: ${report.reason}`),
                ...pendingSellerReports.map((report) => `Seller report: ${report.reason}`),
                ...pendingDeletionRequests.map((request) => `Deletion request: ${request.reason || request.userId}`)
              ]}
              emptyCopy="There are no approvals, reports, or disputes yet."
            />
          </section>
        </>
      ) : null}
      {activeSection === "Vendor Applications" ? (
        <AdminPanel title="Vendor Applications" search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} statuses={["All", "PENDING", "APPROVED", "REJECTED"]}>
          {paginate(filteredApplications, pageNumber).map((application) => (
            <div className="application-card" key={application.id}>
              <div>
                <span className={`account-status ${application.status.toLowerCase()}`}>{application.status}</span>
                <h3>{application.businessName}</h3>
                <p>{application.description}</p>
                <small>{application.ownerName} | {application.email} | {application.phone}</small>
                <small>{application.address} | {application.category}</small>
                <small>Private verification file: {application.verificationDocumentName}</small>
              </div>
              {application.logoPreview ? <img src={application.logoPreview} alt="" /> : null}
              <div className="application-actions">
                <button onClick={() => reviewApplication(application, "APPROVED")}>Approve</button>
                <button onClick={() => reviewApplication(application, "REJECTED")}>Reject</button>
              </div>
            </div>
          ))}
          <AdminPagination total={filteredApplications.length} pageNumber={pageNumber} setPageNumber={setPageNumber} />
        </AdminPanel>
      ) : null}
      {activeSection === "Vendors" ? (
        <AdminPanel title="Vendors" search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} statuses={["All", "APPROVED", "PENDING", "SUSPENDED"]}>
          {paginate(filteredVendors, pageNumber).map((vendor) => (
            <div className="table-row admin-table-row" key={vendor.id}>
              <span>{vendor.vendorStatus ?? "PENDING"}</span>
              <strong>{vendor.storeName || vendor.name}</strong>
              <span>{vendor.email}</span>
              <span>{vendor.storeCategory ?? "Not set"}</span>
              <button onClick={() => updateVendorStatus(vendor.id, "APPROVED")}>{vendor.vendorStatus === "SUSPENDED" ? "Reactivate" : "Approve"}</button>
              <button onClick={() => updateVendorStatus(vendor.id, "SUSPENDED")}>Suspend</button>
            </div>
          ))}
          <AdminPagination total={filteredVendors.length} pageNumber={pageNumber} setPageNumber={setPageNumber} />
        </AdminPanel>
      ) : null}
      {activeSection === "Customers" ? (
        <AdminPanel title="Customers" search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} statuses={["All", "ACTIVE"]}>
          {paginate(filteredCustomers, pageNumber).map((customer) => (
            <div className="table-row admin-table-row" key={customer.id}>
              <span>ACTIVE</span>
              <strong>{customer.name}</strong>
              <span>{customer.email}</span>
              <span>{customer.phone || "No phone"}</span>
              <span>{customer.address || "No address"}</span>
            </div>
          ))}
          <AdminPagination total={filteredCustomers.length} pageNumber={pageNumber} setPageNumber={setPageNumber} />
        </AdminPanel>
      ) : null}
      {activeSection === "Products" ? (
        <AdminPanel title="Products" search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} statuses={["All", "Draft", "Published", "Out of Stock", "Suspended", "Removed"]}>
          {paginate(filteredProducts, pageNumber).map((product) => (
            <div className="table-row admin-table-row" key={product.id}>
              <span>{product.status}</span>
              <strong>{product.name}</strong>
              <span>{product.vendor}</span>
              <span>{product.category}</span>
              <button onClick={() => updateProductStatus(product.id, "Published")}>{product.status === "Published" ? "Live" : "Restore"}</button>
              <button onClick={() => updateProductStatus(product.id, "Suspended")}>Suspend</button>
              <button onClick={() => removeProduct(product.id)}>Remove</button>
            </div>
          ))}
          <AdminPagination total={filteredProducts.length} pageNumber={pageNumber} setPageNumber={setPageNumber} />
        </AdminPanel>
      ) : null}
      {activeSection === "Categories" ? (
        <section className="table-panel">
          <h3>Categories</h3>
          <form className="admin-inline-form" onSubmit={addCategory}>
            <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category name" />
            <button>Add Category</button>
          </form>
          {categoryList.map((categoryName) => (
            <div className="table-row admin-table-row" key={categoryName}>
              <strong>{categoryName}</strong>
              <span>{products.filter((product) => product.category === categoryName).length} products</span>
              <button onClick={() => removeCategory(categoryName)}>Remove</button>
            </div>
          ))}
        </section>
      ) : null}
      {activeSection === "Orders" ? (
        <AdminPanel title="Orders" search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} statuses={["All", "Pending", "Paid", "Processing"]}>
          {paginate(filteredOrders, pageNumber).map((order) => (
            <div className="table-row admin-table-row" key={order.id}>
              <span>{order.status}</span>
              <strong>{order.orderNumber}</strong>
              <span>{order.customerName}</span>
              <span>{currency.format(order.total)}</span>
              <span>{order.createdAt}</span>
            </div>
          ))}
          <AdminPagination total={filteredOrders.length} pageNumber={pageNumber} setPageNumber={setPageNumber} />
        </AdminPanel>
      ) : null}
      {activeSection === "Payments" ? (
        <AdminPanel title="Payments" search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} statuses={["All", "PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"]}>
          {paginate(filteredPayments, pageNumber).map((payment) => (
            <div className="table-row admin-table-row" key={payment.reference}>
              <span>{payment.status}</span>
              <strong>{payment.reference}</strong>
              <span>Order #{payment.orderId}</span>
              <span>{currency.format(payment.amount)}</span>
              <span>{payment.provider}</span>
            </div>
          ))}
          <AdminPagination total={filteredPayments.length} pageNumber={pageNumber} setPageNumber={setPageNumber} />
        </AdminPanel>
      ) : null}
      {activeSection === "Payouts" ? (
        <AdminPanel title="Payouts" search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} statuses={["All", "PENDING", "APPROVED", "PAID", "REJECTED"]}>
          {paginate(filteredPayouts, pageNumber).map((request) => (
            <div className="table-row admin-table-row" key={request.id}>
              <span>{request.status}</span>
              <strong>{request.vendor}</strong>
              <span>{currency.format(request.amount)}</span>
              <span>{request.method}</span>
              <span>{request.requestedAt}</span>
            </div>
          ))}
          <AdminPagination total={filteredPayouts.length} pageNumber={pageNumber} setPageNumber={setPageNumber} />
        </AdminPanel>
      ) : null}
      {activeSection === "Disputes" ? (
        <section className="table-panel">
          <h3>Disputes, Reports and Account Requests</h3>
          {productReports.length === 0 && sellerReports.length === 0 && accountDeletionRequests.length === 0 ? <EmptyState icon={<ShieldCheck size={38} />} title="No active disputes" copy="Buyer reports, seller reports and account deletion requests will appear here." /> : null}
          {productReports.map((report) => {
            const product = products.find((item) => item.databaseId === report.productId);
            return (
            <div className="table-row admin-table-row" key={report.id}>
              <span>Product: {report.status}</span>
              <strong>{product?.name ?? "Reported product"}</strong>
              <span>{report.reason}</span>
              <span>{report.createdAt}</span>
              <button onClick={() => product ? void updateProductStatus(product.id, "Suspended") : undefined}>Suspend Product</button>
              <button onClick={() => product ? void removeProduct(product.id) : undefined}>Remove Product</button>
              <button onClick={() => void reviewProductReport(report, "DISMISSED")}>Dismiss</button>
            </div>
          );})}
          {sellerReports.map((report) => {
            const seller = users.find((user) => user.id === report.sellerUserId);
            return (
              <div className="table-row admin-table-row" key={report.id}>
                <span>Seller: {report.status}</span>
                <strong>{seller?.storeName || seller?.name || "Reported seller"}</strong>
                <span>{report.reason}</span>
                <span>{report.createdAt}</span>
                {seller ? <button onClick={() => updateVendorStatus(seller.id, "SUSPENDED")}>Suspend Seller</button> : null}
                <button onClick={() => void reviewSellerReport(report, "REVIEWED")}>Mark Reviewed</button>
                <button onClick={() => void reviewSellerReport(report, "DISMISSED")}>Dismiss</button>
              </div>
            );
          })}
          {accountDeletionRequests.map((request) => {
            const account = users.find((user) => user.id === request.userId);
            return (
              <div className="table-row admin-table-row" key={request.id}>
                <span>Deletion: {request.status}</span>
                <strong>{account?.name || "Account deletion request"}</strong>
                <span>{request.reason || "No reason provided"}</span>
                <span>{request.createdAt}</span>
                <button disabled>Review Identity</button>
                <button disabled>Manual Processing</button>
              </div>
            );
          })}
        </section>
      ) : null}
      {activeSection === "Reports" ? (
        <section className="dashboard-grid">
          <ListPanel title="Revenue Report" items={[`Revenue: ${currency.format(totalRevenue)}`, `Commission: ${currency.format(platformCommissionEarned)}`, `Pending payouts: ${currency.format(pendingPayoutTotal)}`]} />
          <ListPanel title="Marketplace Report" items={[`Vendors: ${vendors.length}`, `Customers: ${customers.length}`, `Products: ${products.length}`, `Orders: ${orders.length}`]} />
          <ListPanel title="Risk Report" items={[`Suspended vendors: ${vendors.filter((vendor) => vendor.vendorStatus === "SUSPENDED").length}`, `Suspended products: ${reportedProducts.length}`, `Pending applications: ${pendingApplications.length}`]} />
        </section>
      ) : null}
      {activeSection === "App Store Readiness" ? (
        <AppStoreReadinessPanel />
      ) : null}
      {activeSection === "Finance Settings" ? (
        <>
          <section className="finance-mode-notice">
            <ShieldCheck size={26} />
            <div>
              <strong>Payment settlement is in test mode</strong>
              <span>No real funds are transferred until secure provider verification, backend webhooks, and persisted payments are completed.</span>
            </div>
          </section>
          <section className="finance-settings-grid">
            <form className="form-panel" onSubmit={(event) => { event.preventDefault(); void saveFinanceSettings(); }}>
              <h3>Finance Settings</h3>
              <label>Platform Commission</label>
              <input value={settings.commissionRate} onChange={(event) => setSettings((current) => ({ ...current, commissionRate: event.target.value }))} type="number" min="0" max="100" step="0.01" />
              <label>Currency</label>
              <input value="GHS" disabled />
              <label>Payment Mode</label>
              <input value="TEST" disabled />
              <FormMessage error={financeMessage.error} success={financeMessage.success} />
              <button>Save Finance Settings</button>
            </form>
            <form className="form-panel" onSubmit={saveTestSettlementAccount}>
              <h3>Admin Settlement Account</h3>
              <input value={settlementForm.accountHolderName} onChange={(event) => setSettlementForm((current) => ({ ...current, accountHolderName: event.target.value }))} placeholder="Account holder name" />
              <input value={settlementForm.bankName} onChange={(event) => setSettlementForm((current) => ({ ...current, bankName: event.target.value }))} placeholder="Bank name" />
              <input value={settlementForm.bankCode} onChange={(event) => setSettlementForm((current) => ({ ...current, bankCode: event.target.value }))} placeholder="Provider-supported bank code" />
              <input value={settlementForm.accountNumber} onChange={(event) => setSettlementForm((current) => ({ ...current, accountNumber: event.target.value }))} placeholder="Account number, masked before storage" inputMode="numeric" />
              <input value="GHS" disabled />
              <button>Save Masked Test Configuration</button>
              <button className="ghost-button" type="button" disabled>Verify Bank Account - Backend Required</button>
              <p className="privacy-note">The full account number is not stored. Provider recipient/subaccount verification requires a future secure backend.</p>
            </form>
          </section>
          <section className="summary-panel finance-summary">
            <h3>Current Finance Configuration</h3>
            <SummaryLine label="Platform Commission" value={`${financeSetting?.commission_rate ?? 3}%`} />
            <SummaryLine label="Settlement Account" value={settlementAccount?.account_number_masked ?? "Not Configured"} />
            <SummaryLine label="Verification Status" value={settlementAccount?.verification_status ?? "UNVERIFIED"} />
            <SummaryLine label="Payment Provider Status" value="Not connected" />
            <SummaryLine label="Currency" value={financeSetting?.currency ?? "GHS"} />
            <SummaryLine label="Payment Mode" value={financeSetting?.payment_mode ?? "TEST"} />
            <SummaryLine label="Last Updated" value={financeSetting ? new Date(financeSetting.updated_at).toLocaleString() : "Not connected"} />
            <SummaryLine label="Updated By Administrator" value={adminUser?.email ?? "Not available"} strong />
          </section>
        </>
      ) : null}
      {activeSection === "Platform Settings" ? (
        <section className="split-layout">
          <form className="form-panel">
            <h3>Platform Settings</h3>
            <input value={settings.commissionRate} onChange={(event) => setSettings((current) => ({ ...current, commissionRate: event.target.value }))} placeholder="Commission rate %" />
            <select value={settings.serviceFeeEnabled} onChange={(event) => setSettings((current) => ({ ...current, serviceFeeEnabled: event.target.value }))}>
              <option value="Enabled">Service fee enabled</option>
              <option value="Disabled">Service fee disabled</option>
            </select>
            <select value={settings.marketplaceStatus} onChange={(event) => setSettings((current) => ({ ...current, marketplaceStatus: event.target.value }))}>
              <option value="Open">Marketplace open</option>
              <option value="Maintenance">Maintenance mode</option>
            </select>
            <p className="privacy-note">Settings are stored in the current app session only. No database has been added.</p>
          </form>
          <aside className="summary-panel">
            <h3>Current Settings</h3>
            <SummaryLine label="Commission rate" value={`${settings.commissionRate}%`} />
            <SummaryLine label="Service fee" value={settings.serviceFeeEnabled} />
            <SummaryLine label="Marketplace status" value={settings.marketplaceStatus} strong />
          </aside>
        </section>
      ) : null}
    </>
  );
}

function PlatformProgress({ settlementAccount, financeSetting }: { settlementAccount: SettlementAccountRow | null; financeSetting: PlatformSettingRow | null }) {
  const modules = [
    ["Authentication", supabase ? "Connected" : "Pending"],
    ["Database persistence", supabase ? "Partially connected" : "Pending"],
    ["Vendor onboarding", supabase ? "Connected" : "Pending"],
    ["Products", supabase ? "Connected" : "Temporary State"],
    ["Orders", "Temporary State"],
    ["Payments", financeSetting?.payment_mode ?? "TEST Mode"],
    ["Platform commission", financeSetting ? "Configured in TEST Mode" : "Pending"],
    ["Settlement account", settlementAccount?.verification_status === "VERIFIED" ? "Verified" : "Not Configured"],
    ["Payouts", "Pending"],
    ["Buyer Protection", "Pending"]
  ];
  return (
    <section className="platform-progress">
      <div className="section-header"><h3>Platform Progress</h3><span>Honest production-readiness status</span></div>
      <div className="progress-grid">
        {modules.map(([label, status]) => (
          <article key={label}>
            <strong>{label}</strong>
            <span className={status.includes("Connected") || status === "Verified" ? "ready" : "pending"}>{status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AppStoreReadinessPanel() {
  const items = [
    ["Mobile responsive design", "Complete", "Public pages and seller upload use responsive layouts."],
    ["Capacitor Android setup", "In Progress", "Documented, not installed yet."],
    ["Capacitor iOS setup", "In Progress", "Documented, requires macOS and Xcode."],
    ["App icon", "In Progress", "SVG placeholder exists; final store icon still needed."],
    ["Splash screen", "In Progress", "Manifest theme and placeholder assets exist; native splash needs Capacitor."],
    ["Privacy Policy", "Complete", "Public privacy page exists."],
    ["Terms", "Complete", "Public terms page exists."],
    ["Delete Account", "Complete", "Deletion request page and database table exist."],
    ["Product reporting", "Complete", "Product report form and database table exist."],
    ["Content moderation", "In Progress", "Admin can suspend/remove; deeper automation still needed."],
    ["Seller policy", "Complete", "Public seller policy page exists."],
    ["Prohibited items page", "Complete", "Public prohibited-items page exists."],
    ["Data Safety notes", "Complete", "Documentation exists in docs."],
    ["Store Listing Draft", "Complete", "Store listing draft exists in docs."],
    ["Android build ready", "Missing", "Capacitor must be installed and Android platform generated."],
    ["iOS build ready", "Missing", "Capacitor iOS platform must be generated on macOS with Xcode."],
    ["Screenshots", "Missing", "Final phone screenshots still need to be captured."],
    ["Payment status", "In Progress", "Checkout remains test mode; live payment is not active."]
  ];
  return (
    <section className="table-panel">
      <h3>App Store Readiness</h3>
      <p className="privacy-note">This checklist tracks Google Play and Apple App Store readiness without falsely marking unfinished production systems as complete.</p>
      <div className="play-readiness-grid">
        {items.map(([label, status, detail]) => (
          <article className={`play-card ${status.toLowerCase().replaceAll(" ", "-")}`} key={label}>
            <span>{status}</span>
            <strong>{label}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const ADMIN_PAGE_SIZE = 6;

function filterBySearchAndStatus<T>(
  items: T[],
  search: string,
  statusFilter: string,
  getSearchText: (item: T) => string,
  getStatus: (item: T) => string
) {
  const normalizedSearch = search.trim().toLowerCase();
  return items.filter((item) => {
    const matchesSearch = !normalizedSearch || getSearchText(item).toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "All" || getStatus(item) === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

function paginate<T>(items: T[], pageNumber: number) {
  const start = (pageNumber - 1) * ADMIN_PAGE_SIZE;
  return items.slice(start, start + ADMIN_PAGE_SIZE);
}

function isToday(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return false;
  return parsedDate.toDateString() === new Date().toDateString();
}

function getPlatformCommissionFromOrders(orders: Order[], payments: PaymentRecord[]) {
  const paidOrderIds = new Set(
    payments.filter((payment) => payment.status === "SUCCESSFUL").map((payment) => payment.orderId)
  );
  const paidVendorSales = orders
    .filter((order) => paidOrderIds.has(order.id))
    .flatMap((order) => order.items)
    .reduce((sum, item) => sum + item.subtotal, 0);
  return Math.round(paidVendorSales * PLATFORM_COMMISSION_RATE);
}

function AdminPanel({
  title,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  statuses,
  children
}: {
  title: string;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  statuses: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="table-panel admin-panel">
      <div className="section-heading">
        <div>
          <h3>{title}</h3>
          <p>Search, filter and review marketplace records.</p>
        </div>
      </div>
      <div className="admin-toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>
      {children}
    </section>
  );
}

function AdminPagination({
  total,
  pageNumber,
  setPageNumber
}: {
  total: number;
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  return (
    <div className="admin-pagination">
      <span>Page {Math.min(pageNumber, totalPages)} of {totalPages} | {total} records</span>
      <div>
        <button disabled={pageNumber <= 1} onClick={() => setPageNumber((current) => Math.max(1, current - 1))}>Previous</button>
        <button disabled={pageNumber >= totalPages} onClick={() => setPageNumber((current) => Math.min(totalPages, current + 1))}>Next</button>
      </div>
    </div>
  );
}

function ProductsPage({
  user,
  products,
  setProducts
}: {
  user: AuthUser | null;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}) {
  const [draft, setDraft] = useState<ProductDraft>({
    name: "",
    description: "",
    sku: "",
    category: "Electronics",
    subcategory: "",
    brand: "",
    price: "",
    discountPrice: "",
    stock: "",
    condition: "New",
    deliveryOptions: [],
    status: "Draft",
    images: [],
    wholesalePrice: "",
    minimumOrderQuantity: ""
  });
  const [message, setMessage] = useState({ error: "", success: "" });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const vendorName = user?.storeName || user?.name || "Vendor";
  const vendorProducts = products.filter((product) => product.vendor === vendorName);

  useEffect(() => {
    if (!user || user.role !== "VENDOR") return;
    loadSellerProducts(user.id)
      .then((catalog) => {
        const sellerProducts = catalog.map(mapCatalogProduct);
        setProducts((current) => [
          ...current.filter((product) => product.vendor !== vendorName),
          ...sellerProducts
        ]);
      })
      .catch((error) => setMessage({ error: error instanceof Error ? error.message : "Could not load seller products.", success: "" }));
  }, [user?.id, vendorName]);

  const updateDraft = (field: keyof ProductDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage({ error: "", success: "" });
  };
  const toggleDeliveryOption = (option: string) => {
    setDraft((current) => ({
      ...current,
      deliveryOptions: current.deliveryOptions.includes(option)
        ? current.deliveryOptions.filter((item) => item !== option)
        : [...current.deliveryOptions, option]
    }));
    setMessage({ error: "", success: "" });
  };
  const updateImages = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length < 1 || selectedFiles.length > 6) {
      setMessage({ error: "Upload between 1 and 6 product images.", success: "" });
      return;
    }
    const invalidFile = selectedFiles.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalidFile) {
      setMessage({ error: "Images must be JPG, PNG, or WEBP and no larger than 5 MB each.", success: "" });
      return;
    }
    setImageFiles(selectedFiles);
    setDraft((current) => ({ ...current, images: selectedFiles.map((file) => URL.createObjectURL(file)) }));
    setMessage({ error: "", success: "" });
  };
  const resetDraft = () => {
    setDraft({
      name: "",
      description: "",
      sku: "",
      category: "Electronics",
      subcategory: "",
      brand: "",
      price: "",
      discountPrice: "",
      stock: "",
      condition: "New",
      deliveryOptions: [],
      status: "Draft",
      images: [],
      wholesalePrice: "",
      minimumOrderQuantity: ""
    });
    setEditingProductId(null);
    setImageFiles([]);
    setVideoFile(null);
    setUploadProgress(0);
  };

  const uploadProduct = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    const validationError = validateProductDraft(draft);
    if (validationError) {
      setMessage({ error: validationError, success: "" });
      setIsSaving(false);
      return;
    }
    const prohibitedError = getProhibitedContentWarning(`${draft.name} ${draft.description} ${draft.category} ${draft.subcategory} ${draft.brand}`);
    if (prohibitedError) {
      setMessage({ error: prohibitedError, success: "" });
      setIsSaving(false);
      return;
    }

    if (!user || user.role !== "VENDOR" || user.vendorStatus !== "APPROVED") {
      setMessage({ error: "Only approved sellers can upload products.", success: "" });
      setIsSaving(false);
      return;
    }
    const existing = editingProductId ? products.find((product) => product.id === editingProductId) : undefined;
    if (!existing && imageFiles.length === 0) {
      setMessage({ error: "Upload at least one product image.", success: "" });
      setIsSaving(false);
      return;
    }
    setUploadProgress(20);
    try {
      const saved = await saveSellerProduct({
        databaseId: existing?.databaseId,
        sellerUserId: user.id,
        name: draft.name.trim(),
        description: draft.description.trim(),
        category: draft.category,
        subcategory: draft.subcategory.trim(),
        brand: draft.brand.trim(),
        sku: draft.sku.trim(),
        condition: draft.condition,
        retailPrice: Number(draft.price),
        discountPrice: draft.discountPrice ? Number(draft.discountPrice) : undefined,
        wholesalePrice: draft.wholesalePrice ? Number(draft.wholesalePrice) : undefined,
        minimumOrderQuantity: draft.minimumOrderQuantity ? Number(draft.minimumOrderQuantity) : undefined,
        quantity: Number(draft.stock),
        deliveryOptions: draft.deliveryOptions,
        status: draft.status === "Published" ? "Published" : "Draft",
        imageFiles,
        videoFile: videoFile ?? undefined
      });
      setUploadProgress(100);
      const nextProduct = mapCatalogProduct(saved);
      setProducts((currentProducts) =>
        existing
          ? currentProducts.map((product) => product.id === existing.id ? nextProduct : product)
          : [nextProduct, ...currentProducts]
      );
      resetDraft();
      setMessage({ error: "", success: existing ? "Product updated and saved." : "Product uploaded and saved." });
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Could not save product.", success: "" });
      setUploadProgress(0);
    } finally {
      setIsSaving(false);
    }
  };
  const editProduct = (product: Product) => {
    setEditingProductId(product.id);
    setDraft({
      name: product.name,
      description: product.description,
      sku: product.sku,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      price: String(product.price),
      discountPrice: product.discountPrice ? String(product.discountPrice) : "",
      stock: String(product.stock),
      condition: product.condition,
      deliveryOptions: product.deliveryOptions,
      status: product.status,
      images: product.images,
      wholesalePrice: product.wholesalePrice ? String(product.wholesalePrice) : "",
      minimumOrderQuantity: product.minimumOrderQuantity ? String(product.minimumOrderQuantity) : ""
    });
    setMessage({ error: "", success: "Editing product." });
  };
  const deleteProduct = async (productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product?.databaseId || !window.confirm("Delete this product and its uploaded media?")) return;
    try {
      await deleteSellerProduct(product.databaseId, product.media);
      setProducts((currentProducts) => currentProducts.filter((item) => item.id !== productId));
      if (editingProductId === productId) resetDraft();
      setMessage({ error: "", success: "Product deleted." });
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Could not delete product.", success: "" });
    }
  };
  const updateProductStatus = async (productId: number, status: ProductStatus) => {
    const product = products.find((item) => item.id === productId);
    if (!product?.databaseId || !["Draft", "Published"].includes(status)) return;
    try {
      await setSellerProductStatus(product.databaseId, status === "Published" ? "PUBLISHED" : "DRAFT");
      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === productId ? { ...item, status, badge: status === "Published" ? "Live" : status } : item
        )
      );
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Could not update product status.", success: "" });
    }
  };

  return (
    <>
      <PageIntro
        kicker="Catalog"
        title="Product Management"
        copy="Create products with SKU, images, videos, brand, category, price, discount, stock, shipping weight, and product type."
      />
      <section className="split-layout">
        <form className="form-panel" onSubmit={uploadProduct}>
          <h3>{editingProductId ? "Edit Product" : "Upload Product"}</h3>
          <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Product name" />
          <textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Product description" />
          <input value={draft.sku} onChange={(event) => updateDraft("sku", event.target.value)} placeholder="SKU" />
          <select value={draft.category} onChange={(event) => updateDraft("category", event.target.value)}>
            {categories.map(([name]) => <option key={name} value={name}>{name}</option>)}
          </select>
          <input value={draft.subcategory} onChange={(event) => updateDraft("subcategory", event.target.value)} placeholder="Subcategory" />
          <input value={draft.brand} onChange={(event) => updateDraft("brand", event.target.value)} placeholder="Brand" />
          <input value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} placeholder="Price" inputMode="decimal" />
          <input value={draft.discountPrice} onChange={(event) => updateDraft("discountPrice", event.target.value)} placeholder="Discount price, optional" inputMode="decimal" />
          <input value={draft.wholesalePrice} onChange={(event) => updateDraft("wholesalePrice", event.target.value)} placeholder="Wholesale price, optional" inputMode="decimal" />
          <input value={draft.minimumOrderQuantity} onChange={(event) => updateDraft("minimumOrderQuantity", event.target.value)} placeholder="Minimum wholesale order quantity, optional" inputMode="numeric" />
          <input value={draft.stock} onChange={(event) => updateDraft("stock", event.target.value)} placeholder="Stock quantity" inputMode="numeric" />
          <select value={draft.condition} onChange={(event) => updateDraft("condition", event.target.value as ProductDraft["condition"])}>
            <option value="New">New</option>
            <option value="Used">Used</option>
          </select>
          <select value={draft.status} onChange={(event) => updateDraft("status", event.target.value as ProductStatus)}>
            <option value="Draft">Draft</option>
            <option value="Published">Publish Now</option>
          </select>
          <div className="checkbox-grid">
            {["Door delivery", "Pickup point", "Vendor pickup", "Express delivery"].map((option) => (
              <label key={option}>
                <input type="checkbox" checked={draft.deliveryOptions.includes(option)} onChange={() => toggleDeliveryOption(option)} />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <label className="file-input">
            <span>Product images, 1-6</span>
            <input type="file" accept="image/*" multiple onChange={(event) => updateImages(event.target.files)} />
            <small>{draft.images.length} selected</small>
          </label>
          {draft.images.length ? (
            <div className="image-preview-grid">
              {draft.images.map((image, index) => (
                <div className="media-preview" key={image}>
                  <img src={image} alt={`Product preview ${index + 1}`} />
                  {imageFiles.length ? <button type="button" onClick={() => {
                    const nextFiles = imageFiles.filter((_, fileIndex) => fileIndex !== index);
                    setImageFiles(nextFiles);
                    setDraft((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }));
                  }}>Remove</button> : null}
                </div>
              ))}
            </div>
          ) : null}
          <label className="file-input">
            <span>Optional product video, MP4 or WEBM up to 50 MB</span>
            <input type="file" accept="video/mp4,video/webm" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!["video/mp4", "video/webm"].includes(file.type) || file.size > 50 * 1024 * 1024) {
                setMessage({ error: "Video must be MP4 or WEBM and no larger than 50 MB.", success: "" });
                return;
              }
              setVideoFile(file);
              setMessage({ error: "", success: "" });
            }} />
            <small>{videoFile?.name || "No video selected"}</small>
          </label>
          {videoFile ? <video className="video-preview" controls src={URL.createObjectURL(videoFile)} /> : null}
          {uploadProgress > 0 ? <progress value={uploadProgress} max="100">{uploadProgress}%</progress> : null}
          <p className="privacy-note">By publishing this product, you confirm it follows MarketHub's Seller Policy and Prohibited Items Policy.</p>
          <FormMessage error={message.error} success={message.success} />
          <button disabled={isSaving}>{isSaving ? "Saving..." : editingProductId ? "Save Product" : draft.status === "Published" ? "Publish Product Now" : "Save Draft"}</button>
          {editingProductId ? <button type="button" className="ghost-button" onClick={resetDraft}>Cancel Edit</button> : null}
        </form>
        <aside className="summary-panel">
          <h3>Stock Summary</h3>
          <SummaryLine label="Uploaded products" value={String(vendorProducts.length)} />
          <SummaryLine label="Total stock" value={String(vendorProducts.reduce((sum, product) => sum + product.stock, 0))} />
          <SummaryLine label="Store" value={vendorName} strong />
        </aside>
      </section>
      <section className="table-panel">
        <h3>Inventory</h3>
        {vendorProducts.length === 0 ? (
          <EmptyState
            icon={<Package size={38} />}
            title="No uploaded products"
            copy="You have not listed any products yet. Upload your first product with clear pictures and an optional video to start reaching buyers."
          />
        ) : null}
        {vendorProducts.map((product) => (
          <div className="table-row product-row" key={product.id}>
            <span>{product.category}</span>
            <strong>{product.name}</strong>
            <em>{product.status}</em>
            <span>{currency.format(product.price)}</span>
            <button onClick={() => editProduct(product)}>Edit</button>
            <button onClick={() => updateProductStatus(product.id, product.status === "Published" ? "Draft" : "Published")}>{product.status === "Published" ? "Unpublish" : "Publish"}</button>
            <button onClick={() => deleteProduct(product.id)}>Delete</button>
          </div>
        ))}
      </section>
    </>
  );
}

function validateProductDraft(draft: ProductDraft) {
  if (!draft.name.trim()) return "Product name is required.";
  if (draft.description.trim().length < 20) return "Product description must be at least 20 characters.";
  if (!draft.sku.trim()) return "SKU is required.";
  if (!draft.category.trim()) return "Category is required.";
  if (!draft.subcategory.trim()) return "Subcategory is required.";
  if (!draft.brand.trim()) return "Brand is required.";
  if (!draft.price.trim() || Number(draft.price) <= 0) return "Enter a valid product price.";
  if (draft.discountPrice && Number(draft.discountPrice) >= Number(draft.price)) {
    return "Discount price must be lower than product price.";
  }
  if (draft.wholesalePrice && Number(draft.wholesalePrice) <= 0) return "Enter a valid wholesale price.";
  if (draft.minimumOrderQuantity && (!Number.isInteger(Number(draft.minimumOrderQuantity)) || Number(draft.minimumOrderQuantity) < 2)) {
    return "Minimum wholesale order quantity must be at least 2.";
  }
  if (draft.wholesalePrice && !draft.minimumOrderQuantity) return "Add a minimum order quantity for wholesale pricing.";
  if (draft.minimumOrderQuantity && !draft.wholesalePrice) return "Add a wholesale price for the minimum order quantity.";
  if (!draft.stock.trim() || Number(draft.stock) < 0 || !Number.isInteger(Number(draft.stock))) {
    return "Enter a valid stock quantity.";
  }
  if (draft.deliveryOptions.length === 0) return "Select at least one delivery option.";
  if (draft.images.length < 1 || draft.images.length > 6) return "Upload between 1 and 6 product images.";
  return "";
}

function getProhibitedContentWarning(text: string) {
  const normalized = text.toLowerCase();
  const matchedTerm = prohibitedTerms.find((term) => normalized.includes(term));
  if (!matchedTerm) return "";
  return `This listing appears to include prohibited marketplace content (${matchedTerm}). Review the Prohibited Items policy before publishing.`;
}

function PaymentsPage({
  user,
  orders,
  payments,
  payoutRequests,
  createPayoutRequest
}: {
  user: AuthUser | null;
  orders: Order[];
  payments: PaymentRecord[];
  payoutRequests: PayoutRequest[];
  createPayoutRequest: (vendor: string, amount: number, method: string, account: string) => string;
}) {
  const vendorName = user?.storeName || user?.name || "Vendor";
  const finance = getVendorFinance(vendorName, orders, payments, payoutRequests);
  const vendorPayouts = payoutRequests.filter((request) => request.vendor === vendorName);
  const [form, setForm] = useState({
    amount: "",
    method: "Mobile Money",
    account: ""
  });
  const [message, setMessage] = useState({ error: "", success: "" });

  if (user?.role === "ADMIN") {
    return (
      <>
        <PageIntro
          kicker="Demo Data"
          title="Payments and Payouts"
          copy="Payment, commission, and payout information on this page are temporary frontend test data. No real financial operations are active."
        />
        <section className="stat-grid">
          <Metric label="Test payment records" value={String(payments.length)} delta="Temporary session data" />
          <Metric label="Successful flow tests" value={String(payments.filter((payment) => payment.status === "SUCCESSFUL").length)} delta="Not real payments" />
          <Metric label="Pending payouts" value={String(payoutRequests.filter((request) => request.status === "PENDING").length)} delta="Needs review" />
          <Metric label="Platform commission" value={`${Math.round(PLATFORM_COMMISSION_RATE * 100)}%`} delta="Per completed sale" />
        </section>
        <section className="table-panel">
          <h3>Payout Requests</h3>
          {payoutRequests.length === 0 ? <EmptyState icon={<Wallet size={42} />} title="No payout requests" copy="Vendor payout requests will appear here for admin review." /> : null}
          {payoutRequests.map((request) => (
            <div className="table-row payout-row" key={request.id}>
              <strong>{request.vendor}</strong>
              <span>{currency.format(request.amount)}</span>
              <span>{request.method}</span>
              <em className={request.status === "PENDING" ? "processing" : ""}>{request.status}</em>
              <span>{request.requestedAt}</span>
            </div>
          ))}
        </section>
      </>
    );
  }

  const submitPayout = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.amount.trim() || amount <= 0) {
      setMessage({ error: "Enter a payout amount greater than zero.", success: "" });
      return;
    }
    if (amount > finance.availableEarnings) {
      setMessage({ error: "Payout amount cannot exceed available earnings.", success: "" });
      return;
    }

    const result = createPayoutRequest(vendorName, amount, form.method, form.account);
    if (result.includes("submitted")) {
      setMessage({ error: "", success: result });
      setForm({ amount: "", method: "Mobile Money", account: "" });
      return;
    }
    setMessage({ error: result, success: "" });
  };

  return (
    <>
      <PageIntro
        kicker="Demo Data"
        title="Earnings and Payouts"
        copy="Earnings, commissions, and payout requests are temporary test data. Real vendor payouts are not active yet."
      />
      <section className="stat-grid">
        <Metric label="Gross completed sales" value={currency.format(finance.grossCompletedSales)} delta="Delivered paid order lines" />
        <Metric label="Platform commission" value={currency.format(finance.platformCommission)} delta={`${Math.round(PLATFORM_COMMISSION_RATE * 100)}% deducted`} />
        <Metric label="Available earnings" value={currency.format(finance.availableEarnings)} delta="Ready to request" />
        <Metric label="Pending payouts" value={currency.format(finance.pendingPayouts)} delta="Submitted requests" />
      </section>
      <section className="split-layout">
        <form className="form-panel" onSubmit={submitPayout}>
          <h3>Request Payout</h3>
          <div className="demo-notice">
            <strong>Coming soon</strong>
            <span>Real payout requests are not active yet.</span>
          </div>
          <input
            value={form.amount}
            onChange={(event) => {
              setForm((current) => ({ ...current, amount: event.target.value }));
              setMessage({ error: "", success: "" });
            }}
            placeholder="Amount"
            type="number"
            min="1"
            max={finance.availableEarnings || undefined}
          />
          <select
            value={form.method}
            onChange={(event) => {
              setForm((current) => ({ ...current, method: event.target.value }));
              setMessage({ error: "", success: "" });
            }}
          >
            <option value="Mobile Money">Mobile Money</option>
            <option value="Bank transfer">Bank transfer</option>
          </select>
          <input
            value={form.account}
            onChange={(event) => {
              setForm((current) => ({ ...current, account: event.target.value }));
              setMessage({ error: "", success: "" });
            }}
            placeholder="Mobile money number or bank account"
          />
          <FormMessage error={message.error} success={message.success} />
          <button disabled>Real Payouts Coming Soon</button>
        </form>
        <aside className="summary-panel">
          <h3>Earnings Breakdown</h3>
          <SummaryLine label="Completed gross sales" value={currency.format(finance.grossCompletedSales)} />
          <SummaryLine label="Platform commission" value={`-${currency.format(finance.platformCommission)}`} />
          <SummaryLine label="Net earnings" value={currency.format(finance.netEarnings)} />
          <SummaryLine label="Pending payouts" value={`-${currency.format(finance.pendingPayouts)}`} />
          <SummaryLine label="Available balance" value={currency.format(finance.availableEarnings)} strong />
        </aside>
      </section>
      <section className="table-panel">
        <h3>Payout History</h3>
        {vendorPayouts.length === 0 ? <EmptyState icon={<Wallet size={42} />} title="No payout requests yet" copy="After delivered paid orders generate earnings, you can request a payout here." /> : null}
        {vendorPayouts.map((request) => (
          <div className="table-row payout-row" key={request.id}>
            <strong>{currency.format(request.amount)}</strong>
            <span>{request.method}</span>
            <span>{request.account}</span>
            <em className={request.status === "PENDING" ? "processing" : ""}>{request.status}</em>
            <span>{request.requestedAt}</span>
          </div>
        ))}
      </section>
    </>
  );
}

function LogisticsPage() {
  return <FeatureMatrix title="Logistics and Delivery" kicker="Fulfillment" items={["Local couriers", "National postal services", "Third-party logistics", "Real-time tracking", "Delivery estimation", "Fee calculator", "Pickup points", "Shipment timeline", "Return handling", "Vendor pickup scheduling"]} />;
}

function ReviewsPage() {
  return <FeatureMatrix title="Reviews and Ratings" kicker="Trust" items={["Product star ratings", "Review photos", "Review videos", "Verified purchase badges", "Store rating", "Delivery rating", "Customer service rating", "Moderation queue", "Fake review detection"]} />;
}

function NotificationsPage() {
  return <FeatureMatrix title="Notification System" kicker="Messaging" items={["Email", "SMS", "Push notifications", "WhatsApp", "New order alerts", "Payment received", "Shipment updates", "Refund processed", "Low stock alerts", "Dispute opened"]} />;
}

function AnalyticsPage() {
  return (
    <>
      <PageIntro
        kicker="Insights"
        title="Analytics"
        copy="MarketHub tracks sales, conversion, product performance, inventory turnover, customer behavior, cart abandonment, and search trends."
      />
      <section className="dashboard-grid">
        <ChartPanel title="Customer Behavior" empty />
        <ListPanel title="Vendor Metrics" items={[]} emptyCopy="Vendor analytics will begin after sellers upload products and receive orders." />
        <ListPanel title="Customer Metrics" items={[]} emptyCopy="Customer analytics will begin after accounts, browsing, carts, and purchases exist." />
      </section>
    </>
  );
}

function AiPage() {
  return <FeatureMatrix title="AI Features" kicker="Competitive Advantage" items={["Personalized suggestions", "Frequently bought together", "Suspicious transaction detection", "Fake review detection", "Product description generation", "Sales forecasting", "Inventory forecasting", "Shopping chatbot", "Order tracking assistant"]} />;
}

function ProfilePage({
  user,
  setCurrentUser,
  setPage,
  onAuthenticated,
  authPrompt,
  vendorApplications,
  setVendorApplications,
  initialMode,
  setVerificationEmail
}: {
  user: AuthUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  setPage: (page: PageId) => void;
  onAuthenticated: (authUser: SupabaseAuthUser) => Promise<AuthUser>;
  authPrompt: string;
  vendorApplications: VendorApplication[];
  setVendorApplications: React.Dispatch<React.SetStateAction<VendorApplication[]>>;
  initialMode: "login" | "signup";
  setVerificationEmail?: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authWorking, setAuthWorking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    acceptedTerms: false
  });
  const [vendorForm, setVendorForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    category: "Electronics",
    logoName: "",
    logoPreview: "",
    verificationDocumentName: ""
  });
  const [vendorMessage, setVendorMessage] = useState({ error: "", success: "" });
  const [vendorLogoFile, setVendorLogoFile] = useState<File | null>(null);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setAuthError("");
    setAuthSuccess("");
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthWorking(true);
    if (!supabase) {
      setAuthError(supabaseConfigurationMessage);
      setAuthWorking(false);
      return;
    }
    const client = supabase;

    if (mode === "login") {
      const { data, error } = await client.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      if (error) {
        setAuthError(getFriendlyAuthError(error.message));
        setAuthWorking(false);
        return;
      }

      if (data.user) {
        await onAuthenticated(data.user);
      }

      setAuthSuccess("Logged in securely.");
      setAuthWorking(false);
      return;
    }

    const validationError = validateSignup(form);
    if (validationError) {
      setAuthError(validationError);
      setAuthWorking(false);
      return;
    }

    const { data, error } = await client.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: {
          full_name: form.name.trim()
        }
      }
    });

    if (error) {
      setAuthError(getFriendlyAuthError(error.message));
      setAuthWorking(false);
      return;
    }

    if (data.session?.user && form.phone.trim()) {
      await client
        .from("profiles")
        .update({ phone: form.phone.trim() })
        .eq("id", data.session.user.id);
    }

    if (data.session?.user) {
      await onAuthenticated(data.session.user);
    }

    if (!data.session) {
      const email = form.email.trim().toLowerCase();
      window.localStorage.setItem("markethubPendingVerificationEmail", email);
      setVerificationEmail?.(email);
      setAuthWorking(false);
      setPage("verify-email");
      return;
    }

    setAuthSuccess("Customer account created securely.");
    setAuthWorking(false);
  };

  const updateVendorField = (field: keyof typeof vendorForm, value: string) => {
    setVendorForm((current) => ({ ...current, [field]: value }));
    setVendorMessage({ error: "", success: "" });
  };

  const updateVendorFile = (field: "logo" | "verification", file: File | undefined) => {
    if (!file) return;
    setVendorMessage({ error: "", success: "" });
    if (field === "logo") {
      setVendorLogoFile(file);
      setVendorForm((current) => ({
        ...current,
        logoName: file.name,
        logoPreview: URL.createObjectURL(file)
      }));
      return;
    }
    setVerificationFile(file);
    setVendorForm((current) => ({
      ...current,
      verificationDocumentName: file.name
    }));
  };

  const submitVendorApplication = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setVendorMessage({ error: supabaseConfigurationMessage, success: "" });
      return;
    }
    const client = supabase;
    if (!user || user.role !== "CUSTOMER") {
      setVendorMessage({ error: "Only registered customers can apply to become vendors.", success: "" });
      return;
    }

    const validationError = validateVendorApplication(vendorForm);
    if (validationError) {
      setVendorMessage({ error: validationError, success: "" });
      return;
    }

    const existingPending = vendorApplications.some(
      (application) => application.userId === user.id && application.status === "PENDING"
    );

    if (existingPending) {
      setVendorMessage({ error: "You already have a pending vendor application.", success: "" });
      return;
    }

    if (!vendorLogoFile || !verificationFile) {
      setVendorMessage({ error: "Select a store logo and a private verification document.", success: "" });
      return;
    }

    let assets: Awaited<ReturnType<typeof uploadSellerApplicationAssets>>;
    try {
      assets = await uploadSellerApplicationAssets(user.id, vendorLogoFile, verificationFile);
    } catch (error) {
      setVendorMessage({ error: error instanceof Error ? error.message : "Could not securely upload seller documents.", success: "" });
      return;
    }

    const { data, error } = await client
      .from("vendor_applications")
      .insert({
        user_id: user.id,
        business_name: vendorForm.businessName.trim(),
        owner_name: vendorForm.ownerName.trim(),
        phone: vendorForm.phone.trim(),
        email: vendorForm.email.trim().toLowerCase(),
        address: vendorForm.address.trim(),
        description: vendorForm.description.trim(),
        category: vendorForm.category,
        logo_path: assets.logoPath,
        verification_document_path: assets.verificationDocumentPath,
        status: "PENDING"
      })
      .select("*")
      .single<VendorApplicationRow>();

    if (error || !data) {
      setVendorMessage({ error: error?.message ?? "Could not submit vendor application.", success: "" });
      return;
    }

    setVendorApplications((currentApplications) => [mapVendorApplication(data), ...currentApplications]);
    setCurrentUser({ ...user, vendorStatus: "PENDING" });
    setVendorMessage({ error: "", success: "Vendor application submitted for admin review." });
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: "",
        confirmPassword: "",
        phone: user.phone ?? "",
        address: user.address ?? "",
        acceptedTerms: true
      });
    }
  }, [user]);

  if (user) {
    return (
      <>
        <PageIntro kicker="Account" title="My Account" copy="Manage your MarketHub activity and seller application from one secure place." />
        <section className="profile-layout">
          <aside className="account-side-nav">
            <div className="account-side-profile">
              <span className="account-avatar-small large">{user.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{user.name}</strong>
                <small>{roleLabels[user.role]} account</small>
              </div>
            </div>
            <button className="active">
              <LayoutDashboard size={16} />
              Account Center
            </button>
            <button onClick={() => setPage("profile")}><User size={16} /> Profile</button>
            {user.role === "CUSTOMER" ? <button onClick={() => setPage("track")}><PackageCheck size={16} /> My Orders</button> : null}
            {user.role === "CUSTOMER" ? <button onClick={() => setPage("wishlist")}><Heart size={16} /> Wishlist</button> : null}
            {user.role === "CUSTOMER" ? <button onClick={() => setPage("cart")}><ShoppingCart size={16} /> Cart</button> : null}
            {user.role === "CUSTOMER" ? <button onClick={() => document.getElementById("vendor-application")?.scrollIntoView({ behavior: "smooth" })}><Store size={16} /> Become a Seller</button> : null}
            {user.role === "VENDOR" ? <button onClick={() => setPage("vendor")}><LayoutDashboard size={16} /> Seller Dashboard</button> : null}
            {user.role === "ADMIN" ? <button onClick={() => setPage("admin")}><ShieldCheck size={16} /> Admin Dashboard</button> : null}
          </aside>
          <div className="stack-panel">
            <section className="form-panel account-overview">
              <div className="account-overview-hero">
                <div>
                  <p className="eyebrow">Welcome back</p>
                  <h3>{user.name}</h3>
                  <AccountStatus user={user} />
                </div>
                <button onClick={() => setPage("profile")}>Edit Profile</button>
              </div>
              <div className="account-quick-grid">
                <article>
                  <small>Email</small>
                  <strong>{user.email}</strong>
                </article>
                <article>
                  <small>Phone</small>
                  <strong>{user.phone || "Add phone number"}</strong>
                </article>
                <article>
                  <small>Role</small>
                  <strong>{roleLabels[user.role]}</strong>
                </article>
                <article>
                  <small>Delivery address</small>
                  <strong>{user.address || "Add delivery address"}</strong>
                </article>
              </div>
            </section>
            {user.role === "CUSTOMER" ? (
              <VendorApplicationForm
                form={vendorForm}
                message={vendorMessage}
                onSubmit={submitVendorApplication}
                onFieldChange={updateVendorField}
                onFileChange={updateVendorFile}
                applications={vendorApplications.filter((application) => application.userId === user.id)}
              />
            ) : null}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageIntro
        kicker="Account"
        title={mode === "signup" ? "Create Account" : "Log In"}
        copy={mode === "signup" ? "Join MarketHub as a customer and start shopping trusted products across Ghana." : "Welcome back. Log in securely to continue shopping or manage your seller workspace."}
      />
      <section className="auth-layout">
        <form className="form-panel" onSubmit={submitAuth}>
          <div className="auth-tabs">
            <button className={mode === "signup" ? "active" : ""} type="button" onClick={() => setPage("signup")}>Sign up</button>
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setPage("login")}>Log in</button>
          </div>
          <FormMessage error={authPrompt || (!supabase ? supabaseConfigurationMessage : "")} success="" />
          {mode === "signup" ? (
            <>
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Full name" />
            </>
          ) : null}
          <input value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email address" />
          <label className="password-field">
            <input value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Password" type={showPassword ? "text" : "password"} />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} title={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </label>
          {mode === "signup" ? (
            <>
              <label className="password-field">
                <input value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} placeholder="Confirm password" type={showConfirmPassword ? "text" : "password"} />
                <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} title={showConfirmPassword ? "Hide password" : "Show password"}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </label>
              <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Phone number" />
              <label className="terms-checkbox">
                <input type="checkbox" checked={form.acceptedTerms} onChange={(event) => setForm((current) => ({ ...current, acceptedTerms: event.target.checked }))} />
                <span>I agree to the Terms and Privacy Policy.</span>
              </label>
            </>
          ) : null}
          <FormMessage error={authError} success={authSuccess} />
          <button disabled={authWorking}>{authWorking ? "Please wait..." : mode === "signup" ? "Create Customer Account" : "Log In"}</button>
          {mode === "login" ? <button type="button" className="ghost-button" onClick={() => setPage("forgot-password")}>Forgot Password?</button> : null}
          {mode === "login" ? <button type="button" className="ghost-button" onClick={() => setPage("verify-email")}>Enter Verification Code</button> : null}
        </form>
        <div className="auth-card">
          <ShieldCheck size={28} />
          <h3>Role-based access</h3>
          <p>Customers shop and message vendors. Vendors manage stores and uploads. Admins control approvals, disputes, categories, and settings.</p>
        </div>
      </section>
    </>
  );
}

function VerifyEmailCodePage({
  initialEmail,
  setVerificationEmail,
  setPage,
  onAuthenticated
}: {
  initialEmail: string;
  setVerificationEmail: React.Dispatch<React.SetStateAction<string>>;
  setPage: (page: PageId) => void;
  onAuthenticated: (authUser: SupabaseAuthUser) => Promise<AuthUser>;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState({ error: "", success: "" });
  const [working, setWorking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const normalizedEmail = email.trim().toLowerCase();
  const updateStoredEmail = (value: string) => {
    setEmail(value);
    setVerificationEmail(value);
    if (value.trim()) {
      window.localStorage.setItem("markethubPendingVerificationEmail", value.trim().toLowerCase());
    }
    setMessage({ error: "", success: "" });
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setMessage({ error: supabaseConfigurationMessage, success: "" });
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setMessage({ error: "Enter the email address you used to create your MarketHub account.", success: "" });
      return;
    }
    const cleanedCode = code.replace(/\D/g, "");
    if (cleanedCode.length < 6) {
      setMessage({ error: "Enter the 6-digit verification code from your email.", success: "" });
      return;
    }
    setWorking(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanedCode,
      type: "signup"
    });
    if (error) {
      setMessage({ error: "The code is invalid or has expired. Please check your email or request a new code.", success: "" });
      setWorking(false);
      return;
    }
    window.localStorage.removeItem("markethubPendingVerificationEmail");
    setVerificationEmail("");
    setMessage({ error: "", success: "Email verified successfully. Welcome to MarketHub." });
    if (data.user) {
      await onAuthenticated(data.user);
    } else {
      setPage("login");
    }
    setWorking(false);
  };

  const resendCode = async () => {
    if (!supabase || cooldown > 0) return;
    if (!isValidEmail(normalizedEmail)) {
      setMessage({ error: "Enter your email address before requesting a new code.", success: "" });
      return;
    }
    setWorking(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`
      }
    });
    setWorking(false);
    if (error) {
      setMessage({ error: getFriendlyAuthError(error.message), success: "" });
      return;
    }
    setCooldown(60);
    setMessage({ error: "", success: "A new verification code has been sent to your email." });
  };

  return (
    <>
      <PageIntro
        kicker="Email Verification"
        title="Verify your email"
        copy="Enter the 6-digit code we sent to your email to activate your MarketHub account."
      />
      <section className="auth-layout compact-auth">
        <form className="form-panel verification-panel" onSubmit={verifyCode}>
          <div className="verification-hero">
            <span className="brand-mark">M</span>
            <div>
              <h3>Check your inbox</h3>
              <p>We sent a 6-digit verification code to your email address.</p>
            </div>
          </div>
          <label>Email address<input type="email" value={email} onChange={(event) => updateStoredEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label>Verification code<input className="pin-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" /></label>
          <FormMessage error={message.error} success={message.success} />
          <button disabled={working}>{working ? "Verifying..." : "Verify Email"}</button>
          <button type="button" className="ghost-button" disabled={working || cooldown > 0} onClick={resendCode}>
            {cooldown > 0 ? `You can request a new code in ${cooldown}s` : "Resend code"}
          </button>
          <button type="button" className="ghost-button" onClick={() => setPage("signup")}>Change email or create account again</button>
          <button type="button" className="ghost-button" onClick={() => setPage("login")}>Back to Log In</button>
        </form>
      </section>
    </>
  );
}

function UserProfilePage({
  user,
  setUsers,
  setCurrentUser,
  setPage
}: {
  user: AuthUser | null;
  setUsers: React.Dispatch<React.SetStateAction<AuthUser[]>>;
  setCurrentUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  setPage: (page: PageId) => void;
}) {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? ""
  });
  const [message, setMessage] = useState({ error: "", success: "" });
  const [saving, setSaving] = useState(false);

  if (!user) return <AccessDeniedPage requiredRole="a logged-in account" setPage={setPage} />;

  const updateProfile = async (event: FormEvent) => {
    event.preventDefault();
    setMessage({ error: "", success: "" });
    if (!supabase) {
      setMessage({ error: supabaseConfigurationMessage, success: "" });
      return;
    }
    if (!form.name.trim() || !isValidEmail(form.email)) {
      setMessage({ error: "Enter a full name and valid email address.", success: "" });
      return;
    }
    setSaving(true);
    const nextEmail = form.email.trim().toLowerCase();
    if (nextEmail !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: nextEmail });
      if (emailError) {
        setMessage({ error: emailError.message, success: "" });
        setSaving(false);
        return;
      }
    }
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.name.trim(), email: nextEmail, phone: form.phone.trim() || null, address: form.address.trim() || null })
      .eq("id", user.id);
    if (error) {
      setMessage({ error: error.message, success: "" });
      setSaving(false);
      return;
    }
    const updated = { ...user, name: form.name.trim(), email: nextEmail, phone: form.phone.trim(), address: form.address.trim() };
    setUsers((current) => current.map((item) => item.id === user.id ? updated : item));
    setCurrentUser(updated);
    setMessage({ error: "", success: "Profile already updated." });
    setSaving(false);
  };

  return (
    <>
      <PageIntro kicker="Profile" title={user.name} copy="Keep your personal contact details accurate for orders and seller communication." />
      <section className="profile-page-grid">
        <aside className="profile-identity-card">
          <span className="profile-avatar">{user.name.slice(0, 2).toUpperCase()}</span>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <AccountStatus user={user} />
          <button className="ghost-button" onClick={() => setPage("account")}>Open My Account</button>
        </aside>
        <form className="form-panel" onSubmit={updateProfile}>
          <h3>Profile Details</h3>
          <label>Full name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>Email address<input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <label>Phone number<input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label>
          <label>Delivery address<input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></label>
          <FormMessage error={message.error} success={message.success} />
          <button disabled={saving}>{saving ? "Saving..." : "Save Profile"}</button>
        </form>
      </section>
    </>
  );
}

function PasswordRecoveryPage({ mode, setPage }: { mode: "request" | "reset"; setPage: (page: PageId) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setMessage({ error: supabaseConfigurationMessage, success: "" });
      return;
    }
    setWorking(true);
    setMessage({ error: "", success: "" });
    if (mode === "request") {
      if (!isValidEmail(email)) {
        setMessage({ error: "Enter a valid email address.", success: "" });
        setWorking(false);
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      setMessage(error ? { error: error.message, success: "" } : { error: "", success: "Password reset instructions have been sent to your email." });
      setWorking(false);
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setMessage({ error: "Use at least 8 characters with uppercase, lowercase, and a number.", success: "" });
      setWorking(false);
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ error: "Passwords do not match.", success: "" });
      setWorking(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? { error: error.message, success: "" } : { error: "", success: "Password updated. You can now continue to your account." });
    setWorking(false);
  };

  return (
    <>
      <PageIntro kicker="Account Security" title={mode === "request" ? "Forgot Password" : "Set a New Password"} copy="MarketHub uses Supabase Auth to securely manage password recovery." />
      <section className="auth-layout compact-auth">
        <form className="form-panel" onSubmit={submit}>
          {mode === "request" ? (
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          ) : (
            <>
              <label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
            </>
          )}
          <FormMessage error={message.error} success={message.success} />
          <button disabled={working}>{working ? "Please wait..." : mode === "request" ? "Send Reset Email" : "Update Password"}</button>
          <button type="button" className="ghost-button" onClick={() => setPage("login")}>Back to Log In</button>
        </form>
      </section>
    </>
  );
}

function validateSignup(form: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}) {
  if (!form.name.trim()) return "Full name is required.";
  if (!isValidEmail(form.email)) return "Enter a valid email address.";
  if (form.password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
    return "Password must include uppercase, lowercase, and a number.";
  }
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  if (!form.acceptedTerms) return "Agree to the Terms and Privacy Policy to create an account.";
  return "";
}

function validateVendorApplication(form: {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  category: string;
  logoName: string;
  verificationDocumentName: string;
}) {
  if (!form.businessName.trim()) return "Business or store name is required.";
  if (!form.ownerName.trim()) return "Owner full name is required.";
  if (!form.phone.trim() || form.phone.trim().length < 8) return "Enter a valid phone number.";
  if (!isValidEmail(form.email)) return "Enter a valid email address.";
  if (!form.address.trim()) return "Business address is required.";
  if (form.description.trim().length < 20) return "Store description must be at least 20 characters.";
  if (!form.category.trim()) return "Product category is required.";
  if (!form.logoName) return "Vendor logo upload is required.";
  if (!form.verificationDocumentName) return "Ghana Card or business verification document is required.";
  return "";
}

function VendorApplicationForm({
  form,
  message,
  applications,
  onSubmit,
  onFieldChange,
  onFileChange
}: {
  form: {
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    description: string;
    category: string;
    logoName: string;
    logoPreview: string;
    verificationDocumentName: string;
  };
  message: { error: string; success: string };
  applications: VendorApplication[];
  onSubmit: (event: FormEvent) => void;
  onFieldChange: (field: keyof typeof form, value: string) => void;
  onFileChange: (field: "logo" | "verification", file: File | undefined) => void;
}) {
  const latestApplication = applications[applications.length - 1];

  return (
    <form id="vendor-application" className="form-panel" onSubmit={onSubmit}>
          <h3>Become a Seller</h3>
      {latestApplication ? (
        <p className={`account-status ${latestApplication.status.toLowerCase()}`}>
          Latest application: {latestApplication.status}
        </p>
      ) : null}
      <input value={form.businessName} onChange={(event) => onFieldChange("businessName", event.target.value)} placeholder="Business/store name" />
      <input value={form.ownerName} onChange={(event) => onFieldChange("ownerName", event.target.value)} placeholder="Owner full name" />
      <input value={form.phone} onChange={(event) => onFieldChange("phone", event.target.value)} placeholder="Phone number" />
      <input value={form.email} onChange={(event) => onFieldChange("email", event.target.value)} placeholder="Email address" />
      <input value={form.address} onChange={(event) => onFieldChange("address", event.target.value)} placeholder="Business address" />
      <textarea value={form.description} onChange={(event) => onFieldChange("description", event.target.value)} placeholder="Store description" />
      <select value={form.category} onChange={(event) => onFieldChange("category", event.target.value)}>
        {categories.map(([name]) => <option key={name} value={name}>{name}</option>)}
      </select>
      <label className="file-input">
        <span>Vendor logo upload</span>
        <input type="file" accept="image/*" onChange={(event) => onFileChange("logo", event.target.files?.[0])} />
        <small>{form.logoName || "No logo selected"}</small>
      </label>
      {form.logoPreview ? <img className="logo-preview" src={form.logoPreview} alt="" /> : null}
      <label className="file-input private-file">
        <span>Ghana Card or business verification document</span>
        <input type="file" accept=".pdf,image/*" onChange={(event) => onFileChange("verification", event.target.files?.[0])} />
        <small>{form.verificationDocumentName || "Private document not selected"}</small>
      </label>
      <p className="privacy-note">Verification documents are for admin review only and are never shown publicly.</p>
      <FormMessage error={message.error} success={message.success} />
      <button>Submit Vendor Application</button>
    </form>
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("email not confirmed") || normalized.includes("not confirmed")) {
    return "Please verify your email first. Check your inbox for the verification code.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "The email or password is incorrect. Please check your details and try again.";
  }
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "An account already exists for this email. Log in or use password recovery.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  if (normalized.includes("expired") || normalized.includes("invalid token")) {
    return "The code is invalid or has expired. Please request a new code.";
  }
  return "We could not complete that account action. Please try again.";
}

function FormMessage({ error, success }: { error: string; success: string }) {
  if (!error && !success) return null;
  return <p className={error ? "form-message error" : "form-message success"}>{error || success}</p>;
}

function AccountStatus({ user }: { user: AuthUser }) {
  if (user.role === "CUSTOMER" && user.vendorStatus === "PENDING") {
    return <p className="account-status pending">Vendor application pending admin review</p>;
  }

  if (user.role !== "VENDOR") {
    return <p className="account-status">{roleLabels[user.role]} account active</p>;
  }

  return <p className={`account-status ${user.vendorStatus?.toLowerCase()}`}>Vendor status: {user.vendorStatus}</p>;
}

function RoleGuard({
  user,
  roles,
  setPage,
  children
}: {
  user: AuthUser | null;
  roles: Role[];
  setPage: (page: PageId) => void;
  children: React.ReactNode;
}) {
  if (!user || !roles.includes(user.role)) {
    return <AccessDeniedPage requiredRole={roles.map((role) => roleLabels[role]).join(" or ")} setPage={setPage} />;
  }

  if (roles.includes("VENDOR") && user.role === "VENDOR" && user.vendorStatus !== "APPROVED") {
    return <AccessDeniedPage requiredRole="an approved vendor account" setPage={setPage} />;
  }

  return <>{children}</>;
}

function AccessDeniedPage({ requiredRole, setPage }: { requiredRole: string; setPage: (page: PageId) => void }) {
  return (
    <>
      <PageIntro kicker="Protected" title="Access Restricted" copy="" />
      <section className="empty-state">
        <ShieldCheck size={42} />
        <h3>Sign in with {requiredRole}</h3>
        <p>This page is protected by role-based authorization.</p>
        <button className="primary-mini empty-action" onClick={() => setPage("login")}>Go to Log In</button>
      </section>
    </>
  );
}

function FeatureMatrix({ title, kicker, items }: { title: string; kicker: string; items: string[] }) {
  return (
    <>
      <PageIntro kicker={kicker} title={title} copy="This page captures the operating requirements from the PRD and turns them into visible web app modules for planning and implementation." />
      <section className="feature-grid">
        {items.map((item) => (
          <article className="feature-card" key={item}>
            <CheckCircle2 size={19} />
            <strong>{item}</strong>
          </article>
        ))}
      </section>
    </>
  );
}

function ChartPanel({ title, empty = false }: { title: string; empty?: boolean }) {
  const bars = empty ? [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8] : [32, 54, 38, 72, 60, 86, 58, 93, 78, 104, 88, 116];
  return (
    <article className="chart-panel">
      <h3>{title}</h3>
      <div className="chart">
        {bars.map((height, index) => (
          <span style={{ height }} key={index} />
        ))}
      </div>
      {empty ? <p className="panel-empty">No activity has been recorded yet.</p> : null}
    </article>
  );
}

function ListPanel({ title, items, emptyCopy = "Nothing to show yet." }: { title: string; items: string[]; emptyCopy?: string }) {
  return (
    <article className="list-panel">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="panel-empty">{emptyCopy}</p> : null}
      {items.map((item) => (
        <div key={item}>
          <Zap size={16} />
          <span>{item}</span>
        </div>
      ))}
    </article>
  );
}

function StatusPanel({ empty = false }: { empty?: boolean }) {
  return (
    <article className="status-panel">
      <h3>Orders by Status</h3>
      <div className="donut" />
      {empty ? <p className="panel-empty">No orders have been placed yet.</p> : null}
      <p><span /> Delivered: 0</p>
      <p><span /> Processing: 0</p>
      <p><span /> Shipped: 0</p>
      <p><span /> Cancelled: 0</p>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  copy
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <section className="empty-state">
      {icon}
      <h3>{title}</h3>
      <p>{copy}</p>
    </section>
  );
}

export { App };

