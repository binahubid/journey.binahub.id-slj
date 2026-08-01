-- ====================================================================
-- 005_create_sahabat_safar_profiles.sql
-- Membuat tabel `sahabat_safar_profiles` untuk menyimpan instrumen
-- profil Sahabat Safar dari Initial Process.
--
-- JALANKAN DI: Supabase Dashboard → SQL Editor
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.sahabat_safar_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  layer1 JSONB DEFAULT '{}'::jsonb,
  layer2 JSONB DEFAULT '{}'::jsonb,
  layer3 JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.sahabat_safar_profiles ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- RLS Policies
DROP POLICY IF EXISTS "Users manage own sahabat_safar_profile" ON public.sahabat_safar_profiles;
CREATE POLICY "Users manage own sahabat_safar_profile" ON public.sahabat_safar_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin view all sahabat_safar_profile" ON public.sahabat_safar_profiles;
CREATE POLICY "Admin view all sahabat_safar_profile" ON public.sahabat_safar_profiles
  FOR SELECT USING (public.is_admin());
