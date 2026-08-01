-- Enforce participant monitoring edit windows at the database layer.

CREATE OR REPLACE FUNCTION public.current_program_day(target_user_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    1,
    LEAST(
      90,
      (CURRENT_DATE - COALESCE(
        (SELECT p.start_date::date FROM public.profiles p WHERE p.user_id = target_user_id LIMIT 1),
        CURRENT_DATE
      )) + 1
    )
  )::int;
$$;

CREATE OR REPLACE FUNCTION public.enforce_monthly_review_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  program_day INT;
  start_day INT;
  grace_end_day INT;
BEGIN
  IF NEW.user_id <> auth.uid() THEN
    RETURN NEW;
  END IF;

  program_day := public.current_program_day(NEW.user_id);
  start_day := ((NEW.month_number - 1) * 30) + 1;
  grace_end_day := (NEW.month_number * 30) + 7;

  IF NEW.month_number NOT BETWEEN 1 AND 3 OR program_day < start_day OR program_day > grace_end_day THEN
    RAISE EXCEPTION 'Checkpoint month % is not editable on program day %', NEW.month_number, program_day;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_monthly_review_window_trigger ON public.monthly_reviews;
CREATE TRIGGER enforce_monthly_review_window_trigger
  BEFORE INSERT OR UPDATE ON public.monthly_reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_monthly_review_window();

DROP TRIGGER IF EXISTS enforce_monthly_indicator_window_trigger ON public.monthly_indicator_reports;
CREATE TRIGGER enforce_monthly_indicator_window_trigger
  BEFORE INSERT OR UPDATE ON public.monthly_indicator_reports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_monthly_review_window();

CREATE OR REPLACE FUNCTION public.enforce_final_reflection_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id = auth.uid()
     AND NEW.final_reflection IS DISTINCT FROM OLD.final_reflection
     AND public.current_program_day(NEW.user_id) < 89 THEN
    RAISE EXCEPTION 'Final reflection is available from program day 89';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_final_reflection_window_trigger ON public.journeys;
CREATE TRIGGER enforce_final_reflection_window_trigger
  BEFORE UPDATE OF final_reflection ON public.journeys
  FOR EACH ROW EXECUTE FUNCTION public.enforce_final_reflection_window();

REVOKE ALL ON FUNCTION public.current_program_day(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_program_day(UUID) TO authenticated;
