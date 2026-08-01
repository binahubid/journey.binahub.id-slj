-- ====================================================================
-- 003_add_location_to_journals.sql
-- Menambahkan kolom `location` ke tabel `journals` untuk menyimpan
-- timestamp & lokasi penulisan refleksi harian.
--
-- JALANKAN DI: Supabase Dashboard → SQL Editor
-- ====================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'journals' AND column_name = 'location'
    ) THEN
        ALTER TABLE public.journals ADD COLUMN location TEXT DEFAULT 'Jakarta';
    END IF;
END $$;
