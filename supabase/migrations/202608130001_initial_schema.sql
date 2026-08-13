-- Fishing Intelligence pilot schema
-- Run through Supabase CLI: supabase db push

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_units text not null default 'metric' check (preferred_units in ('metric', 'imperial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.species (
  id uuid primary key default gen_random_uuid(),
  common_name text not null unique,
  scientific_name text,
  sort_order integer not null default 100
);

create table if not exists public.water_bodies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  water_type text not null default 'lake',
  province_state text,
  country text,
  latitude double precision,
  longitude double precision,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  manufacturer text,
  product_name text not null,
  category text not null,
  model text,
  size_value numeric,
  size_unit text,
  weight_value numeric,
  weight_unit text,
  primary_colour text,
  secondary_colour text,
  pattern text,
  notes text,
  quantity_owned integer not null default 1 check (quantity_owned >= 0),
  storage_location text,
  photo_path text,
  is_favourite boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fishing_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  water_body_id uuid not null references public.water_bodies(id) on delete restrict,
  target_species_id uuid references public.species(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  start_latitude double precision,
  start_longitude double precision,
  current_lure_id uuid references public.lures(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  trip_notes text,
  weather_summary text,
  air_temperature_c numeric,
  wind_speed_kmh numeric,
  wind_direction text,
  barometric_pressure_hpa numeric,
  water_temperature_c numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create unique index if not exists one_active_trip_per_user
  on public.fishing_trips(user_id)
  where status = 'active';

create table if not exists public.fishing_spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  water_body_id uuid not null references public.water_bodies(id) on delete restrict,
  name text,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  structure_type text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fishing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.fishing_trips(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'trip_started',
      'setup_selected',
      'casts_recorded',
      'bite',
      'hooked',
      'fish_lost',
      'fish_caught',
      'spot_marked',
      'trip_ended'
    )
  ),
  event_time timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  lure_id uuid references public.lures(id) on delete set null,
  fishing_spot_id uuid references public.fishing_spots(id) on delete set null,
  cast_quantity integer check (cast_quantity is null or cast_quantity > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.catches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.fishing_trips(id) on delete cascade,
  event_id uuid references public.fishing_events(id) on delete set null,
  species_id uuid not null references public.species(id) on delete restrict,
  lure_id uuid references public.lures(id) on delete set null,
  fishing_spot_id uuid references public.fishing_spots(id) on delete set null,
  caught_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  length_cm numeric check (length_cm is null or length_cm > 0),
  weight_kg numeric check (weight_kg is null or weight_kg > 0),
  disposition text check (disposition is null or disposition in ('released', 'kept', 'unknown')),
  lure_snapshot jsonb not null default '{}'::jsonb,
  photo_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_water_bodies_user on public.water_bodies(user_id);
create index if not exists idx_lures_user_active on public.lures(user_id, is_active);
create index if not exists idx_trips_user_started on public.fishing_trips(user_id, started_at desc);
create index if not exists idx_events_trip_time on public.fishing_events(trip_id, event_time);
create index if not exists idx_events_user_type on public.fishing_events(user_id, event_type);
create index if not exists idx_catches_user_time on public.catches(user_id, caught_at desc);
create index if not exists idx_catches_trip on public.catches(trip_id);
create index if not exists idx_catches_species on public.catches(species_id);
create index if not exists idx_spots_user_water on public.fishing_spots(user_id, water_body_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists water_bodies_set_updated_at on public.water_bodies;
create trigger water_bodies_set_updated_at before update on public.water_bodies
for each row execute function public.set_updated_at();

drop trigger if exists lures_set_updated_at on public.lures;
create trigger lures_set_updated_at before update on public.lures
for each row execute function public.set_updated_at();

drop trigger if exists fishing_trips_set_updated_at on public.fishing_trips;
create trigger fishing_trips_set_updated_at before update on public.fishing_trips
for each row execute function public.set_updated_at();

drop trigger if exists fishing_spots_set_updated_at on public.fishing_spots;
create trigger fishing_spots_set_updated_at before update on public.fishing_spots
for each row execute function public.set_updated_at();

drop trigger if exists catches_set_updated_at on public.catches;
create trigger catches_set_updated_at before update on public.catches
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.species enable row level security;
alter table public.water_bodies enable row level security;
alter table public.lures enable row level security;
alter table public.fishing_trips enable row level security;
alter table public.fishing_spots enable row level security;
alter table public.fishing_events enable row level security;
alter table public.catches enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "species_read_authenticated" on public.species
  for select to authenticated using (true);

create policy "water_bodies_select_own" on public.water_bodies
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "water_bodies_insert_own" on public.water_bodies
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "water_bodies_update_own" on public.water_bodies
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "water_bodies_delete_own" on public.water_bodies
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "lures_select_own" on public.lures
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "lures_insert_own" on public.lures
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lures_update_own" on public.lures
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lures_delete_own" on public.lures
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "trips_select_own" on public.fishing_trips
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "trips_insert_own" on public.fishing_trips
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.water_bodies wb
      where wb.id = water_body_id and wb.user_id = (select auth.uid())
    )
    and (
      current_lure_id is null
      or exists (
        select 1 from public.lures l
        where l.id = current_lure_id and l.user_id = (select auth.uid())
      )
    )
  );
create policy "trips_update_own" on public.fishing_trips
  for update to authenticated using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.water_bodies wb
      where wb.id = water_body_id and wb.user_id = (select auth.uid())
    )
    and (
      current_lure_id is null
      or exists (
        select 1 from public.lures l
        where l.id = current_lure_id and l.user_id = (select auth.uid())
      )
    )
  );
create policy "trips_delete_own" on public.fishing_trips
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "spots_select_own" on public.fishing_spots
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "spots_insert_own" on public.fishing_spots
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.water_bodies wb
      where wb.id = water_body_id and wb.user_id = (select auth.uid())
    )
  );
create policy "spots_update_own" on public.fishing_spots
  for update to authenticated using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.water_bodies wb
      where wb.id = water_body_id and wb.user_id = (select auth.uid())
    )
  );
create policy "spots_delete_own" on public.fishing_spots
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "events_select_own" on public.fishing_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "events_insert_own" on public.fishing_events
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.fishing_trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
    and (
      lure_id is null
      or exists (
        select 1 from public.lures l
        where l.id = lure_id and l.user_id = (select auth.uid())
      )
    )
    and (
      fishing_spot_id is null
      or exists (
        select 1 from public.fishing_spots s
        where s.id = fishing_spot_id and s.user_id = (select auth.uid())
      )
    )
  );
create policy "events_update_own" on public.fishing_events
  for update to authenticated using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.fishing_trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
    and (
      lure_id is null
      or exists (
        select 1 from public.lures l
        where l.id = lure_id and l.user_id = (select auth.uid())
      )
    )
    and (
      fishing_spot_id is null
      or exists (
        select 1 from public.fishing_spots s
        where s.id = fishing_spot_id and s.user_id = (select auth.uid())
      )
    )
  );
create policy "events_delete_own" on public.fishing_events
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "catches_select_own" on public.catches
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "catches_insert_own" on public.catches
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.fishing_trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
    and (
      lure_id is null
      or exists (
        select 1 from public.lures l
        where l.id = lure_id and l.user_id = (select auth.uid())
      )
    )
    and (
      fishing_spot_id is null
      or exists (
        select 1 from public.fishing_spots s
        where s.id = fishing_spot_id and s.user_id = (select auth.uid())
      )
    )
  );
create policy "catches_update_own" on public.catches
  for update to authenticated using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.fishing_trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
    and (
      lure_id is null
      or exists (
        select 1 from public.lures l
        where l.id = lure_id and l.user_id = (select auth.uid())
      )
    )
    and (
      fishing_spot_id is null
      or exists (
        select 1 from public.fishing_spots s
        where s.id = fishing_spot_id and s.user_id = (select auth.uid())
      )
    )
  );
create policy "catches_delete_own" on public.catches
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Private catch-photo bucket. Object paths must begin with the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catch-photos',
  'catch-photos',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "catch_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'catch-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "catch_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'catch-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "catch_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'catch-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
  )
  with check (
    bucket_id = 'catch-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "catch_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'catch-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );
