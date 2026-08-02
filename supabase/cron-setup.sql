-- ============================================================
-- CRON SETUP: send-user-reminders
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- Pastikan pg_cron dan pg_net sudah aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Jadwalkan send-user-reminders setiap 5 menit
-- Ganti <YOUR_REMINDER_CRON_SECRET> dengan secret yang sama seperti di Edge Function
SELECT cron.schedule(
  'slj-send-user-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fwmmcxjvdwjcecgxggwk.supabase.co/functions/v1/send-user-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'l4YmZo1ePhRO4jxBFT59DhSEpb5u3lxkMfbmTBMX7fgB1oWy'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verifikasi cron sudah terjadwal
SELECT * FROM cron.job WHERE jobname = 'slj-send-user-reminders';
