-- ============================================================
-- Amazing Tools Company — Supabase setup
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. CATEGORIES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  image text,
  created_at timestamptz default now()
);

-- 2. PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  image text,
  variant_label text,
  variants text[] default '{}',
  created_at timestamptz default now()
);

-- 3. RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories for select using (true);

drop policy if exists "Authenticated manage categories" on public.categories;
create policy "Authenticated manage categories" on public.categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Public read products" on public.products;
create policy "Public read products" on public.products for select using (true);

drop policy if exists "Authenticated manage products" on public.products;
create policy "Authenticated manage products" on public.products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4. STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('product-images','product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read images" on storage.objects;
create policy "Public read images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Authenticated upload images" on storage.objects;
create policy "Authenticated upload images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "Authenticated update images" on storage.objects;
create policy "Authenticated update images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

drop policy if exists "Authenticated delete images" on storage.objects;
create policy "Authenticated delete images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
