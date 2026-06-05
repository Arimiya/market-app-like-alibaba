-- Align persisted categories with the customer-facing MarketHub category menu.

insert into public.categories (name, slug) values
  ('Phones & Tablets', 'phones-tablets'),
  ('Home & Kitchen', 'home-kitchen'),
  ('Groceries', 'groceries'),
  ('Industrial Supplies', 'industrial-supplies')
on conflict (slug) do update set name = excluded.name, status = 'ACTIVE';
