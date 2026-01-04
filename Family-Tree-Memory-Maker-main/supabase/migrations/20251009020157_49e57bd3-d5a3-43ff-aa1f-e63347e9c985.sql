-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create family_trees table
CREATE TABLE public.family_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  gedcom_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create individuals table
CREATE TABLE public.individuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  gedcom_id TEXT,
  given_name TEXT,
  surname TEXT,
  sex TEXT,
  birth_date TEXT,
  birth_place TEXT,
  death_date TEXT,
  death_place TEXT,
  occupation TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create families table (relationships)
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  gedcom_id TEXT,
  husband_id UUID REFERENCES public.individuals(id) ON DELETE SET NULL,
  wife_id UUID REFERENCES public.individuals(id) ON DELETE SET NULL,
  marriage_date TEXT,
  marriage_place TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create children table (family members)
CREATE TABLE public.family_children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.individuals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, child_id)
);

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES public.family_trees(id) ON DELETE CASCADE,
  individual_id UUID REFERENCES public.individuals(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.family_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_trees
CREATE POLICY "Users can view their own trees"
  ON public.family_trees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trees"
  ON public.family_trees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trees"
  ON public.family_trees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trees"
  ON public.family_trees FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for individuals
CREATE POLICY "Users can view individuals in their trees"
  ON public.individuals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = individuals.tree_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create individuals in their trees"
  ON public.individuals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = tree_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update individuals in their trees"
  ON public.individuals FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = tree_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete individuals in their trees"
  ON public.individuals FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = tree_id AND user_id = auth.uid()
  ));

-- RLS Policies for families
CREATE POLICY "Users can view families in their trees"
  ON public.families FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = families.tree_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create families in their trees"
  ON public.families FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = tree_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update families in their trees"
  ON public.families FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = tree_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete families in their trees"
  ON public.families FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = tree_id AND user_id = auth.uid()
  ));

-- RLS Policies for family_children
CREATE POLICY "Users can view children in their trees"
  ON public.family_children FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.families f
    JOIN public.family_trees t ON f.tree_id = t.id
    WHERE f.id = family_children.family_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can create children in their trees"
  ON public.family_children FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.families f
    JOIN public.family_trees t ON f.tree_id = t.id
    WHERE f.id = family_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete children in their trees"
  ON public.family_children FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.families f
    JOIN public.family_trees t ON f.tree_id = t.id
    WHERE f.id = family_id AND t.user_id = auth.uid()
  ));

-- RLS Policies for photos
CREATE POLICY "Users can view photos in their trees"
  ON public.photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = photos.tree_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can upload photos to their trees"
  ON public.photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = tree_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete photos from their trees"
  ON public.photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.family_trees
    WHERE id = tree_id AND user_id = auth.uid()
  ));

-- Create storage buckets for photos and GEDCOM files
INSERT INTO storage.buckets (id, name, public) VALUES ('family-photos', 'family-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('gedcom-files', 'gedcom-files', false);

-- Storage policies for family-photos
CREATE POLICY "Users can view their own photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for gedcom-files
CREATE POLICY "Users can view their own GEDCOM files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gedcom-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own GEDCOM files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gedcom-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own GEDCOM files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gedcom-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_family_trees_updated_at
    BEFORE UPDATE ON public.family_trees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_individuals_updated_at
    BEFORE UPDATE ON public.individuals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();