-- User reminder preferences, Web Push subscriptions, and due reminder generation.

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS journal_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS quran_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hadith_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checkpoint_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS social_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS inactivity_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS habit_reminder_time TIME NOT NULL DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS journal_reminder_time TIME NOT NULL DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS quran_reminder_time TIME NOT NULL DEFAULT '06:30',
  ADD COLUMN IF NOT EXISTS hadith_reminder_time TIME NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS prayer_reminder_minutes INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.settings
  ALTER COLUMN prayer_notifications_enabled SET DEFAULT FALSE;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
  ADD COLUMN IF NOT EXISTS action_url TEXT NOT NULL DEFAULT '/notifications',
  ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_dedupe_key_unique
  ON public.notifications(user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

CREATE OR REPLACE FUNCTION public.generate_due_user_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INT := 0;
  affected INT := 0;
BEGIN
  -- Habit reminder: one notification per participant/local date, only when no habit is completed today.
  INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
  SELECT
    p.user_id,
    'Habit hari ini belum selesai',
    'Luangkan beberapa menit untuk menyelesaikan habit yang Anda tetapkan di PTP.',
    'reminder',
    'habit:' || local.local_date::TEXT,
    '/dashboard'
  FROM public.profiles p
  CROSS JOIN LATERAL (
    SELECT
      (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::DATE AS local_date,
      (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::TIME AS local_time
  ) local
  LEFT JOIN public.settings s ON s.user_id = p.user_id
  WHERE p.role::TEXT = 'participant'
    AND COALESCE(s.habit_notifications_enabled, TRUE)
    AND local.local_time >= COALESCE(s.habit_reminder_time, '20:00'::TIME)
    AND EXISTS (SELECT 1 FROM public.habits h WHERE h.user_id = p.user_id AND NOT h.is_archived)
    AND NOT EXISTS (
      SELECT 1 FROM public.habit_logs hl
      WHERE hl.user_id = p.user_id AND hl.date = local.local_date::TEXT AND hl.completed
    )
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS affected = ROW_COUNT; inserted_count := inserted_count + affected;

  -- Journal reminder.
  INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
  SELECT p.user_id, 'Waktunya menulis jurnal',
    'Tutup hari dengan satu refleksi jujur tentang perjalanan Anda hari ini.',
    'reminder', 'journal:' || local.local_date::TEXT, '/journal'
  FROM public.profiles p
  CROSS JOIN LATERAL (
    SELECT
      (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::DATE AS local_date,
      (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::TIME AS local_time
  ) local
  LEFT JOIN public.settings s ON s.user_id = p.user_id
  WHERE p.role::TEXT = 'participant'
    AND COALESCE(s.journal_notifications_enabled, TRUE)
    AND local.local_time >= COALESCE(s.journal_reminder_time, '21:00'::TIME)
    AND NOT EXISTS (SELECT 1 FROM public.journals j WHERE j.user_id = p.user_id AND j.date = local.local_date::TEXT)
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS affected = ROW_COUNT; inserted_count := inserted_count + affected;

  -- Optional Quran reminder.
  INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
  SELECT p.user_id, 'Tilawah hari ini',
    'Mulai hari dengan membaca dan merenungkan ayat Al-Qur''an.',
    'reminder', 'quran:' || local.local_date::TEXT, '/dashboard'
  FROM public.profiles p
  CROSS JOIN LATERAL (
    SELECT
      (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::DATE AS local_date,
      (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::TIME AS local_time
  ) local
  JOIN public.settings s ON s.user_id = p.user_id
  WHERE p.role::TEXT = 'participant' AND s.quran_notifications_enabled
    AND local.local_time >= s.quran_reminder_time
    AND NOT EXISTS (SELECT 1 FROM public.quran_logs q WHERE q.user_id = p.user_id AND q.date = local.local_date)
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS affected = ROW_COUNT; inserted_count := inserted_count + affected;

  -- Optional daily hadith reminder.
  INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
  SELECT p.user_id, 'Hadits hari ini menanti',
    'Baca satu hadits dan ambil satu pelajaran untuk diamalkan hari ini.',
    'reminder', 'hadith:' || local.local_date::TEXT, '/dashboard'
  FROM public.profiles p
  CROSS JOIN LATERAL (
    SELECT
      (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::DATE AS local_date,
      (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::TIME AS local_time
  ) local
  JOIN public.settings s ON s.user_id = p.user_id
  WHERE p.role::TEXT = 'participant' AND s.hadith_notifications_enabled
    AND local.local_time >= s.hadith_reminder_time
    AND NOT EXISTS (
      SELECT 1 FROM public.hadith_logs h WHERE h.user_id = p.user_id AND h.date = local.local_date AND h.is_read
    )
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS affected = ROW_COUNT; inserted_count := inserted_count + affected;

  -- Journey checkpoints: H-3, H-1, and checkpoint day.
  INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
  SELECT p.user_id,
    'Checkpoint ' || milestone.day_no || ' hari',
    CASE delta.days_left
      WHEN 3 THEN 'Tiga hari lagi Anda memasuki checkpoint. Siapkan evaluasi perjalanan Anda.'
      WHEN 1 THEN 'Besok adalah hari checkpoint. Lengkapi progres dan refleksi Anda.'
      ELSE 'Checkpoint Anda tiba hari ini. Buka Monitoring untuk mengisi evaluasi.'
    END,
    'checkpoint',
    'checkpoint:' || milestone.day_no || ':' || delta.days_left,
    '/monitoring'
  FROM public.profiles p
  CROSS JOIN (VALUES (30), (60), (90)) milestone(day_no)
  CROSS JOIN LATERAL (
    SELECT ((p.start_date::DATE + (milestone.day_no - 1)) -
      (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::DATE)::INT AS days_left
  ) delta
  LEFT JOIN public.settings s ON s.user_id = p.user_id
  WHERE p.role::TEXT = 'participant' AND p.start_date IS NOT NULL
    AND COALESCE(s.checkpoint_notifications_enabled, TRUE)
    AND delta.days_left IN (3, 1, 0)
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS affected = ROW_COUNT; inserted_count := inserted_count + affected;

  -- Inactivity reminder, once per local date after three inactive days.
  INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
  SELECT p.user_id, 'Kami menantikan perjalanan Anda',
    'Sudah beberapa hari tidak ada aktivitas. Mulai kembali dengan satu habit kecil hari ini.',
    'reminder', 'inactive:' || local.local_date::TEXT, '/dashboard'
  FROM public.profiles p
  CROSS JOIN LATERAL (
    SELECT (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::DATE AS local_date
  ) local
  LEFT JOIN public.settings s ON s.user_id = p.user_id
  WHERE p.role::TEXT = 'participant'
    AND COALESCE(s.inactivity_notifications_enabled, TRUE)
    AND COALESCE(p.last_active_at, p.created_at) <= NOW() - INTERVAL '3 days'
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS affected = ROW_COUNT; inserted_count := inserted_count + affected;

  -- Batch auto-lock warning, H-3.
  INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
  SELECT p.user_id, 'PTP akan segera dikunci',
    'Tiga hari lagi periode penyusunan PTP pada batch Anda berakhir. Periksa dan selesaikan PTP sekarang.',
    'system', 'batch-lock:' || b.id::TEXT || ':h3', '/journey'
  FROM public.profiles p
  JOIN public.batches b ON b.id = p.batch_id
  LEFT JOIN public.settings s ON s.user_id = p.user_id
  WHERE p.role::TEXT = 'participant' AND b.auto_lock_at IS NOT NULL
    AND COALESCE(s.checkpoint_notifications_enabled, TRUE)
    AND (b.auto_lock_at AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::DATE
      - (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta'))::DATE = 3
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS affected = ROW_COUNT; inserted_count := inserted_count + affected;

  RETURN jsonb_build_object('created', inserted_count, 'generated_at', NOW());
END;
$$;

REVOKE ALL ON FUNCTION public.generate_due_user_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_due_user_reminders() TO service_role;

CREATE OR REPLACE FUNCTION public.claim_pending_push_notifications(p_limit INT DEFAULT 500)
RETURNS TABLE (
  notification_id UUID,
  user_id UUID,
  title TEXT,
  message TEXT,
  action_url TEXT,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT n.id, n.user_id, n.title, n.message, n.action_url,
    ps.endpoint, ps.p256dh, ps.auth
  FROM public.notifications n
  JOIN public.settings s ON s.user_id = n.user_id AND s.push_notifications_enabled
  JOIN public.push_subscriptions ps ON ps.user_id = n.user_id AND ps.is_active
  WHERE n.push_sent_at IS NULL
  ORDER BY n.created_at ASC
  LIMIT GREATEST(1, LEAST(p_limit, 1000));
$$;

REVOKE ALL ON FUNCTION public.claim_pending_push_notifications(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_push_notifications(INT) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_push_notifications_sent(p_notification_ids UUID[])
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE changed INT;
BEGIN
  UPDATE public.notifications SET push_sent_at = NOW()
  WHERE id = ANY(p_notification_ids) AND push_sent_at IS NULL;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_push_notifications_sent(UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_push_notifications_sent(UUID[]) TO service_role;

-- Social notification preferences are enforced at insert time.
CREATE OR REPLACE FUNCTION public.allow_social_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.category IN ('coach', 'system')
    AND EXISTS (
      SELECT 1 FROM public.settings s
      WHERE s.user_id = NEW.user_id AND NOT s.social_notifications_enabled
    ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_social_notification_preference ON public.notifications;
CREATE TRIGGER enforce_social_notification_preference
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.allow_social_notification();

-- Notify participants when a coach writes or changes a monthly checkpoint response.
CREATE OR REPLACE FUNCTION public.notify_monthly_review_coach_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.coach_replied_at IS NOT NULL
    AND (OLD.coach_replied_at IS DISTINCT FROM NEW.coach_replied_at OR OLD.coach_note IS DISTINCT FROM NEW.coach_note) THEN
    INSERT INTO public.notifications (user_id, title, message, category, dedupe_key, action_url)
    VALUES (
      NEW.user_id,
      'Coach memberikan respons',
      'Coach telah memberikan catatan pada checkpoint bulan ' || NEW.month_number || '. Buka Monitoring untuk membacanya.',
      'coach',
      'coach-reply:' || NEW.id::TEXT || ':' || EXTRACT(EPOCH FROM NEW.coach_replied_at)::BIGINT,
      '/monitoring'
    )
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_participant_on_coach_reply ON public.monthly_reviews;
CREATE TRIGGER notify_participant_on_coach_reply
  AFTER UPDATE OF coach_note, coach_replied_at ON public.monthly_reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_monthly_review_coach_reply();
