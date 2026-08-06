-- Methodology v1.1: indicator actual source + linked action plans + quality rubric.
-- Actual source states where the reported indicator value comes from:
--   action_plan (auto from habit tracking) | self_report | external | coach.
-- Existing indicators are backfilled as self_report (the historical manual entry path).
-- Apply through the normal Supabase migration process, then reload PostgREST.

BEGIN;

ALTER TABLE public.ptp_indicators
  ADD COLUMN IF NOT EXISTS actual_source TEXT NOT NULL DEFAULT 'self_report',
  ADD COLUMN IF NOT EXISTS quality_rubric JSONB;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ptp_indicators_actual_source_check') THEN
    ALTER TABLE public.ptp_indicators ADD CONSTRAINT ptp_indicators_actual_source_check
      CHECK (actual_source IN ('action_plan', 'self_report', 'external', 'coach')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ptp_indicators_quality_rubric_check') THEN
    ALTER TABLE public.ptp_indicators ADD CONSTRAINT ptp_indicators_quality_rubric_check
      CHECK (quality_rubric IS NULL OR jsonb_typeof(quality_rubric) = 'object') NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ptp_indicator_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES public.ptp_indicators(id) ON DELETE CASCADE,
  action_plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (indicator_id, action_plan_id)
);
CREATE INDEX IF NOT EXISTS ptp_indicator_action_plans_indicator_idx
  ON public.ptp_indicator_action_plans (indicator_id);
CREATE INDEX IF NOT EXISTS ptp_indicator_action_plans_plan_idx
  ON public.ptp_indicator_action_plans (action_plan_id);

-- Guard direct inserts as well: the journey must belong to the participant and the
-- action plan must belong to the same journey.
CREATE OR REPLACE FUNCTION public.validate_ptp_indicator_action_plan_link()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE indicator_journey UUID; participant_id UUID; plan_journey UUID;
BEGIN
  SELECT pi.journey_id, pi.participant_user_id INTO indicator_journey, participant_id
  FROM public.ptp_indicators pi WHERE pi.id = NEW.indicator_id;
  SELECT ap.journey_id INTO plan_journey FROM public.action_plans ap WHERE ap.id = NEW.action_plan_id;
  IF indicator_journey IS NULL OR plan_journey IS NULL OR indicator_journey <> plan_journey THEN
    RAISE EXCEPTION 'Indicator dan Action Plan harus berasal dari journey yang sama.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.ptp_indicators pi
    WHERE pi.id = NEW.indicator_id AND pi.area = (SELECT ap.area_category FROM public.action_plans ap WHERE ap.id = NEW.action_plan_id)
  ) THEN
    RAISE EXCEPTION 'Action Plan terhubung harus berada pada area indikator yang sama.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_ptp_indicator_action_plan_link_trigger ON public.ptp_indicator_action_plans;
CREATE TRIGGER validate_ptp_indicator_action_plan_link_trigger
  BEFORE INSERT OR UPDATE ON public.ptp_indicator_action_plans
  FOR EACH ROW EXECUTE FUNCTION public.validate_ptp_indicator_action_plan_link();

-- ── Publish: persist actual_source, quality_rubric, and linked action plans ──
CREATE OR REPLACE FUNCTION public.publish_ptp_draft(p_journey_id UUID, p_draft JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  selected_areas JSONB;
  targets JSONB;
  area_name TEXT;
  target_data JSONB;
  indicator JSONB;
  active_count INT;
  selected_count INT;
  distinct_count INT;
  indicator_types TEXT[];
  indicator_keys TEXT[];
  success_labels JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = p_journey_id AND j.user_id = auth.uid() AND j.ptp_status = 'EDITABLE'
  ) THEN
    RAISE EXCEPTION 'PTP tidak dapat diterapkan.' USING ERRCODE = '42501';
  END IF;
  IF p_draft IS NULL OR jsonb_typeof(p_draft) <> 'object' THEN
    RAISE EXCEPTION 'Format draft PTP tidak valid.';
  END IF;

  selected_areas := COALESCE(p_draft->'selected_areas', '[]'::JSONB);
  targets := COALESCE(p_draft->'targets', '{}'::JSONB);
  IF jsonb_typeof(selected_areas) <> 'array' OR jsonb_typeof(targets) <> 'object' THEN
    RAISE EXCEPTION 'Format area dan target PTP tidak valid.';
  END IF;

  SELECT COUNT(*), COUNT(DISTINCT value)
  INTO selected_count, distinct_count
  FROM jsonb_array_elements_text(selected_areas);
  IF selected_count <> 3 OR distinct_count <> 3 THEN
    RAISE EXCEPTION 'Pilih tepat 3 Area Transformasi sebelum melanjutkan.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(selected_areas) selected(area)
    WHERE selected.area NOT IN ('Spiritual Growth','Personal Development','Leadership Excellence','Relationship','Community Impact')
  ) THEN
    RAISE EXCEPTION 'Area Transformasi tidak valid.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.action_plans ap
    WHERE ap.journey_id = p_journey_id
      AND ap.area_category IS NOT NULL
      AND NOT (selected_areas ? ap.area_category)
  ) THEN
    RAISE EXCEPTION 'Pindahkan atau hapus Action Plan dari area yang dibatalkan sebelum melanjutkan.';
  END IF;

  FOR area_name IN SELECT value FROM jsonb_array_elements_text(selected_areas) LOOP
    target_data := targets->area_name;
    IF target_data IS NULL OR NULLIF(BTRIM(target_data->>'mainTarget'), '') IS NULL THEN
      RAISE EXCEPTION '%: Target Utama 90 Hari wajib diisi.', area_name;
    END IF;
    IF jsonb_typeof(COALESCE(target_data->'indicators', '[]'::JSONB)) <> 'array' THEN
      RAISE EXCEPTION '%: format indikator tidak valid.', area_name;
    END IF;

    SELECT COUNT(*) INTO active_count
    FROM jsonb_array_elements(target_data->'indicators') item
    WHERE COALESCE((item->>'active')::BOOLEAN, false);
    IF active_count < 1 OR active_count > 4 THEN
      RAISE EXCEPTION '%: harus memiliki 1-4 indikator aktif.', area_name;
    END IF;

    indicator_types := ARRAY[]::TEXT[];
    indicator_keys := ARRAY[]::TEXT[];
    FOR indicator IN SELECT value FROM jsonb_array_elements(target_data->'indicators') LOOP
      IF NOT COALESCE((indicator->>'active')::BOOLEAN, false) THEN CONTINUE; END IF;
      IF indicator->>'type' NOT IN ('quality','quantity','time','cost') THEN RAISE EXCEPTION '%: jenis indikator tidak valid.', area_name; END IF;
      IF (indicator->>'type') = ANY(indicator_types) THEN RAISE EXCEPTION '%: satu jenis indikator hanya dapat digunakan sekali.', area_name; END IF;
      indicator_types := array_append(indicator_types, indicator->>'type');
      IF NULLIF(BTRIM(indicator->>'key'), '') IS NULL OR (indicator->>'key') = ANY(indicator_keys) THEN RAISE EXCEPTION '%: key indikator tidak valid atau duplikat.', area_name; END IF;
      indicator_keys := array_append(indicator_keys, indicator->>'key');
      IF NULLIF(BTRIM(indicator->>'label'), '') IS NULL THEN RAISE EXCEPTION '%: nama indikator wajib diisi.', area_name; END IF;
      IF NULLIF(BTRIM(indicator->>'unit'), '') IS NULL THEN RAISE EXCEPTION '% - %: satuan wajib diisi.', area_name, indicator->>'label'; END IF;
      IF jsonb_typeof(indicator->'baseline') <> 'number' OR jsonb_typeof(indicator->'target') <> 'number' THEN RAISE EXCEPTION '% - %: kondisi saat ini dan target wajib berupa angka.', area_name, indicator->>'label'; END IF;
      IF (indicator->>'baseline')::NUMERIC < 0 OR (indicator->>'target')::NUMERIC < 0 OR (indicator->>'baseline')::NUMERIC = (indicator->>'target')::NUMERIC THEN RAISE EXCEPTION '% - %: kondisi saat ini dan target harus tidak negatif dan berbeda.', area_name, indicator->>'label'; END IF;
      IF indicator->>'direction' NOT IN ('higher_is_better','lower_is_better') THEN RAISE EXCEPTION '% - %: arah indikator tidak valid.', area_name, indicator->>'label'; END IF;
      IF ((indicator->>'direction' = 'higher_is_better') AND (indicator->>'target')::NUMERIC <= (indicator->>'baseline')::NUMERIC)
         OR ((indicator->>'direction' = 'lower_is_better') AND (indicator->>'target')::NUMERIC >= (indicator->>'baseline')::NUMERIC) THEN
        RAISE EXCEPTION '% - %: target tidak sesuai dengan arah indikator.', area_name, indicator->>'label';
      END IF;
      IF COALESCE(indicator->>'actual_source', 'self_report') NOT IN ('action_plan','self_report','external','coach') THEN
        RAISE EXCEPTION '% - %: sumber data capaian tidak valid.', area_name, indicator->>'label';
      END IF;
      IF indicator->'quality_rubric' IS NOT NULL AND jsonb_typeof(indicator->'quality_rubric') <> 'object' THEN
        RAISE EXCEPTION '% - %: rubrik kualitas harus berupa objek deskripsi skor 1-5.', area_name, indicator->>'label';
      END IF;
      IF EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(indicator->'linked_action_plan_ids','[]'::JSONB)) raw_link
        WHERE NOT EXISTS (
          SELECT 1 FROM public.action_plans ap
          WHERE ap.journey_id = p_journey_id AND ap.id::TEXT = raw_link.value
        )
      ) THEN
        RAISE EXCEPTION '% - %: Action Plan terhubung tidak valid.', area_name, indicator->>'label';
      END IF;
    END LOOP;
  END LOOP;

  SELECT COALESCE(jsonb_agg(item->>'label'), '[]'::JSONB)
  INTO success_labels
  FROM jsonb_array_elements_text(selected_areas) selected(area)
  CROSS JOIN LATERAL jsonb_array_elements(targets -> selected.area -> 'indicators') item
  WHERE COALESCE((item->>'active')::BOOLEAN, false);

  UPDATE public.journeys
  SET area_transformasi = selected_areas,
      main_target = targets::TEXT,
      success_indicators = success_labels,
      ptp_draft = NULL,
      ptp_draft_updated_at = NULL,
      ptp_published_at = NOW(),
      updated_at = NOW()
  WHERE id = p_journey_id;

  UPDATE public.ptp_indicators SET active = false WHERE journey_id = p_journey_id AND active;

  INSERT INTO public.ptp_indicators (
    participant_user_id, journey_id, area, indicator_key, indicator_type,
    label, active, direction, baseline_value, target_value, unit,
    actual_source, quality_rubric, updated_at
  )
  SELECT auth.uid(), p_journey_id, selected.area, item->>'key', item->>'type', BTRIM(item->>'label'),
    true, item->>'direction', (item->>'baseline')::NUMERIC, (item->>'target')::NUMERIC,
    BTRIM(item->>'unit'), COALESCE(item->>'actual_source', 'self_report'), item->'quality_rubric', NOW()
  FROM jsonb_array_elements_text(selected_areas) selected(area)
  CROSS JOIN LATERAL jsonb_array_elements(targets -> selected.area -> 'indicators') item
  WHERE COALESCE((item->>'active')::BOOLEAN, false)
  ON CONFLICT (journey_id, area, indicator_key) DO UPDATE SET
    indicator_type = EXCLUDED.indicator_type,
    label = EXCLUDED.label,
    active = true,
    direction = EXCLUDED.direction,
    baseline_value = EXCLUDED.baseline_value,
    target_value = EXCLUDED.target_value,
    unit = EXCLUDED.unit,
    actual_source = EXCLUDED.actual_source,
    quality_rubric = EXCLUDED.quality_rubric,
    updated_at = NOW();

  DELETE FROM public.ptp_indicators existing
  WHERE existing.journey_id = p_journey_id
    AND NOT EXISTS (SELECT 1 FROM public.ptp_indicator_actuals actual WHERE actual.indicator_id = existing.id)
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(selected_areas) selected(area)
      CROSS JOIN LATERAL jsonb_array_elements(targets -> selected.area -> 'indicators') item
      WHERE COALESCE((item->>'active')::BOOLEAN, false)
        AND existing.area = selected.area
        AND existing.indicator_key = item->>'key'
    );

  -- Resync indicator → action plan links from the published draft.
  DELETE FROM public.ptp_indicator_action_plans l
  USING public.ptp_indicators pi
  WHERE pi.id = l.indicator_id AND pi.journey_id = p_journey_id AND pi.active;

  INSERT INTO public.ptp_indicator_action_plans (indicator_id, action_plan_id)
  SELECT pi.id, ap.id
  FROM jsonb_array_elements_text(selected_areas) selected(area)
  CROSS JOIN LATERAL jsonb_array_elements(targets -> selected.area -> 'indicators') item
  JOIN public.ptp_indicators pi
    ON pi.journey_id = p_journey_id AND pi.area = selected.area AND pi.indicator_key = item->>'key' AND pi.active
  CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(item->'linked_action_plan_ids','[]'::JSONB)) raw_link
  JOIN public.action_plans ap ON ap.journey_id = p_journey_id AND ap.id::TEXT = raw_link.value
  WHERE COALESCE((item->>'active')::BOOLEAN, false)
  ON CONFLICT (indicator_id, action_plan_id) DO NOTHING;

  RETURN jsonb_build_object('published', true, 'published_at', NOW());
END; $$;

REVOKE ALL ON FUNCTION public.publish_ptp_draft(UUID,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_ptp_draft(UUID,JSONB) TO authenticated;

-- ── Report: surface source, rubric, and linked action plans per indicator ──
CREATE OR REPLACE FUNCTION public.get_participant_assessment(p_participant_user_id UUID DEFAULT auth.uid()) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_variable
DECLARE j public.journeys%ROWTYPE; p public.profiles%ROWTYPE; start_date DATE; program_end_date DATE; data_cutoff_date DATE; local_date DATE; participant_timezone TEXT; active_indicators INT := 0; measured_indicators INT := 0; outcome NUMERIC; indicator_data JSONB := '[]'; outcome_areas JSONB := '[]'; execution_areas JSONB := '[]'; measured_execution_areas INT := 0; execution NUMERIC; scheduled NUMERIC := 0; completed NUMERIC := 0; unsupported_habits INT := 0; weeks INT := 0; supported_weeks INT := 0; pairing_complete BOOLEAN := true; journal_days INT := 0; journal_total_days INT := 0; checkpoint_due INT := 0; checkpoint_submitted INT := 0; checkpoint_on_time INT := 0; checkpoint_data JSONB := '[]'; baseline_areas JSONB := '[]'; baseline_score NUMERIC; assessment JSONB; BEGIN
  IF p_participant_user_id <> auth.uid() AND NOT public.is_admin() AND NOT public.is_coach_of(p_participant_user_id) THEN RAISE EXCEPTION 'Akses assessment ditolak.' USING ERRCODE='42501'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id=p_participant_user_id; SELECT * INTO j FROM public.journeys WHERE user_id=p_participant_user_id ORDER BY created_at DESC, id DESC LIMIT 1;
  IF p.user_id IS NULL OR j.id IS NULL THEN RAISE EXCEPTION 'Peserta atau journey tidak ditemukan.'; END IF;
  participant_timezone := COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta');
  local_date := (NOW() AT TIME ZONE participant_timezone)::DATE;
  start_date := COALESCE(p.start_date::DATE, j.created_at::DATE, local_date - 89);
  program_end_date := start_date + 89;
  data_cutoff_date := LEAST(program_end_date, local_date);
  WITH scored AS (
    SELECT i.area, i.active, latest.actual_value,
      CASE WHEN i.active AND latest.actual_value IS NOT NULL AND i.baseline_value IS NOT NULL AND i.target_value IS NOT NULL AND i.baseline_value <> i.target_value
        THEN LEAST(100, GREATEST(0, CASE WHEN i.direction='higher_is_better' THEN (latest.actual_value-i.baseline_value)/(i.target_value-i.baseline_value)*100 ELSE (i.baseline_value-latest.actual_value)/(i.baseline_value-i.target_value)*100 END)) END score
    FROM public.ptp_indicators i LEFT JOIN LATERAL (
      SELECT x.actual_value FROM public.ptp_indicator_actuals x
      WHERE x.indicator_id=i.id
        AND ((x.month_number - 1) * 30) <= (data_cutoff_date - start_date)
      ORDER BY x.month_number DESC LIMIT 1
    ) latest ON true
    WHERE i.participant_user_id=p_participant_user_id AND i.journey_id=j.id
  ), areas AS (
    SELECT area, COUNT(*) FILTER (WHERE active) active_count, COUNT(score) measured_count, AVG(score) score FROM scored GROUP BY area
  ) SELECT COALESCE(SUM(active_count),0), COALESCE(SUM(measured_count),0), AVG(score), COALESCE(jsonb_agg(jsonb_build_object('area',area,'score',ROUND(score),'active_indicators',active_count,'measured_indicators',measured_count,'indicator_coverage',ROUND(active_count::NUMERIC/4*100),'measurement_coverage',CASE WHEN active_count=0 THEN 0 ELSE ROUND(measured_count::NUMERIC/active_count*100) END,'status',CASE WHEN active_count=0 THEN 'TIDAK_DIUKUR' WHEN measured_count=0 THEN 'BELUM_ADA_DATA' ELSE 'TERUKUR' END) ORDER BY area),'[]'::JSONB)
    INTO active_indicators, measured_indicators, outcome, outcome_areas FROM areas;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'key', i.indicator_key,
    'area', i.area,
    'type', i.indicator_type,
    'label', i.label,
    'active', i.active,
    'direction', i.direction,
    'baseline', i.baseline_value,
    'target', i.target_value,
    'unit', i.unit,
    'actual_source', i.actual_source,
    'quality_rubric', i.quality_rubric,
    'linked_action_plan_ids', COALESCE((SELECT jsonb_agg(l.action_plan_id ORDER BY l.action_plan_id) FROM public.ptp_indicator_action_plans l WHERE l.indicator_id = i.id), '[]'::JSONB),
    'actuals', COALESCE((SELECT jsonb_agg(jsonb_build_object('month', x.month_number, 'actual', x.actual_value, 'evidence_note', x.evidence_note) ORDER BY x.month_number) FROM public.ptp_indicator_actuals x WHERE x.indicator_id = i.id), '[]'::JSONB)
  ) ORDER BY i.area, i.indicator_type), '[]'::JSONB)
  INTO indicator_data
  FROM public.ptp_indicators i
  WHERE i.participant_user_id = p_participant_user_id AND i.journey_id = j.id;
  WITH habit_data AS (
    SELECT h.area_category area, h.id,
      CASE
        WHEN h.frequency_kind = 'daily' THEN GREATEST(0, bounds.last_day - bounds.first_day + 1) * GREATEST(COALESCE(h.quantity,1),1)
        WHEN h.frequency_kind = 'weekly' THEN (SELECT COUNT(DISTINCT date_trunc('week', day)::DATE) FROM generate_series(bounds.first_day, bounds.last_day, INTERVAL '1 day') day) * GREATEST(COALESCE(h.quantity,1),1)
        WHEN h.frequency_kind = 'custom' AND jsonb_typeof(h.custom_schedule->'weekdays') = 'array'
          AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(h.custom_schedule->'weekdays') weekday WHERE weekday !~ '^[1-7]$')
          THEN (SELECT COUNT(*) FROM generate_series(bounds.first_day, bounds.last_day, INTERVAL '1 day') day WHERE EXTRACT(ISODOW FROM day)::INT IN (SELECT value::INT FROM jsonb_array_elements_text(h.custom_schedule->'weekdays'))) * GREATEST(COALESCE(h.quantity,1),1)
      END scheduled,
      COALESCE(l.done,0) done
    FROM public.habits h
    CROSS JOIN LATERAL (SELECT GREATEST(start_date,COALESCE(h.effective_from,start_date)) first_day, LEAST(data_cutoff_date,COALESCE(h.effective_until,data_cutoff_date)) last_day) bounds
    LEFT JOIN LATERAL (SELECT SUM(LEAST(GREATEST(COALESCE(hl.completed_count,CASE WHEN hl.completed THEN 1 ELSE 0 END),0),GREATEST(COALESCE(h.quantity,1),1))) done FROM public.habit_logs hl WHERE hl.habit_id=h.id AND hl.user_id=h.user_id AND hl.is_canonical_occurrence AND hl.occurrence_start BETWEEN CASE WHEN h.frequency_kind='weekly' THEN date_trunc('week', bounds.first_day::TIMESTAMP)::DATE ELSE bounds.first_day END AND bounds.last_day) l ON true
    WHERE h.user_id=p_participant_user_id AND NOT COALESCE(h.is_archived,false) AND COALESCE(h.effective_from,start_date)<=data_cutoff_date AND (h.effective_until IS NULL OR h.effective_until>=start_date)
  ), area_data AS (
    SELECT COALESCE(hd.area,'Tanpa Area') area, SUM(LEAST(hd.done,hd.scheduled)) FILTER (WHERE hd.scheduled IS NOT NULL) completed, SUM(hd.scheduled) scheduled, COUNT(*) FILTER (WHERE hd.scheduled IS NULL) unsupported, CASE WHEN SUM(hd.scheduled)>0 THEN SUM(LEAST(hd.done,hd.scheduled))/SUM(hd.scheduled)*100 END score FROM habit_data hd GROUP BY COALESCE(hd.area,'Tanpa Area')
  ) SELECT COALESCE(SUM(ad.scheduled),0), COALESCE(SUM(ad.completed),0), COALESCE(SUM(ad.unsupported),0), COUNT(ad.score), CASE WHEN SUM(ad.scheduled)>0 THEN SUM(ad.completed)/SUM(ad.scheduled)*100 END, COALESCE(jsonb_agg(jsonb_build_object('area',ad.area,'score',ROUND(ad.score),'numerator',ad.completed,'denominator',ad.scheduled,'unsupported_habits',ad.unsupported,'status',CASE WHEN ad.scheduled IS NULL OR ad.scheduled=0 THEN CASE WHEN ad.unsupported>0 THEN 'TIDAK_DAPAT_DIHITUNG' ELSE 'TIDAK_DIUKUR' END ELSE 'TERUKUR' END) ORDER BY ad.area),'[]'::JSONB)
     INTO scheduled, completed, unsupported_habits, measured_execution_areas, execution, execution_areas FROM area_data ad;
  WITH eligible_weeks AS (
    SELECT DISTINCT date_trunc('week', day)::DATE week_start, pp.period_source
    FROM public.sahabat_safar_pairing_periods pp
    CROSS JOIN LATERAL generate_series(GREATEST(start_date,pp.paired_at::DATE), LEAST(data_cutoff_date,COALESCE(pp.unpaired_at::DATE,data_cutoff_date)), INTERVAL '1 day') day
    WHERE pp.user_id=p_participant_user_id AND pp.paired_at::DATE<=data_cutoff_date AND COALESCE(pp.unpaired_at::DATE,data_cutoff_date)>=start_date
  )
  SELECT COUNT(DISTINCT week_start), COALESCE(BOOL_AND(period_source='recorded'),true)
    INTO weeks, pairing_complete FROM eligible_weeks;
  SELECT COUNT(DISTINCT date_trunc('week',r.date::TIMESTAMP)) INTO supported_weeks FROM public.safar_reminders r WHERE r.user_id=p_participant_user_id AND r.date BETWEEN start_date AND data_cutoff_date AND EXISTS (SELECT 1 FROM public.sahabat_safar_pairing_periods pp WHERE pp.user_id=p_participant_user_id AND r.date BETWEEN pp.paired_at::DATE AND COALESCE(pp.unpaired_at::DATE,data_cutoff_date));
  SELECT COUNT(DISTINCT activity_date) INTO journal_days FROM public.journals WHERE user_id=p_participant_user_id AND is_canonical_day AND activity_date BETWEEN start_date AND data_cutoff_date;
  journal_total_days := GREATEST(0, (LEAST(data_cutoff_date, program_end_date) - start_date) + 1);
  WITH baseline_raw AS (
    SELECT ans.area, SUM(ans.score) total, COUNT(*) cnt
    FROM public.baseline_assessments ba JOIN public.baseline_answers ans ON ans.assessment_id=ba.id
    WHERE ba.user_id=p_participant_user_id AND ba.completed
      AND ans.area IN ('spiritual_growth','personal_development','leadership_excellence','relationship','community_impact')
    GROUP BY ans.area
  ), baseline_mapped AS (
    SELECT
      CASE b.area
        WHEN 'spiritual_growth' THEN 'Spiritual Growth'
        WHEN 'personal_development' THEN 'Personal Development'
        WHEN 'leadership_excellence' THEN 'Leadership Excellence'
        WHEN 'relationship' THEN 'Relationship'
        WHEN 'community_impact' THEN 'Community Impact'
        ELSE b.area
      END area,
      ROUND((b.total::NUMERIC/(b.cnt*10))*100) score
    FROM baseline_raw b
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object('area',bm.area,'score',bm.score) ORDER BY bm.area),'[]'::JSONB),
    ROUND(AVG(bm.score) FILTER (WHERE jsonb_array_length(COALESCE(j.area_transformasi,'[]'::JSONB))=0 OR COALESCE(j.area_transformasi,'[]'::JSONB) ? bm.area))
    INTO baseline_areas, baseline_score FROM baseline_mapped bm;
  WITH checkpoint_schedule AS (
    SELECT month_number, start_date + ((month_number - 1) * 30) open_date, start_date + (month_number * 30 - 1) due_date, start_date + (month_number * 30 + 6) grace_cutoff
    FROM generate_series(1,3) month_number
  ), checkpoint_rows AS (
    SELECT s.*, mr.first_submitted_at,
      CASE
        WHEN mr.first_submitted_at IS NOT NULL THEN 'SUBMITTED'
        WHEN local_date < s.open_date THEN 'NOT_MATURED'
        WHEN local_date < s.due_date THEN 'OPEN'
        WHEN local_date = s.due_date THEN 'DUE'
        WHEN local_date <= s.grace_cutoff THEN 'GRACE'
        ELSE 'MISSED'
      END status
    FROM checkpoint_schedule s LEFT JOIN public.monthly_reviews mr ON mr.user_id=p_participant_user_id AND mr.month_number=s.month_number
  )
  SELECT COUNT(*) FILTER (WHERE local_date > grace_cutoff), COUNT(*) FILTER (WHERE local_date > grace_cutoff AND first_submitted_at IS NOT NULL AND (first_submitted_at AT TIME ZONE participant_timezone)::DATE <= grace_cutoff),
    COALESCE(jsonb_agg(jsonb_build_object('month',month_number,'open_date',open_date,'mature_date',grace_cutoff + 1,'due_date',due_date,'grace_cutoff',grace_cutoff,'status',status,'submitted',first_submitted_at IS NOT NULL,'submitted_by_grace',first_submitted_at IS NOT NULL AND (first_submitted_at AT TIME ZONE participant_timezone)::DATE <= grace_cutoff,'first_submitted_at',first_submitted_at) ORDER BY month_number),'[]'::JSONB)
  INTO checkpoint_due, checkpoint_submitted, checkpoint_data FROM checkpoint_rows;
  -- Compute checkpoint_on_time: matured checkpoints submitted by grace deadline.
  checkpoint_on_time := checkpoint_submitted;
  SELECT jsonb_build_object(
    'participant_outcome', a.participant_outcome,
    'coach_score', a.coach_score,
    'validated_outcome', a.validated_outcome,
    'validation_status', a.validation_status,
    'evidence_note', a.evidence_note,
    'rubric_scores', COALESCE((SELECT jsonb_agg(jsonb_build_object('rubric_key', s.rubric_key, 'score', s.score, 'weight', s.weight) ORDER BY s.rubric_key) FROM public.coach_assessment_scores s WHERE s.assessment_id = a.id), '[]'::JSONB)
  ) INTO assessment FROM public.coach_assessments a WHERE a.participant_user_id=p_participant_user_id AND a.journey_id=j.id;
  RETURN jsonb_build_object(
    'user_id', p_participant_user_id,
    'journey_id', j.id,
    'indicators', indicator_data,
    'participant', jsonb_build_object('user_id', p.user_id, 'full_name', p.full_name, 'company_name', p.company_name, 'location', p.location, 'journey_status', j.status, 'journey_id', j.id, 'muhasabah', j.muhasabah, 'niat', j.niat, 'main_target', j.main_target, 'area_transformasi', j.area_transformasi, 'success_indicators', j.success_indicators),
    'baseline', jsonb_build_object('completed', EXISTS(SELECT 1 FROM public.baseline_assessments ba WHERE ba.user_id=p_participant_user_id AND ba.completed),'score',baseline_score,'areas',baseline_areas),
    'methodology_version', '1.1',
    'period', jsonb_build_object('start_date',start_date,'program_end_date',program_end_date,'data_cutoff_date',data_cutoff_date,'checkpoint_grace_cutoff',program_end_date + 7,'timezone',participant_timezone),
    'metrics', jsonb_build_object('outcome',jsonb_build_object('score',CASE WHEN measured_indicators=0 THEN NULL ELSE ROUND(outcome) END,'numerator',measured_indicators,'denominator',active_indicators,'indicator_coverage',CASE WHEN active_indicators=0 THEN 0 ELSE LEAST(100, ROUND(active_indicators::NUMERIC/(GREATEST(1,jsonb_array_length(COALESCE(j.area_transformasi,'[]'::JSONB)))*4)*100)) END,'measurement_coverage',CASE WHEN active_indicators=0 THEN 0 ELSE ROUND(measured_indicators::NUMERIC/active_indicators*100) END,'coverage',CASE WHEN active_indicators=0 THEN 0 ELSE ROUND(measured_indicators::NUMERIC/active_indicators*100) END,'period_end',program_end_date,'areas',outcome_areas),'execution',jsonb_build_object('score',CASE WHEN measured_execution_areas=0 THEN NULL ELSE ROUND(execution) END,'numerator',completed,'denominator',scheduled,'coverage',CASE WHEN scheduled=0 THEN NULL ELSE ROUND(completed::NUMERIC/scheduled*100) END,'unsupported_habits',unsupported_habits,'areas',execution_areas),'engagement',jsonb_build_object('baseline',EXISTS(SELECT 1 FROM public.baseline_assessments ba WHERE ba.user_id=p_participant_user_id AND ba.completed),'ptp',active_indicators>0,'checkpoint',jsonb_build_object('met',checkpoint_on_time>0 AND checkpoint_on_time=checkpoint_due,'numerator',checkpoint_on_time,'denominator',checkpoint_due,'coverage',CASE WHEN checkpoint_due=0 THEN NULL ELSE ROUND(checkpoint_on_time::NUMERIC/checkpoint_due*100) END,'items',checkpoint_data),'journal',jsonb_build_object('met',journal_total_days>0 AND journal_days>=CEIL(journal_total_days*0.5),'journal_days',journal_days,'total_days',journal_total_days,'consistency',CASE WHEN journal_total_days=0 THEN NULL ELSE ROUND(journal_days::NUMERIC/journal_total_days*100) END),'tracking',scheduled>0 OR measured_indicators>0),'peer_support',jsonb_build_object('score',CASE WHEN weeks=0 THEN NULL ELSE ROUND(LEAST(100,supported_weeks::NUMERIC/weeks*100)) END,'numerator',supported_weeks,'denominator',weeks,'period_data_complete',weeks>0 AND pairing_complete,'limitation',CASE WHEN weeks=0 THEN 'Pairing period has not been recorded; historical pairing cannot be inferred safely.' WHEN NOT pairing_complete THEN 'Includes estimated legacy pairing period.' ELSE NULL END),'coach_assessment',assessment)
  );
END; $$;

REVOKE ALL ON FUNCTION public.get_participant_assessment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_participant_assessment(UUID) TO authenticated;

-- ── RLS for the link table ──
ALTER TABLE public.ptp_indicator_action_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Related users manage indicator action plan links" ON public.ptp_indicator_action_plans;
CREATE POLICY "Related users manage indicator action plan links" ON public.ptp_indicator_action_plans
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.ptp_indicators pi
      WHERE pi.id = indicator_id AND (auth.uid() = pi.participant_user_id OR public.is_coach_of(pi.participant_user_id) OR public.is_admin())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ptp_indicators pi
      WHERE pi.id = indicator_id AND auth.uid() = pi.participant_user_id
    )
  );

NOTIFY pgrst, 'reload schema';
COMMIT;
