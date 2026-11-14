-- Trial reminders follow the spiritual practice scope and two weekly evaluations.
BEGIN;

CREATE OR REPLACE FUNCTION public.slj_can_remind(p_user_id UUID, p_kind TEXT DEFAULT 'spiritual')
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = p_user_id AND p.role::TEXT = 'participant'
      AND NULLIF(BTRIM(p.program_code), '') IS NOT NULL
      AND (p.program_code <> 'SLJ-TRIAL-14' OR (
        p_kind IN ('spiritual','practice') AND EXISTS (
          SELECT 1 FROM public.slj_trial_enrollments t
          WHERE t.user_id = p.user_id AND t.starts_at <= NOW() AND t.expires_at > NOW()
        )
      ))
  );
$$;
REVOKE ALL ON FUNCTION public.slj_can_remind(UUID,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.slj_can_remind(UUID,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.slj_notification_access_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE kind TEXT := 'spiritual'; trial BOOLEAN; home TEXT;
BEGIN
  IF NEW.category NOT IN ('reminder','checkpoint') AND COALESCE(NEW.dedupe_key,'') NOT LIKE 'batch-lock:%' THEN RETURN NEW; END IF;
  SELECT program_code = 'SLJ-TRIAL-14' INTO trial FROM public.profiles WHERE user_id = NEW.user_id;
  IF NEW.dedupe_key LIKE 'batch-lock:%' THEN kind := 'program';
  ELSIF NEW.category = 'checkpoint' OR NEW.dedupe_key LIKE 'habit:%' THEN kind := 'practice';
  END IF;
  IF NOT public.slj_can_remind(NEW.user_id,kind) THEN RETURN NULL; END IF;
  IF trial AND NEW.category = 'checkpoint'
    AND COALESCE(NEW.dedupe_key,'') !~ '^checkpoint:(7|14):(0|1|3)$' THEN RETURN NULL; END IF;
  home := CASE WHEN trial THEN '/trial' ELSE '/dashboard' END;
  IF NEW.action_url = '/dashboard' THEN
    NEW.action_url := home || CASE
      WHEN NEW.dedupe_key LIKE 'habit:%' THEN '?widget=habits'
      WHEN NEW.dedupe_key LIKE 'quran:%' THEN '?widget=quran'
      WHEN NEW.dedupe_key LIKE 'hadith:%' THEN '?widget=hadith'
      WHEN NEW.dedupe_key LIKE 'prayer:%' THEN '?widget=prayer'
      ELSE '' END;
    IF trial AND NEW.dedupe_key LIKE 'inactive:%' THEN
      NEW.message := 'Mulai kembali dengan satu kebiasaan, catatan ibadah, atau refleksi hari ini.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

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
  -- One daily reminder when at least one scheduled habit still needs work.
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
    AND public.slj_can_remind(p.user_id, 'practice')
    AND EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.user_id = p.user_id AND NOT h.is_archived
        AND (p.program_code <> 'SLJ-TRIAL-14' OR h.area_category = 'Spiritual Growth')
        AND (h.effective_from IS NULL OR h.effective_from <= local.local_date)
        AND (h.effective_until IS NULL OR h.effective_until >= local.local_date)
        AND (
          h.frequency_kind IN ('daily','weekly')
          OR (h.frequency_kind = 'custom' AND EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(
              CASE WHEN jsonb_typeof(h.custom_schedule->'weekdays') = 'array'
                THEN h.custom_schedule->'weekdays' ELSE '[]'::JSONB END
            ) weekday(value) WHERE value = EXTRACT(ISODOW FROM local.local_date)::INT::TEXT
          ))
        )
        AND COALESCE((
          SELECT MAX(GREATEST(COALESCE(hl.completed_count, CASE WHEN hl.completed THEN 1 ELSE 0 END), 0))
          FROM public.habit_logs hl
          WHERE hl.user_id = p.user_id AND hl.habit_id = h.id AND hl.is_canonical_occurrence
            AND COALESCE(hl.occurrence_start, hl.activity_date, hl.date::DATE)
              = CASE WHEN h.frequency_kind = 'weekly' THEN date_trunc('week', local.local_date)::DATE ELSE local.local_date END
        ),0) < GREATEST(COALESCE(h.quantity,1),1)
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
    CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN
      CASE WHEN milestone.day_no = 7 THEN 'Evaluasi pekan pertama' ELSE 'Evaluasi pekan kedua' END
      ELSE 'Checkpoint ' || milestone.day_no || ' hari' END,
    CASE delta.days_left
      WHEN 3 THEN 'Tiga hari lagi Anda memasuki checkpoint. Siapkan evaluasi perjalanan Anda.'
      WHEN 1 THEN 'Besok adalah hari checkpoint. Lengkapi progres dan refleksi Anda.'
      ELSE 'Checkpoint Anda tiba hari ini. Buka Monitoring untuk mengisi evaluasi.'
    END,
    'checkpoint',
    'checkpoint:' || milestone.day_no || ':' || delta.days_left,
    '/monitoring'
  FROM public.profiles p
  CROSS JOIN LATERAL (
    SELECT day_no FROM (VALUES (7), (14), (30), (60), (90)) schedule(day_no)
    WHERE (p.program_code = 'SLJ-TRIAL-14' AND day_no IN (7,14))
      OR (p.program_code <> 'SLJ-TRIAL-14' AND day_no IN (30,60,90))
  ) milestone
  CROSS JOIN LATERAL (
    SELECT (((p.start_date AT TIME ZONE COALESCE(NULLIF(p.timezone,''),'Asia/Jakarta'))::DATE + (milestone.day_no - 1)) -
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
RETURNS TABLE (notification_id UUID,user_id UUID,title TEXT,message TEXT,action_url TEXT,endpoint TEXT,p256dh TEXT,auth TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT n.id,n.user_id,n.title,n.message,n.action_url,ps.endpoint,ps.p256dh,ps.auth
  FROM public.notifications n
  JOIN public.settings s ON s.user_id = n.user_id AND s.push_notifications_enabled
  JOIN public.push_subscriptions ps ON ps.user_id = n.user_id AND ps.is_active
  WHERE n.push_sent_at IS NULL AND n.is_read IS NOT TRUE AND (
    n.category NOT IN ('reminder','checkpoint') OR public.slj_can_remind(n.user_id,
      CASE WHEN n.category = 'checkpoint' OR n.dedupe_key LIKE 'habit:%' THEN 'practice' ELSE 'spiritual' END)
  )
  ORDER BY n.created_at ASC,n.id LIMIT GREATEST(1,LEAST(p_limit,1000));
$$;
REVOKE ALL ON FUNCTION public.claim_pending_push_notifications(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_push_notifications(INT) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
