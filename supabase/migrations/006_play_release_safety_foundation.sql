-- Google Play readiness safety foundation: reports, moderation, account deletion.

alter table public.products drop constraint if exists products_status_check;
alter table public.products
  add constraint products_status_check
  check (status in ('DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'SUSPENDED', 'REMOVED'));

create table if not exists public.product_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reporter_user_id uuid references public.profiles(id) on delete set null,
  seller_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('Fake product', 'Scam or fraud', 'Prohibited item', 'Offensive content', 'Wrong category', 'Copyright/trademark issue', 'Other')),
  description text,
  status text not null default 'PENDING' check (status in ('PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz
);

create table if not exists public.seller_reports (
  id uuid primary key default gen_random_uuid(),
  seller_user_id uuid not null references public.profiles(id) on delete cascade,
  reporter_user_id uuid references public.profiles(id) on delete set null,
  reason text not null check (reason in ('Fake product', 'Scam or fraud', 'Prohibited item', 'Offensive content', 'Wrong category', 'Copyright/trademark issue', 'Other')),
  description text,
  status text not null default 'PENDING' check (status in ('PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null default 'PENDING' check (status in ('PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz
);

alter table public.product_reports enable row level security;
alter table public.seller_reports enable row level security;
alter table public.account_deletion_requests enable row level security;

drop policy if exists "product_reports_insert_public_or_user" on public.product_reports;
create policy "product_reports_insert_public_or_user"
on public.product_reports for insert
to anon, authenticated
with check (
  reporter_user_id is null or reporter_user_id = auth.uid()
);

drop policy if exists "product_reports_admin_select_update" on public.product_reports;
create policy "product_reports_admin_select_update"
on public.product_reports for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "seller_reports_insert_public_or_user" on public.seller_reports;
create policy "seller_reports_insert_public_or_user"
on public.seller_reports for insert
to anon, authenticated
with check (
  reporter_user_id is null or reporter_user_id = auth.uid()
);

drop policy if exists "seller_reports_admin_select_update" on public.seller_reports;
create policy "seller_reports_admin_select_update"
on public.seller_reports for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "account_deletion_insert_own" on public.account_deletion_requests;
create policy "account_deletion_insert_own"
on public.account_deletion_requests for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "account_deletion_select_own_or_admin" on public.account_deletion_requests;
create policy "account_deletion_select_own_or_admin"
on public.account_deletion_requests for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "account_deletion_admin_update" on public.account_deletion_requests;
create policy "account_deletion_admin_update"
on public.account_deletion_requests for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.product_reports to anon, authenticated;
grant select, insert, update on public.seller_reports to anon, authenticated;
grant select, insert, update on public.account_deletion_requests to authenticated;

create index if not exists product_reports_product_id_idx on public.product_reports(product_id);
create index if not exists product_reports_status_created_at_idx on public.product_reports(status, created_at desc);
create index if not exists seller_reports_seller_user_id_idx on public.seller_reports(seller_user_id);
create index if not exists account_deletion_user_id_idx on public.account_deletion_requests(user_id);
