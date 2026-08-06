-- Grant table privileges required for PostgREST before RLS evaluates access.

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.ptp_indicator_action_plans
TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
