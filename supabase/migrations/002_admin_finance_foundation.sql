-- MarketHub admin finance foundation.
-- TEST MODE ONLY: this migration does not initialize payments, verify bank accounts,
-- process provider webhooks, split settlements, or transfer real funds.

create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  commission_rate numeric(5, 2) not null default 3.00 check (commission_rate >= 0 and commission_rate <= 100),
  currency text not null default 'GHS' check (currency = 'GHS'),
  payments_enabled boolean not null default false,
  payment_mode text not null default 'TEST' check (payment_mode in ('TEST', 'LIVE')),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_settlement_accounts (
  id uuid primary key default gen_random_uuid(),
  account_holder_name text not null,
  bank_name text not null,
  bank_code text not null,
  account_number_masked text not null check (account_number_masked !~ '^[0-9]+$'),
  provider_recipient_code text,
  provider_subaccount_code text,
  currency text not null default 'GHS' check (currency = 'GHS'),
  verification_status text not null default 'UNVERIFIED' check (verification_status in ('UNVERIFIED', 'VERIFIED', 'FAILED')),
  is_active boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transaction_commissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  payment_id uuid not null,
  gross_amount numeric(14, 2) not null check (gross_amount >= 0),
  commission_rate numeric(5, 2) not null default 3.00 check (commission_rate >= 0 and commission_rate <= 100),
  commission_amount numeric(14, 2) not null check (commission_amount >= 0),
  vendor_net_amount numeric(14, 2) not null check (vendor_net_amount >= 0),
  currency text not null default 'GHS' check (currency = 'GHS'),
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'REVERSED')),
  created_at timestamptz not null default now(),
  unique (payment_id),
  check (commission_amount = round(gross_amount * commission_rate / 100, 2)),
  check (vendor_net_amount = gross_amount - commission_amount)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists transaction_commissions_order_id_idx on public.transaction_commissions(order_id);
create index if not exists transaction_commissions_status_idx on public.transaction_commissions(status);
create index if not exists platform_settlement_accounts_active_idx on public.platform_settlement_accounts(is_active) where is_active = true;
create index if not exists admin_audit_logs_admin_user_id_idx on public.admin_audit_logs(admin_user_id);
create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);

drop trigger if exists set_platform_settings_updated_at on public.platform_settings;
create trigger set_platform_settings_updated_at
before update on public.platform_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_platform_settlement_accounts_updated_at on public.platform_settlement_accounts;
create trigger set_platform_settlement_accounts_updated_at
before update on public.platform_settlement_accounts
for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;
alter table public.platform_settlement_accounts enable row level security;
alter table public.transaction_commissions enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "platform_settings_admin_all" on public.platform_settings;
create policy "platform_settings_admin_all"
on public.platform_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "platform_settlement_accounts_admin_all" on public.platform_settlement_accounts;
create policy "platform_settlement_accounts_admin_all"
on public.platform_settlement_accounts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "transaction_commissions_admin_select" on public.transaction_commissions;
create policy "transaction_commissions_admin_select"
on public.transaction_commissions for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_audit_logs_admin_select" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_select"
on public.admin_audit_logs for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_audit_logs_admin_insert" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_insert"
on public.admin_audit_logs for insert
to authenticated
with check (public.is_admin() and admin_user_id = auth.uid());

grant select, insert, update on public.platform_settings to authenticated;
grant select, insert, update on public.platform_settlement_accounts to authenticated;
grant select on public.transaction_commissions to authenticated;
grant select, insert on public.admin_audit_logs to authenticated;

insert into public.platform_settings (
  id,
  commission_rate,
  currency,
  payments_enabled,
  payment_mode
) values (
  '00000000-0000-0000-0000-000000000001',
  3.00,
  'GHS',
  false,
  'TEST'
)
on conflict (id) do nothing;

comment on table public.platform_settlement_accounts is
  'Admin-only masked settlement references. Never store raw bank account numbers in this table.';

comment on table public.transaction_commissions is
  'Commission records must be created by a future trusted backend only after verified successful payments.';
