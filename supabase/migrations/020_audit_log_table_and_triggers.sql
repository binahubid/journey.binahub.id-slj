-- ====================================================================
-- 020_audit_log_table_and_triggers.sql
-- Tabel audit_log untuk mencatat perubahan data penting.
-- Trigger otomatis pada companies, batches, profiles, journeys.
-- ====================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. AUDIT LOG TABLE
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,          -- INSERT, UPDATE, DELETE
  table_name TEXT NOT NULL,      -- companies, batches, profiles, journeys
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON public.audit_log (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- 2. RLS POLICIES
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.audit_log;
CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "System insert audit log" ON public.audit_log;
CREATE POLICY "System insert audit log" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- 3. GENERIC AUDIT TRIGGER FUNCTION
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID;
  actor_email TEXT;
  old_json JSONB;
  new_json JSONB;
BEGIN
  -- Ambil actor dari auth context
  actor := auth.uid();
  SELECT email INTO actor_email FROM auth.users WHERE id = actor;

  IF TG_OP = 'INSERT' THEN
    new_json := to_jsonb(NEW);
    INSERT INTO public.audit_log (actor_id, actor_email, action, table_name, record_id, new_data)
    VALUES (actor, actor_email, 'INSERT', TG_TABLE_NAME, NEW.id, new_json);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    -- Skip jika tidak ada perubahan signifikan (hanya updated_at)
    IF old_json - 'updated_at' = new_json - 'updated_at' THEN
      RETURN NEW;
    END IF;
    INSERT INTO public.audit_log (actor_id, actor_email, action, table_name, record_id, old_data, new_data)
    VALUES (actor, actor_email, 'UPDATE', TG_TABLE_NAME, NEW.id, old_json, new_json);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    old_json := to_jsonb(OLD);
    INSERT INTO public.audit_log (actor_id, actor_email, action, table_name, record_id, old_data)
    VALUES (actor, actor_email, 'DELETE', TG_TABLE_NAME, OLD.id, old_json);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 4. ATTACH TRIGGERS KE TABEL
-- ──────────────────────────────────────────────────────────────

-- Companies
DROP TRIGGER IF EXISTS audit_companies ON public.companies;
CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Batches
DROP TRIGGER IF EXISTS audit_batches ON public.batches;
CREATE TRIGGER audit_batches
  AFTER INSERT OR UPDATE OR DELETE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Profiles (hanya perubahan role, company_id, batch_id, coach_id)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Journeys (hanya perubahan ptp_status)
DROP TRIGGER IF EXISTS audit_journeys ON public.journeys;
CREATE TRIGGER audit_journeys
  AFTER INSERT OR UPDATE OR DELETE ON public.journeys
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ──────────────────────────────────────────────────────────────
-- 5. RPC untuk membaca audit log (admin-only, dengan filter)
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_audit_log(
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS SETOF public.audit_log
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat membaca audit log.';
  END IF;

  RETURN QUERY
  SELECT al.*
  FROM public.audit_log al
  WHERE (p_table_name IS NULL OR al.table_name = p_table_name)
    AND (p_record_id IS NULL OR al.record_id = p_record_id)
    AND (p_actor_id IS NULL OR al.actor_id = p_actor_id)
  ORDER BY al.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 500))
  OFFSET GREATEST(0, p_offset);
END;
$$;

REVOKE ALL ON FUNCTION public.get_audit_log(TEXT, UUID, UUID, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_audit_log(TEXT, UUID, UUID, INT, INT) TO authenticated;
