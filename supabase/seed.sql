-- Local-development seed file.
-- Reference species are also a migration so remote projects receive them with `supabase db push`.
insert into public.species (common_name, scientific_name, sort_order) values
  ('Smallmouth Bass', 'Micropterus dolomieu', 10),
  ('Largemouth Bass', 'Micropterus salmoides', 20),
  ('Walleye', 'Sander vitreus', 30),
  ('Northern Pike', 'Esox lucius', 40),
  ('Muskellunge', 'Esox masquinongy', 50),
  ('Yellow Perch', 'Perca flavescens', 60),
  ('Lake Trout', 'Salvelinus namaycush', 70),
  ('Rainbow Trout', 'Oncorhynchus mykiss', 80),
  ('Brown Trout', 'Salmo trutta', 90),
  ('Brook Trout', 'Salvelinus fontinalis', 100),
  ('Black Crappie', 'Pomoxis nigromaculatus', 110),
  ('Bluegill', 'Lepomis macrochirus', 120),
  ('Pumpkinseed', 'Lepomis gibbosus', 130),
  ('Common Carp', 'Cyprinus carpio', 140),
  ('Channel Catfish', 'Ictalurus punctatus', 150),
  ('Lake Whitefish', 'Coregonus clupeaformis', 160),
  ('Other', null, 999)
on conflict (common_name) do update
set scientific_name = excluded.scientific_name,
    sort_order = excluded.sort_order;
