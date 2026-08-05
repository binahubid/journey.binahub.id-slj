-- Methodology v1.0: additive, repeatable assessment and impact reporting.
-- This migration is deliberately not a deployment script. Apply it through the
-- normal Supabase migration process, then reload PostgREST.

BEGIN;

ALTER TABLE public.monthly_indicator_reports
  ADD COLUMN IF NOT EXISTS indicator_key TEXT,
  ADD COLUMN IF NOT EXISTS indicator_type TEXT,
  ADD COLUMN IF NOT EXISTS indicator_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS indicator_direction TEXT,
  ADD COLUMN IF NOT EXISTS indicator_baseline NUMERIC,
  ADD COLUMN IF NOT EXISTS indicator_target NUMERIC,
  ADD COLUMN IF NOT EXISTS indicator_actual NUMERIC,
  ADD COLUMN IF NOT EXISTS indicator_unit TEXT;

-- Canonical execution metadata. Legacy columns remain available to existing
-- clients; triggers keep the additive columns authoritative for reporting.
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS frequency_kind TEXT NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS custom_schedule JSONB,
  ADD COLUMN IF NOT EXISTS sync_source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS sync_key TEXT;

UPDATE public.habits
SET frequency_kind = CASE
  WHEN LOWER(BTRIM(frequency)) IN ('daily', 'setiap hari', 'harian') THEN 'daily'
  WHEN LOWER(BTRIM(frequency)) = 'weekly' OR LOWER(BTRIM(frequency)) LIKE '%minggu%' THEN 'weekly'
  ELSE 'custom'
END,
sync_source = CASE
  WHEN action_plan_id IS NOT NULL THEN 'action_plan'
  WHEN COALESCE(NULLIF(BTRIM(source), ''), 'manual') = 'action_plan' THEN 'action_plan'
  WHEN COALESCE(NULLIF(BTRIM(source), ''), 'manual') = 'manual' THEN 'manual'
  ELSE 'import'
END,
sync_key = COALESCE(sync_key, CASE WHEN action_plan_id IS NOT NULL THEN action_plan_id::TEXT END);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'habits_frequency_kind_check') THEN
    ALTER TABLE public.habits ADD CONSTRAINT habits_frequency_kind_check
      CHECK (frequency_kind IN ('daily', 'weekly', 'custom')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'habits_sync_source_check') THEN
    ALTER TABLE public.habits ADD CONSTRAINT habits_sync_source_check
      CHECK (sync_source IN ('manual', 'action_plan', 'system', 'import')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'habits_custom_schedule_check') THEN
    ALTER TABLE public.habits ADD CONSTRAINT habits_custom_schedule_check
      CHECK (frequency_kind <> 'custom' OR custom_schedule IS NULL OR jsonb_typeof(custom_schedule) = 'object') NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS habits_sync_identity_unique
  ON public.habits (user_id, sync_source, sync_key) WHERE sync_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.canonicalize_habit_metadata()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.frequency_kind := CASE
    WHEN LOWER(BTRIM(NEW.frequency)) IN ('daily', 'setiap hari', 'harian') THEN 'daily'
    WHEN LOWER(BTRIM(NEW.frequency)) = 'weekly' OR LOWER(BTRIM(NEW.frequency)) LIKE '%minggu%' THEN 'weekly'
    ELSE 'custom'
  END;
  IF NEW.frequency_kind NOT IN ('daily', 'weekly', 'custom') THEN
    RAISE EXCEPTION 'Frekuensi habit harus daily, weekly, atau custom.';
  END IF;
  IF NEW.action_plan_id IS NOT NULL THEN
    NEW.sync_source := 'action_plan';
    NEW.sync_key := NEW.action_plan_id::TEXT;
  ELSE
    NEW.sync_source := CASE WHEN NEW.sync_source IN ('manual', 'system', 'import') THEN NEW.sync_source ELSE 'manual' END;
    NEW.sync_key := NULLIF(BTRIM(NEW.sync_key), '');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS canonicalize_habit_metadata_trigger ON public.habits;
CREATE TRIGGER canonicalize_habit_metadata_trigger
  BEFORE INSERT OR UPDATE OF frequency, frequency_kind, action_plan_id, sync_source, sync_key
  ON public.habits FOR EACH ROW EXECUTE FUNCTION public.canonicalize_habit_metadata();

ALTER TABLE public.habit_logs
  ADD COLUMN IF NOT EXISTS activity_date DATE,
  ADD COLUMN IF NOT EXISTS occurrence_start DATE,
  ADD COLUMN IF NOT EXISTS is_canonical_occurrence BOOLEAN NOT NULL DEFAULT TRUE;

-- Existing triggers/indexes from a prior application must not interfere with
-- the repeatable canonical backfill below.
DROP TRIGGER IF EXISTS canonicalize_habit_log_occurrence_trigger ON public.habit_logs;
DROP INDEX IF EXISTS public.habit_logs_occurrence_identity_unique;

WITH canonicalized AS (
  SELECT hl.id, hl.date::DATE activity_date,
    CASE WHEN h.frequency_kind = 'weekly' THEN date_trunc('week', hl.date::DATE::TIMESTAMP)::DATE ELSE hl.date::DATE END occurrence_start,
    ROW_NUMBER() OVER (
      PARTITION BY hl.habit_id, CASE WHEN h.frequency_kind = 'weekly' THEN date_trunc('week', hl.date::DATE::TIMESTAMP)::DATE ELSE hl.date::DATE END
      ORDER BY
        (hl.date::DATE = CASE WHEN h.frequency_kind = 'weekly' THEN date_trunc('week', hl.date::DATE::TIMESTAMP)::DATE ELSE hl.date::DATE END) DESC,
        hl.created_at DESC,
        hl.id DESC
    ) = 1 is_canonical
  FROM public.habit_logs hl JOIN public.habits h ON h.id = hl.habit_id
)
UPDATE public.habit_logs hl
SET activity_date = COALESCE(hl.activity_date, c.activity_date),
    occurrence_start = COALESCE(hl.occurrence_start, c.occurrence_start),
    is_canonical_occurrence = c.is_canonical,
    date = CASE WHEN c.is_canonical THEN c.occurrence_start::TEXT ELSE hl.date END
FROM canonicalized c
WHERE c.id = hl.id;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'habit_logs_occurrence_dates_check') THEN
    ALTER TABLE public.habit_logs ADD CONSTRAINT habit_logs_occurrence_dates_check
      CHECK (activity_date IS NOT NULL AND occurrence_start IS NOT NULL AND occurrence_start <= activity_date) NOT VALID;
  END IF;
END $$;

-- Deduplicate legacy canonical rows before creating the unique index.
-- Keep only the most recent canonical log per (habit_id, occurrence_start).
WITH duplicates AS (
  SELECT hl.id,
    ROW_NUMBER() OVER (
      PARTITION BY hl.habit_id, hl.occurrence_start
      ORDER BY hl.created_at DESC, hl.id DESC
    ) rn
  FROM public.habit_logs hl
  WHERE hl.is_canonical_occurrence
)
UPDATE public.habit_logs hl SET is_canonical_occurrence = FALSE
FROM duplicates d WHERE d.id = hl.id AND d.rn > 1;

-- Fails safely on ambiguous persisted duplicates rather than deleting evidence.
CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_occurrence_identity_unique
  ON public.habit_logs (habit_id, occurrence_start) WHERE is_canonical_occurrence;

CREATE OR REPLACE FUNCTION public.canonicalize_habit_log_occurrence()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE canonical_frequency TEXT; habit_owner UUID;
BEGIN
  SELECT h.frequency_kind, h.user_id INTO canonical_frequency, habit_owner
  FROM public.habits h WHERE h.id = NEW.habit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit tidak ditemukan.';
  END IF;
  IF NEW.user_id IS DISTINCT FROM habit_owner THEN
    RAISE EXCEPTION 'Pemilik habit log tidak sesuai dengan pemilik habit.' USING ERRCODE = '42501';
  END IF;
  NEW.activity_date := COALESCE(NEW.activity_date, NEW.date::DATE);
  NEW.occurrence_start := CASE
    WHEN canonical_frequency = 'weekly' THEN date_trunc('week', NEW.activity_date::TIMESTAMP)::DATE
    ELSE NEW.activity_date
  END;
  -- date remains the legacy conflict key; weekly writes use their Monday key.
  NEW.date := NEW.occurrence_start::TEXT;
  NEW.is_canonical_occurrence := TRUE;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS canonicalize_habit_log_occurrence_trigger ON public.habit_logs;
CREATE TRIGGER canonicalize_habit_log_occurrence_trigger
  BEFORE INSERT OR UPDATE OF habit_id, date, activity_date, occurrence_start
  ON public.habit_logs FOR EACH ROW EXECUTE FUNCTION public.canonicalize_habit_log_occurrence();

ALTER TABLE public.journals
  ADD COLUMN IF NOT EXISTS activity_date DATE,
  ADD COLUMN IF NOT EXISTS is_canonical_day BOOLEAN NOT NULL DEFAULT TRUE;
DROP TRIGGER IF EXISTS canonicalize_journal_activity_date_trigger ON public.journals;
DROP INDEX IF EXISTS public.journals_user_activity_date_unique;
WITH canonicalized AS (
  SELECT id, date::DATE activity_date,
    ROW_NUMBER() OVER (PARTITION BY user_id, date::DATE ORDER BY created_at DESC, id DESC) = 1 is_canonical
  FROM public.journals
)
UPDATE public.journals j
SET activity_date = COALESCE(j.activity_date, c.activity_date), is_canonical_day = c.is_canonical
FROM canonicalized c WHERE c.id = j.id;
CREATE UNIQUE INDEX IF NOT EXISTS journals_user_activity_date_unique
  ON public.journals (user_id, activity_date) WHERE is_canonical_day;

CREATE OR REPLACE FUNCTION public.canonicalize_journal_activity_date()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.activity_date := COALESCE(NEW.activity_date, NEW.date::DATE);
  NEW.date := NEW.activity_date::TEXT;
  NEW.is_canonical_day := TRUE;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS canonicalize_journal_activity_date_trigger ON public.journals;
CREATE TRIGGER canonicalize_journal_activity_date_trigger
  BEFORE INSERT OR UPDATE OF date, activity_date ON public.journals
  FOR EACH ROW EXECUTE FUNCTION public.canonicalize_journal_activity_date();

ALTER TABLE public.monthly_reviews
  ADD COLUMN IF NOT EXISTS first_submitted_at TIMESTAMPTZ;
UPDATE public.monthly_reviews
SET first_submitted_at = COALESCE(first_submitted_at, created_at)
WHERE first_submitted_at IS NULL;

CREATE OR REPLACE FUNCTION public.protect_monthly_review_evidence()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.first_submitted_at := NOW();
    IF auth.uid() = NEW.user_id THEN
      NEW.coach_note := NULL;
      NEW.coach_replied_at := NULL;
    END IF;
  ELSE
    NEW.first_submitted_at := OLD.first_submitted_at;
    IF auth.uid() = NEW.user_id THEN
      IF NEW.user_id IS DISTINCT FROM OLD.user_id
         OR NEW.coach_note IS DISTINCT FROM OLD.coach_note
         OR NEW.coach_replied_at IS DISTINCT FROM OLD.coach_replied_at THEN
        RAISE EXCEPTION 'Peserta tidak dapat mengubah field tanggapan coach.' USING ERRCODE = '42501';
      END IF;
    ELSIF auth.uid() IS NOT NULL THEN
      IF NEW.user_id IS DISTINCT FROM OLD.user_id
         OR NEW.month_number IS DISTINCT FROM OLD.month_number
         OR NEW.status IS DISTINCT FROM OLD.status
         OR NEW.participant_note IS DISTINCT FROM OLD.participant_note
         OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Coach tidak dapat mengubah bukti checkpoint peserta.' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_monthly_review_evidence_trigger ON public.monthly_reviews;
CREATE TRIGGER protect_monthly_review_evidence_trigger
  BEFORE INSERT OR UPDATE ON public.monthly_reviews
  FOR EACH ROW EXECUTE FUNCTION public.protect_monthly_review_evidence();

-- Use the participant's local, unbounded program day. In particular, month 3
-- closes after local program day 97 rather than remaining open indefinitely.
CREATE OR REPLACE FUNCTION public.enforce_monthly_review_window()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE program_day INT; start_day INT; grace_end_day INT; participant_timezone TEXT; participant_start DATE;
BEGIN
  IF NEW.user_id <> auth.uid() THEN RETURN NEW; END IF;
  SELECT COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'), p.start_date::DATE
    INTO participant_timezone, participant_start FROM public.profiles p WHERE p.user_id = NEW.user_id;
  program_day := ((NOW() AT TIME ZONE participant_timezone)::DATE - COALESCE(participant_start, (NOW() AT TIME ZONE participant_timezone)::DATE)) + 1;
  start_day := ((NEW.month_number - 1) * 30) + 1;
  grace_end_day := (NEW.month_number * 30) + 7;
  IF NEW.month_number NOT BETWEEN 1 AND 3 OR program_day < start_day OR program_day > grace_end_day THEN
    RAISE EXCEPTION 'Checkpoint month % is not editable on local program day %', NEW.month_number, program_day;
  END IF;
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'monthly_indicator_reports_indicator_type_check') THEN
    ALTER TABLE public.monthly_indicator_reports ADD CONSTRAINT monthly_indicator_reports_indicator_type_check
      CHECK (indicator_type IS NULL OR indicator_type IN ('quality', 'quantity', 'time', 'cost')) NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ptp_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  indicator_key TEXT NOT NULL,
  indicator_type TEXT NOT NULL DEFAULT 'quantity' CHECK (indicator_type IN ('quality', 'quantity', 'time', 'cost')),
  label TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  direction TEXT NOT NULL DEFAULT 'higher_is_better' CHECK (direction IN ('higher_is_better', 'lower_is_better')),
  baseline_value NUMERIC,
  target_value NUMERIC,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (journey_id, area, indicator_key)
);

ALTER TABLE public.ptp_indicators
  ALTER COLUMN baseline_value DROP NOT NULL,
  ALTER COLUMN baseline_value DROP DEFAULT,
  ALTER COLUMN target_value DROP NOT NULL,
  ALTER COLUMN target_value DROP DEFAULT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ptp_indicators_indicator_type_check') THEN
    ALTER TABLE public.ptp_indicators ADD CONSTRAINT ptp_indicators_indicator_type_check
      CHECK (indicator_type IN ('quality', 'quantity', 'time', 'cost')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ptp_indicators_direction_check') THEN
    ALTER TABLE public.ptp_indicators ADD CONSTRAINT ptp_indicators_direction_check
      CHECK (direction IN ('higher_is_better', 'lower_is_better')) NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.sahabat_safar_pairing_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unpaired_at TIMESTAMPTZ,
  period_source TEXT NOT NULL DEFAULT 'recorded' CHECK (period_source IN ('recorded', 'legacy_estimate')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id <> partner_user_id),
  CHECK (unpaired_at IS NULL OR unpaired_at >= paired_at)
);
CREATE INDEX IF NOT EXISTS sahabat_safar_pairing_periods_user_idx
  ON public.sahabat_safar_pairing_periods (user_id, paired_at);

CREATE OR REPLACE FUNCTION public.validate_ptp_indicator()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE active_count INT; duplicate_type INT;
BEGIN
  IF NEW.indicator_type NOT IN ('quality', 'quantity', 'time', 'cost') THEN RAISE EXCEPTION 'Invalid indicator type'; END IF;
  IF NEW.direction NOT IN ('higher_is_better', 'lower_is_better') THEN RAISE EXCEPTION 'Invalid indicator direction'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.journeys j WHERE j.id = NEW.journey_id AND j.user_id = NEW.participant_user_id) THEN
    RAISE EXCEPTION 'Indicator journey does not belong to participant';
  END IF;
  IF NEW.active THEN
    IF NEW.baseline_value IS NULL OR NEW.target_value IS NULL OR NEW.baseline_value = NEW.target_value
       OR NULLIF(BTRIM(NEW.unit), '') IS NULL THEN
      RAISE EXCEPTION '% - %: baseline, target, and unit must be complete and baseline must differ from target', NEW.area, NEW.label;
    END IF;
    IF NEW.baseline_value < 0 OR NEW.target_value < 0 THEN
      RAISE EXCEPTION '% - %: baseline and target cannot be negative', NEW.area, NEW.label;
    END IF;
    IF (NEW.direction = 'higher_is_better' AND NEW.target_value <= NEW.baseline_value)
       OR (NEW.direction = 'lower_is_better' AND NEW.target_value >= NEW.baseline_value) THEN
      RAISE EXCEPTION '% - %: target tidak sesuai dengan arah indikator', NEW.area, NEW.label;
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.journey_id::TEXT || ':' || NEW.area, 0));
    SELECT COUNT(*) INTO active_count FROM public.ptp_indicators
      WHERE journey_id = NEW.journey_id AND area = NEW.area AND active AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    IF active_count >= 4 THEN RAISE EXCEPTION '%: maximum four active indicators allowed', NEW.area; END IF;
    SELECT COUNT(*) INTO duplicate_type FROM public.ptp_indicators
      WHERE journey_id = NEW.journey_id AND area = NEW.area AND active AND indicator_type = NEW.indicator_type AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    IF duplicate_type > 0 THEN RAISE EXCEPTION '%: active indicator type % already exists', NEW.area, NEW.indicator_type; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_ptp_indicator_trigger ON public.ptp_indicators;

CREATE TABLE IF NOT EXISTS public.ptp_indicator_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES public.ptp_indicators(id) ON DELETE CASCADE,
  participant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  month_number INT NOT NULL CHECK (month_number BETWEEN 1 AND 3),
  actual_value NUMERIC NOT NULL,
  evidence_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (indicator_id, month_number)
);

CREATE OR REPLACE FUNCTION public.validate_ptp_indicator_actual()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.ptp_indicators pi
    WHERE pi.id = NEW.indicator_id
      AND pi.participant_user_id = NEW.participant_user_id
      AND pi.journey_id = NEW.journey_id
  ) THEN
    RAISE EXCEPTION 'Indicator does not belong to participant' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_ptp_indicator_actual_trigger ON public.ptp_indicator_actuals;
CREATE TRIGGER validate_ptp_indicator_actual_trigger BEFORE INSERT OR UPDATE ON public.ptp_indicator_actuals
  FOR EACH ROW EXECUTE FUNCTION public.validate_ptp_indicator_actual();

-- Normalize only definitions with real baseline, target, and unit. Incomplete legacy
-- quality/time/cost fields remain untouched in monthly_indicator_reports.
INSERT INTO public.ptp_indicators (participant_user_id, journey_id, area, indicator_key, indicator_type, label, active, direction, baseline_value, target_value, unit)
SELECT DISTINCT ON (source.journey_id, source.area, source.indicator_type)
  source.user_id, source.journey_id, source.area, source.indicator_key, source.indicator_type,
  source.label, true, source.direction, source.baseline_value, source.target_value, source.unit
FROM (
  SELECT j.user_id, mir.journey_id, mir.area, COALESCE(NULLIF(BTRIM(mir.indicator_key), ''), 'legacy:' || mir.indicator_type || ':' || lower(regexp_replace(mir.area, '[[:space:]]+', '-', 'g'))) indicator_key,
    mir.indicator_type, COALESCE(NULLIF(BTRIM(mir.indicator_key), ''), mir.area || ' - ' || mir.indicator_type) label,
    COALESCE(mir.indicator_direction, CASE WHEN mir.indicator_type IN ('time', 'cost') THEN 'lower_is_better' ELSE 'higher_is_better' END) direction,
    mir.indicator_baseline baseline_value, mir.indicator_target target_value, NULLIF(BTRIM(mir.indicator_unit), '') unit
  FROM public.monthly_indicator_reports mir
  JOIN public.journeys j ON j.id = mir.journey_id AND j.user_id = mir.user_id
  WHERE mir.indicator_type IN ('quality', 'quantity', 'time', 'cost')
  UNION ALL
  SELECT j.user_id, mir.journey_id, mir.area,
    'legacy:quantity:' || lower(regexp_replace(mir.area, '[[:space:]]+', '-', 'g')), 'quantity', mir.area || ' - quantity',
    'higher_is_better', mir.kuantitas_baseline, mir.kuantitas_target, 'legacy quantity (unit unspecified)'
  FROM public.monthly_indicator_reports mir
  JOIN public.journeys j ON j.id = mir.journey_id AND j.user_id = mir.user_id
) source
WHERE source.journey_id IS NOT NULL AND source.indicator_key IS NOT NULL
  AND source.baseline_value IS NOT NULL AND source.target_value IS NOT NULL
  AND source.baseline_value <> source.target_value AND source.baseline_value >= 0 AND source.target_value >= 0
  AND ((source.direction = 'higher_is_better' AND source.target_value > source.baseline_value)
    OR (source.direction = 'lower_is_better' AND source.target_value < source.baseline_value))
  AND source.unit IS NOT NULL
ORDER BY source.journey_id, source.area, source.indicator_type, source.indicator_key
ON CONFLICT (journey_id, area, indicator_key) DO NOTHING;

INSERT INTO public.ptp_indicator_actuals (indicator_id, participant_user_id, journey_id, month_number, actual_value, evidence_note)
SELECT pi.id, pi.participant_user_id, pi.journey_id, mir.month_number,
  COALESCE(mir.indicator_actual, mir.kuantitas_actual), NULL
FROM public.monthly_indicator_reports mir
JOIN public.ptp_indicators pi ON pi.journey_id = mir.journey_id AND pi.area = mir.area
  AND pi.indicator_key = COALESCE(
    NULLIF(BTRIM(mir.indicator_key), ''),
    'legacy:' || COALESCE(mir.indicator_type, 'quantity') || ':' || lower(regexp_replace(mir.area, '[[:space:]]+', '-', 'g'))
  )
WHERE COALESCE(mir.indicator_actual, mir.kuantitas_actual) IS NOT NULL
ON CONFLICT (indicator_id, month_number) DO NOTHING;

CREATE TRIGGER validate_ptp_indicator_trigger BEFORE INSERT OR UPDATE ON public.ptp_indicators
  FOR EACH ROW EXECUTE FUNCTION public.validate_ptp_indicator();

CREATE TABLE IF NOT EXISTS public.coach_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  coach_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_outcome NUMERIC CHECK (participant_outcome BETWEEN 0 AND 100),
  coach_score NUMERIC CHECK (coach_score BETWEEN 0 AND 100),
  validated_outcome NUMERIC CHECK (validated_outcome BETWEEN 0 AND 100),
  validation_status TEXT NOT NULL DEFAULT 'BELUM_DITINJAU' CHECK (validation_status IN ('BELUM_DITINJAU', 'TERVERIFIKASI', 'PERLU_KLARIFIKASI', 'TIDAK_DAPAT_DIVERIFIKASI')),
  evidence_note TEXT,
  methodology_version TEXT NOT NULL DEFAULT '1.0',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_user_id, journey_id)
);

CREATE TABLE IF NOT EXISTS public.coach_assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.coach_assessments(id) ON DELETE CASCADE,
  rubric_key TEXT NOT NULL,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, rubric_key)
);

CREATE OR REPLACE FUNCTION public.protect_reviewed_ptp_indicator_actual()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  participant_id UUID := CASE WHEN TG_OP='DELETE' THEN OLD.participant_user_id ELSE NEW.participant_user_id END;
  participant_journey_id UUID := CASE WHEN TG_OP='DELETE' THEN OLD.journey_id ELSE NEW.journey_id END;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.coach_assessments ca
    WHERE ca.participant_user_id=participant_id
      AND ca.journey_id=participant_journey_id
      AND ca.reviewed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Bukti indikator terkunci setelah assessment coach disimpan.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS protect_reviewed_ptp_indicator_actual_trigger ON public.ptp_indicator_actuals;
CREATE TRIGGER protect_reviewed_ptp_indicator_actual_trigger
  BEFORE UPDATE OR DELETE ON public.ptp_indicator_actuals
  FOR EACH ROW EXECUTE FUNCTION public.protect_reviewed_ptp_indicator_actual();

ALTER TABLE public.ptp_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ptp_indicator_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sahabat_safar_pairing_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participant manages own PTP indicators" ON public.ptp_indicators;
CREATE POLICY "Participant manages own PTP indicators" ON public.ptp_indicators FOR ALL TO authenticated USING (auth.uid() = participant_user_id) WITH CHECK (auth.uid() = participant_user_id);
DROP POLICY IF EXISTS "Coach and admin read PTP indicators" ON public.ptp_indicators;
CREATE POLICY "Coach and admin read PTP indicators" ON public.ptp_indicators FOR SELECT TO authenticated USING (public.is_coach_of(participant_user_id) OR public.is_admin());
DROP POLICY IF EXISTS "Participant manages own indicator actuals" ON public.ptp_indicator_actuals;
CREATE POLICY "Participant manages own indicator actuals" ON public.ptp_indicator_actuals FOR ALL TO authenticated USING (auth.uid() = participant_user_id) WITH CHECK (auth.uid() = participant_user_id);
DROP POLICY IF EXISTS "Coach and admin read indicator actuals" ON public.ptp_indicator_actuals;
CREATE POLICY "Coach and admin read indicator actuals" ON public.ptp_indicator_actuals FOR SELECT TO authenticated USING (public.is_coach_of(participant_user_id) OR public.is_admin());

DROP POLICY IF EXISTS "Assigned coach reads assessments" ON public.coach_assessments;
CREATE POLICY "Assigned coach reads assessments" ON public.coach_assessments FOR SELECT TO authenticated USING (auth.uid() = participant_user_id OR public.is_coach_of(participant_user_id) OR public.is_admin());
DROP POLICY IF EXISTS "Assigned coach inserts assessments" ON public.coach_assessments;
DROP POLICY IF EXISTS "Assigned coach updates assessments" ON public.coach_assessments;
DROP POLICY IF EXISTS "Assessment owner reads scores" ON public.coach_assessment_scores;
CREATE POLICY "Assessment owner reads scores" ON public.coach_assessment_scores FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.coach_assessments a WHERE a.id = assessment_id AND (auth.uid() = a.participant_user_id OR public.is_coach_of(a.participant_user_id) OR public.is_admin())));
DROP POLICY IF EXISTS "Assigned coach manages scores" ON public.coach_assessment_scores;

DROP POLICY IF EXISTS "Related users and authorized staff read pairing periods" ON public.sahabat_safar_pairing_periods;
CREATE POLICY "Related users and authorized staff read pairing periods" ON public.sahabat_safar_pairing_periods FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = partner_user_id OR public.is_coach_of(user_id) OR public.is_admin());

CREATE OR REPLACE FUNCTION public.record_sahabat_safar_pairing_period()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Kolom pairing hanya dapat diubah melalui kontrol admin.' USING ERRCODE = '42501';
  END IF;
  IF OLD.sahabat_safar_user_id IS DISTINCT FROM NEW.sahabat_safar_user_id THEN
    UPDATE public.sahabat_safar_pairing_periods SET unpaired_at = NOW()
      WHERE user_id = NEW.user_id AND unpaired_at IS NULL;
    IF NEW.sahabat_safar_user_id IS NOT NULL THEN
      INSERT INTO public.sahabat_safar_pairing_periods (user_id, partner_user_id, paired_at)
      VALUES (NEW.user_id, NEW.sahabat_safar_user_id, NOW());
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS record_sahabat_safar_pairing_period_trigger ON public.profiles;
CREATE TRIGGER record_sahabat_safar_pairing_period_trigger AFTER UPDATE OF sahabat_safar_user_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.record_sahabat_safar_pairing_period();

-- Required read-through for the reporting RPC and the coach workspace.
DROP POLICY IF EXISTS "Assigned coach reads monthly indicator reports" ON public.monthly_indicator_reports;
CREATE POLICY "Assigned coach reads monthly indicator reports" ON public.monthly_indicator_reports FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_coach_of(user_id) OR public.is_admin());
DROP POLICY IF EXISTS "Assigned coach reads baseline assessments" ON public.baseline_assessments;
CREATE POLICY "Assigned coach reads baseline assessments" ON public.baseline_assessments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_coach_of(user_id) OR public.is_admin());
DROP POLICY IF EXISTS "Assigned coach reads baseline answers" ON public.baseline_answers;
CREATE POLICY "Assigned coach reads baseline answers" ON public.baseline_answers FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_coach_of(user_id) OR public.is_admin());
DROP POLICY IF EXISTS "Assigned coach reads habits" ON public.habits;
CREATE POLICY "Assigned coach reads habits" ON public.habits FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_coach_of(user_id) OR public.is_admin());
DROP POLICY IF EXISTS "Assigned coach reads habit logs" ON public.habit_logs;
CREATE POLICY "Assigned coach reads habit logs" ON public.habit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_coach_of(user_id) OR public.is_admin());
DROP POLICY IF EXISTS "Assigned coach reads journals" ON public.journals;
CREATE POLICY "Assigned coach reads journals" ON public.journals FOR SELECT TO authenticated USING (auth.uid() = user_id OR (is_private = false AND (public.is_coach_of(user_id) OR public.is_admin())));
DROP POLICY IF EXISTS "Coach view and update monthly reviews" ON public.monthly_reviews;
DROP POLICY IF EXISTS "Coach and admin view/update monthly reviews" ON public.monthly_reviews;
DROP POLICY IF EXISTS "Assigned coach reads monthly reviews" ON public.monthly_reviews;
CREATE POLICY "Assigned coach reads monthly reviews" ON public.monthly_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_coach_of(user_id) OR public.is_admin());
DROP POLICY IF EXISTS "Assigned coach reads support team" ON public.support_team;
CREATE POLICY "Assigned coach reads support team" ON public.support_team FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_coach_of(user_id) OR public.is_admin());
DROP POLICY IF EXISTS "Assigned coach reads safar reminders" ON public.safar_reminders;
CREATE POLICY "Assigned coach reads safar reminders" ON public.safar_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_coach_of(user_id) OR public.is_admin());

DROP FUNCTION IF EXISTS public.save_monthly_review_coach_note(UUID,INT,TEXT);
CREATE FUNCTION public.save_monthly_review_coach_note(p_participant_user_id UUID, p_month_number INT, p_coach_note TEXT)
RETURNS public.monthly_reviews LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE review public.monthly_reviews%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_coach_of(p_participant_user_id) THEN
    RAISE EXCEPTION 'Coach tidak ditugaskan kepada peserta ini.' USING ERRCODE = '42501';
  END IF;
  IF p_month_number NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Nomor checkpoint tidak valid.'; END IF;
  UPDATE public.monthly_reviews
  SET coach_note = NULLIF(BTRIM(p_coach_note), ''), coach_replied_at = NOW()
  WHERE user_id = p_participant_user_id AND month_number = p_month_number
  RETURNING * INTO review;
  IF review.id IS NULL THEN RAISE EXCEPTION 'Checkpoint peserta belum disubmit.'; END IF;
  RETURN review;
END $$;

-- One participant is the atomic reporting contract. Null score means no evidence,
-- never zero performance. Execution includes missing rows as failed occurrences.
DROP FUNCTION IF EXISTS public.get_participant_assessment(UUID);
CREATE FUNCTION public.get_participant_assessment(p_participant_user_id UUID DEFAULT auth.uid()) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_variable
DECLARE j public.journeys%ROWTYPE; p public.profiles%ROWTYPE; start_date DATE; program_end_date DATE; data_cutoff_date DATE; local_date DATE; participant_timezone TEXT; active_indicators INT := 0; measured_indicators INT := 0; outcome NUMERIC; indicator_data JSONB := '[]'; outcome_areas JSONB := '[]'; execution_areas JSONB := '[]'; measured_execution_areas INT := 0; execution NUMERIC; scheduled NUMERIC := 0; completed NUMERIC := 0; unsupported_habits INT := 0; weeks INT := 0; supported_weeks INT := 0; pairing_complete BOOLEAN := true; journal_days INT := 0; journal_total_days INT := 0; checkpoint_due INT := 0; checkpoint_submitted INT := 0; checkpoint_on_time INT := 0; checkpoint_data JSONB := '[]'; baseline_areas JSONB := '[]'; baseline_score NUMERIC; assessment JSONB; BEGIN
  IF p_participant_user_id <> auth.uid() AND NOT public.is_admin() AND NOT public.is_coach_of(p_participant_user_id) THEN RAISE EXCEPTION 'Akses assessment ditolak.' USING ERRCODE='42501'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id=p_participant_user_id; SELECT * INTO j FROM public.journeys WHERE user_id=p_participant_user_id ORDER BY created_at DESC, id DESC LIMIT 1;
  IF p.user_id IS NULL OR j.id IS NULL THEN RAISE EXCEPTION 'Peserta atau journey tidak ditemukan.'; END IF;
  participant_timezone := COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta');
  local_date := (NOW() AT TIME ZONE participant_timezone)::DATE;
  start_date := COALESCE(p.start_date::DATE, j.created_at::DATE, local_date - 89);
  program_end_date := start_date + 89;
  data_cutoff_date := LEAST(program_end_date, local_date);
  WITH scored AS (
    SELECT i.area, i.active, latest.actual_value,
      CASE WHEN i.active AND latest.actual_value IS NOT NULL AND i.baseline_value IS NOT NULL AND i.target_value IS NOT NULL AND i.baseline_value <> i.target_value
        THEN LEAST(100, GREATEST(0, CASE WHEN i.direction='higher_is_better' THEN (latest.actual_value-i.baseline_value)/(i.target_value-i.baseline_value)*100 ELSE (i.baseline_value-latest.actual_value)/(i.baseline_value-i.target_value)*100 END)) END score
    FROM public.ptp_indicators i LEFT JOIN LATERAL (
      SELECT x.actual_value FROM public.ptp_indicator_actuals x
      WHERE x.indicator_id=i.id
        AND ((x.month_number - 1) * 30) <= (data_cutoff_date - start_date)
      ORDER BY x.month_number DESC LIMIT 1
    ) latest ON true
    WHERE i.participant_user_id=p_participant_user_id AND i.journey_id=j.id
  ), areas AS (
    SELECT area, COUNT(*) FILTER (WHERE active) active_count, COUNT(score) measured_count, AVG(score) score FROM scored GROUP BY area
  ) SELECT COALESCE(SUM(active_count),0), COALESCE(SUM(measured_count),0), AVG(score), COALESCE(jsonb_agg(jsonb_build_object('area',area,'score',ROUND(score),'active_indicators',active_count,'measured_indicators',measured_count,'indicator_coverage',ROUND(active_count::NUMERIC/4*100),'measurement_coverage',CASE WHEN active_count=0 THEN 0 ELSE ROUND(measured_count::NUMERIC/active_count*100) END,'status',CASE WHEN active_count=0 THEN 'TIDAK_DIUKUR' WHEN measured_count=0 THEN 'BELUM_ADA_DATA' ELSE 'TERUKUR' END) ORDER BY area),'[]'::JSONB)
    INTO active_indicators, measured_indicators, outcome, outcome_areas FROM areas;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'key', i.indicator_key,
    'area', i.area,
    'type', i.indicator_type,
    'label', i.label,
    'active', i.active,
    'direction', i.direction,
    'baseline', i.baseline_value,
    'target', i.target_value,
    'unit', i.unit,
    'actuals', COALESCE((SELECT jsonb_agg(jsonb_build_object('month', x.month_number, 'actual', x.actual_value, 'evidence_note', x.evidence_note) ORDER BY x.month_number) FROM public.ptp_indicator_actuals x WHERE x.indicator_id = i.id), '[]'::JSONB)
  ) ORDER BY i.area, i.indicator_type), '[]'::JSONB)
  INTO indicator_data
  FROM public.ptp_indicators i
  WHERE i.participant_user_id = p_participant_user_id AND i.journey_id = j.id;
  WITH habit_data AS (
    SELECT h.area_category area, h.id,
      CASE
        WHEN h.frequency_kind = 'daily' THEN GREATEST(0, bounds.last_day - bounds.first_day + 1) * GREATEST(COALESCE(h.quantity,1),1)
        WHEN h.frequency_kind = 'weekly' THEN (SELECT COUNT(DISTINCT date_trunc('week', day)::DATE) FROM generate_series(bounds.first_day, bounds.last_day, INTERVAL '1 day') day) * GREATEST(COALESCE(h.quantity,1),1)
        WHEN h.frequency_kind = 'custom' AND jsonb_typeof(h.custom_schedule->'weekdays') = 'array'
          AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(h.custom_schedule->'weekdays') weekday WHERE weekday !~ '^[1-7]$')
          THEN (SELECT COUNT(*) FROM generate_series(bounds.first_day, bounds.last_day, INTERVAL '1 day') day WHERE EXTRACT(ISODOW FROM day)::INT IN (SELECT value::INT FROM jsonb_array_elements_text(h.custom_schedule->'weekdays'))) * GREATEST(COALESCE(h.quantity,1),1)
      END scheduled,
      COALESCE(l.done,0) done
    FROM public.habits h
    CROSS JOIN LATERAL (SELECT GREATEST(start_date,COALESCE(h.effective_from,start_date)) first_day, LEAST(data_cutoff_date,COALESCE(h.effective_until,data_cutoff_date)) last_day) bounds
    LEFT JOIN LATERAL (SELECT SUM(LEAST(GREATEST(COALESCE(hl.completed_count,CASE WHEN hl.completed THEN 1 ELSE 0 END),0),GREATEST(COALESCE(h.quantity,1),1))) done FROM public.habit_logs hl WHERE hl.habit_id=h.id AND hl.user_id=h.user_id AND hl.is_canonical_occurrence AND hl.occurrence_start BETWEEN CASE WHEN h.frequency_kind='weekly' THEN date_trunc('week', bounds.first_day::TIMESTAMP)::DATE ELSE bounds.first_day END AND bounds.last_day) l ON true
    WHERE h.user_id=p_participant_user_id AND NOT COALESCE(h.is_archived,false) AND COALESCE(h.effective_from,start_date)<=data_cutoff_date AND (h.effective_until IS NULL OR h.effective_until>=start_date)
  ), area_data AS (
    SELECT COALESCE(hd.area,'Tanpa Area') area, SUM(LEAST(hd.done,hd.scheduled)) FILTER (WHERE hd.scheduled IS NOT NULL) completed, SUM(hd.scheduled) scheduled, COUNT(*) FILTER (WHERE hd.scheduled IS NULL) unsupported, CASE WHEN SUM(hd.scheduled)>0 THEN SUM(LEAST(hd.done,hd.scheduled))/SUM(hd.scheduled)*100 END score FROM habit_data hd GROUP BY COALESCE(hd.area,'Tanpa Area')
  ) SELECT COALESCE(SUM(ad.scheduled),0), COALESCE(SUM(ad.completed),0), COALESCE(SUM(ad.unsupported),0), COUNT(ad.score), CASE WHEN SUM(ad.scheduled)>0 THEN SUM(ad.completed)/SUM(ad.scheduled)*100 END, COALESCE(jsonb_agg(jsonb_build_object('area',ad.area,'score',ROUND(ad.score),'numerator',ad.completed,'denominator',ad.scheduled,'unsupported_habits',ad.unsupported,'status',CASE WHEN ad.scheduled IS NULL OR ad.scheduled=0 THEN CASE WHEN ad.unsupported>0 THEN 'TIDAK_DAPAT_DIHITUNG' ELSE 'TIDAK_DIUKUR' END ELSE 'TERUKUR' END) ORDER BY ad.area),'[]'::JSONB)
     INTO scheduled, completed, unsupported_habits, measured_execution_areas, execution, execution_areas FROM area_data ad;
  WITH eligible_weeks AS (
    SELECT DISTINCT date_trunc('week', day)::DATE week_start, pp.period_source
    FROM public.sahabat_safar_pairing_periods pp
    CROSS JOIN LATERAL generate_series(GREATEST(start_date,pp.paired_at::DATE), LEAST(data_cutoff_date,COALESCE(pp.unpaired_at::DATE,data_cutoff_date)), INTERVAL '1 day') day
    WHERE pp.user_id=p_participant_user_id AND pp.paired_at::DATE<=data_cutoff_date AND COALESCE(pp.unpaired_at::DATE,data_cutoff_date)>=start_date
  )
  SELECT COUNT(DISTINCT week_start), COALESCE(BOOL_AND(period_source='recorded'),true)
    INTO weeks, pairing_complete FROM eligible_weeks;
  SELECT COUNT(DISTINCT date_trunc('week',r.date::TIMESTAMP)) INTO supported_weeks FROM public.safar_reminders r WHERE r.user_id=p_participant_user_id AND r.date BETWEEN start_date AND data_cutoff_date AND EXISTS (SELECT 1 FROM public.sahabat_safar_pairing_periods pp WHERE pp.user_id=p_participant_user_id AND r.date BETWEEN pp.paired_at::DATE AND COALESCE(pp.unpaired_at::DATE,data_cutoff_date));
  SELECT COUNT(DISTINCT activity_date) INTO journal_days FROM public.journals WHERE user_id=p_participant_user_id AND is_canonical_day AND activity_date BETWEEN start_date AND data_cutoff_date;
  journal_total_days := GREATEST(0, (LEAST(data_cutoff_date, program_end_date) - start_date) + 1);
  WITH baseline_raw AS (
    SELECT ans.area, SUM(ans.score) total, COUNT(*) cnt
    FROM public.baseline_assessments ba JOIN public.baseline_answers ans ON ans.assessment_id=ba.id
    WHERE ba.user_id=p_participant_user_id AND ba.completed
    GROUP BY ans.area
  ), baseline_mapped AS (
    SELECT
      CASE b.area
        WHEN 'spiritual_growth' THEN 'Spiritual Growth'
        WHEN 'personal_development' THEN 'Personal Development'
        WHEN 'leadership_excellence' THEN 'Leadership Excellence'
        WHEN 'relationship' THEN 'Relationship'
        WHEN 'community_impact' THEN 'Community Impact'
        ELSE b.area
      END area,
      ROUND((b.total::NUMERIC/(b.cnt*10))*100) score
    FROM baseline_raw b
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('area',area,'score',score) ORDER BY area),'[]'::JSONB), ROUND(AVG(score))
    INTO baseline_areas, baseline_score FROM baseline_mapped;
  WITH checkpoint_schedule AS (
    SELECT month_number, start_date + ((month_number - 1) * 30) open_date, start_date + (month_number * 30 - 1) due_date, start_date + (month_number * 30 + 6) grace_cutoff
    FROM generate_series(1,3) month_number
  ), checkpoint_rows AS (
    SELECT s.*, mr.first_submitted_at,
      CASE
        WHEN mr.first_submitted_at IS NOT NULL THEN 'SUBMITTED'
        WHEN local_date < s.open_date THEN 'NOT_MATURED'
        WHEN local_date < s.due_date THEN 'OPEN'
        WHEN local_date = s.due_date THEN 'DUE'
        WHEN local_date <= s.grace_cutoff THEN 'GRACE'
        ELSE 'MISSED'
      END status
    FROM checkpoint_schedule s LEFT JOIN public.monthly_reviews mr ON mr.user_id=p_participant_user_id AND mr.month_number=s.month_number
  )
  SELECT COUNT(*) FILTER (WHERE local_date > grace_cutoff), COUNT(*) FILTER (WHERE local_date > grace_cutoff AND first_submitted_at IS NOT NULL AND (first_submitted_at AT TIME ZONE participant_timezone)::DATE <= grace_cutoff),
    COALESCE(jsonb_agg(jsonb_build_object('month',month_number,'open_date',open_date,'mature_date',grace_cutoff + 1,'due_date',due_date,'grace_cutoff',grace_cutoff,'status',status,'submitted',first_submitted_at IS NOT NULL,'submitted_by_grace',first_submitted_at IS NOT NULL AND (first_submitted_at AT TIME ZONE participant_timezone)::DATE <= grace_cutoff,'first_submitted_at',first_submitted_at) ORDER BY month_number),'[]'::JSONB)
  INTO checkpoint_due, checkpoint_submitted, checkpoint_data FROM checkpoint_rows;
  -- Compute checkpoint_on_time: matured checkpoints submitted by grace deadline.
  checkpoint_on_time := checkpoint_submitted;
  SELECT jsonb_build_object(
    'participant_outcome', a.participant_outcome,
    'coach_score', a.coach_score,
    'validated_outcome', a.validated_outcome,
    'validation_status', a.validation_status,
    'evidence_note', a.evidence_note,
    'rubric_scores', COALESCE((SELECT jsonb_agg(jsonb_build_object('rubric_key', s.rubric_key, 'score', s.score, 'weight', s.weight) ORDER BY s.rubric_key) FROM public.coach_assessment_scores s WHERE s.assessment_id = a.id), '[]'::JSONB)
  ) INTO assessment FROM public.coach_assessments a WHERE a.participant_user_id=p_participant_user_id AND a.journey_id=j.id;
  RETURN jsonb_build_object(
    'user_id', p_participant_user_id,
    'journey_id', j.id,
    'indicators', indicator_data,
    'participant', jsonb_build_object('user_id', p.user_id, 'full_name', p.full_name, 'company_name', p.company_name, 'location', p.location, 'journey_status', j.status, 'journey_id', j.id, 'muhasabah', j.muhasabah, 'niat', j.niat, 'main_target', j.main_target, 'area_transformasi', j.area_transformasi, 'success_indicators', j.success_indicators),
    'baseline', jsonb_build_object('completed', EXISTS(SELECT 1 FROM public.baseline_assessments ba WHERE ba.user_id=p_participant_user_id AND ba.completed),'score',baseline_score,'areas',baseline_areas),
    'methodology_version', '1.0',
    'period', jsonb_build_object('start_date',start_date,'program_end_date',program_end_date,'data_cutoff_date',data_cutoff_date,'checkpoint_grace_cutoff',program_end_date + 7,'timezone',participant_timezone),
    'metrics', jsonb_build_object('outcome',jsonb_build_object('score',CASE WHEN measured_indicators=0 THEN NULL ELSE ROUND(outcome) END,'numerator',measured_indicators,'denominator',active_indicators,'indicator_coverage',CASE WHEN active_indicators=0 THEN 0 ELSE LEAST(100, ROUND(active_indicators::NUMERIC/(GREATEST(1,jsonb_array_length(COALESCE(j.area_transformasi,'[]'::JSONB)))*4)*100)) END,'measurement_coverage',CASE WHEN active_indicators=0 THEN 0 ELSE ROUND(measured_indicators::NUMERIC/active_indicators*100) END,'coverage',CASE WHEN active_indicators=0 THEN 0 ELSE ROUND(measured_indicators::NUMERIC/active_indicators*100) END,'period_end',program_end_date,'areas',outcome_areas),'execution',jsonb_build_object('score',CASE WHEN measured_execution_areas=0 THEN NULL ELSE ROUND(execution) END,'numerator',completed,'denominator',scheduled,'coverage',CASE WHEN scheduled=0 THEN NULL ELSE ROUND(completed::NUMERIC/scheduled*100) END,'unsupported_habits',unsupported_habits,'areas',execution_areas),'engagement',jsonb_build_object('baseline',EXISTS(SELECT 1 FROM public.baseline_assessments ba WHERE ba.user_id=p_participant_user_id AND ba.completed),'ptp',active_indicators>0,'checkpoint',jsonb_build_object('met',checkpoint_on_time>0 AND checkpoint_on_time=checkpoint_due,'numerator',checkpoint_on_time,'denominator',checkpoint_due,'coverage',CASE WHEN checkpoint_due=0 THEN NULL ELSE ROUND(checkpoint_on_time::NUMERIC/checkpoint_due*100) END,'items',checkpoint_data),'journal',jsonb_build_object('met',journal_total_days>0 AND journal_days>=CEIL(journal_total_days*0.5),'journal_days',journal_days,'total_days',journal_total_days,'consistency',CASE WHEN journal_total_days=0 THEN NULL ELSE ROUND(journal_days::NUMERIC/journal_total_days*100) END),'tracking',scheduled>0 OR measured_indicators>0),'peer_support',jsonb_build_object('score',CASE WHEN weeks=0 THEN NULL ELSE ROUND(LEAST(100,supported_weeks::NUMERIC/weeks*100)) END,'numerator',supported_weeks,'denominator',weeks,'period_data_complete',weeks>0 AND pairing_complete,'limitation',CASE WHEN weeks=0 THEN 'Pairing period has not been recorded; historical pairing cannot be inferred safely.' WHEN NOT pairing_complete THEN 'Includes estimated legacy pairing period.' ELSE NULL END),'coach_assessment',assessment)
  );
END; $$;

DROP FUNCTION IF EXISTS public.save_coach_assessment(UUID,UUID,NUMERIC,TEXT,TEXT,JSONB);
CREATE FUNCTION public.save_coach_assessment(p_participant_user_id UUID, p_journey_id UUID, p_participant_outcome NUMERIC, p_validation_status TEXT, p_evidence_note TEXT, p_scores JSONB)
RETURNS public.coach_assessments LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.coach_assessments%ROWTYPE; item JSONB; calculated NUMERIC; canonical_outcome NUMERIC; keys TEXT[] := ARRAY['evidence', 'consistency', 'target', 'sustainability'];
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_coach_of(p_participant_user_id) THEN RAISE EXCEPTION 'Coach tidak ditugaskan kepada peserta ini.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.journeys WHERE id = p_journey_id AND user_id = p_participant_user_id) THEN RAISE EXCEPTION 'Journey peserta tidak valid.'; END IF;
  SELECT (public.get_participant_assessment(p_participant_user_id) #>> '{metrics,outcome,score}')::NUMERIC INTO canonical_outcome;
  IF canonical_outcome IS NULL THEN RAISE EXCEPTION 'Participant Outcome belum dapat dihitung dari bukti indikator.'; END IF;
  IF p_participant_outcome IS NULL OR ABS(p_participant_outcome - canonical_outcome) > 1 THEN RAISE EXCEPTION 'Participant Outcome pada layar sudah tidak mutakhir. Muat ulang assessment.'; END IF;
  IF p_validation_status IS NULL OR p_validation_status NOT IN ('BELUM_DITINJAU','TERVERIFIKASI','PERLU_KLARIFIKASI','TIDAK_DAPAT_DIVERIFIKASI') THEN RAISE EXCEPTION 'Status validasi tidak valid.'; END IF;
  IF p_scores IS NULL OR jsonb_typeof(p_scores) <> 'array' OR jsonb_array_length(p_scores) <> 4 OR (SELECT array_agg(value->>'key' ORDER BY value->>'key') FROM jsonb_array_elements(p_scores)) <> (SELECT array_agg(value ORDER BY value) FROM unnest(keys) value) OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_scores) value WHERE jsonb_typeof(value) <> 'object' OR jsonb_typeof(value->'score') <> 'number' OR (value->>'score')::NUMERIC NOT IN (1,2,3,4,5)) THEN RAISE EXCEPTION 'Empat skor rubrik integer 1-5 wajib diisi dengan key yang valid.'; END IF;
  SELECT ROUND(SUM((value->>'score')::NUMERIC / 5 * 100 * CASE value->>'key' WHEN 'evidence' THEN .30 WHEN 'consistency' THEN .30 WHEN 'target' THEN .25 WHEN 'sustainability' THEN .15 END)) INTO calculated FROM jsonb_array_elements(p_scores) value;
  INSERT INTO public.coach_assessments (participant_user_id, journey_id, coach_user_id, participant_outcome, coach_score, validated_outcome, validation_status, evidence_note, methodology_version, reviewed_at, updated_at)
  VALUES (p_participant_user_id, p_journey_id, auth.uid(), ROUND(canonical_outcome), calculated, ROUND(canonical_outcome * .6 + calculated * .4), p_validation_status, NULLIF(BTRIM(p_evidence_note), ''), '1.0', NOW(), NOW())
  ON CONFLICT (participant_user_id, journey_id) DO UPDATE SET coach_user_id=auth.uid(), participant_outcome=EXCLUDED.participant_outcome, coach_score=EXCLUDED.coach_score, validated_outcome=EXCLUDED.validated_outcome, validation_status=EXCLUDED.validation_status, evidence_note=EXCLUDED.evidence_note, methodology_version='1.0', reviewed_at=NOW(), updated_at=NOW() RETURNING * INTO a;
  DELETE FROM public.coach_assessment_scores WHERE assessment_id = a.id;
  FOR item IN SELECT value FROM jsonb_array_elements(p_scores) LOOP INSERT INTO public.coach_assessment_scores (assessment_id, rubric_key, score, weight) VALUES (a.id, item->>'key', (item->>'score')::INT, CASE item->>'key' WHEN 'evidence' THEN 30 WHEN 'consistency' THEN 30 WHEN 'target' THEN 25 ELSE 15 END); END LOOP;
  RETURN a;
END; $$;

CREATE OR REPLACE FUNCTION public.get_coach_participants() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role::TEXT IN ('coach', 'admin')) THEN
    RAISE EXCEPTION 'Akses Coach Portal ditolak.' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'participant_user_id', p.user_id,
    'full_name', p.full_name,
    'company_name', p.company_name,
    'batch_name', b.name,
    'location', p.location,
    'journey_id', j.id,
    'journey_status', j.status,
    'muhasabah', j.muhasabah,
    'niat', j.niat,
    'main_target', j.main_target,
    'area_transformasi', j.area_transformasi,
    'success_indicators', j.success_indicators,
    'last_active_at', p.last_active_at,
    'days_inactive', GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(p.last_active_at, p.created_at))) / 86400))::INT
  ) ORDER BY p.full_name), '[]'::JSONB)
  INTO result
  FROM public.profiles p
  LEFT JOIN public.batches b ON b.id = p.batch_id
  LEFT JOIN LATERAL (
    SELECT j1.* FROM public.journeys j1 WHERE j1.user_id = p.user_id ORDER BY j1.created_at DESC, j1.id DESC LIMIT 1
  ) j ON TRUE
  WHERE p.role::TEXT = 'participant'
    AND (p.coach_id = auth.uid() OR public.is_admin());

  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_admin_group_impact(p_company_id UUID DEFAULT NULL, p_batch_id UUID DEFAULT NULL) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE records JSONB; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Hanya admin yang dapat membaca impact report.' USING ERRCODE='42501'; END IF;
  SELECT COALESCE(jsonb_agg(public.get_participant_assessment(p.user_id) ORDER BY p.full_name), '[]'::JSONB) INTO records FROM public.profiles p WHERE p.role::TEXT='participant' AND (p_company_id IS NULL OR p.company_id=p_company_id) AND (p_batch_id IS NULL OR p.batch_id=p_batch_id);
  RETURN jsonb_build_object('methodology_version','1.0','participants',records);
END; $$;

REVOKE ALL ON FUNCTION public.save_coach_assessment(UUID,UUID,NUMERIC,TEXT,TEXT,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_coach_assessment(UUID,UUID,NUMERIC,TEXT,TEXT,JSONB) TO authenticated;
REVOKE ALL ON FUNCTION public.save_monthly_review_coach_note(UUID,INT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_monthly_review_coach_note(UUID,INT,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.get_participant_assessment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_participant_assessment(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.get_coach_participants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_coach_participants() TO authenticated;
REVOKE ALL ON FUNCTION public.get_admin_group_impact(UUID,UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_group_impact(UUID,UUID) TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ptp_indicators, public.ptp_indicator_actuals, public.coach_assessments, public.coach_assessment_scores TO authenticated;
GRANT SELECT ON public.sahabat_safar_pairing_periods TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
