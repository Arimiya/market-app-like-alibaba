-- MarketHub Phase 1 database foundation for Supabase.
-- Run this in the Supabase SQL editor or apply it as a migration.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'CUSTOMER' check (role in ('CUSTOMER', 'VENDOR', 'ADMIN')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  owner_name text not null,
  phone text not null,
  email text not null,
  address text not null,
  description text not null,
  category text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  vendor_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null,
  logo_url text,
  banner_url text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  vendor_user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  name text not null,
  slug text not null,
  description text not null,
  brand text,
  sku text,
  condition text not null check (condition in ('NEW', 'USED')),
  price numeric(12, 2) not null check (price >= 0),
  discount_price numeric(12, 2) check (discount_price is null or discount_price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_stores_updated_at on public.stores;
create trigger set_stores_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    'CUSTOMER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
      and status = 'ACTIVE'
  );
$$;

alter table public.profiles enable row level security;
alter table public.vendor_applications enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_customer_fields" on public.profiles;
create policy "profiles_update_own_customer_fields"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'CUSTOMER');

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "vendor_applications_insert_own_customer" on public.vendor_applications;
create policy "vendor_applications_insert_own_customer"
on public.vendor_applications for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'PENDING'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'CUSTOMER' and status = 'ACTIVE'
  )
);

drop policy if exists "vendor_applications_select_own_or_admin" on public.vendor_applications;
create policy "vendor_applications_select_own_or_admin"
on public.vendor_applications for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "vendor_applications_admin_update" on public.vendor_applications;
create policy "vendor_applications_admin_update"
on public.vendor_applications for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "stores_public_active_select" on public.stores;
create policy "stores_public_active_select"
on public.stores for select
to anon, authenticated
using (status = 'ACTIVE');

drop policy if exists "stores_vendor_insert_own" on public.stores;
create policy "stores_vendor_insert_own"
on public.stores for insert
to authenticated
with check (
  vendor_user_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'VENDOR' and status = 'ACTIVE'
  )
);

drop policy if exists "stores_vendor_update_own_or_admin" on public.stores;
create policy "stores_vendor_update_own_or_admin"
on public.stores for update
to authenticated
using (vendor_user_id = auth.uid() or public.is_admin())
with check (vendor_user_id = auth.uid() or public.is_admin());

drop policy if exists "categories_active_select" on public.categories;
create policy "categories_active_select"
on public.categories for select
to anon, authenticated
using (status = 'ACTIVE' or public.is_admin());

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_public_published_select" on public.products;
create policy "products_public_published_select"
on public.products for select
to anon, authenticated
using (status = 'PUBLISHED');

drop policy if exists "products_vendor_select_own_or_admin" on public.products;
create policy "products_vendor_select_own_or_admin"
on public.products for select
to authenticated
using (vendor_user_id = auth.uid() or public.is_admin());

drop policy if exists "products_vendor_insert_own" on public.products;
create policy "products_vendor_insert_own"
on public.products for insert
to authenticated
with check (
  vendor_user_id = auth.uid()
  and exists (
    select 1 from public.stores
    where id = store_id and vendor_user_id = auth.uid() and status = 'ACTIVE'
  )
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'VENDOR' and status = 'ACTIVE'
  )
);

drop policy if exists "products_vendor_update_own_or_admin" on public.products;
create policy "products_vendor_update_own_or_admin"
on public.products for update
to authenticated
using (vendor_user_id = auth.uid() or public.is_admin())
with check (vendor_user_id = auth.uid() or public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.vendor_applications to authenticated;
grant select, insert, update on public.stores to authenticated;
grant select on public.stores to anon;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

insert into public.categories (name, slug) values
  ('Electronics', 'electronics'),
  ('Fashion', 'fashion'),
  ('Home Living', 'home-living'),
  ('Beauty', 'beauty'),
  ('Phones', 'phones'),
  ('Computers', 'computers'),
  ('Sports', 'sports'),
  ('Automotive', 'automotive'),
  ('Baby Products', 'baby-products'),
  ('Books', 'books')
on conflict (slug) do nothing;
