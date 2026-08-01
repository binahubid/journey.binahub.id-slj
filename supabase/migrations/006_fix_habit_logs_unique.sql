-- ====================================================================
-- 006_fix_habit_logs_unique.sql
-- 1. Bersihkan duplikat log kebiasaan harian (keep terbaru per habit_id & date)
-- 2. Tambah UNIQUE constraint (habit_id, date) agar upsert check-in harian
--    { onConflict: "habit_id,date" } tidak gagal di Postgres.
--
-- JALANKAN DI: Supabase Dashboard → SQL Editor
-- ====================================================================

-- 1. Hapus duplikat lama (simpan yang paling terbaru berdasarkan created_at/id)
DELETE FROM public.habit_logs hl1
USING public.habit_logs hl2
WHERE hl1.habit_id = hl2.habit_id
  AND hl1.date = hl2.date
  AND hl1.id < hl2.id;

-- 2. Tambahkan UNIQUE constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'habit_logs_habit_id_date_unique'
  ) THEN
    ALTER TABLE public.habit_logs
      ADD CONSTRAINT habit_logs_habit_id_date_unique UNIQUE (habit_id, date);
  END IF;
END $$;
