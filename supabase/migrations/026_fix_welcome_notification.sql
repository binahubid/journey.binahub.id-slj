-- Fix: batch_name column does not exist in profiles
-- profiles only has batch_id. batch name is in batches table.

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
  -- Get user info (join with batches to get batch name)
  SELECT p.full_name, b.name AS batch_name, p.start_date
  INTO v_user_name, v_batch_name, v_start_date
  FROM public.profiles p
  LEFT JOIN public.batches b ON b.id = p.batch_id
  WHERE p.user_id = p_user_id;

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
