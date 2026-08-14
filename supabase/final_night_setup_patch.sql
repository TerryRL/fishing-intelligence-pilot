-- Fishing Intelligence final night setup patch
-- Run once in Supabase Dashboard > SQL Editor > New query.
-- Adds per-user species customization and persistent custom waterway types.

-- 1) Species can now be global defaults (user_id is null) or user-owned copies/custom entries.
alter table public.species add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.species add column if not exists source_species_id uuid references public.species(id) on delete set null;
alter table public.species add column if not exists photo_path text;
alter table public.species add column if not exists is_active boolean not null default true;

-- Existing schema used a global unique constraint on common_name. Replace it with scoped uniqueness.
alter table public.species drop constraint if exists species_common_name_key;
create unique index if not exists species_default_common_name_unique
  on public.species (lower(common_name))
  where user_id is null;
create unique index if not exists species_user_common_name_unique
  on public.species (user_id, lower(common_name))
  where user_id is not null;
create unique index if not exists species_user_source_unique
  on public.species (user_id, source_species_id)
  where user_id is not null and source_species_id is not null;

-- Replace the former read-all policy so one user's custom fish are never exposed to another user.
drop policy if exists "species_read_authenticated" on public.species;
drop policy if exists "species_select_defaults_and_own" on public.species;
drop policy if exists "species_insert_own" on public.species;
drop policy if exists "species_update_own" on public.species;
drop policy if exists "species_delete_own" on public.species;

create policy "species_select_defaults_and_own" on public.species
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy "species_insert_own" on public.species
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "species_update_own" on public.species
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "species_delete_own" on public.species
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- 2) Persistent user-defined waterway types.
create table if not exists public.waterway_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.waterway_types enable row level security;
drop policy if exists "waterway_types_select_own" on public.waterway_types;
drop policy if exists "waterway_types_insert_own" on public.waterway_types;
drop policy if exists "waterway_types_delete_own" on public.waterway_types;
create policy "waterway_types_select_own" on public.waterway_types
  for select to authenticated using (user_id = (select auth.uid()));
create policy "waterway_types_insert_own" on public.waterway_types
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "waterway_types_delete_own" on public.waterway_types
  for delete to authenticated using (user_id = (select auth.uid()));

select
  (select count(*) from public.species where user_id is null) as default_species,
  (select count(*) from public.waterway_types) as custom_waterway_types;
