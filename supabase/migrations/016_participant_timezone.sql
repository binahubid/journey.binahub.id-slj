-- Canonical timezone for participant-local daily reset.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta';

UPDATE public.profiles
SET timezone = CASE
  WHEN timezone IN ('WIB', 'Auto', '') THEN 'Asia/Jakarta'
  WHEN timezone = 'WITA' THEN 'Asia/Makassar'
  WHEN timezone = 'WIT' THEN 'Asia/Jayapura'
  ELSE timezone
END;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_timezone_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_timezone_check CHECK (
    timezone IN ('Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura')
  );
