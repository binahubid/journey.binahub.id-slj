-- Row Level Security (RLS) Policies for SLJ Database

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 0. Companies & Batches
DROP POLICY IF EXISTS "Public & Auth view companies" ON companies;
DROP POLICY IF EXISTS "Auth manage companies" ON companies;
DROP POLICY IF EXISTS "Allow all for companies" ON companies;
CREATE POLICY "Allow all for companies" ON companies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public & Auth view batches" ON batches;
DROP POLICY IF EXISTS "Auth manage batches" ON batches;
DROP POLICY IF EXISTS "Allow all for batches" ON batches;
CREATE POLICY "Allow all for batches" ON batches FOR ALL USING (true) WITH CHECK (true);

-- 1. Profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coach can read assigned participants profile" ON profiles
  FOR SELECT USING (
    auth.uid() = coach_id OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Journeys
CREATE POLICY "Participants can read own journey" ON journeys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coach can read assigned participant journey" ON journeys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = journeys.user_id AND coach_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Participants can insert/update own journey" ON journeys
  FOR ALL USING (auth.uid() = user_id);

-- 3. Habits & Habit Logs
CREATE POLICY "Participants manage own habits" ON habits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Coach view participant habits" ON habits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = habits.user_id AND coach_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Participants manage own habit logs" ON habit_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Coach view participant habit logs" ON habit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = habit_logs.user_id AND coach_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. Journals (Opt-In Privacy Enforcement)
CREATE POLICY "Participants full control on own journals" ON journals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Coach read non-private journals of assigned participant" ON journals
  FOR SELECT USING (
    is_private = false AND (
      EXISTS (SELECT 1 FROM profiles WHERE user_id = journals.user_id AND coach_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

-- 5. Monthly Reviews
CREATE POLICY "Participants & Coach view monthly reviews" ON monthly_reviews
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = monthly_reviews.user_id AND coach_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Participants update own review notes" ON monthly_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach update coach notes" ON monthly_reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = monthly_reviews.user_id AND coach_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 6. Notifications & Settings
CREATE POLICY "Users read own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own settings" ON settings
  FOR ALL USING (auth.uid() = user_id);
