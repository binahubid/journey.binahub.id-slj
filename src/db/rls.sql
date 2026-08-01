-- ========================================================
-- Row Level Security (RLS) Policies for SLJ Database
-- Source of Truth — Tanpa RLS Recursion (Agustus 2026)
-- ========================================================

-- ──────────────────────────────────────────────────────────
-- HELPER FUNCTIONS (SECURITY DEFINER Mencegah RLS Recursion)
-- ──────────────────────────────────────────────────────────

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

-- ──────────────────────────────────────────────────────────
-- ENABLE RLS ON ALL TABLES
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ptp_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadith_logs ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────
-- GRANTS (Prevents 403 Forbidden)
-- ──────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- ──────────────────────────────────────────────────────────
-- 0. COMPANIES & BATCHES
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow all for companies" ON public.companies;
CREATE POLICY "Allow all for companies" ON public.companies
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for batches" ON public.batches;
CREATE POLICY "Allow all for batches" ON public.batches
  FOR ALL TO public USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────
-- 1. PROFILES
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coach can read assigned participants profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and admin read profiles" ON public.profiles;

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

-- ──────────────────────────────────────────────────────────
-- 2. JOURNEYS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants manage own journey" ON public.journeys;
DROP POLICY IF EXISTS "Coach can read assigned participant journey" ON public.journeys;
DROP POLICY IF EXISTS "Coach and admin read assigned participant journey" ON public.journeys;

CREATE POLICY "Participants manage own journey" ON public.journeys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach and admin read assigned participant journey" ON public.journeys
  FOR SELECT USING (
    public.is_coach_of(journeys.user_id) OR public.is_admin()
  );

-- ──────────────────────────────────────────────────────────
-- 3. ACTION_PLANS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants manage own action plans" ON public.action_plans;
DROP POLICY IF EXISTS "Coach view participant action plans" ON public.action_plans;
DROP POLICY IF EXISTS "Coach and admin view participant action plans" ON public.action_plans;

CREATE POLICY "Participants manage own action plans" ON public.action_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach and admin view participant action plans" ON public.action_plans
  FOR SELECT USING (
    public.is_coach_of(action_plans.user_id) OR public.is_admin()
  );

-- ──────────────────────────────────────────────────────────
-- 4. SUPPORT_TEAM
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants manage own support team" ON public.support_team;
DROP POLICY IF EXISTS "Coach view participant support team" ON public.support_team;
DROP POLICY IF EXISTS "Coach and admin view participant support team" ON public.support_team;

CREATE POLICY "Participants manage own support team" ON public.support_team
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach and admin view participant support team" ON public.support_team
  FOR SELECT USING (
    public.is_coach_of(support_team.user_id) OR public.is_admin()
  );

-- ──────────────────────────────────────────────────────────
-- 5. PTP_SNAPSHOTS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants manage own ptp snapshots" ON public.ptp_snapshots;
DROP POLICY IF EXISTS "Admin view all ptp snapshots" ON public.ptp_snapshots;

CREATE POLICY "Participants manage own ptp snapshots" ON public.ptp_snapshots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin view all ptp snapshots" ON public.ptp_snapshots
  FOR SELECT USING (public.is_admin());

-- ──────────────────────────────────────────────────────────
-- 6. HABITS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants manage own habits" ON public.habits;
DROP POLICY IF EXISTS "Coach view participant habits" ON public.habits;
DROP POLICY IF EXISTS "Coach and admin view participant habits" ON public.habits;

CREATE POLICY "Participants manage own habits" ON public.habits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach and admin view participant habits" ON public.habits
  FOR SELECT USING (
    public.is_coach_of(habits.user_id) OR public.is_admin()
  );

-- ──────────────────────────────────────────────────────────
-- 7. HABIT_LOGS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants manage own habit logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Coach view participant habit logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Coach and admin view participant habit logs" ON public.habit_logs;

CREATE POLICY "Participants manage own habit logs" ON public.habit_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach and admin view participant habit logs" ON public.habit_logs
  FOR SELECT USING (
    public.is_coach_of(habit_logs.user_id) OR public.is_admin()
  );

-- ──────────────────────────────────────────────────────────
-- 8. JOURNALS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants full control on own journals" ON public.journals;
DROP POLICY IF EXISTS "Coach read non-private journals of assigned participant" ON public.journals;
DROP POLICY IF EXISTS "Coach and admin read non-private journals" ON public.journals;

CREATE POLICY "Participants full control on own journals" ON public.journals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach and admin read non-private journals" ON public.journals
  FOR SELECT USING (
    is_private = false AND (
      public.is_coach_of(journals.user_id) OR public.is_admin()
    )
  );

-- ──────────────────────────────────────────────────────────
-- 9. MONTHLY_REVIEWS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Participants manage own monthly reviews" ON public.monthly_reviews;
DROP POLICY IF EXISTS "Coach view and update monthly reviews" ON public.monthly_reviews;
DROP POLICY IF EXISTS "Coach and admin view/update monthly reviews" ON public.monthly_reviews;

CREATE POLICY "Participants manage own monthly reviews" ON public.monthly_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach and admin view/update monthly reviews" ON public.monthly_reviews
  FOR ALL USING (
    public.is_coach_of(monthly_reviews.user_id) OR public.is_admin()
  );

-- ──────────────────────────────────────────────────────────
-- 10. PRAYER_LOGS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users manage own prayer logs" ON public.prayer_logs;
DROP POLICY IF EXISTS "Admin view all prayer logs" ON public.prayer_logs;

CREATE POLICY "Users manage own prayer logs" ON public.prayer_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin view all prayer logs" ON public.prayer_logs
  FOR SELECT USING (public.is_admin());

-- ──────────────────────────────────────────────────────────
-- 11. QURAN_LOGS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users manage own quran logs" ON public.quran_logs;
DROP POLICY IF EXISTS "Admin view all quran logs" ON public.quran_logs;

CREATE POLICY "Users manage own quran logs" ON public.quran_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin view all quran logs" ON public.quran_logs
  FOR SELECT USING (public.is_admin());

-- ──────────────────────────────────────────────────────────
-- 12. HADITH_LOGS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users manage own hadith logs" ON public.hadith_logs;
DROP POLICY IF EXISTS "Admin view all hadith logs" ON public.hadith_logs;

CREATE POLICY "Users manage own hadith logs" ON public.hadith_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin view all hadith logs" ON public.hadith_logs
  FOR SELECT USING (public.is_admin());

-- ──────────────────────────────────────────────────────────
-- 13. ADMIN_NOTIFICATIONS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin manage broadcast notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Authenticated users read broadcast notifications" ON public.admin_notifications;

CREATE POLICY "Admin manage broadcast notifications" ON public.admin_notifications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users read broadcast notifications" ON public.admin_notifications
  FOR SELECT USING (auth.role() = 'authenticated');

-- ──────────────────────────────────────────────────────────
-- 14. USER NOTIFICATIONS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;

CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- 15. SETTINGS
-- ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users manage own settings" ON public.settings;

CREATE POLICY "Users manage own settings" ON public.settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- 16. SAHABAT SAFAR PROFILES
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.sahabat_safar_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sahabat_safar_profile" ON public.sahabat_safar_profiles;
CREATE POLICY "Users manage own sahabat_safar_profile" ON public.sahabat_safar_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin view all sahabat_safar_profile" ON public.sahabat_safar_profiles;
CREATE POLICY "Admin view all sahabat_safar_profile" ON public.sahabat_safar_profiles
  FOR SELECT USING (public.is_admin());
