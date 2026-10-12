-- =============================================================================================
-- 30-hosted.sql — defence in depth for hosted PostgreSQL (Supabase and similar). Safe everywhere.
--
-- 1. Row level security on every app table, with policies only for the app roles. Any other role
--    (for example Supabase's `anon` / `authenticated` behind its public REST "Data API") sees no
--    rows even if it is granted a table later. The table owner (migrations, import) is unaffected.
-- 2. If Supabase's API roles exist, remove every privilege they got on our tables, and stop them
--    getting privileges on tables created later.
-- Run after 20-security.sql. Idempotent.
-- =============================================================================================

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS ascend_apps ON public.%I', t);
    -- Permissions are still decided by the GRANTs in 20-security.sql; RLS only shuts out every
    -- role that is not one of ours.
    EXECUTE format('CREATE POLICY ascend_apps ON public.%I TO ascend_web, ascend_admin, ascend_readonly USING (true) WITH CHECK (true)', t);
  END LOOP;
END
$$;

-- Prisma's migration bookkeeping is never needed by the apps (only present when Prisma migrated).
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    REVOKE ALL ON TABLE public._prisma_migrations FROM PUBLIC;
  END IF;
END
$$;

DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', r);
      -- Tables created later by the current role (migrations) are not handed to the API roles.
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', r);
    END IF;
  END LOOP;
END
$$;
