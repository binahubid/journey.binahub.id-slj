-- Migration 027 preflight. Safe to run before the new tables/columns exist.
-- This script is read-only and raises an exception for hard dependencies.

SELECT current_setting('server_version_num')::INT AS server_version_num;

DO $$
DECLARE missing TEXT; missing_columns TEXT;
BEGIN
  SELECT string_agg(required.name, ', ' ORDER BY required.name) INTO missing
  FROM (VALUES
    ('profiles'), ('habits'), ('habit_logs'), ('journals'), ('journeys'),
    ('monthly_indicator_reports'), ('monthly_reviews'), ('baseline_assessments'),
    ('baseline_answers'), ('safar_reminders'), ('support_team'), ('batches')
  ) required(name)
  WHERE to_regclass('public.' || required.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing required tables: %', missing; END IF;

  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'Missing public.is_admin(). Apply migration 001 first.';
  END IF;
  IF to_regprocedure('public.is_coach_of(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Missing public.is_coach_of(uuid). Apply migration 001 first.';
  END IF;

  WITH required(table_name, column_name) AS (VALUES
    ('profiles','user_id'), ('profiles','timezone'), ('profiles','start_date'),
    ('profiles','sahabat_safar_user_id'), ('profiles','coach_id'),
    ('habits','id'), ('habits','user_id'), ('habits','frequency'), ('habits','quantity'),
    ('habits','action_plan_id'), ('habits','source'), ('habits','effective_from'),
    ('habits','effective_until'), ('habits','is_archived'), ('habits','area_category'),
    ('habit_logs','id'), ('habit_logs','habit_id'), ('habit_logs','user_id'),
    ('habit_logs','date'), ('habit_logs','completed'), ('habit_logs','completed_count'),
    ('habit_logs','created_at'), ('journals','id'), ('journals','user_id'),
    ('journals','date'), ('journals','created_at'), ('journals','is_private'),
    ('journeys','id'), ('journeys','user_id'), ('journeys','area_transformasi'),
    ('monthly_indicator_reports','user_id'), ('monthly_indicator_reports','journey_id'),
    ('monthly_indicator_reports','area'), ('monthly_indicator_reports','month_number'),
    ('monthly_indicator_reports','kuantitas_baseline'), ('monthly_indicator_reports','kuantitas_target'),
    ('monthly_indicator_reports','kuantitas_actual'),
    ('monthly_reviews','user_id'), ('monthly_reviews','month_number'),
    ('monthly_reviews','coach_note'), ('monthly_reviews','coach_replied_at')
  )
  SELECT string_agg(required.table_name || '.' || required.column_name, ', ' ORDER BY 1)
  INTO missing_columns
  FROM required LEFT JOIN information_schema.columns c
    ON c.table_schema='public' AND c.table_name=required.table_name AND c.column_name=required.column_name
  WHERE c.column_name IS NULL;
  IF missing_columns IS NOT NULL THEN RAISE EXCEPTION 'Missing required columns: %', missing_columns; END IF;
END $$;

-- Required legacy columns. Missing rows are blockers.
WITH required(table_name, column_name) AS (VALUES
  ('profiles','user_id'), ('profiles','timezone'), ('profiles','start_date'),
  ('profiles','sahabat_safar_user_id'), ('profiles','coach_id'),
  ('habits','id'), ('habits','user_id'), ('habits','frequency'),
  ('habits','quantity'), ('habits','action_plan_id'), ('habits','source'),
  ('habits','effective_from'), ('habits','effective_until'),
  ('habits','is_archived'), ('habits','area_category'),
  ('habit_logs','id'), ('habit_logs','habit_id'), ('habit_logs','user_id'),
  ('habit_logs','date'), ('habit_logs','completed'), ('habit_logs','completed_count'),
  ('habit_logs','created_at'),
  ('journals','id'), ('journals','user_id'), ('journals','date'),
  ('journals','created_at'), ('journals','is_private'),
  ('journeys','id'), ('journeys','user_id'), ('journeys','area_transformasi'),
  ('monthly_indicator_reports','user_id'), ('monthly_indicator_reports','journey_id'),
  ('monthly_indicator_reports','area'), ('monthly_indicator_reports','month_number'),
  ('monthly_reviews','user_id'), ('monthly_reviews','month_number'),
  ('monthly_reviews','coach_note'), ('monthly_reviews','coach_replied_at')
)
SELECT required.*
FROM required
LEFT JOIN information_schema.columns c
  ON c.table_schema='public' AND c.table_name=required.table_name AND c.column_name=required.column_name
WHERE c.column_name IS NULL;

-- Legacy report ownership conflicts. Must return zero rows.
SELECT mir.user_id report_user_id, mir.journey_id, j.user_id journey_user_id, mir.area, mir.month_number
FROM public.monthly_indicator_reports mir
LEFT JOIN public.journeys j ON j.id=mir.journey_id
WHERE mir.journey_id IS NOT NULL AND (j.id IS NULL OR j.user_id IS DISTINCT FROM mir.user_id);

-- Habit logs attached to a habit owned by another user. Must return zero rows.
SELECT hl.id habit_log_id, hl.user_id log_user_id, h.user_id habit_user_id, hl.habit_id
FROM public.habit_logs hl
JOIN public.habits h ON h.id=hl.habit_id
WHERE hl.user_id IS DISTINCT FROM h.user_id;

-- Duplicate legacy daily keys. Migration 006 should already prevent these.
SELECT habit_id, date, COUNT(*) duplicate_count
FROM public.habit_logs
GROUP BY habit_id, date
HAVING COUNT(*) > 1;

-- Conflicting legacy quantity definitions require review before backfill.
SELECT journey_id, area,
  COUNT(DISTINCT ROW(kuantitas_baseline,kuantitas_target)) definition_count
FROM public.monthly_indicator_reports
WHERE journey_id IS NOT NULL
GROUP BY journey_id, area
HAVING COUNT(DISTINCT ROW(kuantitas_baseline,kuantitas_target)) > 1;

-- Existing target objects. These should normally all be null before migration.
SELECT 'ptp_indicators' object_name, to_regclass('public.ptp_indicators') object_regclass
UNION ALL SELECT 'ptp_indicator_actuals', to_regclass('public.ptp_indicator_actuals')
UNION ALL SELECT 'coach_assessments', to_regclass('public.coach_assessments')
UNION ALL SELECT 'coach_assessment_scores', to_regclass('public.coach_assessment_scores')
UNION ALL SELECT 'sahabat_safar_pairing_periods', to_regclass('public.sahabat_safar_pairing_periods');

-- Open lock waits indicate this is not a suitable maintenance window.
SELECT pid, locktype, relation::regclass, mode
FROM pg_locks WHERE NOT granted;
