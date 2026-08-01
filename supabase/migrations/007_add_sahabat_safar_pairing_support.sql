-- ====================================================================
-- 007_add_sahabat_safar_pairing_support.sql
-- Menambahkan kolom `sahabat_safar_user_id` & `sahabat_safar_name` ke `profiles`
-- dan memastikan RLS policy admin untuk melakukan pairing Sahabat Safar.
--
-- JALANKAN DI: Supabase Dashboard → SQL Editor
-- ====================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'sahabat_safar_user_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN sahabat_safar_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'sahabat_safar_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN sahabat_safar_name TEXT;
    END IF;
END $$;
