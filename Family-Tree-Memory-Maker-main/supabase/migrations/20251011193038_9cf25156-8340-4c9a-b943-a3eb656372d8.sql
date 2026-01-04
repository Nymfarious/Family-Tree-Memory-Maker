-- Fix #2: Add RLS policy to restrict invite validation to valid tokens only
-- This prevents unauthorized access to expired or used invites
CREATE POLICY "Anyone can validate unexpired unused invites"
ON public.temporary_invites
FOR SELECT
USING (
  expires_at > now()
  AND used_at IS NULL
  AND revoked_at IS NULL
);

-- Fix #3: Secure function search_path to prevent SQL injection
-- Use CREATE OR REPLACE to update the function without dropping dependent policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Fix #4: Add missing UPDATE policies for better UX

-- Allow users to update family_children relationships in their trees
CREATE POLICY "Users can update children in their trees"
ON public.family_children
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.families f
    JOIN public.family_trees t ON f.tree_id = t.id
    WHERE f.id = family_children.family_id
    AND t.user_id = auth.uid()
  )
);

-- Allow users to update photo captions in their trees
CREATE POLICY "Users can update photos in their trees"
ON public.photos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.family_trees
    WHERE family_trees.id = photos.tree_id
    AND family_trees.user_id = auth.uid()
  )
);

-- Note: user_roles UPDATE policy intentionally omitted
-- Roles should only be inserted/deleted by admins, never updated