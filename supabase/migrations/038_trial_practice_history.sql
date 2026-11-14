-- Preserve self-guided practice when a participant joins the 90-day program.
BEGIN;

CREATE TABLE IF NOT EXISTS public.slj_trial_practice_archives (
  user_id UUID PRIMARY KEY REFERENCES public.slj_trial_enrollments(user_id) ON DELETE CASCADE,
  practice JSONB NOT NULL
);

ALTER TABLE public.slj_trial_practice_archives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.slj_trial_practice_archives FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.slj_trial_practice_snapshot(p_participant_id UUID)
RETURNS JSONB LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'journey', (SELECT to_jsonb(j) FROM public.journeys j WHERE j.user_id = p_participant_id),
    'reviews', (SELECT jsonb_agg(to_jsonb(r) ORDER BY r.month_number)
      FROM public.monthly_reviews r WHERE r.user_id = p_participant_id),
    'indicator_reports', (SELECT jsonb_agg(to_jsonb(r))
      FROM public.monthly_indicator_reports r WHERE r.user_id = p_participant_id),
    'indicators', (SELECT jsonb_agg(to_jsonb(i) ORDER BY i.created_at, i.id)
      FROM public.ptp_indicators i WHERE i.participant_user_id = p_participant_id),
    'actuals', (SELECT jsonb_agg(to_jsonb(a))
      FROM public.ptp_indicator_actuals a WHERE a.participant_user_id = p_participant_id),
    'plans', (SELECT jsonb_agg(to_jsonb(p)) FROM public.action_plans p WHERE p.user_id = p_participant_id),
    'indicator_links', (SELECT jsonb_agg(to_jsonb(l))
      FROM public.ptp_indicator_action_plans l JOIN public.ptp_indicators i ON i.id = l.indicator_id
      WHERE i.participant_user_id = p_participant_id),
    'baseline_submission', (SELECT to_jsonb(b) FROM public.baseline_assessments b WHERE b.user_id = p_participant_id),
    'preparation', (SELECT to_jsonb(p) FROM public.sahabat_safar_profiles p WHERE p.user_id = p_participant_id)
  );
$$;
REVOKE ALL ON FUNCTION public.slj_trial_practice_snapshot(UUID) FROM PUBLIC, anon, authenticated;

-- The enrollment RPC already uses this transaction-local flag for changes to the journey.
CREATE OR REPLACE FUNCTION public.enforce_final_reflection_window()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE first_day INT;
BEGIN
  IF current_setting('app.enrollment', TRUE) = 'true' THEN RETURN NEW; END IF;
  SELECT CASE WHEN program_code = 'SLJ-TRIAL-14' THEN 13 ELSE 89 END INTO first_day
    FROM public.profiles WHERE user_id = NEW.user_id;
  IF NEW.user_id = auth.uid() AND NEW.final_reflection IS DISTINCT FROM OLD.final_reflection
    AND public.current_program_day(NEW.user_id) < first_day THEN
    RAISE EXCEPTION 'Refleksi akhir tersedia mulai hari program %.', first_day;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.slj_archive_trial_on_enrollment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.slj_trial_enrollments WHERE user_id = NEW.user_id) THEN RETURN NEW; END IF;

  INSERT INTO public.slj_trial_practice_archives(user_id, practice)
  VALUES (NEW.user_id, public.slj_trial_practice_snapshot(NEW.user_id));

  -- Detach the custom habits before clearing their action plans so their logs keep their original references.
  UPDATE public.habits SET action_plan_id = NULL, is_archived = TRUE, sync_key = NULL
    WHERE user_id = NEW.user_id AND area_category = 'Spiritual Growth';

  DELETE FROM public.monthly_reviews WHERE user_id = NEW.user_id;
  DELETE FROM public.monthly_indicator_reports WHERE user_id = NEW.user_id;
  DELETE FROM public.ptp_indicators WHERE participant_user_id = NEW.user_id;
  DELETE FROM public.action_plans WHERE user_id = NEW.user_id;

  UPDATE public.journeys
  SET area_transformasi = '[]'::JSONB, main_target = NULL, success_indicators = '[]'::JSONB,
      ptp_draft = NULL, ptp_draft_updated_at = NULL, ptp_published_at = NULL,
      ptp_status = 'EDITABLE', locked_at = NULL, locked_by = NULL, final_reflection = NULL, updated_at = NOW()
  WHERE user_id = NEW.user_id;

  -- Existing answers are reusable when completing the remaining full-program questions.
  UPDATE public.baseline_assessments SET completed = FALSE, submitted_at = NULL, updated_at = NOW()
    WHERE user_id = NEW.user_id;
  UPDATE public.sahabat_safar_profiles SET is_completed = FALSE, updated_at = NOW()
    WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.slj_archive_trial_on_enrollment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS slj_archive_trial_on_enrollment ON public.profiles;
CREATE TRIGGER slj_archive_trial_on_enrollment
  AFTER UPDATE OF program_code ON public.profiles FOR EACH ROW
  WHEN (OLD.program_code = 'SLJ-TRIAL-14' AND NULLIF(BTRIM(NEW.program_code), '') IS NOT NULL
    AND NEW.program_code <> 'SLJ-TRIAL-14')
  EXECUTE FUNCTION public.slj_archive_trial_on_enrollment();

CREATE OR REPLACE FUNCTION public.get_slj_trial_result()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  participant_id UUID := auth.uid();
  enrollment public.slj_trial_enrollments%ROWTYPE;
  snapshot JSONB;
BEGIN
  IF participant_id IS NULL THEN RAISE EXCEPTION 'Silakan masuk untuk melanjutkan.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO enrollment FROM public.slj_trial_enrollments WHERE user_id = participant_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT a.practice INTO snapshot FROM public.slj_trial_practice_archives a WHERE a.user_id = participant_id;
  IF snapshot IS NULL THEN
    -- Older accounts that already joined a program have no trial evaluation to display.
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = participant_id AND program_code = 'SLJ-TRIAL-14')
      THEN RETURN NULL; END IF;
    snapshot := public.slj_trial_practice_snapshot(participant_id);
  END IF;

  RETURN jsonb_build_object(
    'reviews', COALESCE(NULLIF(snapshot->'reviews', 'null'::JSONB), '[]'::JSONB),
    'indicators', COALESCE(NULLIF(snapshot->'indicators', 'null'::JSONB), '[]'::JSONB),
    'actuals', COALESCE(NULLIF(snapshot->'actuals', 'null'::JSONB), '[]'::JSONB),
    'reflection', snapshot #>> '{journey,final_reflection}'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_slj_trial_result() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_slj_trial_result() TO authenticated;

COMMIT;
