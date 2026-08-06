-- Tighten the quality rubric contract for databases where migration 029 was
-- already applied. NOT VALID preserves historical rows while enforcing the
-- complete 1-5 rubric on new or updated quality indicators.

BEGIN;

ALTER TABLE public.ptp_indicators
  DROP CONSTRAINT IF EXISTS ptp_indicators_quality_rubric_check;

ALTER TABLE public.ptp_indicators
  ADD CONSTRAINT ptp_indicators_quality_rubric_check CHECK (
    indicator_type <> 'quality'
    OR (
      quality_rubric IS NOT NULL
      AND jsonb_typeof(quality_rubric) = 'object'
      AND (quality_rubric - ARRAY['1','2','3','4','5']::TEXT[]) = '{}'::JSONB
      AND quality_rubric ? '1'
      AND quality_rubric ? '2'
      AND quality_rubric ? '3'
      AND quality_rubric ? '4'
      AND quality_rubric ? '5'
      AND jsonb_typeof(quality_rubric->'1') = 'string' AND NULLIF(BTRIM(quality_rubric->>'1'), '') IS NOT NULL
      AND jsonb_typeof(quality_rubric->'2') = 'string' AND NULLIF(BTRIM(quality_rubric->>'2'), '') IS NOT NULL
      AND jsonb_typeof(quality_rubric->'3') = 'string' AND NULLIF(BTRIM(quality_rubric->>'3'), '') IS NOT NULL
      AND jsonb_typeof(quality_rubric->'4') = 'string' AND NULLIF(BTRIM(quality_rubric->>'4'), '') IS NOT NULL
      AND jsonb_typeof(quality_rubric->'5') = 'string' AND NULLIF(BTRIM(quality_rubric->>'5'), '') IS NOT NULL
    )
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.cleanup_ptp_links_after_action_plan_move()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.ptp_indicator_action_plans link
  USING public.ptp_indicators indicator
  WHERE link.action_plan_id = NEW.id
    AND indicator.id = link.indicator_id
    AND (indicator.journey_id <> NEW.journey_id OR indicator.area IS DISTINCT FROM NEW.area_category);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS cleanup_ptp_links_after_action_plan_move_trigger ON public.action_plans;
CREATE TRIGGER cleanup_ptp_links_after_action_plan_move_trigger
  AFTER UPDATE OF journey_id, area_category ON public.action_plans
  FOR EACH ROW
  WHEN (OLD.journey_id IS DISTINCT FROM NEW.journey_id OR OLD.area_category IS DISTINCT FROM NEW.area_category)
  EXECUTE FUNCTION public.cleanup_ptp_links_after_action_plan_move();

NOTIFY pgrst, 'reload schema';
COMMIT;
