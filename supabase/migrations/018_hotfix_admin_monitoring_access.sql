-- Hotfix for legacy admin data, RPC visibility, and PostgREST schema cache.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND lower(role::TEXT) = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Backfill company/batch membership for records created before canonical enrollment.
UPDATE public.profiles p
SET batch_id = b.id,
    company_id = b.company_id,
    company_name = COALESCE(NULLIF(p.company_name, ''), b.company_name)
FROM public.batches b
WHERE p.batch_id IS NULL
  AND p.program_code IS NOT NULL
  AND upper(trim(p.program_code)) = upper(trim(b.access_code));

UPDATE public.profiles p
SET company_id = c.id,
    company_name = COALESCE(NULLIF(p.company_name, ''), c.name)
FROM public.companies c
WHERE p.company_id IS NULL
  AND p.company_name IS NOT NULL
  AND lower(trim(p.company_name)) = lower(trim(c.name));

DROP FUNCTION IF EXISTS public.get_admin_monitoring(UUID, UUID, UUID, INT, INT);

CREATE FUNCTION public.get_admin_monitoring(
  p_company_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_coach_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 200,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  company_id UUID,
  company_name TEXT,
  batch_id UUID,
  batch_name TEXT,
  coach_id UUID,
  coach_name TEXT,
  program_code TEXT,
  last_active_at TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  journey_id UUID,
  journey_status journey_status,
  ptp_status TEXT,
  habit_avg_percent INT,
  months_reviewed INT,
  needs_support BOOLEAN,
  last_coach_reply_at TIMESTAMPTZ,
  days_inactive INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses monitoring ditolak: profile login bukan admin.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT m.user_id, m.full_name, m.company_id, m.company_name, m.batch_id,
         m.batch_name, m.coach_id, m.coach_name, m.program_code,
         m.last_active_at, m.start_date, m.end_date, m.journey_id,
         m.journey_status, m.ptp_status, m.habit_avg_percent,
         COALESCE(m.months_reviewed, 0), COALESCE(m.needs_support, false),
         m.last_coach_reply_at, m.days_inactive
  FROM public.admin_participant_monitoring m
  WHERE (p_company_id IS NULL OR m.company_id = p_company_id)
    AND (p_batch_id IS NULL OR m.batch_id = p_batch_id)
    AND (p_coach_id IS NULL OR m.coach_id = p_coach_id)
  ORDER BY m.full_name
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 200), 1000))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_monitoring(UUID, UUID, UUID, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_monitoring(UUID, UUID, UUID, INT, INT) TO authenticated;

-- Ensure admin read policies are present after older migrations/scripts.
DROP POLICY IF EXISTS "Admins read companies" ON public.companies;
DROP POLICY IF EXISTS "Admins read batches" ON public.batches;
CREATE POLICY "Admins read companies" ON public.companies
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read batches" ON public.batches
  FOR SELECT TO authenticated USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
