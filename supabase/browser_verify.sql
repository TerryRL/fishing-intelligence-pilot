-- Fishing Intelligence Pilot - Browser verification
-- Run in Supabase Dashboard > SQL Editor after browser_setup.sql.

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles','species','water_bodies','lures','fishing_trips','fishing_spots','fishing_events','catches'
  )
order by tablename;

select count(*) as species_loaded from public.species;

select id, name, public
from storage.buckets
where id = 'catch-photos';

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname in ('public','storage')
  and tablename in (
    'profiles','species','water_bodies','lures','fishing_trips','fishing_spots','fishing_events','catches','objects'
  )
order by schemaname, tablename, policyname;
