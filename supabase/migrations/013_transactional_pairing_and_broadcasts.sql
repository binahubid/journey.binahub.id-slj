-- Transactional Sahabat Safar pairing and validated admin broadcasts.

-- support_team is one canonical support record per participant.
DELETE FROM public.support_team duplicate
USING public.support_team retained
WHERE duplicate.user_id = retained.user_id
  AND duplicate.id > retained.id;

-- Pastikan kolom updated_at ada (dibuat sebelum migration 013 tanpa kolom ini).
ALTER TABLE public.support_team ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS support_team_user_id_key
  ON public.support_team (user_id);

CREATE OR REPLACE FUNCTION public.pair_sahabat_safar(
  p_user_a UUID,
  p_user_b UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_a public.profiles%ROWTYPE;
  profile_b public.profiles%ROWTYPE;
  journey_a UUID;
  journey_b UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat memasangkan Sahabat Safar.';
  END IF;

  IF p_user_a IS NULL OR p_user_b IS NULL OR p_user_a = p_user_b THEN
    RAISE EXCEPTION 'Pasangan Sahabat Safar tidak valid.';
  END IF;

  SELECT * INTO profile_a FROM public.profiles WHERE user_id = p_user_a FOR UPDATE;
  SELECT * INTO profile_b FROM public.profiles WHERE user_id = p_user_b FOR UPDATE;

  IF profile_a.user_id IS NULL OR profile_b.user_id IS NULL
     OR profile_a.role <> 'participant'::user_role
     OR profile_b.role <> 'participant'::user_role THEN
    RAISE EXCEPTION 'Kedua akun harus merupakan peserta aktif.';
  END IF;

  IF profile_a.sahabat_safar_user_id IS NOT NULL OR profile_b.sahabat_safar_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Salah satu peserta sudah memiliki Sahabat Safar.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sahabat_safar_profiles
    WHERE user_id = p_user_a AND is_completed = true
  ) OR NOT EXISTS (
    SELECT 1 FROM public.sahabat_safar_profiles
    WHERE user_id = p_user_b AND is_completed = true
  ) THEN
    RAISE EXCEPTION 'Kedua peserta harus menyelesaikan Initial Process.';
  END IF;

  SELECT id INTO journey_a FROM public.journeys WHERE user_id = p_user_a ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO journey_b FROM public.journeys WHERE user_id = p_user_b ORDER BY created_at DESC LIMIT 1;

  IF journey_a IS NULL OR journey_b IS NULL THEN
    RAISE EXCEPTION 'Journey peserta belum tersedia.';
  END IF;

  UPDATE public.profiles
  SET sahabat_safar_user_id = p_user_b, sahabat_safar_name = profile_b.full_name
  WHERE user_id = p_user_a;

  UPDATE public.profiles
  SET sahabat_safar_user_id = p_user_a, sahabat_safar_name = profile_a.full_name
  WHERE user_id = p_user_b;

  INSERT INTO public.support_team (user_id, journey_id, sahabat_safar_user_id, sahabat_safar_name, updated_at)
  VALUES (p_user_a, journey_a, p_user_b, profile_b.full_name, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET journey_id = EXCLUDED.journey_id,
        sahabat_safar_user_id = EXCLUDED.sahabat_safar_user_id,
        sahabat_safar_name = EXCLUDED.sahabat_safar_name,
        updated_at = NOW();

  INSERT INTO public.support_team (user_id, journey_id, sahabat_safar_user_id, sahabat_safar_name, updated_at)
  VALUES (p_user_b, journey_b, p_user_a, profile_a.full_name, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET journey_id = EXCLUDED.journey_id,
        sahabat_safar_user_id = EXCLUDED.sahabat_safar_user_id,
        sahabat_safar_name = EXCLUDED.sahabat_safar_name,
        updated_at = NOW();

  RETURN jsonb_build_object(
    'user_a', p_user_a,
    'user_b', p_user_b,
    'name_a', profile_a.full_name,
    'name_b', profile_b.full_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unpair_sahabat_safar(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat melepas pasangan Sahabat Safar.';
  END IF;

  SELECT sahabat_safar_user_id INTO partner_id
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF partner_id IS NULL THEN
    RAISE EXCEPTION 'Peserta belum memiliki Sahabat Safar.';
  END IF;

  PERFORM 1 FROM public.profiles WHERE user_id = partner_id FOR UPDATE;

  UPDATE public.profiles
  SET sahabat_safar_user_id = NULL, sahabat_safar_name = NULL
  WHERE user_id IN (p_user_id, partner_id);

  UPDATE public.support_team
  SET sahabat_safar_user_id = NULL, sahabat_safar_name = NULL, updated_at = NOW()
  WHERE user_id IN (p_user_id, partner_id);

  RETURN jsonb_build_object('user_id', p_user_id, 'partner_id', partner_id);
END;
$$;

REVOKE ALL ON FUNCTION public.pair_sahabat_safar(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unpair_sahabat_safar(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pair_sahabat_safar(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unpair_sahabat_safar(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.send_admin_broadcast(
  p_title TEXT,
  p_message TEXT,
  p_target_scope TEXT,
  p_target_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id UUID := auth.uid();
  actor_name TEXT;
  target_label TEXT;
  broadcast_id UUID;
  v_recipient_count INTEGER := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengirim broadcast.';
  END IF;

  IF length(trim(p_title)) < 3 OR length(trim(p_message)) < 3 THEN
    RAISE EXCEPTION 'Judul dan pesan wajib diisi.';
  END IF;

  IF p_target_scope NOT IN ('all', 'company', 'batch', 'coach', 'participant') THEN
    RAISE EXCEPTION 'Scope broadcast tidak valid.';
  END IF;

  IF p_target_scope <> 'all' AND p_target_id IS NULL THEN
    RAISE EXCEPTION 'Target broadcast wajib dipilih.';
  END IF;

  SELECT COALESCE(NULLIF(full_name, ''), 'Administrator') INTO actor_name
  FROM public.profiles WHERE user_id = actor_id;

  CASE p_target_scope
    WHEN 'all' THEN target_label := 'Semua Peserta';
    WHEN 'company' THEN
      SELECT 'Perusahaan: ' || name INTO target_label FROM public.companies WHERE id = p_target_id;
    WHEN 'batch' THEN
      SELECT 'Batch: ' || company_name || ' — ' || name INTO target_label FROM public.batches WHERE id = p_target_id;
    WHEN 'coach' THEN
      SELECT 'Kelompok Bimbingan: ' || COALESCE(NULLIF(full_name, ''), 'Coach')
      INTO target_label FROM public.profiles WHERE user_id = p_target_id AND role = 'coach'::user_role;
    WHEN 'participant' THEN
      SELECT 'Peserta: ' || COALESCE(NULLIF(full_name, ''), 'Peserta')
      INTO target_label FROM public.profiles WHERE user_id = p_target_id AND role = 'participant'::user_role;
  END CASE;

  IF target_label IS NULL THEN
    RAISE EXCEPTION 'Target broadcast tidak ditemukan.';
  END IF;

  INSERT INTO public.admin_notifications (
    title, message, target_scope, target_id, target_label, sent_by, recipient_count
  ) VALUES (
    trim(p_title), trim(p_message), p_target_scope, p_target_id::TEXT, target_label, actor_name, 0
  ) RETURNING id INTO broadcast_id;

  WITH recipients AS (
    SELECT DISTINCT p.user_id
    FROM public.profiles p
    WHERE p.role = 'participant'::user_role
      AND CASE p_target_scope
        WHEN 'all' THEN true
        WHEN 'company' THEN p.company_id = p_target_id
        WHEN 'batch' THEN p.batch_id = p_target_id
        WHEN 'coach' THEN p.coach_id = p_target_id
        WHEN 'participant' THEN p.user_id = p_target_id
        ELSE false
      END
  ), inserted AS (
    INSERT INTO public.notifications (user_id, title, message, category, is_read)
    SELECT user_id, trim(p_title), trim(p_message), 'broadcast', false
    FROM recipients
    RETURNING id
  )
  SELECT COUNT(*) INTO v_recipient_count FROM inserted;

  UPDATE public.admin_notifications
  SET recipient_count = v_recipient_count
  WHERE id = broadcast_id;

  RETURN jsonb_build_object(
    'id', broadcast_id,
    'target_label', target_label,
    'recipient_count', v_recipient_count,
    'sent_by', actor_name,
    'sent_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.send_admin_broadcast(TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_admin_broadcast(TEXT, TEXT, TEXT, UUID) TO authenticated;
