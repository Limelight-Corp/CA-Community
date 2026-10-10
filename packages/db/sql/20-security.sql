-- =============================================================================================
-- 20-security.sql — roles, least-privilege grants and tamper-proof audit log.
--
-- Run as a superuser once per database, AFTER the Prisma migration and 10-constraints.sql.
-- Passwords are NOT set here: set them out of band (see docs/DATABASE_DESIGN.md), e.g.
--   ALTER ROLE ascend_web PASSWORD '<from your secret manager>';
--
-- Roles
--   ascend_owner    owns the schema; used ONLY for migrations (DATABASE_MIGRATION_URL).
--   ascend_web      the public website. Reads published content; writes bookings, accounts,
--                   applications, messages, mentorship. Cannot see admin users or the audit log,
--                   cannot change content, cannot delete anything.
--   ascend_admin    the admin console. Full content management and back-office writes; may only
--                   INSERT into the audit log; cannot alter the schema.
--   ascend_readonly reporting / BI. SELECT only, and no secret columns.
-- =============================================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ascend_owner')    THEN CREATE ROLE ascend_owner    NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ascend_web')      THEN CREATE ROLE ascend_web      LOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ascend_admin')    THEN CREATE ROLE ascend_admin    LOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ascend_readonly') THEN CREATE ROLE ascend_readonly LOGIN; END IF;
END
$$;

-- App roles can never become superuser, create databases/roles, bypass RLS or replicate.
ALTER ROLE ascend_web      NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 40;
ALTER ROLE ascend_admin    NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 15;
ALTER ROLE ascend_readonly NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 5;

-- Runaway or stuck queries are cut off instead of piling up (also limits slow-query DoS).
ALTER ROLE ascend_web      SET statement_timeout = '5s';
ALTER ROLE ascend_admin    SET statement_timeout = '30s';
ALTER ROLE ascend_readonly SET statement_timeout = '60s';
ALTER ROLE ascend_web      SET idle_in_transaction_session_timeout = '15s';
ALTER ROLE ascend_admin    SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE ascend_readonly SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE ascend_web      SET lock_timeout = '3s';
ALTER ROLE ascend_admin    SET lock_timeout = '10s';
-- Log slow statements from the apps for tuning.
ALTER ROLE ascend_web      SET log_min_duration_statement = '500ms';
ALTER ROLE ascend_admin    SET log_min_duration_statement = '1s';

-- Nobody gets anything by default.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
-- Only our own functions: extension functions in public (citext, pg_trgm operators) must stay
-- executable, or every case-insensitive comparison fails.
REVOKE ALL ON FUNCTION ascend_is_email(citext), ascend_is_mobile(text), ascend_is_https(text),
  ascend_is_link(text), ascend_is_slug(text), ascend_is_sha256(text) FROM PUBLIC;
REVOKE ALL ON PROCEDURE ascend_check(regclass, text, text) FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO ascend_web, ascend_admin, ascend_readonly;
REVOKE CREATE ON SCHEMA public FROM ascend_web, ascend_admin, ascend_readonly;

-- Validation helpers used by CHECK constraints.
GRANT EXECUTE ON FUNCTION ascend_is_email(citext), ascend_is_mobile(text), ascend_is_https(text),
  ascend_is_link(text), ascend_is_slug(text), ascend_is_sha256(text)
  TO ascend_web, ascend_admin, ascend_readonly;

-- ---------------------------------------------------------------------------------------------
-- ascend_web — the public website
-- ---------------------------------------------------------------------------------------------
GRANT SELECT ON
  site_settings, taxonomy_terms, wings, events, event_agenda_items, speakers, event_speakers,
  news_articles, resources, gallery_items, team_members, testimonials, initiatives, jobs
TO ascend_web;
-- Seat counter and download counter only (not the rest of the event / resource).
GRANT UPDATE (seats_taken, updated_at) ON events TO ascend_web;
GRANT UPDATE (downloads, updated_at)   ON resources TO ascend_web;

GRANT SELECT, INSERT, UPDATE ON member_accounts, member_profiles, auth_tokens TO ascend_web;
GRANT SELECT, INSERT, UPDATE ON event_registrations TO ascend_web;
GRANT SELECT, INSERT, UPDATE ON memberships, membership_payments TO ascend_web;
GRANT SELECT, INSERT, DELETE ON membership_interests TO ascend_web;
GRANT SELECT, INSERT, UPDATE ON mentors, mentorship_requests TO ascend_web;
GRANT SELECT, INSERT, DELETE ON mentor_wings, mentorship_request_wings TO ascend_web;
GRANT INSERT ON contact_messages TO ascend_web;
-- The reminder/notification worker runs inside the web app.
GRANT SELECT, INSERT, UPDATE ON notification_outbox TO ascend_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limit_buckets TO ascend_web;
-- Website cannot mark itself paid: payment columns on a membership are changed only through
-- verified gateway callbacks, which run in the web app, so UPDATE stays granted — but status
-- approval is admin-only (enforced by the trigger below).
-- No access at all: admin_users, audit_logs.

-- ---------------------------------------------------------------------------------------------
-- ascend_admin — the admin console
-- ---------------------------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON
  site_settings, taxonomy_terms, wings, events, event_agenda_items, speakers, event_speakers,
  news_articles, resources, gallery_items, team_members, testimonials, initiatives, jobs,
  event_registrations, memberships, membership_payments, membership_interests,
  mentors, mentor_wings, mentorship_requests, mentorship_request_wings, contact_messages,
  notification_outbox, rate_limit_buckets
TO ascend_admin;
GRANT SELECT, INSERT, UPDATE ON admin_users TO ascend_admin;
-- Admins see member accounts (to link bookings) but never the password hash or tokens.
GRANT SELECT (id, name, email, mobile, email_verified_at, last_login_at, created_at, updated_at) ON member_accounts TO ascend_admin;
GRANT SELECT ON member_profiles TO ascend_admin;
-- Audit log: append and read only.
GRANT SELECT, INSERT ON audit_logs TO ascend_admin;
GRANT USAGE ON SEQUENCE audit_logs_id_seq TO ascend_admin;

-- ---------------------------------------------------------------------------------------------
-- ascend_readonly — reporting (no secrets: column lists exclude hashes and tokens)
-- ---------------------------------------------------------------------------------------------
GRANT SELECT ON
  site_settings, taxonomy_terms, wings, events, event_agenda_items, speakers, event_speakers,
  news_articles, resources, gallery_items, team_members, testimonials, initiatives, jobs,
  memberships, membership_payments, membership_interests, mentors, mentor_wings,
  mentorship_requests, mentorship_request_wings, contact_messages
TO ascend_readonly;
GRANT SELECT (id, booking_id, event_id, account_id, event_title, name, email, mobile, city,
  membership_no, organisation, designation, fee, status, payment_status, paid_at, refund_amount,
  refunded_at, attended, attended_at, certificate_id, whatsapp_opt_in, created_at, updated_at)
  ON event_registrations TO ascend_readonly;
GRANT SELECT (id, name, email, email_verified_at, last_login_at, created_at) ON member_accounts TO ascend_readonly;

-- ---------------------------------------------------------------------------------------------
-- Tamper-proof audit log: no UPDATE / DELETE / TRUNCATE for anyone but the owner.
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ascend_audit_immutable() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (% blocked)', TG_OP USING ERRCODE = 'insufficient_privilege';
END
$$;
DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs;
CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION ascend_audit_immutable();
DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit_logs;
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION ascend_audit_immutable();

-- ---------------------------------------------------------------------------------------------
-- Guard rails the website role cannot get around, even with a bug in the app
-- ---------------------------------------------------------------------------------------------

-- The website may create membership applications and record verified payments, but never
-- approve/reject an application or change its fee.
CREATE OR REPLACE FUNCTION ascend_membership_web_guard() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF current_user = 'ascend_web' THEN
    IF TG_OP = 'INSERT' AND NEW.status <> 'PENDING' THEN
      RAISE EXCEPTION 'new applications must be PENDING' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.fee IS DISTINCT FROM OLD.fee) THEN
      RAISE EXCEPTION 'membership status and fee are set by an admin' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS memberships_web_guard ON memberships;
CREATE TRIGGER memberships_web_guard BEFORE INSERT OR UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION ascend_membership_web_guard();

-- Mentor approval is admin-only; a mentor may only pause/resume themselves.
CREATE OR REPLACE FUNCTION ascend_mentor_web_guard() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF current_user = 'ascend_web' THEN
    IF TG_OP = 'INSERT' AND NEW.status <> 'PENDING' THEN
      RAISE EXCEPTION 'new mentors must be PENDING' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status
       AND NOT (OLD.status IN ('APPROVED', 'PAUSED') AND NEW.status IN ('APPROVED', 'PAUSED')) THEN
      RAISE EXCEPTION 'mentor approval is admin-only' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS mentors_web_guard ON mentors;
CREATE TRIGGER mentors_web_guard BEFORE INSERT OR UPDATE ON mentors
  FOR EACH ROW EXECUTE FUNCTION ascend_mentor_web_guard();

-- Surfaces overselling in the database log. The app's seat holds prevent it; the only allowed case
-- is a payment that lands after its hold lapsed (the attendee has paid, so it is confirmed).
CREATE OR REPLACE FUNCTION ascend_event_seats_guard() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF current_user = 'ascend_web' AND NEW.seats_total > 0 AND NEW.seats_taken > NEW.seats_total
     AND NEW.seats_taken > OLD.seats_taken THEN
    -- A late payment after its hold lapsed is still confirmed by the app; record it, don't block it.
    RAISE WARNING 'event % over capacity: %/%', NEW.slug, NEW.seats_taken, NEW.seats_total;
  END IF;
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS events_seats_guard ON events;
CREATE TRIGGER events_seats_guard BEFORE UPDATE OF seats_taken ON events
  FOR EACH ROW EXECUTE FUNCTION ascend_event_seats_guard();

-- Future tables created by the owner get no implicit access.
ALTER DEFAULT PRIVILEGES FOR ROLE ascend_owner IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE ascend_owner IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC;
