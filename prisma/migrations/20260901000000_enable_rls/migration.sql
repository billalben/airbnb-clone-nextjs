-- Enable RLS on all existing app tables (deny-by-default: no policies yet).
-- The application accesses these tables only through Prisma, which connects
-- with a BYPASSRLS admin role, so RLS does not affect the running app.
ALTER TABLE "User"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Home"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HomeImage"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Favorite"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reservation" ENABLE ROW LEVEL SECURITY;

-- Auto-enable RLS on any future table created in the public schema, so the
-- "RLS disabled" security warning does not reappear as the schema grows.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
  LOOP
    IF cmd.schema_name = 'public' THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
    END IF;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();