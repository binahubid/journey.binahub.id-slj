-- Idempotent monitoring alerts and scheduled PTP auto-lock execution.

CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read monitoring alerts" ON public.monitoring_alerts FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Coaches read assigned alerts" ON public.monitoring_alerts FOR SELECT TO authenticated USING (coach_id = auth.uid());

CREATE OR REPLACE FUNCTION public.run_monitoring_automation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked_count INT := 0;
  inactivity_alert_count INT := 0;
  support_alert_count INT := 0;
BEGIN
  -- Auto-lock hanya batch yang waktunya sudah lewat dan PTP masih editable.
  WITH due_users AS (
    SELECT DISTINCT p.user_id
    FROM public.batches b
    JOIN public.profiles p ON p.batch_id = b.id
    WHERE b.auto_lock_at IS NOT NULL AND b.auto_lock_at <= NOW()
  ), locked AS (
    UPDATE public.journeys j
    SET ptp_status = 'LOCKED', locked_at = NOW(), updated_at = NOW()
    WHERE j.ptp_status = 'EDITABLE'
      AND EXISTS (SELECT 1 FROM due_users du WHERE du.user_id = j.user_id)
    RETURNING j.id
  ) SELECT COUNT(*) INTO locked_count FROM locked;

  -- Inactivity alerts mengikuti threshold system settings dan idempotent per hari.
  WITH inserted AS (
    INSERT INTO public.monitoring_alerts (user_id, coach_id, alert_type, event_key, message)
    SELECT m.user_id, m.coach_id, 'INACTIVITY',
      'INACTIVITY:' || m.user_id::TEXT || ':' || CURRENT_DATE::TEXT,
      m.full_name || ' tidak aktif selama ' || m.days_inactive || ' hari.'
    FROM public.admin_participant_monitoring m
    CROSS JOIN public.system_settings s
    WHERE s.id = 1
      AND m.days_inactive >= s.monitoring_inactivity_days
      AND m.journey_status NOT IN ('COMPLETED', 'ARCHIVED')
    ON CONFLICT (event_key) DO NOTHING
    RETURNING id
  ) SELECT COUNT(*) INTO inactivity_alert_count FROM inserted;

  -- NEED_SUPPORT tanpa balasan coach > 3 hari.
  WITH inserted AS (
    INSERT INTO public.monitoring_alerts (user_id, coach_id, alert_type, event_key, message)
    SELECT p.user_id, p.coach_id, 'COACH_RESPONSE',
      'COACH_RESPONSE:' || mr.id::TEXT,
      COALESCE(p.full_name, 'Peserta') || ' membutuhkan respons coach pada checkpoint bulan ' || mr.month_number || '.'
    FROM public.monthly_reviews mr
    JOIN public.profiles p ON p.user_id = mr.user_id
    WHERE mr.status = 'NEED_SUPPORT'
      AND mr.coach_replied_at IS NULL
      AND mr.created_at <= NOW() - INTERVAL '3 days'
    ON CONFLICT (event_key) DO NOTHING
    RETURNING id
  ) SELECT COUNT(*) INTO support_alert_count FROM inserted;

  -- Fan-out alert baru ke coach sebagai notifikasi in-app.
  INSERT INTO public.notifications (user_id, title, message, category, is_read)
  SELECT ma.coach_id, 'Monitoring Peserta', ma.message, 'checkpoint', false
  FROM public.monitoring_alerts ma
  WHERE ma.coach_id IS NOT NULL
    AND ma.created_at >= NOW() - INTERVAL '5 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = ma.coach_id AND n.message = ma.message AND n.created_at >= ma.created_at
    );

  RETURN jsonb_build_object(
    'locked_ptps', locked_count,
    'inactivity_alerts', inactivity_alert_count,
    'coach_response_alerts', support_alert_count,
    'executed_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_monitoring_automation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_monitoring_automation() TO service_role;

-- Jadwalkan secara manual setelah pg_cron tersedia di project:
-- SELECT cron.schedule(
--   'slj-monitoring-automation',
--   '0 * * * *',
--   $$SELECT public.run_monitoring_automation();$$
-- );
