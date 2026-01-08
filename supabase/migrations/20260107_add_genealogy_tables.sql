-- ============================================================================
-- Family Tree Memory Maker - Database Schema
-- Migration: Add trees, people, locations tables for cross-referencing
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TREES TABLE
-- Stores metadata about imported family trees
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_filename TEXT,
  person_count INTEGER DEFAULT 0,
  family_count INTEGER DEFAULT 0,
  location_count INTEGER DEFAULT 0,
  root_person_id UUID, -- Will reference people table
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for trees
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trees" ON public.trees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trees" ON public.trees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trees" ON public.trees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trees" ON public.trees
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- LOCATIONS TABLE (Normalized)
-- Stores unique locations with parsed components
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_text TEXT NOT NULL,
  city TEXT,
  county TEXT,
  state TEXT,
  state_code TEXT, -- e.g., 'NY', 'PA'
  country TEXT DEFAULT 'United States',
  country_code TEXT DEFAULT 'US',
  region TEXT, -- e.g., 'New England', 'Mid-Atlantic'
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_international BOOLEAN DEFAULT FALSE,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Unique constraint on raw_text to avoid duplicates
  CONSTRAINT unique_raw_location UNIQUE (raw_text)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_state ON public.locations(state);
CREATE INDEX IF NOT EXISTS idx_locations_county ON public.locations(county);
CREATE INDEX IF NOT EXISTS idx_locations_region ON public.locations(region);
CREATE INDEX IF NOT EXISTS idx_locations_country ON public.locations(country);

-- RLS for locations (shared across all users - locations are universal)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view locations" ON public.locations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert locations" ON public.locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- PEOPLE TABLE
-- Stores individuals from GEDCOM files
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  gedcom_id TEXT, -- Original GEDCOM xref like @I1@
  
  -- Name fields
  name TEXT,
  given_name TEXT,
  surname TEXT,
  maiden_name TEXT,
  nickname TEXT,
  name_suffix TEXT, -- Jr., Sr., III, etc.
  
  -- Gender
  sex TEXT CHECK (sex IN ('M', 'F', 'U')), -- Male, Female, Unknown
  
  -- Birth
  birth_date TEXT, -- Keep original GEDCOM format
  birth_year INTEGER, -- Extracted for filtering
  birth_location_id UUID REFERENCES public.locations(id),
  birth_place_raw TEXT, -- Original GEDCOM place string
  
  -- Death
  death_date TEXT,
  death_year INTEGER,
  death_location_id UUID REFERENCES public.locations(id),
  death_place_raw TEXT,
  is_living BOOLEAN DEFAULT TRUE,
  
  -- Family links (GEDCOM style)
  famc UUID, -- Family as child (references families.id)
  
  -- Additional data
  occupation TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for tree + gedcom_id combo
  CONSTRAINT unique_person_in_tree UNIQUE (tree_id, gedcom_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_people_tree ON public.people(tree_id);
CREATE INDEX IF NOT EXISTS idx_people_surname ON public.people(surname);
CREATE INDEX IF NOT EXISTS idx_people_birth_year ON public.people(birth_year);
CREATE INDEX IF NOT EXISTS idx_people_birth_location ON public.people(birth_location_id);
CREATE INDEX IF NOT EXISTS idx_people_death_location ON public.people(death_location_id);

-- RLS for people
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view people in their trees" ON public.people
  FOR SELECT USING (
    tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert people in their trees" ON public.people
  FOR INSERT WITH CHECK (
    tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update people in their trees" ON public.people
  FOR UPDATE USING (
    tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete people in their trees" ON public.people
  FOR DELETE USING (
    tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
  );

-- ============================================================================
-- FAMILIES TABLE
-- Stores family units (marriages/partnerships)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  gedcom_id TEXT, -- Original GEDCOM xref like @F1@
  
  -- Spouses
  husband_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  wife_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  
  -- Marriage info
  marriage_date TEXT,
  marriage_year INTEGER,
  marriage_location_id UUID REFERENCES public.locations(id),
  marriage_place_raw TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_family_in_tree UNIQUE (tree_id, gedcom_id)
);

-- RLS for families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view families in their trees" ON public.families
  FOR SELECT USING (
    tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage families in their trees" ON public.families
  FOR ALL USING (
    tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
  );

-- ============================================================================
-- FAMILY_CHILDREN Junction Table
-- Links children to families (supports multiple children per family)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.family_children (
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  birth_order INTEGER, -- 1 = first child, 2 = second, etc.
  PRIMARY KEY (family_id, person_id)
);

-- RLS
ALTER TABLE public.family_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view family_children in their trees" ON public.family_children
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM public.families 
      WHERE tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage family_children in their trees" ON public.family_children
  FOR ALL USING (
    family_id IN (
      SELECT id FROM public.families 
      WHERE tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- PERSON_LOCATIONS Junction Table
-- Links people to locations with event type (supports multiple locations per person)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.person_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('birth', 'death', 'marriage', 'residence', 'census', 'military', 'immigration', 'naturalization', 'burial', 'other')),
  event_date TEXT,
  event_year INTEGER,
  source TEXT, -- Where this info came from
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Avoid exact duplicates
  CONSTRAINT unique_person_location_event UNIQUE (person_id, location_id, event_type, event_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_person_locations_person ON public.person_locations(person_id);
CREATE INDEX IF NOT EXISTS idx_person_locations_location ON public.person_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_person_locations_event_type ON public.person_locations(event_type);

-- RLS
ALTER TABLE public.person_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view person_locations in their trees" ON public.person_locations
  FOR SELECT USING (
    person_id IN (
      SELECT id FROM public.people 
      WHERE tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage person_locations in their trees" ON public.person_locations
  FOR ALL USING (
    person_id IN (
      SELECT id FROM public.people 
      WHERE tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- NOTES TABLE
-- Stores notes for people (supports multiple notes per person)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.person_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'yellow', -- For colorful notes popup
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.person_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes in their trees" ON public.person_notes
  FOR SELECT USING (
    person_id IN (
      SELECT id FROM public.people 
      WHERE tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage notes in their trees" ON public.person_notes
  FOR ALL USING (
    person_id IN (
      SELECT id FROM public.people 
      WHERE tree_id IN (SELECT id FROM public.trees WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View: All locations with usage counts
CREATE OR REPLACE VIEW public.location_stats AS
SELECT 
  l.*,
  COUNT(DISTINCT pl.person_id) as person_count,
  COUNT(DISTINCT CASE WHEN pl.event_type = 'birth' THEN pl.person_id END) as birth_count,
  COUNT(DISTINCT CASE WHEN pl.event_type = 'death' THEN pl.person_id END) as death_count,
  MIN(pl.event_year) as earliest_year,
  MAX(pl.event_year) as latest_year
FROM public.locations l
LEFT JOIN public.person_locations pl ON l.id = pl.location_id
GROUP BY l.id;

-- View: People with their locations joined
CREATE OR REPLACE VIEW public.people_with_locations AS
SELECT 
  p.*,
  bl.raw_text as birth_location,
  bl.state as birth_state,
  bl.region as birth_region,
  dl.raw_text as death_location,
  dl.state as death_state,
  dl.region as death_region
FROM public.people p
LEFT JOIN public.locations bl ON p.birth_location_id = bl.id
LEFT JOIN public.locations dl ON p.death_location_id = dl.id;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update tree stats after import
CREATE OR REPLACE FUNCTION update_tree_stats(tree_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.trees SET
    person_count = (SELECT COUNT(*) FROM public.people WHERE tree_id = tree_uuid),
    family_count = (SELECT COUNT(*) FROM public.families WHERE tree_id = tree_uuid),
    location_count = (
      SELECT COUNT(DISTINCT location_id) 
      FROM public.person_locations pl
      JOIN public.people p ON pl.person_id = p.id
      WHERE p.tree_id = tree_uuid
    ),
    updated_at = NOW()
  WHERE id = tree_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find or create a location
CREATE OR REPLACE FUNCTION find_or_create_location(
  p_raw_text TEXT,
  p_city TEXT DEFAULT NULL,
  p_county TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'United States',
  p_region TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  location_uuid UUID;
BEGIN
  -- Try to find existing
  SELECT id INTO location_uuid
  FROM public.locations
  WHERE raw_text = p_raw_text;
  
  -- If not found, create
  IF location_uuid IS NULL THEN
    INSERT INTO public.locations (raw_text, city, county, state, country, region)
    VALUES (p_raw_text, p_city, p_county, p_state, p_country, p_region)
    RETURNING id INTO location_uuid;
  END IF;
  
  RETURN location_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT SELECT ON public.location_stats TO authenticated;
GRANT SELECT ON public.people_with_locations TO authenticated;
GRANT EXECUTE ON FUNCTION update_tree_stats TO authenticated;
GRANT EXECUTE ON FUNCTION find_or_create_location TO authenticated;
