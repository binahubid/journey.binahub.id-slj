-- ====================================================================
-- 002_fix_journeys_unique_and_cleanup.sql
-- 1. Bersihkan row duplikat journeys (keep terbaru per user)
-- 2. Pindahkan relasi (action_plans, ptp_snapshots, support_team) 
--    dari journey lama ke journey terbaru agar data tidak yatim
-- 3. Tambah UNIQUE constraint pada user_id
--
-- JALANKAN DI: Supabase Dashboard → SQL Editor
-- JALANKAN SETELAH: 001_fix_rls_policies.sql
-- ====================================================================

-- ──────────────────────────────────────────────────────────────────────
-- STEP 1: Identifikasi journey terbaru per user (yang akan di-keep)
-- ──────────────────────────────────────────────────────────────────────

-- Buat temp table berisi journey_id yang BUKAN terbaru (akan dihapus)
CREATE TEMP TABLE _journeys_to_remove AS
SELECT j.id, j.user_id
FROM public.journeys j
WHERE j.id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.journeys
  ORDER BY user_id, created_at DESC
);

-- Buat temp table berisi journey_id terbaru per user (akan di-keep)
CREATE TEMP TABLE _journeys_to_keep AS
SELECT DISTINCT ON (user_id) id, user_id
FROM public.journeys
ORDER BY user_id, created_at DESC;

-- ──────────────────────────────────────────────────────────────────────
-- STEP 2: Pindahkan relasi dari journey lama ke journey terbaru
--         agar data action_plans, ptp_snapshots, support_team tidak hilang
-- ──────────────────────────────────────────────────────────────────────

-- Pindahkan action_plans
UPDATE public.action_plans ap
SET journey_id = k.id
FROM _journeys_to_remove r
JOIN _journeys_to_keep k ON k.user_id = r.user_id
WHERE ap.journey_id = r.id;

-- Pindahkan ptp_snapshots
UPDATE public.ptp_snapshots ps
SET journey_id = k.id
FROM _journeys_to_remove r
JOIN _journeys_to_keep k ON k.user_id = r.user_id
WHERE ps.journey_id = r.id;

-- Pindahkan support_team
UPDATE public.support_team st
SET journey_id = k.id
FROM _journeys_to_remove r
JOIN _journeys_to_keep k ON k.user_id = r.user_id
WHERE st.journey_id = r.id;

-- ──────────────────────────────────────────────────────────────────────
-- STEP 3: Hapus journey duplikat (yang bukan terbaru)
-- ──────────────────────────────────────────────────────────────────────

DELETE FROM public.journeys
WHERE id IN (SELECT id FROM _journeys_to_remove);

-- Bersihkan temp tables
DROP TABLE IF EXISTS _journeys_to_remove;
DROP TABLE IF EXISTS _journeys_to_keep;

-- ──────────────────────────────────────────────────────────────────────
-- STEP 4: Tambah UNIQUE constraint agar tidak bisa duplikat lagi
-- ──────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'journeys_user_id_unique'
  ) THEN
    ALTER TABLE public.journeys
      ADD CONSTRAINT journeys_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- ====================================================================
-- SELESAI. Sekarang setiap user hanya bisa punya 1 journey.
-- Upsert di frontend harus menggunakan onConflict: "user_id"
-- ====================================================================
