-- Unify admin authorization between Supabase Auth app_metadata and profiles.role.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = auth.uid()
        AND lower(role::TEXT) = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Synchronize all trusted Auth app_metadata roles into public profiles.
-- This covers the supplied admin UUID and future accounts provisioned by Auth admin.
INSERT INTO public.profiles (user_id, full_name, role)
SELECT
  u.id,
  COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1), 'Administrator'),
  CASE
    WHEN u.raw_app_meta_data ->> 'role' = 'admin' THEN 'admin'::user_role
    WHEN u.raw_app_meta_data ->> 'role' = 'coach' THEN 'coach'::user_role
    ELSE 'participant'::user_role
  END
FROM auth.users u
WHERE u.raw_app_meta_data ->> 'role' IN ('admin', 'coach')
ON CONFLICT (user_id) DO UPDATE
SET role = EXCLUDED.role,
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name);

-- Explicitly guarantee the known BinaHub admin is synchronized.
UPDATE public.profiles
SET role = 'admin'::user_role
WHERE user_id = 'fe5a092d-1457-4783-b068-c8291387a028'::UUID;

-- Ensure the row exists even if the generic synchronization was skipped.
INSERT INTO public.profiles (user_id, full_name, role)
SELECT id, COALESCE(split_part(email, '@', 1), 'Administrator'), 'admin'::user_role
FROM auth.users
WHERE id = 'fe5a092d-1457-4783-b068-c8291387a028'::UUID
ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::user_role;

NOTIFY pgrst, 'reload schema';
