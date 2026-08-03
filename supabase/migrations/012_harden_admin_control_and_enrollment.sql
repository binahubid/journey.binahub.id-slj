-- Admin control plane hardening and canonical participant enrollment.

-- Participants may not change authorization or organizational assignment fields.
CREATE OR REPLACE FUNCTION public.prevent_participant_profile_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.user_id
     AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin'
     AND COALESCE(current_setting('app.enrollment', true), 'false') <> 'true'
     AND (
       NEW.role IS DISTINCT FROM OLD.role
       OR NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.batch_id IS DISTINCT FROM OLD.batch_id
       OR NEW.coach_id IS DISTINCT FROM OLD.coach_id
       OR NEW.program_code IS DISTINCT FROM OLD.program_code
     ) THEN
    RAISE EXCEPTION 'Perubahan role dan assignment hanya dapat dilakukan oleh admin.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_participant_profile_escalation ON public.profiles;
CREATE TRIGGER prevent_participant_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_participant_profile_escalation();

-- Remove conflicting broad policies before applying admin-only access.
DROP POLICY IF EXISTS "Allow all for companies" ON public.companies;
DROP POLICY IF EXISTS "Allow all for batches" ON public.batches;
DROP POLICY IF EXISTS "Authenticated users read companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users read batches" ON public.batches;
DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
DROP POLICY IF EXISTS "Admins manage batches" ON public.batches;

CREATE POLICY "Admins read companies" ON public.companies
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage companies" ON public.companies
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins read batches" ON public.batches
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage batches" ON public.batches
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Enrollment never exposes access-code rows to participants. The RPC validates
-- and assigns the canonical company/batch membership in one transaction.
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
BEGIN
  IF participant_id IS NULL THEN
    RAISE EXCEPTION 'Sesi login tidak ditemukan.';
  END IF;

  IF length(clean_code) < 3 OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'Nama dan kode program wajib diisi.';
  END IF;

  SELECT * INTO selected_batch
  FROM public.batches
  WHERE upper(access_code) = clean_code
    AND lower(COALESCE(status, 'active')) IN ('active', 'upcoming')
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

  start_at := COALESCE(existing_profile.start_date, NOW());

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
    updated_at = NOW();

  RETURN jsonb_build_object(
    'company_name', selected_batch.company_name,
    'batch_id', selected_batch.id,
    'batch_name', selected_batch.name,
    'start_date', start_at,
    'end_date', start_at + INTERVAL '89 days'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.enroll_participant_by_access_code(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enroll_participant_by_access_code(TEXT, TEXT) TO authenticated;

-- Batch-scoped PTP locking. No global fallback is allowed.
CREATE OR REPLACE FUNCTION public.lock_batch_ptps(p_batch_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengunci PTP batch.';
  END IF;

  UPDATE public.journeys j
  SET ptp_status = 'LOCKED', locked_at = NOW(), locked_by = auth.uid(), updated_at = NOW()
  WHERE j.ptp_status = 'EDITABLE'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = j.user_id AND p.batch_id = p_batch_id
    );

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

REVOKE ALL ON FUNCTION public.lock_batch_ptps(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lock_batch_ptps(UUID) TO authenticated;
