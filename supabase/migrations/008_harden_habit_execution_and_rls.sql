-- Canonical habit execution contract and RLS hardening.

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

DROP POLICY IF EXISTS "Allow all for companies" ON public.companies;
DROP POLICY IF EXISTS "Allow all for batches" ON public.batches;

CREATE POLICY "Authenticated users read companies" ON public.companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage companies" ON public.companies
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users read batches" ON public.batches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage batches" ON public.batches
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS area_category TEXT;

ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS area_category TEXT;

ALTER TABLE public.habit_logs
  ADD COLUMN IF NOT EXISTS completed_count INT DEFAULT 0;

UPDATE public.action_plans
SET quantity = GREATEST(1, COALESCE(quantity, target, 1)),
    area_category = COALESCE(NULLIF(area_category, ''), NULLIF(category, ''), 'Spiritual Growth');

UPDATE public.habits
SET quantity = GREATEST(1, COALESCE(quantity, target, 1)),
    area_category = COALESCE(NULLIF(area_category, ''), NULLIF(category, ''), 'Spiritual Growth');

UPDATE public.habit_logs
SET completed_count = CASE
  WHEN completed THEN GREATEST(1, COALESCE(completed_count, 1))
  ELSE 0
END;

-- Keep the newest habit for each action plan and move its logs before deleting duplicates.
WITH ranked AS (
  SELECT id, action_plan_id,
         FIRST_VALUE(id) OVER (PARTITION BY action_plan_id ORDER BY created_at DESC, id DESC) AS keep_id,
         ROW_NUMBER() OVER (PARTITION BY action_plan_id ORDER BY created_at DESC, id DESC) AS rn
  FROM public.habits
  WHERE action_plan_id IS NOT NULL
)
DELETE FROM public.habit_logs duplicate_log
USING ranked, public.habit_logs kept_log
WHERE ranked.rn > 1
  AND duplicate_log.habit_id = ranked.id
  AND kept_log.habit_id = ranked.keep_id
  AND kept_log.date = duplicate_log.date;

WITH ranked AS (
  SELECT id,
         FIRST_VALUE(id) OVER (PARTITION BY action_plan_id ORDER BY created_at DESC, id DESC) AS keep_id,
         ROW_NUMBER() OVER (PARTITION BY action_plan_id ORDER BY created_at DESC, id DESC) AS rn
  FROM public.habits
  WHERE action_plan_id IS NOT NULL
)
UPDATE public.habit_logs hl
SET habit_id = ranked.keep_id
FROM ranked
WHERE ranked.rn > 1 AND hl.habit_id = ranked.id;

DELETE FROM public.habit_logs a
USING public.habit_logs b
WHERE a.habit_id = b.habit_id
  AND a.date = b.date
  AND a.id < b.id;

DELETE FROM public.habits h
USING (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY action_plan_id ORDER BY created_at DESC, id DESC) AS rn
    FROM public.habits WHERE action_plan_id IS NOT NULL
  ) ranked WHERE rn > 1
) duplicates
WHERE h.id = duplicates.id;

UPDATE public.habits h
SET action_plan_id = NULL
WHERE action_plan_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.action_plans ap WHERE ap.id = h.action_plan_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'habits_action_plan_id_fkey') THEN
    ALTER TABLE public.habits
      ADD CONSTRAINT habits_action_plan_id_fkey
      FOREIGN KEY (action_plan_id) REFERENCES public.action_plans(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS habits_action_plan_id_unique
  ON public.habits(action_plan_id);

CREATE UNIQUE INDEX IF NOT EXISTS monthly_reviews_user_month_unique
  ON public.monthly_reviews(user_id, month_number);

DROP POLICY IF EXISTS "Users can manage their own monthly indicator reports" ON public.monthly_indicator_reports;
CREATE POLICY "Users can manage their own monthly indicator reports"
  ON public.monthly_indicator_reports FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
