-- ====================================================================
-- 004_fix_rls_infinite_recursion.sql
-- Fix bug: "infinite recursion detected in policy for relation profiles"
--
-- Penyebab: Policy RLS pada `profiles` melakukan query `SELECT ... FROM profiles`,
-- yang menyebabkan Postgres memanggil policy RLS `profiles` secara rekursif tanpa henti.
--
-- Solusi: Gunakan SECURITY DEFINER helper function (is_admin() & is_coach_of())
-- yang mengeksekusi query role tanpa memicu RLS recursion.
--
-- JALANKAN DI: Supabase Dashboard → SQL Editor
-- ====================================================================

-- ──────────────────────────────────────────────────────────────────────
-- 1. HELPER FUNCTIONS (SECURITY DEFINER untuk Bypass RLS Recursion)
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_coach_of(participant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = participant_id AND coach_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ──────────────────────────────────────────────────────────────────────
-- 2. REFIX PROFILES POLICIES
-- ──────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coach can read assigned participants profile" ON public.profiles;

CREATE POLICY "Users and admin read profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR coach_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ──────────────────────────────────────────────────────────────────────
-- 3. REFIX OTHER POLICIES TO USE HELPER FUNCTIONS
-- ──────────────────────────────────────────────────────────────────────

-- JOURNEYS
DROP POLICY IF EXISTS "Coach can read assigned participant journey" ON public.journeys;
CREATE POLICY "Coach and admin read assigned participant journey" ON public.journeys
  FOR SELECT USING (
    public.is_coach_of(journeys.user_id) OR public.is_admin()
  );

-- ACTION_PLANS
DROP POLICY IF EXISTS "Coach view participant action plans" ON public.action_plans;
CREATE POLICY "Coach and admin view participant action plans" ON public.action_plans
  FOR SELECT USING (
    public.is_coach_of(action_plans.user_id) OR public.is_admin()
  );

-- SUPPORT_TEAM
DROP POLICY IF EXISTS "Coach view participant support team" ON public.support_team;
CREATE POLICY "Coach and admin view participant support team" ON public.support_team
  FOR SELECT USING (
    public.is_coach_of(support_team.user_id) OR public.is_admin()
  );

-- PTP_SNAPSHOTS
DROP POLICY IF EXISTS "Admin view all ptp snapshots" ON public.ptp_snapshots;
CREATE POLICY "Admin view all ptp snapshots" ON public.ptp_snapshots
  FOR SELECT USING (public.is_admin());

-- HABITS
DROP POLICY IF EXISTS "Coach view participant habits" ON public.habits;
CREATE POLICY "Coach and admin view participant habits" ON public.habits
  FOR SELECT USING (
    public.is_coach_of(habits.user_id) OR public.is_admin()
  );

-- HABIT_LOGS
DROP POLICY IF EXISTS "Coach view participant habit logs" ON public.habit_logs;
CREATE POLICY "Coach and admin view participant habit logs" ON public.habit_logs
  FOR SELECT USING (
    public.is_coach_of(habit_logs.user_id) OR public.is_admin()
  );

-- JOURNALS
DROP POLICY IF EXISTS "Coach read non-private journals of assigned participant" ON public.journals;
CREATE POLICY "Coach and admin read non-private journals" ON public.journals
  FOR SELECT USING (
    is_private = false AND (
      public.is_coach_of(journals.user_id) OR public.is_admin()
    )
  );

-- MONTHLY_REVIEWS
DROP POLICY IF EXISTS "Coach view and update monthly reviews" ON public.monthly_reviews;
CREATE POLICY "Coach and admin view/update monthly reviews" ON public.monthly_reviews
  FOR ALL USING (
    public.is_coach_of(monthly_reviews.user_id) OR public.is_admin()
  );

-- PRAYER_LOGS
DROP POLICY IF EXISTS "Admin view all prayer logs" ON public.prayer_logs;
CREATE POLICY "Admin view all prayer logs" ON public.prayer_logs
  FOR SELECT USING (public.is_admin());

-- QURAN_LOGS
DROP POLICY IF EXISTS "Admin view all quran logs" ON public.quran_logs;
CREATE POLICY "Admin view all quran logs" ON public.quran_logs
  FOR SELECT USING (public.is_admin());

-- HADITH_LOGS
DROP POLICY IF EXISTS "Admin view all hadith logs" ON public.hadith_logs;
CREATE POLICY "Admin view all hadith logs" ON public.hadith_logs
  FOR SELECT USING (public.is_admin());

-- ADMIN_NOTIFICATIONS
DROP POLICY IF EXISTS "Admin manage broadcast notifications" ON public.admin_notifications;
CREATE POLICY "Admin manage broadcast notifications" ON public.admin_notifications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ====================================================================
-- SELESAI. Infinite recursion pada tabel profiles teratasi 100%.
-- ====================================================================
