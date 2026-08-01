-- Add the habit period columns referenced by the execution engine.
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS effective_from DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS effective_until DATE;

UPDATE public.habits
SET effective_from = COALESCE(effective_from, created_at::date, CURRENT_DATE);

NOTIFY pgrst, 'reload schema';
