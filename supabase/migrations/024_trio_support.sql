-- Trio support: backdoor for odd-numbered participants.
-- Adds trio_id to profiles and 3 RPCs: pair_trio, unpair_trio_member, dissolve_trio.

-- 1. Add trio_id column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trio_id UUID;

-- 2. RPC: pair_trio — Create a trio from an existing pair + 1 unpaired person
CREATE OR REPLACE FUNCTION public.pair_trio(
  p_user_a UUID,
  p_user_b UUID,
  p_unpaired UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_a public.profiles%ROWTYPE;
  profile_b public.profiles%ROWTYPE;
  profile_u public.profiles%ROWTYPE;
  new_trio_id UUID := gen_random_uuid();
  journey_a UUID;
  journey_b UUID;
  journey_u UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat membuat Trio Sahabat Safar.';
  END IF;

  IF p_user_a IS NULL OR p_user_b IS NULL OR p_unpaired IS NULL THEN
    RAISE EXCEPTION 'Data trio tidak lengkap.';
  END IF;

  IF p_user_a = p_user_b OR p_user_a = p_unpaired OR p_user_b = p_unpaired THEN
    RAISE EXCEPTION 'Tidak boleh ada user duplikat dalam satu trio.';
  END IF;

  -- Lock all three profiles
  SELECT * INTO profile_a FROM public.profiles WHERE user_id = p_user_a FOR UPDATE;
  SELECT * INTO profile_b FROM public.profiles WHERE user_id = p_user_b FOR UPDATE;
  SELECT * INTO profile_u FROM public.profiles WHERE user_id = p_unpaired FOR UPDATE;

  -- Validate all three exist and are participants
  IF profile_a.user_id IS NULL OR profile_b.user_id IS NULL OR profile_u.user_id IS NULL
     OR profile_a.role <> 'participant'::user_role
     OR profile_b.role <> 'participant'::user_role
     OR profile_u.role <> 'participant'::user_role THEN
    RAISE EXCEPTION 'Ketiga akun harus merupakan peserta aktif.';
  END IF;

  -- A and B must already be paired with each other
  IF profile_a.sahabat_safar_user_id IS DISTINCT FROM p_user_b
     OR profile_b.sahabat_safar_user_id IS DISTINCT FROM p_user_a THEN
    RAISE EXCEPTION 'Peserta A dan B harus sudah menjadi pasangan Sahabat Safar.';
  END IF;

  -- Unpaired must not already have a partner or trio
  IF profile_u.sahabat_safar_user_id IS NOT NULL OR profile_u.trio_id IS NOT NULL THEN
    RAISE EXCEPTION 'Peserta yang akan bergabung sudah memiliki pasangan atau trio.';
  END IF;

  -- All three must have completed Initial Process
  IF NOT EXISTS (SELECT 1 FROM public.sahabat_safar_profiles WHERE user_id = p_user_a AND is_completed = true)
     OR NOT EXISTS (SELECT 1 FROM public.sahabat_safar_profiles WHERE user_id = p_user_b AND is_completed = true)
     OR NOT EXISTS (SELECT 1 FROM public.sahabat_safar_profiles WHERE user_id = p_unpaired AND is_completed = true) THEN
    RAISE EXCEPTION 'Ketiga peserta harus menyelesaikan Initial Process.';
  END IF;

  -- All three must have journeys
  SELECT id INTO journey_a FROM public.journeys WHERE user_id = p_user_a ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO journey_b FROM public.journeys WHERE user_id = p_user_b ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO journey_u FROM public.journeys WHERE user_id = p_unpaired ORDER BY created_at DESC LIMIT 1;

  IF journey_a IS NULL OR journey_b IS NULL OR journey_u IS NULL THEN
    RAISE EXCEPTION 'Journey salah satu peserta belum tersedia.';
  END IF;

  -- Set trio_id on all three
  UPDATE public.profiles SET trio_id = new_trio_id WHERE user_id IN (p_user_a, p_user_b, p_unpaired);

  -- Update support_team for unpaired person (add sahabat_safar link)
  INSERT INTO public.support_team (user_id, journey_id, sahabat_safar_user_id, sahabat_safar_name, updated_at)
  VALUES (p_unpaired, journey_u, p_user_a, profile_a.full_name, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET journey_id = EXCLUDED.journey_id,
        sahabat_safar_user_id = EXCLUDED.sahabat_safar_user_id,
        sahabat_safar_name = EXCLUDED.sahabat_safar_name,
        updated_at = NOW();

  RETURN jsonb_build_object(
    'trio_id', new_trio_id,
    'user_a', p_user_a,
    'user_b', p_user_b,
    'user_u', p_unpaired,
    'name_a', profile_a.full_name,
    'name_b', profile_b.full_name,
    'name_u', profile_u.full_name
  );
END;
$$;

-- 3. RPC: unpair_trio_member — Remove 1 member from a trio; remaining 2 stay paired
CREATE OR REPLACE FUNCTION public.unpair_trio_member(
  p_trio_id UUID,
  p_user_to_remove UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_users UUID[];
  r_user UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengubah Trio Sahabat Safar.';
  END IF;

  IF p_trio_id IS NULL OR p_user_to_remove IS NULL THEN
    RAISE EXCEPTION 'Data tidak lengkap.';
  END IF;

  -- Verify the user is part of this trio
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = p_user_to_remove AND trio_id = p_trio_id
  ) THEN
    RAISE EXCEPTION 'Peserta tersebut bukan anggota trio ini.';
  END IF;

  -- Collect remaining users
  SELECT array_agg(user_id) INTO remaining_users
  FROM public.profiles WHERE trio_id = p_trio_id AND user_id <> p_user_to_remove;

  -- Clear trio_id from the removed user
  UPDATE public.profiles
  SET trio_id = NULL, sahabat_safar_user_id = NULL, sahabat_safar_name = NULL
  WHERE user_id = p_user_to_remove;

  -- Clear support_team for removed user
  UPDATE public.support_team
  SET sahabat_safar_user_id = NULL, sahabat_safar_name = NULL, updated_at = NOW()
  WHERE user_id = p_user_to_remove;

  -- Clear trio_id from remaining users (they revert to a pair)
  IF remaining_users IS NOT NULL THEN
    FOREACH r_user IN ARRAY remaining_users LOOP
      UPDATE public.profiles SET trio_id = NULL WHERE user_id = r_user;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'trio_id', p_trio_id,
    'removed_user', p_user_to_remove,
    'remaining_users', remaining_users
  );
END;
$$;

-- 4. RPC: dissolve_trio — Break apart a trio; all 3 become unpaired
CREATE OR REPLACE FUNCTION public.dissolve_trio(p_trio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_ids UUID[];
  m UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat membubarkan Trio Sahabat Safar.';
  END IF;

  IF p_trio_id IS NULL THEN
    RAISE EXCEPTION 'Trio ID tidak valid.';
  END IF;

  SELECT array_agg(user_id) INTO member_ids
  FROM public.profiles WHERE trio_id = p_trio_id;

  IF member_ids IS NULL OR array_length(member_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Trio tidak ditemukan.';
  END IF;

  -- Clear trio_id and pair links for all members
  FOREACH m IN ARRAY member_ids LOOP
    UPDATE public.profiles
    SET trio_id = NULL, sahabat_safar_user_id = NULL, sahabat_safar_name = NULL
    WHERE user_id = m;

    UPDATE public.support_team
    SET sahabat_safar_user_id = NULL, sahabat_safar_name = NULL, updated_at = NOW()
    WHERE user_id = m;
  END LOOP;

  RETURN jsonb_build_object(
    'trio_id', p_trio_id,
    'dissolved_members', member_ids
  );
END;
$$;

-- 5. Grants
REVOKE ALL ON FUNCTION public.pair_trio(UUID, UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unpair_trio_member(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dissolve_trio(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pair_trio(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unpair_trio_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dissolve_trio(UUID) TO authenticated;
