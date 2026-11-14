-- Fourteen-day spiritual trial. Activation and expiry use the database clock.
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone_mode TEXT NOT NULL DEFAULT 'AUTO';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS preferred_prayer_city TEXT DEFAULT 'Jakarta';

CREATE TABLE IF NOT EXISTS public.slj_trial_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  signup_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);
INSERT INTO public.slj_trial_settings (id) VALUES (TRUE) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.slj_trial_enrollments (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT slj_trial_fourteen_days CHECK (expires_at = starts_at + INTERVAL '14 days')
);

ALTER TABLE public.slj_trial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slj_trial_enrollments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.slj_trial_settings, public.slj_trial_enrollments FROM anon, authenticated;
GRANT SELECT ON public.slj_trial_settings, public.slj_trial_enrollments TO authenticated;
DROP POLICY IF EXISTS slj_trial_settings_admin ON public.slj_trial_settings;
CREATE POLICY slj_trial_settings_admin ON public.slj_trial_settings FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS slj_trial_enrollment_read ON public.slj_trial_enrollments;
CREATE POLICY slj_trial_enrollment_read ON public.slj_trial_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.slj_trial_offer()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('enabled', enabled AND (signup_until IS NULL OR signup_until > NOW()),
    'signup_until', signup_until, 'days', 14)
  FROM public.slj_trial_settings WHERE id;
$$;
REVOKE ALL ON FUNCTION public.slj_trial_offer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.slj_trial_offer() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.slj_access_status()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  profile public.profiles%ROWTYPE;
  trial public.slj_trial_enrollments%ROWTYPE;
  kind TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Silakan masuk untuk melanjutkan.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO profile FROM public.profiles WHERE user_id = auth.uid();
  SELECT * INTO trial FROM public.slj_trial_enrollments WHERE user_id = auth.uid();
  kind := CASE
    WHEN public.is_admin() OR profile.role::TEXT = 'coach' THEN 'staff'
    WHEN profile.program_code = 'SLJ-TRIAL-14' AND trial.user_id IS NOT NULL THEN 'trial'
    WHEN NULLIF(BTRIM(profile.program_code), '') IS NOT NULL THEN 'program'
    ELSE 'none' END;
  RETURN jsonb_build_object(
    'kind', kind,
    'active', CASE WHEN kind = 'trial' THEN trial.expires_at > NOW() ELSE kind <> 'none' END,
    'starts_at', CASE WHEN kind = 'trial' THEN trial.starts_at ELSE profile.start_date END,
    'expires_at', CASE WHEN kind = 'trial' THEN trial.expires_at ELSE profile.end_date END,
    'days', CASE WHEN kind = 'trial' THEN 14 ELSE 90 END,
    'user_id', auth.uid(), 'full_name', COALESCE(profile.full_name, 'Peserta'),
    'timezone', COALESCE(to_jsonb(profile)->>'timezone', 'Asia/Jakarta'),
    'timezone_mode', profile.timezone_mode,
    'location', COALESCE(profile.location, 'Jakarta')
  );
END;
$$;
REVOKE ALL ON FUNCTION public.slj_access_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.slj_access_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.start_slj_spiritual_trial(
  p_full_name TEXT, p_timezone TEXT DEFAULT 'Asia/Jakarta', p_city TEXT DEFAULT 'Jakarta'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  profile public.profiles%ROWTYPE;
  offer public.slj_trial_settings%ROWTYPE;
  started TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Silakan masuk untuk melanjutkan.' USING ERRCODE = '42501'; END IF;
  IF length(BTRIM(COALESCE(p_full_name, ''))) < 2 OR length(p_full_name) > 120 THEN
    RAISE EXCEPTION 'Isi nama lengkap antara 2 dan 120 karakter.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_timezone)
      OR length(BTRIM(COALESCE(p_city, ''))) NOT BETWEEN 2 AND 120 THEN
    RAISE EXCEPTION 'Periksa kota dan zona waktu Anda.';
  END IF;
  SELECT * INTO profile FROM public.profiles WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR profile.role::TEXT <> 'participant' OR public.is_admin() THEN
    RAISE EXCEPTION 'Uji coba tersedia untuk akun peserta.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Verifikasi email Anda sebelum memulai uji coba.';
  END IF;
  IF NULLIF(BTRIM(profile.program_code), '') IS NOT NULL THEN RETURN public.slj_access_status(); END IF;
  IF EXISTS (SELECT 1 FROM public.slj_trial_enrollments WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Akun ini sudah menggunakan uji coba. Hubungi BinaHub untuk melanjutkan program.';
  END IF;
  IF profile.company_id IS NOT NULL OR profile.batch_id IS NOT NULL THEN
    RAISE EXCEPTION 'Gunakan kode program dari penyelenggara untuk akun yang sudah terdaftar pada program.';
  END IF;
  SELECT * INTO offer FROM public.slj_trial_settings WHERE id FOR SHARE;
  IF NOT FOUND OR NOT offer.enabled OR (offer.signup_until IS NOT NULL AND offer.signup_until <= NOW()) THEN
    RAISE EXCEPTION 'Pendaftaran uji coba sedang ditutup.';
  END IF;

  INSERT INTO public.slj_trial_enrollments (user_id, starts_at, expires_at)
    VALUES (auth.uid(), started, started + INTERVAL '14 days');
  PERFORM set_config('app.enrollment', 'true', TRUE);
  UPDATE public.profiles SET full_name = BTRIM(p_full_name), program_code = 'SLJ-TRIAL-14',
    start_date = started, end_date = started + INTERVAL '14 days', last_active_at = started,
    timezone = p_timezone, timezone_mode = 'MANUAL', location = BTRIM(p_city)
    WHERE user_id = auth.uid();
  INSERT INTO public.journeys (user_id, status, area_transformasi)
    VALUES (auth.uid(), 'ACTIVE', '["Spiritual Growth"]'::JSONB)
    ON CONFLICT (user_id) DO UPDATE SET status = 'ACTIVE',
      area_transformasi = '["Spiritual Growth"]'::JSONB, updated_at = NOW();
  INSERT INTO public.settings (user_id, preferred_prayer_city)
    VALUES (auth.uid(), BTRIM(p_city))
    ON CONFLICT (user_id) DO UPDATE SET preferred_prayer_city = EXCLUDED.preferred_prayer_city;
  RETURN public.slj_access_status();
END;
$$;
REVOKE ALL ON FUNCTION public.start_slj_spiritual_trial(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_slj_spiritual_trial(TEXT, TEXT, TEXT) TO authenticated;

-- Upgrade by a valid program code starts the full journey from the upgrade date.
CREATE OR REPLACE FUNCTION public.enroll_participant_by_access_code(
  p_full_name TEXT,
  p_program_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant_id UUID := auth.uid();
  clean_code TEXT := upper(trim(p_program_code));
  selected_batch public.batches%ROWTYPE;
  existing_profile public.profiles%ROWTYPE;
  start_at TIMESTAMPTZ;
  v_welcome_exists BOOLEAN;
BEGIN
  IF participant_id IS NULL THEN
    RAISE EXCEPTION 'Sesi login tidak ditemukan.';
  END IF;

  IF clean_code = 'SLJ-TRIAL-14' OR length(clean_code) < 3 OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'Nama dan kode program wajib diisi.';
  END IF;

  SELECT * INTO selected_batch
  FROM public.batches
  WHERE upper(access_code) = clean_code
    AND lower(COALESCE(status, 'active')) IN ('active', 'upcoming')
    AND (start_date IS NULL OR start_date = '' OR start_date::date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date = '' OR end_date::date >= CURRENT_DATE)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kode program tidak valid atau sudah tidak aktif.';
  END IF;

  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE user_id = participant_id
  FOR UPDATE;

  IF existing_profile.role IS DISTINCT FROM 'participant'::user_role THEN
    RAISE EXCEPTION 'Akun ini bukan akun peserta.';
  END IF;

  start_at := CASE WHEN existing_profile.program_code = 'SLJ-TRIAL-14' THEN NOW() ELSE COALESCE(existing_profile.start_date, NOW()) END;

  PERFORM set_config('app.enrollment', 'true', true);

  UPDATE public.profiles
  SET full_name = trim(p_full_name),
      company_id = selected_batch.company_id,
      company_name = selected_batch.company_name,
      batch_id = selected_batch.id,
      program_code = clean_code,
      start_date = start_at,
      end_date = start_at + INTERVAL '89 days',
      last_active_at = NOW()
  WHERE user_id = participant_id;

  INSERT INTO public.journeys (user_id, status)
  VALUES (participant_id, 'ACTIVE')
  ON CONFLICT (user_id) DO UPDATE
    SET status = CASE
      WHEN public.journeys.status = 'COMPLETED' THEN public.journeys.status
      ELSE 'ACTIVE'::journey_status
    END,
    area_transformasi = CASE WHEN existing_profile.program_code = 'SLJ-TRIAL-14' THEN '[]'::JSONB ELSE public.journeys.area_transformasi END,
    updated_at = NOW();

  -- Check if welcome notification already exists (avoid duplicates)
  SELECT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = participant_id AND category = 'welcome'
  ) INTO v_welcome_exists;

  -- Create welcome notification if not exists
  IF NOT v_welcome_exists THEN
    PERFORM public.create_welcome_notification(participant_id);
  END IF;

  RETURN jsonb_build_object(
    'company_name', selected_batch.company_name,
    'batch_id', selected_batch.id,
    'batch_name', selected_batch.name,
    'start_date', start_at,
    'end_date', start_at + INTERVAL '89 days',
    'welcome_created', NOT v_welcome_exists
  );
END;
$$;


REVOKE ALL ON FUNCTION public.enroll_participant_by_access_code(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enroll_participant_by_access_code(TEXT, TEXT) TO authenticated;
-- Welcome notifications are only created by the enrollment transaction.
REVOKE ALL ON FUNCTION public.create_welcome_notification(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.slj_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  IF public.is_admin() OR public.is_coach_of(p_user_id) THEN RETURN TRUE; END IF;
  IF p_user_id IS DISTINCT FROM auth.uid() THEN RETURN FALSE; END IF;
  SELECT program_code INTO code FROM public.profiles WHERE user_id = p_user_id;
  IF code = 'SLJ-TRIAL-14' THEN
    RETURN p_feature IN ('spiritual', 'journal') AND EXISTS (
      SELECT 1 FROM public.slj_trial_enrollments WHERE user_id = p_user_id AND expires_at > NOW()
    );
  END IF;
  RETURN NULLIF(BTRIM(code), '') IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.slj_feature_access(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.slj_feature_access(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.slj_activity_access(p_user_id UUID, p_day TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE trial public.slj_trial_enrollments%ROWTYPE; zone TEXT;
BEGIN
  IF NOT public.slj_feature_access(p_user_id, 'spiritual') THEN RETURN FALSE; END IF;
  IF public.is_admin() OR public.is_coach_of(p_user_id) THEN RETURN TRUE; END IF;
  SELECT t.* INTO trial FROM public.slj_trial_enrollments t JOIN public.profiles p USING(user_id)
    WHERE t.user_id = p_user_id AND p.program_code = 'SLJ-TRIAL-14';
  IF NOT FOUND THEN RETURN TRUE; END IF;
  SELECT COALESCE(to_jsonb(p)->>'timezone', 'Asia/Jakarta') INTO zone FROM public.profiles p WHERE p.user_id = p_user_id;
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = zone) THEN zone := 'Asia/Jakarta'; END IF;
  RETURN LEFT(p_day, 10)::DATE BETWEEN (trial.starts_at AT TIME ZONE zone)::DATE AND (NOW() AT TIME ZONE zone)::DATE;
EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RETURN FALSE;
END;
$$;
REVOKE ALL ON FUNCTION public.slj_activity_access(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.slj_activity_access(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.slj_program_write_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row_data JSONB; owner_id UUID;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() OR current_setting('app.enrollment', TRUE) = 'true' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  row_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  owner_id := (row_data->>TG_ARGV[0])::UUID;
  IF NOT public.slj_feature_access(owner_id, TG_ARGV[1]) THEN
    RAISE EXCEPTION 'Fitur ini memerlukan akses program yang aktif.' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Restrictive policies supplement the existing ownership and coach rules.
DO $$
DECLARE item TEXT[]; table_name TEXT; owner_column TEXT;
BEGIN
  FOREACH item SLICE 1 IN ARRAY ARRAY[
    ['action_plans','user_id'], ['habits','user_id'], ['habit_logs','user_id'],
    ['ptp_snapshots','user_id'], ['support_team','user_id'],
    ['sahabat_safar_profiles','user_id'], ['baseline_assessments','user_id'], ['baseline_answers','user_id'],
    ['monthly_reviews','user_id'], ['monthly_indicator_reports','user_id'],
    ['safar_reminders','user_id'], ['sahabat_safar_pairing_periods','user_id'],
    ['coach_assessments','participant_user_id'],
    ['ptp_indicators','participant_user_id'], ['ptp_indicator_actuals','participant_user_id']
  ] LOOP
    table_name := item[1]; owner_column := item[2];
    IF to_regclass('public.' || table_name) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('DROP POLICY IF EXISTS slj_program_access ON public.%I', table_name);
    EXECUTE format('CREATE POLICY slj_program_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.slj_feature_access(%I, ''program'')) WITH CHECK (public.slj_feature_access(%I, ''program''))', table_name, owner_column, owner_column);
    EXECUTE format('DROP TRIGGER IF EXISTS slj_program_access_guard ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER slj_program_access_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.slj_program_write_guard(%L, ''program'')', table_name, owner_column);
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY['prayer_logs','quran_logs','hadith_logs','journals'] LOOP
    IF to_regclass('public.' || table_name) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('DROP POLICY IF EXISTS slj_spiritual_access ON public.%I', table_name);
    EXECUTE format('CREATE POLICY slj_spiritual_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.slj_feature_access(user_id, ''spiritual'')) WITH CHECK (public.slj_activity_access(user_id, date::TEXT))', table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS slj_program_access_guard ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER slj_program_access_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.slj_program_write_guard(''user_id'', ''spiritual'')', table_name);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.slj_trial_journey_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE participant_id UUID; code TEXT;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() OR current_setting('app.enrollment', TRUE) = 'true' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  participant_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
  SELECT program_code INTO code FROM public.profiles WHERE user_id = participant_id;
  IF participant_id = auth.uid() AND code = 'SLJ-TRIAL-14' THEN
    RAISE EXCEPTION 'Uji coba mencakup aktivitas spiritual dan ibadah. PTP tersedia pada program lengkap.' USING ERRCODE = '42501';
  END IF;
  IF participant_id = auth.uid() AND NULLIF(BTRIM(code), '') IS NULL
      AND (TG_OP = 'DELETE' OR NEW.status::TEXT NOT IN ('DRAFT','ONBOARDING')) THEN
    RAISE EXCEPTION 'Aktifkan akses program Anda terlebih dahulu.' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS slj_trial_journey_guard ON public.journeys;
CREATE TRIGGER slj_trial_journey_guard BEFORE INSERT OR UPDATE OR DELETE ON public.journeys
  FOR EACH ROW EXECUTE FUNCTION public.slj_trial_journey_guard();

CREATE OR REPLACE FUNCTION public.admin_slj_trial_overview()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE offer JSONB; participants JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Akses admin diperlukan.' USING ERRCODE = '42501'; END IF;
  SELECT to_jsonb(s) INTO offer FROM public.slj_trial_settings s WHERE id;
  SELECT COALESCE(jsonb_agg(row_data ORDER BY starts_at DESC), '[]'::JSONB) INTO participants
  FROM (
    SELECT t.starts_at, jsonb_build_object('user_id', t.user_id, 'full_name', p.full_name,
      'starts_at', t.starts_at, 'expires_at', t.expires_at,
      'status', CASE WHEN p.program_code <> 'SLJ-TRIAL-14' THEN 'program' WHEN t.expires_at > NOW() THEN 'active' ELSE 'expired' END) row_data
    FROM public.slj_trial_enrollments t JOIN public.profiles p USING(user_id)
    ORDER BY t.starts_at DESC LIMIT 50
  ) recent;
  RETURN jsonb_build_object('settings', offer, 'participants', participants,
    'total', (SELECT count(*) FROM public.slj_trial_enrollments),
    'active', (SELECT count(*) FROM public.slj_trial_enrollments t JOIN public.profiles p USING(user_id)
      WHERE t.expires_at > NOW() AND p.program_code = 'SLJ-TRIAL-14'));
END;
$$;
REVOKE ALL ON FUNCTION public.admin_slj_trial_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_slj_trial_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_slj_trial_offer(p_enabled BOOLEAN, p_signup_until TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Akses admin diperlukan.' USING ERRCODE = '42501'; END IF;
  IF p_enabled IS NULL THEN RAISE EXCEPTION 'Pilih status pendaftaran uji coba.'; END IF;
  UPDATE public.slj_trial_settings SET enabled = p_enabled, signup_until = p_signup_until,
    updated_at = NOW(), updated_by = auth.uid() WHERE id;
  RETURN public.admin_slj_trial_overview();
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_slj_trial_offer(BOOLEAN, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_slj_trial_offer(BOOLEAN, TIMESTAMPTZ) TO authenticated;

-- Apply the same program gate to the existing SECURITY DEFINER assessment RPC.
CREATE OR REPLACE FUNCTION public.get_participant_assessment(p_participant_user_id UUID DEFAULT auth.uid()) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_variable
DECLARE j public.journeys%ROWTYPE; p public.profiles%ROWTYPE; start_date DATE; program_end_date DATE; data_cutoff_date DATE; local_date DATE; participant_timezone TEXT; active_indicators INT := 0; measured_indicators INT := 0; outcome NUMERIC; indicator_data JSONB := '[]'; outcome_areas JSONB := '[]'; execution_areas JSONB := '[]'; measured_execution_areas INT := 0; execution NUMERIC; scheduled NUMERIC := 0; completed NUMERIC := 0; unsupported_habits INT := 0; weeks INT := 0; supported_weeks INT := 0; pairing_complete BOOLEAN := true; journal_days INT := 0; journal_total_days INT := 0; checkpoint_due INT := 0; checkpoint_submitted INT := 0; checkpoint_on_time INT := 0; checkpoint_data JSONB := '[]'; baseline_areas JSONB := '[]'; baseline_score NUMERIC; assessment JSONB; BEGIN
  IF p_participant_user_id <> auth.uid() AND NOT public.is_admin() AND NOT public.is_coach_of(p_participant_user_id) THEN RAISE EXCEPTION 'Akses assessment ditolak.' USING ERRCODE='42501'; END IF;
  IF NOT public.slj_feature_access(p_participant_user_id, 'program') THEN RAISE EXCEPTION 'Assessment tersedia dalam program pendampingan.' USING ERRCODE='42501'; END IF;
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
      AND ans.area IN ('spiritual_growth','personal_development','leadership_excellence','relationship','community_impact')
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
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object('area',bm.area,'score',bm.score) ORDER BY bm.area),'[]'::JSONB),
    ROUND(AVG(bm.score) FILTER (WHERE jsonb_array_length(COALESCE(j.area_transformasi,'[]'::JSONB))=0 OR COALESCE(j.area_transformasi,'[]'::JSONB) ? bm.area))
    INTO baseline_areas, baseline_score FROM baseline_mapped bm;
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

REVOKE ALL ON FUNCTION public.get_participant_assessment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_participant_assessment(UUID) TO authenticated;


-- Worker-side access does not depend on a browser session or editable profile dates.
CREATE OR REPLACE FUNCTION public.slj_can_remind(p_user_id UUID, p_kind TEXT DEFAULT 'spiritual')
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = p_user_id AND p.role::TEXT = 'participant'
      AND NULLIF(BTRIM(p.program_code), '') IS NOT NULL
      AND (p.program_code <> 'SLJ-TRIAL-14' OR (
        p_kind = 'spiritual' AND EXISTS (
          SELECT 1 FROM public.slj_trial_enrollments t WHERE t.user_id = p.user_id AND t.expires_at > NOW()
        )
      ))
  );
$$;
REVOKE ALL ON FUNCTION public.slj_can_remind(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.slj_can_remind(UUID, TEXT) TO service_role;
GRANT SELECT ON public.slj_trial_enrollments TO service_role;

CREATE OR REPLACE FUNCTION public.slj_notification_access_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE kind TEXT := 'spiritual';
BEGIN
  IF NEW.category NOT IN ('reminder', 'checkpoint') AND COALESCE(NEW.dedupe_key, '') NOT LIKE 'batch-lock:%' THEN RETURN NEW; END IF;
  IF NEW.category = 'checkpoint' OR NEW.dedupe_key LIKE 'habit:%' OR NEW.dedupe_key LIKE 'batch-lock:%' THEN kind := 'program'; END IF;
  IF NOT public.slj_can_remind(NEW.user_id, kind) THEN RETURN NULL; END IF;
  IF NEW.action_url = '/dashboard' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id AND program_code = 'SLJ-TRIAL-14'
  ) THEN NEW.action_url := '/trial';
    IF NEW.dedupe_key LIKE 'inactive:%' THEN NEW.message := 'Mulai kembali dengan satu catatan ibadah atau refleksi hari ini.'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS slj_notification_access_guard ON public.notifications;
CREATE TRIGGER slj_notification_access_guard BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.slj_notification_access_guard();

CREATE OR REPLACE FUNCTION public.claim_pending_push_notifications(p_limit INT DEFAULT 500)
RETURNS TABLE (notification_id UUID, user_id UUID, title TEXT, message TEXT, action_url TEXT, endpoint TEXT, p256dh TEXT, auth TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT n.id, n.user_id, n.title, n.message, n.action_url, ps.endpoint, ps.p256dh, ps.auth
  FROM public.notifications n
  JOIN public.settings s ON s.user_id = n.user_id AND s.push_notifications_enabled
  JOIN public.push_subscriptions ps ON ps.user_id = n.user_id AND ps.is_active
  WHERE n.push_sent_at IS NULL AND (
    n.category NOT IN ('reminder', 'checkpoint') OR public.slj_can_remind(n.user_id,
      CASE WHEN n.category = 'checkpoint' OR n.dedupe_key LIKE 'habit:%' THEN 'program' ELSE 'spiritual' END)
  )
  ORDER BY n.created_at ASC LIMIT GREATEST(1, LEAST(p_limit, 1000));
$$;
REVOKE ALL ON FUNCTION public.claim_pending_push_notifications(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_push_notifications(INT) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
