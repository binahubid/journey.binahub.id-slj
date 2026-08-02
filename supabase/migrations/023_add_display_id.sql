-- ============================================================
-- 023_add_display_id.sql
-- Short numeric ID for participants (6 digits)
-- ============================================================

-- 1. Kolom display_id
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_id TEXT;

-- Unique constraint (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_display_id
  ON public.profiles (display_id)
  WHERE display_id IS NOT NULL;

-- 2. Function: generate random 6-digit ID
CREATE OR REPLACE FUNCTION public.generate_display_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  exists_count INT;
BEGIN
  LOOP
    new_id := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_count FROM public.profiles WHERE display_id = new_id;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN new_id;
END;
$$;

-- 3. Trigger: auto-assign display_id on new profile
CREATE OR REPLACE FUNCTION public.set_profile_display_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := public.generate_display_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_display_id ON public.profiles;
CREATE TRIGGER trg_set_display_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profile_display_id();

-- 4. Backfill existing users who don't have display_id
DO $$
DECLARE
  rec RECORD;
  new_id TEXT;
BEGIN
  FOR rec IN SELECT user_id FROM public.profiles WHERE display_id IS NULL LOOP
    new_id := public.generate_display_id();
    UPDATE public.profiles SET display_id = new_id WHERE user_id = rec.user_id;
  END LOOP;
END;
$$;
