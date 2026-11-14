-- Trial plan/results span 14 days. Evaluation snapshots are collected in weeks 1 and 2.
-- Apply after SQL36. Existing participant records remain in place.
BEGIN;

CREATE OR REPLACE FUNCTION public.slj_practice_row_access(p_user_id UUID, p_table TEXT, p_row JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE code TEXT; targets JSONB;
BEGIN
  IF NOT public.slj_feature_access(p_user_id, 'practice') THEN RETURN FALSE; END IF;
  IF public.is_admin() OR public.is_coach_of(p_user_id) THEN RETURN TRUE; END IF;
  SELECT program_code INTO code FROM public.profiles WHERE user_id = p_user_id;
  IF code IS DISTINCT FROM 'SLJ-TRIAL-14' THEN RETURN TRUE; END IF;
  CASE
    WHEN p_table IN ('action_plans', 'habits') THEN
      RETURN p_row->>'area_category' = 'Spiritual Growth';
    WHEN p_table = 'habit_logs' THEN
      RETURN EXISTS (SELECT 1 FROM public.habits h WHERE h.id::TEXT = p_row->>'habit_id'
        AND h.user_id = p_user_id AND h.area_category = 'Spiritual Growth')
        AND public.slj_activity_access(p_user_id, COALESCE(p_row->>'activity_date', p_row->>'date'));
    WHEN p_table = 'baseline_answers' THEN
      RETURN (p_row->>'area' = 'spiritual_growth' AND (p_row->>'question_number')::INT BETWEEN 1 AND 9)
        OR (p_row->>'area' = 'readiness' AND (p_row->>'question_number')::INT BETWEEN 46 AND 50);
    WHEN p_table IN ('ptp_indicators', 'monthly_indicator_reports') THEN
      RETURN p_row->>'area' = 'Spiritual Growth'
        AND (p_table <> 'monthly_indicator_reports' OR p_row->>'month_number' IN ('1','2'));
    WHEN p_table = 'ptp_indicator_actuals' THEN
      RETURN p_row->>'month_number' IN ('1','2')
        AND EXISTS (SELECT 1 FROM public.ptp_indicators i WHERE i.id::TEXT = p_row->>'indicator_id'
          AND i.participant_user_id = p_user_id AND i.area = 'Spiritual Growth');
    WHEN p_table = 'monthly_reviews' THEN
      RETURN p_row->>'month_number' IN ('1','2');
    WHEN p_table = 'ptp_snapshots' THEN
      RETURN NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(p_row #> '{snapshot_data,area_transformasi}', '[]'::JSONB)) area
        WHERE area <> 'Spiritual Growth'
      );
    WHEN p_table = 'journeys' THEN
      IF COALESCE(p_row->'area_transformasi','[]'::JSONB) <> '["Spiritual Growth"]'::JSONB THEN RETURN FALSE; END IF;
      IF p_row->'ptp_draft' IS NOT NULL AND p_row->'ptp_draft' <> 'null'::JSONB THEN
        IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(p_row #> '{ptp_draft,selected_areas}','[]'::JSONB)) area WHERE area <> 'Spiritual Growth') THEN RETURN FALSE; END IF;
        IF EXISTS (SELECT 1 FROM jsonb_object_keys(COALESCE(p_row #> '{ptp_draft,targets}','{}'::JSONB)) area WHERE area <> 'Spiritual Growth') THEN RETURN FALSE; END IF;
      END IF;
      IF NULLIF(BTRIM(p_row->>'main_target'),'') IS NOT NULL THEN
        targets := (p_row->>'main_target')::JSONB;
        IF jsonb_typeof(targets) <> 'object' OR EXISTS (
          SELECT 1 FROM jsonb_object_keys(targets) area WHERE area <> 'Spiritual Growth'
        ) THEN RETURN FALSE; END IF;
      END IF;
      RETURN TRUE;
    ELSE
      RETURN p_table IN ('baseline_assessments', 'sahabat_safar_profiles');
  END CASE;
EXCEPTION WHEN invalid_text_representation OR invalid_parameter_value THEN RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_program_day(target_user_id UUID)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN p.program_code = 'SLJ-TRIAL-14'
    THEN GREATEST(0,FLOOR(EXTRACT(EPOCH FROM (NOW()-p.start_date))/86400)+1)::INT
    ELSE GREATEST(0,((NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone,''),'Asia/Jakarta'))::DATE
      - COALESCE((p.start_date AT TIME ZONE COALESCE(NULLIF(p.timezone,''),'Asia/Jakarta'))::DATE,
        (NOW() AT TIME ZONE COALESCE(NULLIF(p.timezone,''),'Asia/Jakarta'))::DATE))+1)::INT
    END
  FROM public.profiles p WHERE p.user_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.enforce_monthly_review_window()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE program_day INT; code TEXT;
BEGIN
  IF NEW.user_id <> auth.uid() THEN RETURN NEW; END IF;
  SELECT program_code INTO code FROM public.profiles WHERE user_id = NEW.user_id;
  program_day := public.current_program_day(NEW.user_id);
  IF code = 'SLJ-TRIAL-14' THEN
    IF NEW.month_number NOT BETWEEN 1 AND 2
      OR program_day < ((NEW.month_number-1)*7)+1 OR program_day > NEW.month_number*7
      OR NOT public.slj_feature_access(NEW.user_id,'practice') THEN
      RAISE EXCEPTION 'Evaluasi uji coba hanya dapat diisi pada pekan yang sedang berjalan.';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.month_number NOT BETWEEN 1 AND 3 OR program_day < ((NEW.month_number-1)*30)+1
    OR program_day > NEW.month_number*30+7 THEN
    RAISE EXCEPTION 'Bulan % tidak dapat diedit pada hari program %.',NEW.month_number,program_day;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.slj_trial_evaluation_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row_data JSONB; owner_id UUID; evaluation INT; day_number INT;
BEGIN
  row_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  owner_id := (row_data->>'participant_user_id')::UUID;
  IF owner_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = owner_id AND program_code = 'SLJ-TRIAL-14'
  ) THEN
    evaluation := (row_data->>'month_number')::INT;
    day_number := public.current_program_day(owner_id);
    IF evaluation NOT BETWEEN 1 AND 2 OR day_number < ((evaluation-1)*7)+1 OR day_number > evaluation*7
      OR NOT public.slj_feature_access(owner_id,'practice') THEN
      RAISE EXCEPTION 'Capaian uji coba hanya dapat diubah pada pekan yang sedang berjalan.';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS slj_trial_evaluation_guard ON public.ptp_indicator_actuals;
CREATE TRIGGER slj_trial_evaluation_guard BEFORE INSERT OR UPDATE OR DELETE ON public.ptp_indicator_actuals
  FOR EACH ROW EXECUTE FUNCTION public.slj_trial_evaluation_guard();

CREATE OR REPLACE FUNCTION public.get_participant_assessment(p_participant_user_id UUID DEFAULT auth.uid()) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_variable
DECLARE j public.journeys%ROWTYPE; p public.profiles%ROWTYPE; start_date DATE; program_end_date DATE; data_cutoff_date DATE; local_date DATE; participant_timezone TEXT; active_indicators INT := 0; measured_indicators INT := 0; outcome NUMERIC; indicator_data JSONB := '[]'; outcome_areas JSONB := '[]'; execution_areas JSONB := '[]'; measured_execution_areas INT := 0; execution NUMERIC; scheduled NUMERIC := 0; completed NUMERIC := 0; unsupported_habits INT := 0; weeks INT := 0; supported_weeks INT := 0; pairing_complete BOOLEAN := true; journal_days INT := 0; journal_total_days INT := 0; checkpoint_due INT := 0; checkpoint_submitted INT := 0; checkpoint_on_time INT := 0; checkpoint_data JSONB := '[]'; baseline_areas JSONB := '[]'; baseline_score NUMERIC; assessment JSONB; BEGIN
  IF p_participant_user_id <> auth.uid() AND NOT public.is_admin() AND NOT public.is_coach_of(p_participant_user_id) THEN RAISE EXCEPTION 'Akses assessment ditolak.' USING ERRCODE='42501'; END IF;
  IF NOT public.slj_feature_access(p_participant_user_id, 'practice') THEN RAISE EXCEPTION 'Assessment tersedia dalam program pendampingan.' USING ERRCODE='42501'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id=p_participant_user_id; SELECT * INTO j FROM public.journeys WHERE user_id=p_participant_user_id ORDER BY created_at DESC, id DESC LIMIT 1;
  IF p.user_id IS NULL OR j.id IS NULL THEN RAISE EXCEPTION 'Peserta atau journey tidak ditemukan.'; END IF;
  participant_timezone := COALESCE(NULLIF(p.timezone, ''), 'Asia/Jakarta');
  local_date := (NOW() AT TIME ZONE participant_timezone)::DATE;
  start_date := COALESCE((p.start_date AT TIME ZONE participant_timezone)::DATE, (j.created_at AT TIME ZONE participant_timezone)::DATE, local_date);
  program_end_date := CASE WHEN p.program_code = 'SLJ-TRIAL-14'
    THEN (p.end_date AT TIME ZONE participant_timezone)::DATE ELSE start_date + 89 END;
  data_cutoff_date := LEAST(program_end_date, local_date);
  WITH scored AS (
    SELECT i.area, i.active, latest.actual_value,
      CASE WHEN i.active AND latest.actual_value IS NOT NULL AND i.baseline_value IS NOT NULL AND i.target_value IS NOT NULL AND i.baseline_value <> i.target_value
        THEN LEAST(100, GREATEST(0, CASE WHEN i.direction='higher_is_better' THEN (latest.actual_value-i.baseline_value)/(i.target_value-i.baseline_value)*100 ELSE (i.baseline_value-latest.actual_value)/(i.baseline_value-i.target_value)*100 END)) END score
    FROM public.ptp_indicators i LEFT JOIN LATERAL (
      SELECT x.actual_value FROM public.ptp_indicator_actuals x
      WHERE x.indicator_id=i.id
        AND ((x.month_number - 1) * CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN 7 ELSE 30 END)
          < CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN public.current_program_day(p.user_id) ELSE (data_cutoff_date - start_date) + 1 END
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
    'actuals', COALESCE((SELECT jsonb_agg(jsonb_build_object('month', x.month_number, 'actual', x.actual_value, 'evidence_note', x.evidence_note) ORDER BY x.month_number) FROM public.ptp_indicator_actuals x WHERE x.indicator_id = i.id), '[]'::JSONB)
  ) ORDER BY i.area, i.indicator_type), '[]'::JSONB)
  INTO indicator_data
  FROM public.ptp_indicators i
  WHERE i.participant_user_id = p_participant_user_id AND i.journey_id = j.id;
  -- Each habit and each measured area has equal weight. Quantity only caps its occurrence.
  WITH definitions AS (
    SELECT h.id::TEXT id, COALESCE(ap.area_category,h.area_category,h.category,'Tanpa Area') area,
      h.frequency_kind frequency, GREATEST(COALESCE(h.quantity,1),1)::NUMERIC quantity,
      h.custom_schedule, GREATEST(start_date,COALESCE(h.effective_from,start_date)) first_day,
      LEAST(data_cutoff_date,COALESCE(h.effective_until,data_cutoff_date)) last_day
    FROM public.habits h LEFT JOIN public.action_plans ap ON ap.id=h.action_plan_id AND ap.journey_id=j.id
    WHERE h.user_id=p_participant_user_id AND NOT COALESCE(h.is_archived,false)
      AND (h.action_plan_id IS NULL OR ap.id IS NOT NULL)
    UNION ALL
    SELECT 'missing:' || ap.id::TEXT, COALESCE(ap.area_category,'Tanpa Area'),
      CASE WHEN lower(COALESCE(ap.frequency,'')) IN ('daily','harian','setiap hari') THEN 'daily'
        WHEN lower(COALESCE(ap.frequency,'')) IN ('weekly','pekanan') OR lower(ap.frequency) LIKE '%minggu%' THEN 'weekly' ELSE 'unsupported' END,
      GREATEST(COALESCE(ap.quantity,ap.target,1),1)::NUMERIC, NULL::JSONB, start_date, data_cutoff_date
    FROM public.action_plans ap WHERE ap.journey_id=j.id AND ap.user_id=p_participant_user_id
      AND NOT EXISTS (SELECT 1 FROM public.habits h WHERE h.user_id=ap.user_id AND h.action_plan_id=ap.id)
  ), eligible AS (
    SELECT d.*, CASE WHEN d.frequency IN ('daily','weekly') THEN true
      WHEN d.frequency='custom' AND jsonb_typeof(d.custom_schedule->'weekdays')='array'
        THEN jsonb_array_length(d.custom_schedule->'weekdays')>0
          AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(d.custom_schedule->'weekdays') wd WHERE wd !~ '^[1-7]$')
      ELSE false END supported
    FROM definitions d WHERE d.first_day<=d.last_day
      AND (jsonb_array_length(COALESCE(j.area_transformasi,'[]'::JSONB))=0 OR j.area_transformasi ? d.area)
  ), occurrences AS (
    SELECT DISTINCT d.id, CASE WHEN d.frequency='weekly' THEN date_trunc('week',day)::DATE ELSE day::DATE END occurrence
    FROM eligible d CROSS JOIN LATERAL generate_series(d.first_day,d.last_day,INTERVAL '1 day') day
    WHERE d.supported AND (d.frequency<>'custom' OR EXTRACT(ISODOW FROM day)::INT IN
      (SELECT wd::INT FROM jsonb_array_elements_text(d.custom_schedule->'weekdays') wd))
  ), habit_data AS (
    SELECT d.id,d.area,d.supported, COUNT(o.occurrence)*d.quantity scheduled,
      COALESCE(SUM(LEAST(d.quantity,GREATEST(0,COALESCE(hl.completed_count,CASE WHEN hl.completed THEN 1 ELSE 0 END)))),0) done
    FROM eligible d LEFT JOIN occurrences o ON o.id=d.id
    LEFT JOIN public.habit_logs hl ON hl.habit_id::TEXT=d.id AND hl.user_id=p_participant_user_id
      AND hl.is_canonical_occurrence AND hl.occurrence_start=o.occurrence
      AND COALESCE(hl.activity_date,hl.date::DATE) BETWEEN d.first_day AND d.last_day
    GROUP BY d.id,d.area,d.supported,d.quantity
  ), area_data AS (
    SELECT hd.area, SUM(hd.done) FILTER (WHERE hd.supported) completed, SUM(hd.scheduled) FILTER (WHERE hd.supported) scheduled,
      COUNT(*) FILTER (WHERE NOT hd.supported) unsupported,
      AVG(CASE WHEN hd.supported AND hd.scheduled>0 THEN hd.done/hd.scheduled*100 END) score
    FROM habit_data hd GROUP BY hd.area
  ) SELECT COALESCE(SUM(ad.scheduled),0),COALESCE(SUM(ad.completed),0),COALESCE(SUM(ad.unsupported),0),COUNT(ad.score),AVG(ad.score),
    COALESCE(jsonb_agg(jsonb_build_object('area',ad.area,'score',ROUND(ad.score),'numerator',ad.completed,'denominator',ad.scheduled,
      'unsupported_habits',ad.unsupported,'status',CASE WHEN ad.score IS NOT NULL THEN 'TERUKUR'
        WHEN ad.unsupported>0 THEN 'TIDAK_DAPAT_DIHITUNG' ELSE 'TIDAK_DIUKUR' END) ORDER BY ad.area),'[]'::JSONB)
    INTO scheduled,completed,unsupported_habits,measured_execution_areas,execution,execution_areas FROM area_data ad;
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
    SELECT month_number, start_date + ((month_number - 1) * CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN 7 ELSE 30 END) open_date,
      CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN start_date + (month_number * 7 - 1) ELSE start_date + (month_number * 30 - 1) END due_date,
      CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN start_date + (month_number * 7 - 1) ELSE start_date + (month_number * 30 + 6) END grace_cutoff
    FROM generate_series(1,CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN 2 ELSE 3 END) month_number
  ), checkpoint_rows AS (
    SELECT s.*, mr.first_submitted_at,
      CASE
        WHEN mr.first_submitted_at IS NOT NULL THEN 'SUBMITTED'
        WHEN p.program_code = 'SLJ-TRIAL-14' THEN
          CASE WHEN public.current_program_day(p.user_id) < ((s.month_number-1)*7)+1 THEN 'NOT_MATURED'
            WHEN public.current_program_day(p.user_id) < s.month_number*7 THEN 'OPEN'
            WHEN public.current_program_day(p.user_id) = s.month_number*7 THEN 'DUE' ELSE 'MISSED' END
        WHEN local_date < s.open_date THEN 'NOT_MATURED'
        WHEN local_date < s.due_date THEN 'OPEN'
        WHEN local_date = s.due_date THEN 'DUE'
        WHEN local_date <= s.grace_cutoff THEN 'GRACE'
        ELSE 'MISSED'
      END status
    FROM checkpoint_schedule s LEFT JOIN public.monthly_reviews mr ON mr.user_id=p_participant_user_id AND mr.month_number=s.month_number
  )
  SELECT COUNT(*) FILTER (WHERE CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN public.current_program_day(p.user_id) > month_number*7 ELSE local_date > grace_cutoff END), COUNT(*) FILTER (WHERE CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN public.current_program_day(p.user_id) > month_number*7 ELSE local_date > grace_cutoff END AND first_submitted_at IS NOT NULL AND CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN first_submitted_at < p.start_date + (month_number*7) * INTERVAL '1 day' ELSE (first_submitted_at AT TIME ZONE participant_timezone)::DATE <= grace_cutoff END),
    COALESCE(jsonb_agg(jsonb_build_object('month',month_number,'open_date',open_date,'mature_date',grace_cutoff + 1,'due_date',due_date,'grace_cutoff',grace_cutoff,'status',status,'submitted',first_submitted_at IS NOT NULL,'submitted_by_grace',first_submitted_at IS NOT NULL AND CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN first_submitted_at < p.start_date + (month_number*7) * INTERVAL '1 day' ELSE (first_submitted_at AT TIME ZONE participant_timezone)::DATE <= grace_cutoff END,'first_submitted_at',first_submitted_at) ORDER BY month_number),'[]'::JSONB)
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
    'methodology_version', '1.0',
    'period', jsonb_build_object('start_date',start_date,'program_end_date',program_end_date,'data_cutoff_date',data_cutoff_date,'checkpoint_grace_cutoff',program_end_date + 7,'timezone',participant_timezone),
    'metrics', jsonb_build_object('outcome',jsonb_build_object('score',CASE WHEN measured_indicators=0 THEN NULL ELSE ROUND(outcome) END,'numerator',measured_indicators,'denominator',active_indicators,'indicator_coverage',CASE WHEN active_indicators=0 THEN 0 ELSE LEAST(100, ROUND(active_indicators::NUMERIC/(GREATEST(1,jsonb_array_length(COALESCE(j.area_transformasi,'[]'::JSONB)))*4)*100)) END,'measurement_coverage',CASE WHEN active_indicators=0 THEN 0 ELSE ROUND(measured_indicators::NUMERIC/active_indicators*100) END,'coverage',CASE WHEN active_indicators=0 THEN 0 ELSE ROUND(measured_indicators::NUMERIC/active_indicators*100) END,'period_end',program_end_date,'areas',outcome_areas),'execution',jsonb_build_object('score',CASE WHEN measured_execution_areas=0 THEN NULL ELSE ROUND(execution) END,'numerator',completed,'denominator',scheduled,'coverage',CASE WHEN scheduled=0 THEN NULL ELSE ROUND(completed::NUMERIC/scheduled*100) END,'unsupported_habits',unsupported_habits,'areas',execution_areas),'engagement',jsonb_build_object('baseline',EXISTS(SELECT 1 FROM public.baseline_assessments ba WHERE ba.user_id=p_participant_user_id AND ba.completed),'ptp',jsonb_array_length(COALESCE(j.area_transformasi,'[]'::JSONB))=CASE WHEN p.program_code = 'SLJ-TRIAL-14' THEN 1 ELSE 3 END AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(j.area_transformasi) a WHERE (SELECT COUNT(*) FROM public.ptp_indicators i WHERE i.journey_id=j.id AND i.area=a AND i.active) NOT BETWEEN 1 AND 4),'checkpoint',jsonb_build_object('met',checkpoint_on_time>0 AND checkpoint_on_time=checkpoint_due,'numerator',checkpoint_on_time,'denominator',checkpoint_due,'coverage',CASE WHEN checkpoint_due=0 THEN NULL ELSE ROUND(checkpoint_on_time::NUMERIC/checkpoint_due*100) END,'items',checkpoint_data),'journal',jsonb_build_object('met',journal_total_days>0 AND journal_days>=CEIL(journal_total_days*0.5),'journal_days',journal_days,'total_days',journal_total_days,'consistency',CASE WHEN journal_total_days=0 THEN NULL ELSE ROUND(journal_days::NUMERIC/journal_total_days*100) END),'tracking',measured_indicators>0 OR EXISTS(SELECT 1 FROM public.habit_logs hl WHERE hl.user_id=p_participant_user_id AND hl.is_canonical_occurrence AND COALESCE(hl.activity_date,hl.date::DATE) BETWEEN start_date AND data_cutoff_date)),'peer_support',jsonb_build_object('score',CASE WHEN weeks=0 THEN NULL ELSE ROUND(LEAST(100,supported_weeks::NUMERIC/weeks*100)) END,'numerator',supported_weeks,'denominator',weeks,'period_data_complete',weeks>0 AND pairing_complete,'limitation',CASE WHEN weeks=0 THEN 'Pairing period has not been recorded; historical pairing cannot be inferred safely.' WHEN NOT pairing_complete THEN 'Includes estimated legacy pairing period.' ELSE NULL END),'coach_assessment',assessment)
  );
END; $$;
COMMIT;
