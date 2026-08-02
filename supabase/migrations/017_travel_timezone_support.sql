-- Support participant travel outside Indonesia while keeping explicit override.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone_mode TEXT NOT NULL DEFAULT 'AUTO';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_timezone_check;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_timezone_mode_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_timezone_mode_check CHECK (
    timezone_mode IN ('AUTO', 'MANUAL')
  );

UPDATE public.profiles
SET timezone_mode = 'AUTO'
WHERE timezone_mode IS NULL OR timezone_mode NOT IN ('AUTO', 'MANUAL');

-- timezone stores the latest valid IANA timezone. Browser clients update it
-- when AUTO mode detects travel; MANUAL mode keeps the selected value.
