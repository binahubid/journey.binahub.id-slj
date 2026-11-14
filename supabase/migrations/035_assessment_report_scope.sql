-- Keep non-enrolled accounts and spiritual trials out of full-program assessments.
-- CASE protects the report call itself; a WHERE condition alone may be reordered by Postgres.
BEGIN;
CREATE OR REPLACE VIEW public.admin_participant_monitoring AS
SELECT
  p.user_id,
  COALESCE(NULLIF(p.full_name, ''), 'Peserta SLJ') AS full_name,
  p.company_id,
  p.company_name,
  p.batch_id,
  b.name AS batch_name,
  p.coach_id,
      COALESCE(NULLIF(coach.full_name, ''), NULLIF(b.coach_name, '')) AS coach_name,
  p.program_code,
  p.last_active_at,
  p.start_date,
  p.end_date,
  cuj.journey_id,
  cuj.status AS journey_status,
  cuj.ptp_status,
  -- Habit scoring (90 hari): rata-rata rasio penyelesaian per hari
  hs.habit_avg_percent::INT AS habit_avg_percent,
  -- Checkpoint / monthly review terakhir
  reviews.months_reviewed,
  reviews.needs_support,
  reviews.last_coach_reply_at,
  -- Inactivity dalam hari terhadap NOW()
  GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(p.last_active_at, p.created_at))) / 86400))::INT AS days_inactive
FROM public.profiles p
LEFT JOIN public.current_user_journeys cuj ON cuj.user_id = p.user_id
LEFT JOIN public.batches b ON b.id = p.batch_id
LEFT JOIN public.profiles coach ON coach.user_id = p.coach_id
LEFT JOIN LATERAL (
  SELECT CASE WHEN cuj.journey_id IS NOT NULL AND p.program_code IS NOT NULL AND p.program_code<>'SLJ-TRIAL-14'
    THEN (public.get_participant_assessment(p.user_id)#>>'{metrics,execution,score}')::INT ELSE NULL END habit_avg_percent
) hs ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INT AS months_reviewed,
    BOOL_OR(status = 'NEED_SUPPORT') AS needs_support,
    MAX(coach_replied_at) AS last_coach_reply_at
  FROM public.monthly_reviews mr
  WHERE mr.user_id = p.user_id
) reviews ON true
WHERE p.role::TEXT = 'participant';



CREATE OR REPLACE FUNCTION public.get_admin_group_impact(p_company_id UUID DEFAULT NULL, p_batch_id UUID DEFAULT NULL) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE records JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Hanya admin yang dapat membaca impact report.' USING ERRCODE='42501'; END IF;
  SELECT COALESCE(jsonb_agg(public.get_participant_assessment(p.user_id) ORDER BY p.full_name),'[]'::JSONB)
    INTO records FROM public.profiles p
    WHERE p.role::TEXT='participant' AND p.program_code IS NOT NULL AND p.program_code<>'SLJ-TRIAL-14'
      AND EXISTS(SELECT 1 FROM public.journeys j WHERE j.user_id=p.user_id)
      AND (p_company_id IS NULL OR p.company_id=p_company_id)
      AND (p_batch_id IS NULL OR p.batch_id=p_batch_id);
  RETURN jsonb_build_object('methodology_version','1.0','participants',records);
END $$;
REVOKE ALL ON FUNCTION public.get_admin_group_impact(UUID,UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_group_impact(UUID,UUID) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
