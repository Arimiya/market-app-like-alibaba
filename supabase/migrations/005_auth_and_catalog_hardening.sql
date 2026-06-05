-- Remove unintended RPC access to trigger helpers and add catalog indexes.

alter function public.set_updated_at() set search_path = public;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create index if not exists vendor_applications_user_id_idx on public.vendor_applications(user_id);
create index if not exists vendor_applications_reviewed_by_idx on public.vendor_applications(reviewed_by);
create index if not exists products_vendor_user_id_idx on public.products(vendor_user_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_status_created_at_idx on public.products(status, created_at desc);
create index if not exists product_media_product_id_sort_order_idx on public.product_media(product_id, sort_order);
