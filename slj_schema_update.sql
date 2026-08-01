-- ====================================================================
-- SLJ BinaJourney Complete Schema Update Script for Supabase SQL Editor
-- Run this script in Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Safar Reminders Log (Ingatkan Sahabat Safar)
CREATE TABLE IF NOT EXISTS public.safar_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sahabat_safar_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reminded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure sahabat_safar_user_id column exists on support_team
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'support_team' AND column_name = 'sahabat_safar_user_id'
    ) THEN
        ALTER TABLE public.support_team ADD COLUMN sahabat_safar_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'safar_reminders' AND column_name = 'sahabat_safar_user_id'
    ) THEN
        ALTER TABLE public.safar_reminders ADD COLUMN sahabat_safar_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- RLS for safar_reminders
ALTER TABLE public.safar_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own safar reminders" ON public.safar_reminders;
CREATE POLICY "Users can insert their own safar reminders"
    ON public.safar_reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own safar reminders" ON public.safar_reminders;
CREATE POLICY "Users can view their own safar reminders"
    ON public.safar_reminders FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = sahabat_safar_user_id);

DROP POLICY IF EXISTS "Admins can view all safar reminders" ON public.safar_reminders;
CREATE POLICY "Admins can view all safar reminders"
    ON public.safar_reminders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Batches table auto_lock_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'batches' AND column_name = 'auto_lock_at'
    ) THEN
        ALTER TABLE public.batches ADD COLUMN auto_lock_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Action Plans & Habits columns (quantity & area_category)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'action_plans' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.action_plans ADD COLUMN quantity INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'action_plans' AND column_name = 'area_category'
    ) THEN
        ALTER TABLE public.action_plans ADD COLUMN area_category TEXT DEFAULT 'Spiritual Growth';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'habits' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.habits ADD COLUMN quantity INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'habits' AND column_name = 'area_category'
    ) THEN
        ALTER TABLE public.habits ADD COLUMN area_category TEXT DEFAULT 'Spiritual Growth';
    END IF;
END $$;

-- 4. Habit Logs completed_count column (for items with quantity > 1)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'habit_logs' AND column_name = 'completed_count'
    ) THEN
        ALTER TABLE public.habit_logs ADD COLUMN completed_count INT DEFAULT 1;
    END IF;
END $$;

-- 5. Monthly Indicator Reports (Indicator 4-dimension tracking)
CREATE TABLE IF NOT EXISTS public.monthly_indicator_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE,
    month_number INT NOT NULL CHECK (month_number BETWEEN 1 AND 3),
    area TEXT NOT NULL,
    kualitas_target TEXT,
    kualitas_actual_rating INT CHECK (kualitas_actual_rating BETWEEN 1 AND 5),
    kuantitas_baseline NUMERIC,
    kuantitas_target NUMERIC,
    kuantitas_actual NUMERIC,
    waktu_target TEXT,
    waktu_actual_days INT,
    biaya_target NUMERIC,
    biaya_actual NUMERIC,
    score_percentage NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_number, area)
);

ALTER TABLE public.monthly_indicator_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own monthly indicator reports" ON public.monthly_indicator_reports;
CREATE POLICY "Users can manage their own monthly indicator reports"
    ON public.monthly_indicator_reports FOR ALL
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all monthly indicator reports" ON public.monthly_indicator_reports;
CREATE POLICY "Admins can view all monthly indicator reports"
    ON public.monthly_indicator_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 6. Helper function to auto-lock journeys when auto_lock_at has passed
CREATE OR REPLACE FUNCTION public.check_and_lock_batch_journeys()
RETURNS VOID AS $$
BEGIN
    UPDATE public.journeys
    SET ptp_status = 'LOCKED',
        locked_at = NOW()
    WHERE ptp_status = 'EDITABLE'
      AND user_id IN (
          SELECT p.user_id FROM public.profiles p
          JOIN public.batches b ON p.program_code = b.access_code OR p.batch_id = b.id
          WHERE b.auto_lock_at IS NOT NULL AND NOW() >= b.auto_lock_at
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Manager Supervisor Ratings Table (Validasi Atasan)
CREATE TABLE IF NOT EXISTS public.manager_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    evaluator_name TEXT NOT NULL,
    evaluator_role TEXT,
    month_number INT NOT NULL CHECK (month_number BETWEEN 1 AND 3),
    productivity_rating INT CHECK (productivity_rating BETWEEN 1 AND 5),
    discipline_rating INT CHECK (discipline_rating BETWEEN 1 AND 5),
    integrity_rating INT CHECK (integrity_rating BETWEEN 1 AND 5),
    manager_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_number)
);

-- 0. Ensure user_role enum includes 'associate' if enum is used
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        BEGIN
            ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'associate';
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
END $$;

ALTER TABLE public.manager_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Managers can view manager evaluations" ON public.manager_evaluations;
CREATE POLICY "Admins and Managers can view manager evaluations"
    ON public.manager_evaluations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND (profiles.role::text = 'admin' OR profiles.role::text = 'associate' OR profiles.role::text = 'coach')
        )
    );

-- ==========================================
-- BASELINE SELF-DISCOVERY TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.baseline_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.baseline_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.baseline_assessments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_number INT NOT NULL CHECK (question_number BETWEEN 1 AND 50),
    area TEXT NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, question_number)
);

ALTER TABLE public.baseline_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baseline_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own baseline assessments" ON public.baseline_assessments;
CREATE POLICY "Users can view their own baseline assessments"
    ON public.baseline_assessments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert/update their own baseline assessments" ON public.baseline_assessments;
CREATE POLICY "Users can insert/update their own baseline assessments"
    ON public.baseline_assessments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own baseline answers" ON public.baseline_answers;
CREATE POLICY "Users can view their own baseline answers"
    ON public.baseline_answers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert/update their own baseline answers" ON public.baseline_answers;
CREATE POLICY "Users can insert/update their own baseline answers"
    ON public.baseline_answers FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- JOURNALS ENHANCEMENT COLUMNS
-- ==========================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journals' AND column_name = 'mood') THEN
        ALTER TABLE public.journals ADD COLUMN mood TEXT DEFAULT 'Bersyukur';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journals' AND column_name = 'ibadah_rating') THEN
        ALTER TABLE public.journals ADD COLUMN ibadah_rating FLOAT DEFAULT 4.0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journals' AND column_name = 'energy_pct') THEN
        ALTER TABLE public.journals ADD COLUMN energy_pct INT DEFAULT 80;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journals' AND column_name = 'is_favorite') THEN
        ALTER TABLE public.journals ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journals' AND column_name = 'title') THEN
        ALTER TABLE public.journals ADD COLUMN title TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journals' AND column_name = 'location') THEN
        ALTER TABLE public.journals ADD COLUMN location TEXT DEFAULT 'Jakarta';
    END IF;
END $$;

-- 8. Support Team Table
CREATE TABLE IF NOT EXISTS public.support_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_name TEXT,
    coach_email TEXT,
    sahabat_safar_name TEXT,
    sahabat_safar_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. User Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'reminder',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own support_team" ON public.support_team;
CREATE POLICY "Users manage own support_team" ON public.support_team FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);



