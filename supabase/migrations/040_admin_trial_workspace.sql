-- Admin trial workspace and reversible access controls.
BEGIN;

ALTER TABLE public.slj_trial_enrollments ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
-- NULL identifies archives written before the upgrade time was captured.
ALTER TABLE public.slj_trial_practice_archives ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.slj_trial_practice_archives ALTER COLUMN archived_at SET DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.slj_trial_access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.slj_trial_enrollments(user_id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  paused BOOLEAN NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 3 AND 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.slj_trial_access_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.slj_trial_access_events FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS slj_trial_access_events_recent
  ON public.slj_trial_access_events (user_id, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION public.slj_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  IF public.is_admin() OR public.is_coach_of(p_user_id) THEN RETURN TRUE; END IF;
  IF p_user_id IS DISTINCT FROM auth.uid() THEN RETURN FALSE; END IF;
  SELECT program_code INTO code FROM public.profiles WHERE user_id = p_user_id;
  IF code = 'SLJ-TRIAL-14' THEN
    RETURN p_feature IN ('spiritual', 'journal', 'practice') AND EXISTS (
      SELECT 1 FROM public.slj_trial_enrollments
      WHERE user_id = p_user_id AND starts_at <= NOW() AND expires_at > NOW() AND paused_at IS NULL
    );
  END IF;
  RETURN NULLIF(BTRIM(code), '') IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.slj_can_remind(p_user_id UUID, p_kind TEXT DEFAULT 'spiritual')
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = p_user_id AND p.role::TEXT = 'participant'
      AND NULLIF(BTRIM(p.program_code), '') IS NOT NULL
      AND (p.program_code <> 'SLJ-TRIAL-14' OR (
        p_kind IN ('spiritual','practice') AND EXISTS (
          SELECT 1 FROM public.slj_trial_enrollments t
          WHERE t.user_id = p.user_id AND t.starts_at <= NOW() AND t.expires_at > NOW() AND t.paused_at IS NULL
        )
      ))
  );
$$;

CREATE OR REPLACE FUNCTION public.slj_access_status()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  profile public.profiles%ROWTYPE;
  trial public.slj_trial_enrollments%ROWTYPE;
  kind TEXT;
  trial_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Silakan masuk untuk melanjutkan.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO profile FROM public.profiles WHERE user_id = auth.uid();
  SELECT * INTO trial FROM public.slj_trial_enrollments WHERE user_id = auth.uid();
  kind := CASE
    WHEN public.is_admin() OR profile.role::TEXT = 'coach' THEN 'staff'
    WHEN profile.program_code = 'SLJ-TRIAL-14' AND trial.user_id IS NOT NULL THEN 'trial'
    WHEN NULLIF(BTRIM(profile.program_code), '') IS NOT NULL THEN 'program'
    ELSE 'none' END;
  IF kind = 'trial' THEN
    trial_status := CASE
      WHEN trial.expires_at <= NOW() THEN 'expired'
      WHEN trial.paused_at IS NOT NULL THEN 'paused'
      ELSE 'active' END;
  END IF;
  RETURN jsonb_build_object(
    'kind', kind,
    'active', CASE WHEN kind = 'trial' THEN trial_status = 'active' AND trial.starts_at <= NOW() ELSE kind <> 'none' END,
    'trial_status', trial_status,
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

CREATE OR REPLACE FUNCTION public.admin_slj_trial_workspace(
  p_search TEXT DEFAULT '',
  p_status TEXT DEFAULT 'all',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  search_term TEXT := lower(left(btrim(COALESCE(p_search, '')), 120));
  status_filter TEXT := COALESCE(p_status, 'all');
  workspace JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses admin diperlukan.' USING ERRCODE = '42501';
  END IF;
  IF status_filter NOT IN ('all', 'active', 'paused', 'expired', 'program') THEN
    RAISE EXCEPTION 'Pilih status akses yang tersedia.' USING ERRCODE = '22023';
  END IF;

  WITH enrollments AS MATERIALIZED (
    SELECT t.user_id, t.starts_at, t.expires_at,
      COALESCE(NULLIF(btrim(p.full_name), ''), 'Peserta') AS full_name,
      p.start_date AS program_start,
      CASE
        WHEN p.role::TEXT = 'participant' AND NULLIF(btrim(p.program_code), '') IS NOT NULL
          AND p.program_code <> 'SLJ-TRIAL-14' THEN 'program'
        WHEN p.role::TEXT <> 'participant' OR p.program_code IS DISTINCT FROM 'SLJ-TRIAL-14'
          OR t.expires_at <= NOW() THEN 'expired'
        WHEN t.paused_at IS NOT NULL THEN 'paused'
        ELSE 'active'
      END AS status
    FROM public.slj_trial_enrollments t JOIN public.profiles p USING (user_id)
  ), filtered AS MATERIALIZED (
    SELECT * FROM enrollments
    WHERE (status_filter = 'all' OR status = status_filter)
      AND (search_term = '' OR strpos(lower(full_name), search_term) > 0)
  ), page_rows AS MATERIALIZED (
    SELECT * FROM filtered ORDER BY starts_at DESC, user_id
    LIMIT LEAST(50, GREATEST(1, COALESCE(p_limit, 20))) OFFSET GREATEST(0, COALESCE(p_offset, 0))
  ), progress AS (
    SELECT r.user_id, r.full_name, r.starts_at, r.expires_at, r.status,
      CASE WHEN period.ends_at IS NOT NULL THEN
        LEAST(14, GREATEST(1, floor(extract(epoch FROM (period.ends_at - r.starts_at)) / 86400)::INT + 1))
      END AS trial_day,
      CASE WHEN period.ends_at IS NOT NULL THEN activity.active_days END AS active_days,
      activity.last_activity_at,
      CASE
        WHEN archive.user_id IS NOT NULL THEN archived_reviews.week_1
        WHEN r.status <> 'program' THEN reviews.week_1
      END AS week_1_submitted,
      CASE
        WHEN archive.user_id IS NOT NULL THEN archived_reviews.week_2
        WHEN r.status <> 'program' THEN reviews.week_2
      END AS week_2_submitted
    FROM page_rows r
    LEFT JOIN public.slj_trial_practice_archives archive ON archive.user_id = r.user_id
    CROSS JOIN LATERAL (
      SELECT CASE
        WHEN archive.archived_at IS NOT NULL THEN LEAST(archive.archived_at, r.expires_at, NOW())
        -- Before this migration, the enrollment RPC recorded the upgrade in start_date.
        WHEN r.status = 'program' AND archive.user_id IS NOT NULL AND r.program_start >= r.starts_at
          THEN LEAST(r.program_start, r.expires_at, NOW())
        WHEN r.status <> 'program' AND archive.user_id IS NULL THEN LEAST(r.expires_at, NOW())
      END AS ends_at
    ) period
    CROSS JOIN LATERAL (
      -- Each day is a 24-hour window from activation. Only timestamps are taken from journals.
      SELECT count(DISTINCT floor(extract(epoch FROM (events.recorded_at - r.starts_at)) / 86400))::INT AS active_days,
        max(events.recorded_at) AS last_activity_at
      FROM (
        SELECT created_at AS recorded_at FROM public.prayer_logs
          WHERE user_id = r.user_id AND is_completed IS TRUE
        UNION ALL
        SELECT l.created_at FROM public.habit_logs l JOIN public.habits h ON h.id = l.habit_id
          WHERE l.user_id = r.user_id AND h.user_id = r.user_id AND h.area_category = 'Spiritual Growth'
            AND l.is_canonical_occurrence AND (l.completed OR l.completed_count > 0)
        UNION ALL
        SELECT created_at FROM public.quran_logs WHERE user_id = r.user_id
        UNION ALL
        SELECT created_at FROM public.hadith_logs WHERE user_id = r.user_id AND is_read IS TRUE
        UNION ALL
        SELECT created_at FROM public.journals WHERE user_id = r.user_id
      ) events
      WHERE events.recorded_at >= r.starts_at AND events.recorded_at < period.ends_at
    ) activity
    CROSS JOIN LATERAL (
      SELECT COALESCE(bool_or(month_number = 1), FALSE) AS week_1,
        COALESCE(bool_or(month_number = 2), FALSE) AS week_2
      FROM public.monthly_reviews
      WHERE r.status <> 'program' AND archive.user_id IS NULL AND user_id = r.user_id
        AND month_number IN (1, 2) AND status IN ('ON_TRACK', 'NEED_SUPPORT')
        AND created_at >= r.starts_at AND created_at < period.ends_at
    ) reviews
    CROSS JOIN LATERAL (
      SELECT COALESCE(bool_or(review->>'month_number' = '1'), FALSE) AS week_1,
        COALESCE(bool_or(review->>'month_number' = '2'), FALSE) AS week_2
      FROM jsonb_array_elements(COALESCE(NULLIF(archive.practice->'reviews', 'null'::JSONB), '[]'::JSONB)) review
      WHERE review->>'status' IN ('ON_TRACK', 'NEED_SUPPORT')
    ) archived_reviews
  )
  SELECT jsonb_build_object(
    'settings', (SELECT jsonb_build_object('enabled', enabled, 'signup_until', signup_until)
      FROM public.slj_trial_settings WHERE id),
    'counts', (SELECT jsonb_build_object('all', count(*),
      'active', count(*) FILTER (WHERE status = 'active'),
      'paused', count(*) FILTER (WHERE status = 'paused'),
      'expired', count(*) FILTER (WHERE status = 'expired'),
      'program', count(*) FILTER (WHERE status = 'program')) FROM enrollments),
    'filtered_total', (SELECT count(*) FROM filtered),
    'participants', (SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.starts_at DESC, p.user_id), '[]'::JSONB)
      FROM progress p)
  ) INTO workspace;
  RETURN workspace;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_slj_set_trial_pause(
  p_user_id UUID,
  p_paused BOOLEAN,
  p_reason TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  participant public.profiles%ROWTYPE;
  enrollment public.slj_trial_enrollments%ROWTYPE;
  reason_text TEXT := btrim(p_reason);
  event_time TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses admin diperlukan.' USING ERRCODE = '42501';
  END IF;
  IF p_paused IS NULL OR reason_text IS NULL OR char_length(reason_text) NOT BETWEEN 3 AND 300 THEN
    RAISE EXCEPTION 'Tulis alasan tindakan antara 3 dan 300 karakter.' USING ERRCODE = '22023';
  END IF;

  -- Match the enrollment RPC's profile lock before touching trial state.
  SELECT * INTO participant FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR participant.role::TEXT <> 'participant'
    OR participant.program_code IS DISTINCT FROM 'SLJ-TRIAL-14' THEN
    RAISE EXCEPTION 'Akses trial sudah berubah. Perbarui daftar peserta.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO enrollment FROM public.slj_trial_enrollments WHERE user_id = p_user_id FOR UPDATE;
  event_time := clock_timestamp();
  IF NOT FOUND OR enrollment.starts_at > event_time OR enrollment.expires_at <= event_time THEN
    RAISE EXCEPTION 'Masa uji coba sudah berakhir atau belum dimulai.' USING ERRCODE = '22023';
  END IF;
  IF (enrollment.paused_at IS NOT NULL) = p_paused THEN RETURN; END IF;

  UPDATE public.slj_trial_enrollments
    SET paused_at = CASE WHEN p_paused THEN event_time END
    WHERE user_id = p_user_id;

  INSERT INTO public.slj_trial_access_events (user_id, actor_id, actor_name, paused, reason, created_at)
  SELECT p_user_id, auth.uid(), COALESCE(NULLIF(btrim(p.full_name), ''), 'Admin'), p_paused, reason_text, event_time
    FROM auth.users u LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE u.id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_slj_trial_access_history(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses admin diperlukan.' USING ERRCODE = '42501';
  END IF;
  RETURN (
    SELECT COALESCE(jsonb_agg(to_jsonb(event) ORDER BY event.created_at DESC, event.id DESC), '[]'::JSONB)
    FROM (
      SELECT id, actor_name, paused, reason, created_at FROM public.slj_trial_access_events
      WHERE user_id = p_user_id ORDER BY created_at DESC, id DESC LIMIT 20
    ) event
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_slj_trial_workspace(TEXT, TEXT, INT, INT),
  public.admin_slj_set_trial_pause(UUID, BOOLEAN, TEXT),
  public.admin_slj_trial_access_history(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_slj_trial_workspace(TEXT, TEXT, INT, INT),
  public.admin_slj_set_trial_pause(UUID, BOOLEAN, TEXT),
  public.admin_slj_trial_access_history(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
