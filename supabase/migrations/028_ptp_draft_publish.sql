BEGIN;

ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS ptp_draft JSONB,
  ADD COLUMN IF NOT EXISTS ptp_draft_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ptp_published_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.save_ptp_draft(p_journey_id UUID, p_draft JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = p_journey_id AND j.user_id = auth.uid() AND j.ptp_status = 'EDITABLE'
  ) THEN
    RAISE EXCEPTION 'Draft PTP tidak dapat disimpan.' USING ERRCODE = '42501';
  END IF;
  IF p_draft IS NULL OR jsonb_typeof(p_draft) <> 'object' THEN
    RAISE EXCEPTION 'Format draft PTP tidak valid.';
  END IF;

  UPDATE public.journeys
  SET ptp_draft = p_draft, ptp_draft_updated_at = NOW()
  WHERE id = p_journey_id;

  RETURN jsonb_build_object('saved', true, 'saved_at', NOW());
END; $$;

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
    label, active, direction, baseline_value, target_value, unit, updated_at
  )
  SELECT auth.uid(), p_journey_id, selected.area, item->>'key', item->>'type', BTRIM(item->>'label'),
    true, item->>'direction', (item->>'baseline')::NUMERIC, (item->>'target')::NUMERIC,
    BTRIM(item->>'unit'), NOW()
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

  RETURN jsonb_build_object('published', true, 'published_at', NOW());
END; $$;

REVOKE ALL ON FUNCTION public.save_ptp_draft(UUID,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_ptp_draft(UUID,JSONB) TO authenticated;
REVOKE ALL ON FUNCTION public.publish_ptp_draft(UUID,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_ptp_draft(UUID,JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
