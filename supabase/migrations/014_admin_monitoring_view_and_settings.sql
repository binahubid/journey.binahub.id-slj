-- ====================================================================
-- 014_admin_monitoring_view_and_settings.sql
-- Canonical admin monitoring view + system settings singleton table.
-- Semua halaman Admin membaca sumber yang sama agar konsisten.
-- ====================================================================

-- ──────────────────────────────────────────────────────────────
-- 0. BACKFILL KOLOM YANG MUNGKIN HANYA ADA DI SCHEMA REFERENSI
-- Database lama tidak otomatis memperoleh kolom dari CREATE TABLE IF NOT EXISTS.
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS ptp_status TEXT NOT NULL DEFAULT 'EDITABLE',
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coach_name TEXT,
  ADD COLUMN IF NOT EXISTS auto_lock_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.monthly_reviews
  ADD COLUMN IF NOT EXISTS coach_replied_at TIMESTAMPTZ;

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;

ALTER TABLE public.habit_logs
  ADD COLUMN IF NOT EXISTS completed_count INT NOT NULL DEFAULT 0;

UPDATE public.journeys
SET ptp_status = 'EDITABLE'
WHERE ptp_status IS NULL OR ptp_status NOT IN ('EDITABLE', 'LOCKED');

-- ──────────────────────────────────────────────────────────────
-- 1. SYSTEM SETTINGS (singleton global, admin-only)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  require_access_code_on_signup BOOLEAN NOT NULL DEFAULT TRUE,
  auto_assign_coach_on_signup BOOLEAN NOT NULL DEFAULT TRUE,
  enforce_absolute_journal_privacy BOOLEAN NOT NULL DEFAULT TRUE,
  monitoring_inactivity_days INT NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.system_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins insert system settings" ON public.system_settings;
CREATE POLICY "Authenticated read system settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage system settings" ON public.system_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins insert system settings" ON public.system_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- 2. CANONICAL CURRENT-JOURNEY RULE
-- Journey terbaru per user (created_at DESC, tie-breaker id DESC).
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.current_user_journeys AS
SELECT DISTINCT ON (j.user_id)
  j.id AS journey_id,
  j.user_id,
  j.status,
  j.ptp_status,
  j.created_at AS journey_created_at
FROM public.journeys j
ORDER BY j.user_id, j.created_at DESC, j.id DESC;

-- ──────────────────────────────────────────────────────────────
-- 3. CANONICAL ADMIN PARTICIPANT MONITORING VIEW
-- Satu baris per peserta dengan metric habit, checkpoint,
-- inactivity, dan response coach yang konsisten.
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_participant_monitoring AS
SELECT
  p.user_id,
  COALESCE(NULLIF(p.full_name, ''), 'Peserta SLJ') AS full_name,
  p.company_id,
  p.company_name,
  p.batch_id,
  b.name AS batch_name,
  p.coach_id,
      COALESCE(NULLIF(coach.full_name, ''), NULLIF(b.coach_name, '')) AS coach_name,
  p.program_code,
  p.last_active_at,
  p.start_date,
  p.end_date,
  cuj.journey_id,
  cuj.status AS journey_status,
  cuj.ptp_status,
  -- Habit scoring (90 hari): rata-rata rasio penyelesaian per hari
  COALESCE(hs.habit_avg_percent, 0)::INT AS habit_avg_percent,
  -- Checkpoint / monthly review terakhir
  reviews.months_reviewed,
  reviews.needs_support,
  reviews.last_coach_reply_at,
  -- Inactivity dalam hari terhadap NOW()
  GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(p.last_active_at, p.created_at))) / 86400))::INT AS days_inactive
FROM public.profiles p
LEFT JOIN public.current_user_journeys cuj ON cuj.user_id = p.user_id
LEFT JOIN public.batches b ON b.id = p.batch_id
LEFT JOIN public.profiles coach ON coach.user_id = p.coach_id
LEFT JOIN LATERAL (
  SELECT COALESCE(ROUND(AVG(daily.daily_ratio) * 100), 0)::INT AS habit_avg_percent
  FROM (
    SELECT
      SUM(
        LEAST(1.0, GREATEST(0, COALESCE(hl.completed_count, CASE WHEN hl.completed THEN 1 ELSE 0 END))::NUMERIC
          / GREATEST(1, COALESCE(h.quantity, 1)))
      ) / NULLIF(COUNT(*), 0) AS daily_ratio
    FROM public.habit_logs hl
    JOIN public.habits h ON h.id = hl.habit_id
    WHERE hl.user_id = p.user_id
    GROUP BY hl.date::DATE
  ) daily
) hs ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INT AS months_reviewed,
    BOOL_OR(status = 'NEED_SUPPORT') AS needs_support,
    MAX(coach_replied_at) AS last_coach_reply_at
  FROM public.monthly_reviews mr
  WHERE mr.user_id = p.user_id
) reviews ON true
WHERE p.role::TEXT = 'participant';

-- ──────────────────────────────────────────────────────────────
-- 4. RPC untuk membaca view dengan guard admin + pagination
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_admin_monitoring(
  p_company_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_coach_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 200,
  p_offset INT DEFAULT 0
)
RETURNS SETOF public.admin_participant_monitoring
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat membaca monitoring peserta.';
  END IF;

  RETURN QUERY
  SELECT monitoring.*
  FROM public.admin_participant_monitoring monitoring
  WHERE (p_company_id IS NULL OR monitoring.company_id = p_company_id)
    AND (p_batch_id IS NULL OR monitoring.batch_id = p_batch_id)
    AND (p_coach_id IS NULL OR monitoring.coach_id = p_coach_id)
  ORDER BY monitoring.full_name ASC
  LIMIT GREATEST(1, LEAST(p_limit, 1000))
  OFFSET GREATEST(0, p_offset);
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 5. RPC untuk update system settings (audit updated_by otomatis)
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_system_settings(
  p_require_access_code_on_signup BOOLEAN,
  p_auto_assign_coach_on_signup BOOLEAN,
  p_enforce_absolute_journal_privacy BOOLEAN,
  p_monitoring_inactivity_days INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengubah pengaturan sistem.';
  END IF;

  INSERT INTO public.system_settings (
    id,
    require_access_code_on_signup,
    auto_assign_coach_on_signup,
    enforce_absolute_journal_privacy,
    monitoring_inactivity_days,
    updated_by
  ) VALUES (
    1,
    p_require_access_code_on_signup,
    p_auto_assign_coach_on_signup,
    p_enforce_absolute_journal_privacy,
    GREATEST(1, LEAST(p_monitoring_inactivity_days, 30)),
    auth.uid()
  )
  ON CONFLICT (id) DO UPDATE
  SET require_access_code_on_signup = EXCLUDED.require_access_code_on_signup,
      auto_assign_coach_on_signup = EXCLUDED.auto_assign_coach_on_signup,
      enforce_absolute_journal_privacy = EXCLUDED.enforce_absolute_journal_privacy,
      monitoring_inactivity_days = EXCLUDED.monitoring_inactivity_days,
      updated_at = NOW(),
      updated_by = EXCLUDED.updated_by;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.update_system_settings(BOOLEAN, BOOLEAN, BOOLEAN, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_system_settings(BOOLEAN, BOOLEAN, BOOLEAN, INT) TO authenticated;
REVOKE ALL ON FUNCTION public.get_admin_monitoring(UUID, UUID, UUID, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_monitoring(UUID, UUID, UUID, INT, INT) TO authenticated;

REVOKE ALL ON public.current_user_journeys FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_participant_monitoring FROM PUBLIC, anon, authenticated;

-- Pastikan RPC enrollment migration 012 mengikuti pengaturan assignment coach.
CREATE OR REPLACE FUNCTION public.assign_batch_coach_to_participant(
  p_user_id UUID,
  p_batch_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  use_auto_assign BOOLEAN;
  selected_coach UUID;
BEGIN
  SELECT auto_assign_coach_on_signup INTO use_auto_assign FROM public.system_settings WHERE id = 1;
  IF COALESCE(use_auto_assign, true) THEN
    SELECT coach_id INTO selected_coach FROM public.batches WHERE id = p_batch_id;
    IF selected_coach IS NOT NULL THEN
      UPDATE public.profiles SET coach_id = selected_coach WHERE user_id = p_user_id;
    END IF;
  END IF;
END;
$$;

-- Grants untuk view agar bisa dibaca authenticated user (RLS profile tetap berjalan
-- karena view public.security_barrier tidak diaktifkan di sini; admin-only diterapkan di RPC).
