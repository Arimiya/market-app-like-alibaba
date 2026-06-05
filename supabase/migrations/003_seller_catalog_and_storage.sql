-- MarketHub seller catalog, product media, and private verification storage.

alter table public.vendor_applications
  add column if not exists logo_path text,
  add column if not exists verification_document_path text;

alter table public.profiles
  add column if not exists address text;

alter table public.products
  add column if not exists subcategory text,
  add column if not exists wholesale_price numeric(12, 2) check (wholesale_price is null or wholesale_price >= 0),
  add column if not exists minimum_order_quantity integer check (minimum_order_quantity is null or minimum_order_quantity > 0),
  add column if not exists delivery_options text[] not null default '{}';

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  media_type text not null check (media_type in ('IMAGE', 'VIDEO')),
  storage_path text not null unique,
  public_url text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

alter table public.product_media enable row level security;

drop policy if exists "profiles_vendor_update_own_fields" on public.profiles;
create policy "profiles_vendor_update_own_fields"
on public.profiles for update
to authenticated
using (id = auth.uid() and role = 'VENDOR')
with check (id = auth.uid() and role = 'VENDOR');

drop policy if exists "product_media_public_published_select" on public.product_media;
create policy "product_media_public_published_select"
on public.product_media for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_media.product_id
      and (products.status = 'PUBLISHED' or products.vendor_user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "product_media_vendor_insert_own" on public.product_media;
create policy "product_media_vendor_insert_own"
on public.product_media for insert
to authenticated
with check (
  exists (
    select 1 from public.products
    where products.id = product_media.product_id
      and products.vendor_user_id = auth.uid()
  )
);

drop policy if exists "product_media_vendor_update_own" on public.product_media;
create policy "product_media_vendor_update_own"
on public.product_media for update
to authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_media.product_id
      and (products.vendor_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.products
    where products.id = product_media.product_id
      and (products.vendor_user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "product_media_vendor_delete_own" on public.product_media;
create policy "product_media_vendor_delete_own"
on public.product_media for delete
to authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_media.product_id
      and (products.vendor_user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "products_vendor_delete_own_or_admin" on public.products;
create policy "products_vendor_delete_own_or_admin"
on public.products for delete
to authenticated
using (vendor_user_id = auth.uid() or public.is_admin());

drop policy if exists "stores_admin_all" on public.stores;
create policy "stores_admin_all"
on public.stores for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.product_media to anon, authenticated;
grant insert, update, delete on public.product_media to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('product-videos', 'product-videos', true, 52428800, array['video/mp4', 'video/webm']),
  ('store-assets', 'store-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('vendor-verification', 'vendor-verification', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public_product_media_read" on storage.objects;
create policy "public_product_media_read"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('product-images', 'product-videos', 'store-assets'));

drop policy if exists "approved_vendor_public_media_insert" on storage.objects;
create policy "approved_vendor_public_media_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('product-images', 'product-videos', 'store-assets')
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    bucket_id = 'store-assets'
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'VENDOR' and status = 'ACTIVE'
    )
  )
);

drop policy if exists "approved_vendor_public_media_update" on storage.objects;
create policy "approved_vendor_public_media_update"
on storage.objects for update
to authenticated
using (
  bucket_id in ('product-images', 'product-videos', 'store-assets')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('product-images', 'product-videos', 'store-assets')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "approved_vendor_public_media_delete" on storage.objects;
create policy "approved_vendor_public_media_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('product-images', 'product-videos', 'store-assets')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "customer_verification_upload" on storage.objects;
create policy "customer_verification_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vendor-verification'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "verification_owner_or_admin_read" on storage.objects;
create policy "verification_owner_or_admin_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'vendor-verification'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "verification_owner_or_admin_delete" on storage.objects;
create policy "verification_owner_or_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'vendor-verification'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
