-- Welcome notification for first-time enrollment

-- Add helper function to create welcome notification
CREATE OR REPLACE FUNCTION public.create_welcome_notification(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_batch_name TEXT;
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Get user info
  SELECT full_name, batch_name, start_date
  INTO v_user_name, v_batch_name, v_start_date
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User tidak ditemukan.';
  END IF;

  -- Welcome notification
  INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
  VALUES (
    p_user_id,
    'Selamat datang di BinaJourney!',
    'Halo ' || COALESCE(v_user_name, 'Sahabat BinaJourney') || '! Anda telah terdaftar di batch ' || COALESCE(v_batch_name, '—') || ' dan perjalanan 90 hari Anda dimulai hari ini.',
    'welcome',
    'welcome:' || p_user_id,
    '/dashboard'
  )
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  -- First step notification (next action)
  INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
  VALUES (
    p_user_id,
    'Langkah selanjutnya: Initial Process',
    'Lengkapi profil dan atur tujuan pertumbuhan Anda sebelum mulai membangun habit.',
    'onboarding',
    'next-step-initial-process:' || p_user_id,
    '/initial-process'
  )
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  RETURN jsonb_build_object('welcome_created', true);
END;
$$;

-- Call welcome notification on enrollment
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

  IF length(clean_code) < 3 OR length(trim(p_full_name)) < 2 THEN
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

GRANT EXECUTE ON FUNCTION public.create_welcome_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_participant_by_access_code(TEXT, TEXT) TO authenticated;
