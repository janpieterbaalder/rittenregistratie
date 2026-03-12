-- ==========================================
-- Supabase setup voor Rittenregistratie
-- Voer dit uit in de Supabase SQL Editor
-- ==========================================

-- 1. Custom locaties (door gebruikers toegevoegde locaties)
CREATE TABLE custom_locations (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  address TEXT DEFAULT '',
  postcode TEXT DEFAULT '',
  city TEXT DEFAULT '',
  org TEXT DEFAULT 'overig',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Custom afstanden (auto-berekend via OSRM)
CREATE TABLE custom_distances (
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  km INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (from_name, to_name)
);

-- 3. Row Level Security inschakelen
ALTER TABLE custom_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_distances ENABLE ROW LEVEL SECURITY;

-- 4. Publieke toegang (iedereen mag lezen, toevoegen, verwijderen)
CREATE POLICY "public_all" ON custom_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON custom_distances FOR ALL USING (true) WITH CHECK (true);

-- Optioneel: verwijder hidden_locations tabel als die nog bestaat
-- DROP TABLE IF EXISTS hidden_locations;
