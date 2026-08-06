-- Backfill historical quality indicators so the contract introduced in 030
-- can be fully validated without leaving legacy rows in an exceptional state.

BEGIN;

UPDATE public.ptp_indicators
SET quality_rubric = jsonb_build_object(
  '1', 'Masih sangat jauh dari harapan',
  '2', 'Jarang terlihat, masih banyak kesenjangan',
  '3', 'Kadang konsisten, hasil masih bertahap',
  '4', 'Sering konsisten, hasil mulai jelas',
  '5', 'Sangat konsisten, hasil terlihat nyata'
), updated_at = NOW()
WHERE indicator_type = 'quality'
  AND (
    quality_rubric IS NULL
    OR jsonb_typeof(quality_rubric) <> 'object'
    OR (quality_rubric - ARRAY['1','2','3','4','5']::TEXT[]) <> '{}'::JSONB
    OR NOT (quality_rubric ? '1' AND quality_rubric ? '2' AND quality_rubric ? '3' AND quality_rubric ? '4' AND quality_rubric ? '5')
    OR jsonb_typeof(quality_rubric->'1') <> 'string' OR NULLIF(BTRIM(quality_rubric->>'1'), '') IS NULL
    OR jsonb_typeof(quality_rubric->'2') <> 'string' OR NULLIF(BTRIM(quality_rubric->>'2'), '') IS NULL
    OR jsonb_typeof(quality_rubric->'3') <> 'string' OR NULLIF(BTRIM(quality_rubric->>'3'), '') IS NULL
    OR jsonb_typeof(quality_rubric->'4') <> 'string' OR NULLIF(BTRIM(quality_rubric->>'4'), '') IS NULL
    OR jsonb_typeof(quality_rubric->'5') <> 'string' OR NULLIF(BTRIM(quality_rubric->>'5'), '') IS NULL
  );

ALTER TABLE public.ptp_indicators
  VALIDATE CONSTRAINT ptp_indicators_quality_rubric_check;

NOTIFY pgrst, 'reload schema';
COMMIT;
