-- ====================================================================
-- 021_company_lifecycle_rpcs.sql
-- RPCs untuk lifecycle perusahaan: update, deactivate, guard referential.
-- ====================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. UPDATE COMPANY (edit nama, status)
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_company(
  p_company_id UUID,
  p_name TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_rec RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengubah data perusahaan.';
  END IF;

  SELECT id, name, status INTO company_rec
  FROM public.companies WHERE id = p_company_id;

  IF company_rec IS NULL THEN
    RAISE EXCEPTION 'Perusahaan tidak ditemukan.';
  END IF;

  UPDATE public.companies
  SET
    name = COALESCE(p_name, name),
    status = COALESCE(p_status, status)
  WHERE id = p_company_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.update_company(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_company(UUID, TEXT, TEXT) TO authenticated;

-- ──────────────────────────────────────────────────────────────
-- 2. DEACTIVATE COMPANY (soft delete, guard referential)
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.deactivate_company(
  p_company_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_batch_count INT;
  active_participant_count INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menonaktifkan perusahaan.';
  END IF;

  -- Guard: cek apakah ada batch aktif
  SELECT COUNT(*) INTO active_batch_count
  FROM public.batches
  WHERE company_id = p_company_id AND status = 'Active';

  IF active_batch_count > 0 THEN
    RAISE EXCEPTION 'Tidak dapat menonaktifkan perusahaan dengan % batch aktif. Nonaktifkan atau selesaikan batch terlebih dahulu.', active_batch_count;
  END IF;

  -- Guard: cek apakah ada peserta aktif (ONBOARDING atau ACTIVE journey)
  SELECT COUNT(*) INTO active_participant_count
  FROM public.profiles p
  LEFT JOIN public.current_user_journeys cuj ON cuj.user_id = p.user_id
  WHERE p.company_id = p_company_id
    AND (cuj.status IS NULL OR cuj.status IN ('ONBOARDING', 'ACTIVE'));

  IF active_participant_count > 0 THEN
    RAISE EXCEPTION 'Tidak dapat menonaktifkan perusahaan dengan % peserta aktif. Pastikan semua peserta telah menyelesaikan perjalanan.', active_participant_count;
  END IF;

  -- Deactivate
  UPDATE public.companies
  SET status = 'Inactive'
  WHERE id = p_company_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_company(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_company(UUID) TO authenticated;

-- ──────────────────────────────────────────────────────────────
-- 3. REACTIVATE COMPANY
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reactivate_company(
  p_company_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengaktifkan kembali perusahaan.';
  END IF;

  UPDATE public.companies
  SET status = 'Active'
  WHERE id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perusahaan tidak ditemukan.';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reactivate_company(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reactivate_company(UUID) TO authenticated;

-- ──────────────────────────────────────────────────────────────
-- 4. DELETE COMPANY (hard delete, guard referential ketat)
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.delete_company(
  p_company_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  batch_count INT;
  participant_count INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menghapus perusahaan.';
  END IF;

  -- Guard: cek apakah ada batch
  SELECT COUNT(*) INTO batch_count
  FROM public.batches
  WHERE company_id = p_company_id;

  IF batch_count > 0 THEN
    RAISE EXCEPTION 'Tidak dapat menghapus perusahaan dengan % batch. Hapus batch terlebih dahulu.', batch_count;
  END IF;

  -- Guard: cek apakah ada peserta
  SELECT COUNT(*) INTO participant_count
  FROM public.profiles
  WHERE company_id = p_company_id;

  IF participant_count > 0 THEN
    RAISE EXCEPTION 'Tidak dapat menghapus perusahaan dengan % peserta terdaftar.', participant_count;
  END IF;

  DELETE FROM public.companies WHERE id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perusahaan tidak ditemukan.';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_company(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_company(UUID) TO authenticated;

-- ──────────────────────────────────────────────────────────────
-- 5. GET COMPANY REFERENTIAL STATUS (for UI guards)
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_company_referential_status(
  p_company_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  batch_count INT;
  active_batch_count INT;
  participant_count INT;
  active_participant_count INT;
  coach_count INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat melihat status referensi.';
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'Active')
  INTO batch_count, active_batch_count
  FROM public.batches WHERE company_id = p_company_id;

  SELECT COUNT(*), COUNT(*) FILTER (
    WHERE cuj.status IS NULL OR cuj.status IN ('ONBOARDING', 'ACTIVE')
  )
  INTO participant_count, active_participant_count
  FROM public.profiles p
  LEFT JOIN public.current_user_journeys cuj ON cuj.user_id = p.user_id
  WHERE p.company_id = p_company_id;

  SELECT COUNT(DISTINCT coach_id) INTO coach_count
  FROM public.batches
  WHERE company_id = p_company_id AND coach_id IS NOT NULL;

  result := jsonb_build_object(
    'batch_count', batch_count,
    'active_batch_count', active_batch_count,
    'participant_count', participant_count,
    'active_participant_count', active_participant_count,
    'coach_count', coach_count,
    'can_deactivate', active_batch_count = 0 AND active_participant_count = 0,
    'can_delete', batch_count = 0 AND participant_count = 0
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_company_referential_status(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_company_referential_status(UUID) TO authenticated;
