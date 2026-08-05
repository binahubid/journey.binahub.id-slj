-- ========================================================
-- SLJ (Spiritual Leadership Journey) - Supabase Database Schema
-- Run this script in the Supabase SQL Editor to initialize all tables & RLS policies
-- Safely re-executable (Idempotent)
-- ========================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE journey_status AS ENUM (
      'DRAFT',
      'ONBOARDING',
      'ACTIVE',
      'CHECKPOINT_1',
      'CHECKPOINT_2',
      'CHECKPOINT_3',
      'COMPLETED',
      'ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
      'participant',
      'coach',
      'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  name TEXT NOT NULL,
  access_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  start_date TEXT,
  end_date TEXT,
  coach_id UUID,
  coach_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  program_code TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'participant',
  location TEXT NOT NULL DEFAULT 'Jakarta',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  coach_id UUID,
  sahabat_safar_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  sahabat_safar_name TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. JOURNEYS TABLE (PTP Document)
CREATE TABLE IF NOT EXISTS public.journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status journey_status NOT NULL DEFAULT 'DRAFT',
  ptp_status TEXT NOT NULL DEFAULT 'EDITABLE', -- 'EDITABLE' | 'LOCKED'
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by UUID,
  muhasabah TEXT,
  niat TEXT,
  area_transformasi JSONB NOT NULL DEFAULT '[]'::jsonb,
  main_target TEXT,
  success_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  ptp_draft JSONB,
  ptp_draft_updated_at TIMESTAMP WITH TIME ZONE,
  ptp_published_at TIMESTAMP WITH TIME ZONE,
  final_reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. ACTION PLANS TABLE
CREATE TABLE IF NOT EXISTS public.action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  frequency TEXT NOT NULL DEFAULT 'daily',
  reminder_time TEXT,
  target INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. HABITS TABLE
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  action_plan_id UUID,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  frequency TEXT NOT NULL DEFAULT 'daily',
  reminder_time TEXT,
  target INT NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'manual',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7b. PTP SNAPSHOTS TABLE (Audit History)
CREATE TABLE IF NOT EXISTS public.ptp_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INT NOT NULL DEFAULT 1,
  trigger_type TEXT NOT NULL DEFAULT 'INITIAL', -- 'INITIAL' | 'REVISION' | 'LOCKED'
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. HABIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  activity_date DATE,
  occurrence_start DATE,
  is_canonical_occurrence BOOLEAN NOT NULL DEFAULT TRUE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_count INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT habit_logs_habit_id_date_unique UNIQUE (habit_id, date)
);

-- 9. JOURNALS TABLE
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  content TEXT NOT NULL,
  location TEXT DEFAULT 'Jakarta',
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  ai_polished_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 10. MONTHLY REVIEWS TABLE (3 Checkpoints)
CREATE TABLE IF NOT EXISTS public.monthly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  month_number INT NOT NULL, -- 1, 2, or 3
  status TEXT NOT NULL DEFAULT 'ON_TRACK',
  participant_note TEXT,
  coach_note TEXT,
  coach_replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 11. ADMIN NOTIFICATIONS BROADCAST TABLE
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_scope TEXT NOT NULL DEFAULT 'all',
  target_id TEXT,
  target_label TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  sent_by TEXT NOT NULL DEFAULT 'Super Admin',
  recipient_count INT NOT NULL DEFAULT 0
);

-- 12. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  prayer_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  habit_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  journal_privacy_default BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_prayer_city TEXT NOT NULL DEFAULT 'Jakarta',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 13. SAHABAT SAFAR PROFILES TABLE (Initial Process)
CREATE TABLE IF NOT EXISTS public.sahabat_safar_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  layer1 JSONB DEFAULT '{}'::jsonb,
  layer2 JSONB DEFAULT '{}'::jsonb,
  layer3 JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================================
-- ENABLE ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
-- 13. SUPPORT TEAM TABLE
CREATE TABLE IF NOT EXISTS public.support_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_name TEXT,
  coach_email TEXT,
  sahabat_safar_name TEXT,
  sahabat_safar_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 14. USER NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'reminder',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- RLS POLICIES: lihat src/db/rls.sql sebagai source of truth
-- Jalankan rls.sql terpisah setelah schema ini.
-- ========================================================

-- GRANT TABLE PERMISSIONS TO ALL ROLES (Prevents 403 Forbidden)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- TRIGGER TO AUTOMATICALLY CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'participant'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── HABIT TRACKING TABLES ───
CREATE TABLE IF NOT EXISTS public.prayer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    prayer_name TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date, prayer_name)
);

CREATE TABLE IF NOT EXISTS public.quran_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    surah_name TEXT NOT NULL,
    total_ayat INT NOT NULL,
    from_ayat INT NOT NULL,
    to_ayat INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hadith_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadith_logs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
