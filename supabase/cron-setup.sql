-- ============================================================
-- CRON SETUP: send-user-reminders
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- Pastikan pg_cron dan pg_net sudah aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Jadwalkan send-user-reminders setiap 5 menit
SELECT cron.schedule(
  'slj-send-user-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_URL>/functions/v1/send-user-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<YOUR_REMINDER_CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verifikasi cron sudah terjadwal
SELECT * FROM cron.job WHERE jobname = 'slj-send-user-reminders';
