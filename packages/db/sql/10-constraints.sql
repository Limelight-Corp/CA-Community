-- =============================================================================================
-- 10-constraints.sql — data rules the database enforces itself (run after the Prisma migration).
--
-- The apps validate every input with zod first; these CHECKs are the last line of defence so a
-- bug, a script or a compromised app role still cannot write impossible data. Idempotent: every
-- constraint is dropped and re-created.
-- =============================================================================================

BEGIN;

-- ---------------------------------------------------------------------------------------------
-- Reusable domains of truth (as SQL functions so CHECKs stay short and consistent)
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ascend_is_email(v citext) RETURNS boolean
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT v IS NULL OR (length(v) <= 254 AND v ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') $$;

-- Indian / international mobile: optional +, 7–15 digits, spaces or dashes allowed.
CREATE OR REPLACE FUNCTION ascend_is_mobile(v text) RETURNS boolean
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT v IS NULL OR v ~ '^\+?[0-9][0-9 -]{5,18}[0-9]$' $$;

-- External link: https only (http allowed for legacy content is NOT accepted).
CREATE OR REPLACE FUNCTION ascend_is_https(v text) RETURNS boolean
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT v IS NULL OR v = '' OR v ~* '^https://[^\s<>"]+$' $$;

-- Site link: a same-site path (/events, /uploads/x.png) or an http(s) URL. Blocks javascript:,
-- data: and protocol-relative //host links.
CREATE OR REPLACE FUNCTION ascend_is_link(v text) RETURNS boolean
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT v IS NULL OR v = '' OR v ~ '^/(?!/)[^\s\\]*$' OR v ~* '^https?://[^\s<>"]+$' $$;

CREATE OR REPLACE FUNCTION ascend_is_slug(v text) RETURNS boolean
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT v ~ '^[a-z0-9]+(-[a-z0-9]+)*$' $$;

-- Lowercase hex SHA-256.
CREATE OR REPLACE FUNCTION ascend_is_sha256(v text) RETURNS boolean
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT v IS NULL OR v ~ '^[0-9a-f]{64}$' $$;

-- Helper: (re)create a CHECK constraint.
CREATE OR REPLACE PROCEDURE ascend_check(tbl regclass, name text, expr text)
  LANGUAGE plpgsql AS
$$
BEGIN
  EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', tbl, name);
  EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I CHECK (%s)', tbl, name, expr);
END
$$;

-- ---------------------------------------------------------------------------------------------
-- Site settings & taxonomies
-- ---------------------------------------------------------------------------------------------
CALL ascend_check('site_settings', 'site_settings_singleton', 'id = 1');
CALL ascend_check('site_settings', 'site_settings_fees_ck',
  '(fee_core IS NULL OR fee_core BETWEEN 0 AND 1000000) AND (fee_associate IS NULL OR fee_associate BETWEEN 0 AND 1000000) AND (fee_student IS NULL OR fee_student BETWEEN 0 AND 1000000)');
CALL ascend_check('site_settings', 'site_settings_links_ck',
  'ascend_is_link(hero_image_url) AND ascend_is_https(contact_map_url) AND ascend_is_https(social_linkedin) AND ascend_is_https(social_instagram) AND ascend_is_https(social_facebook) AND ascend_is_https(social_youtube) AND ascend_is_https(social_x)');
CALL ascend_check('site_settings', 'site_settings_email_ck', 'ascend_is_email(contact_email)');
CALL ascend_check('taxonomy_terms', 'taxonomy_terms_value_ck', 'length(btrim(value::text)) BETWEEN 1 AND 60');

-- ---------------------------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------------------------
CALL ascend_check('wings', 'wings_number_ck', 'number BETWEEN 1 AND 99');
CALL ascend_check('wings', 'wings_name_ck', 'length(btrim(name::text)) BETWEEN 1 AND 120');
CALL ascend_check('wings', 'wings_slug_ck', 'ascend_is_slug(slug)');
CALL ascend_check('wings', 'wings_color_ck', 'color ~ ''^#[0-9A-Fa-f]{6}$''');
CALL ascend_check('wings', 'wings_activities_ck', 'cardinality(activities) <= 50');

CALL ascend_check('events', 'events_slug_ck', 'ascend_is_slug(slug)');
CALL ascend_check('events', 'events_title_ck', 'length(btrim(title)) > 0');
CALL ascend_check('events', 'events_money_ck', 'fee >= 0 AND member_fee >= 0 AND member_fee <= fee');
CALL ascend_check('events', 'events_seats_ck', 'seats_total >= 0 AND seats_taken >= 0');
CALL ascend_check('events', 'events_cpe_ck', 'cpe_hours IS NULL OR cpe_hours BETWEEN 0 AND 100');
CALL ascend_check('events', 'events_offline_city_ck', 'mode = ''ONLINE'' OR length(btrim(city)) > 0');
CALL ascend_check('events', 'events_links_ck', 'ascend_is_https(map_url) AND ascend_is_link(image_url)');
CALL ascend_check('events', 'events_description_ck', 'length(description) BETWEEN 1 AND 20000 AND (terms IS NULL OR length(terms) <= 20000)');
CALL ascend_check('event_agenda_items', 'agenda_position_ck', 'position >= 0 AND position < 100');

CALL ascend_check('speakers', 'speakers_slug_ck', 'ascend_is_slug(slug)');
CALL ascend_check('speakers', 'speakers_links_ck', 'ascend_is_link(avatar_url) AND ascend_is_https(linkedin_url)');
CALL ascend_check('speakers', 'speakers_lists_ck', 'cardinality(expertise) <= 30 AND cardinality(highlights) <= 10 AND cardinality(talks) <= 6');
CALL ascend_check('speakers', 'speakers_stats_ck', 'jsonb_typeof(stats) = ''array'' AND jsonb_array_length(stats) <= 4');

CALL ascend_check('news_articles', 'news_slug_ck', 'ascend_is_slug(slug)');
CALL ascend_check('news_articles', 'news_links_ck', 'ascend_is_link(cover_image_url)');
CALL ascend_check('news_articles', 'news_content_ck', 'length(content) BETWEEN 1 AND 50000');

CALL ascend_check('resources', 'resources_downloads_ck', 'downloads >= 0');
-- Private files are only ever served from /resource-files/<random-name>; anything else must be https.
CALL ascend_check('resources', 'resources_file_ck',
  'file_url IS NULL OR file_url = '''' OR file_url ~ ''^/resource-files/[0-9]+-[a-f0-9]{12}\.[a-z0-9]{2,5}$'' OR ascend_is_https(file_url)');

CALL ascend_check('gallery_items', 'gallery_links_ck', 'ascend_is_link(image_url) AND ascend_is_https(video_url)');
CALL ascend_check('team_members', 'team_links_ck', 'ascend_is_link(photo_url) AND ascend_is_https(linkedin_url) AND sort_order BETWEEN 0 AND 999');
CALL ascend_check('testimonials', 'testimonials_links_ck', 'ascend_is_link(photo_url)');
CALL ascend_check('initiatives', 'initiatives_links_ck', 'ascend_is_link(cta_url) AND ascend_is_link(image_url)');

CALL ascend_check('jobs', 'jobs_slug_ck', 'ascend_is_slug(slug)');
CALL ascend_check('jobs', 'jobs_links_ck', 'ascend_is_https(apply_url) AND ascend_is_link(logo_url) AND ascend_is_email(apply_email)');
CALL ascend_check('jobs', 'jobs_requirements_ck', 'cardinality(requirements) <= 50');

-- ---------------------------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------------------------
CALL ascend_check('member_accounts', 'member_accounts_email_ck', 'ascend_is_email(email)');
CALL ascend_check('member_accounts', 'member_accounts_mobile_ck', 'ascend_is_mobile(mobile)');
-- Only scrypt hashes are accepted, so a plaintext password can never be stored by mistake.
CALL ascend_check('member_accounts', 'member_accounts_hash_ck', 'password_hash ~ ''^scrypt\$''');
CALL ascend_check('member_accounts', 'member_accounts_session_ck', 'session_version >= 1');
CALL ascend_check('member_profiles', 'member_profiles_links_ck', 'ascend_is_https(linkedin_url) AND ascend_is_link(photo_url)');
CALL ascend_check('auth_tokens', 'auth_tokens_hash_ck', 'ascend_is_sha256(token_hash)');
CALL ascend_check('auth_tokens', 'auth_tokens_expiry_ck', 'expires_at > created_at AND expires_at <= created_at + interval ''7 days''');
CALL ascend_check('admin_users', 'admin_users_hash_ck', 'password_hash ~ ''^scrypt\$''');
-- Same rule as apps/admin/scripts/seed-admin.mjs.
CALL ascend_check('admin_users', 'admin_users_username_ck', 'username ~ ''^[A-Za-z0-9._@-]{3,64}$''');
CALL ascend_check('rate_limit_buckets', 'rate_limit_ck', 'count >= 0 AND expires_at > window_start');

-- ---------------------------------------------------------------------------------------------
-- Bookings & payments
-- ---------------------------------------------------------------------------------------------
CALL ascend_check('event_registrations', 'reg_contact_ck', 'ascend_is_email(email) AND ascend_is_mobile(mobile)');
CALL ascend_check('event_registrations', 'reg_hashes_ck', 'ascend_is_sha256(access_token_hash) AND ascend_is_sha256(checkin_code_hash)');
CALL ascend_check('event_registrations', 'reg_fee_ck', 'fee >= 0');
-- Status and payment state must agree.
CALL ascend_check('event_registrations', 'reg_state_ck', $c$
  (status = 'PENDING_PAYMENT' AND payment_status IN ('PENDING', 'FAILED'))
  OR (status = 'CONFIRMED' AND payment_status IN ('NOT_REQUIRED', 'PAID'))
  OR (status = 'CANCELLED')
$c$);
CALL ascend_check('event_registrations', 'reg_free_ck', 'fee > 0 OR payment_status IN (''NOT_REQUIRED'', ''REFUNDED'') OR status = ''CANCELLED''');
-- A paid booking always records when it was paid (offline "mark paid" has no gateway payment id).
CALL ascend_check('event_registrations', 'reg_paid_ck', 'payment_status NOT IN (''PAID'', ''REFUNDED'') OR paid_at IS NOT NULL');
CALL ascend_check('event_registrations', 'reg_refund_ck',
  '(payment_status = ''REFUNDED'') = (refunded_at IS NOT NULL) AND (refund_amount IS NULL OR (refund_amount > 0 AND refund_amount <= fee))');
-- Attended always has a check-in time; un-marking keeps the old time (the app allows undo).
CALL ascend_check('event_registrations', 'reg_attended_ck', 'NOT attended OR attended_at IS NOT NULL');

CALL ascend_check('memberships', 'memberships_contact_ck', 'ascend_is_email(email) AND ascend_is_mobile(mobile)');
CALL ascend_check('memberships', 'memberships_fee_ck', 'fee IS NULL OR fee >= 0');
CALL ascend_check('memberships', 'memberships_links_ck', 'ascend_is_https(linkedin_url) AND ascend_is_link(photo_url)');
CALL ascend_check('membership_payments', 'membership_payments_amount_ck', 'amount >= 0 AND valid_until > valid_from');
CALL ascend_check('membership_payments', 'membership_payments_gateway_ck', 'method = ''OFFLINE'' OR gateway_payment_id IS NOT NULL');

-- ---------------------------------------------------------------------------------------------
-- Mentorship, inbox, outbox
-- ---------------------------------------------------------------------------------------------
CALL ascend_check('mentors', 'mentors_capacity_ck', 'capacity BETWEEN 1 AND 20');
CALL ascend_check('mentors', 'mentors_lists_ck', 'cardinality(expertise) BETWEEN 1 AND 10 AND cardinality(modes) BETWEEN 1 AND 2');
CALL ascend_check('mentors', 'mentors_links_ck', 'ascend_is_https(linkedin_url)');
CALL ascend_check('mentorship_requests', 'mentorship_match_ck',
  '(status = ''MATCHED'') <= (mentor_id IS NOT NULL AND matched_at IS NOT NULL)');
CALL ascend_check('contact_messages', 'contact_messages_contact_ck', 'ascend_is_email(email) AND ascend_is_mobile(phone)');
CALL ascend_check('notification_outbox', 'outbox_attempts_ck', 'attempts BETWEEN 0 AND 20');

-- ---------------------------------------------------------------------------------------------
-- Partial unique indexes (business rules)
-- ---------------------------------------------------------------------------------------------

-- One confirmed booking per email per event (unpaid ones may be abandoned and retried).
CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_one_confirmed_per_email
  ON event_registrations (event_id, email) WHERE status = 'CONFIRMED';

-- A member has at most one open mentorship request.
CREATE UNIQUE INDEX IF NOT EXISTS mentorship_requests_one_open_per_account
  ON mentorship_requests (account_id) WHERE status = 'OPEN';

-- Only one live (unused) token per account and purpose.
CREATE UNIQUE INDEX IF NOT EXISTS auth_tokens_one_live_per_purpose
  ON auth_tokens (account_id, purpose) WHERE used_at IS NULL;

-- ---------------------------------------------------------------------------------------------
-- Performance indexes Prisma cannot declare
-- ---------------------------------------------------------------------------------------------

-- Reminder job: upcoming confirmed bookings that were not reminded yet.
CREATE INDEX IF NOT EXISTS event_registrations_reminder_due
  ON event_registrations (event_id) WHERE status = 'CONFIRMED' AND reminder_sent_at IS NULL;

-- Seat holds: live unpaid bookings per event.
CREATE INDEX IF NOT EXISTS event_registrations_holds
  ON event_registrations (event_id, updated_at) WHERE status = 'PENDING_PAYMENT';

-- Public listings only ever read published rows.
CREATE INDEX IF NOT EXISTS events_published_upcoming ON events (date) WHERE is_published AND cancelled_at IS NULL;
CREATE INDEX IF NOT EXISTS jobs_open ON jobs (featured DESC, created_at DESC) WHERE is_published;

-- Site search and admin search (substring, case-insensitive) — trigram GIN.
CREATE INDEX IF NOT EXISTS events_search_trgm   ON events        USING gin ((title || ' ' || city || ' ' || venue) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS news_search_trgm     ON news_articles USING gin ((title || ' ' || summary) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS resources_search_trgm ON resources    USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS speakers_search_trgm ON speakers      USING gin ((name || ' ' || title) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS jobs_search_trgm     ON jobs          USING gin ((title || ' ' || organisation || ' ' || location) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS registrations_search_trgm ON event_registrations USING gin ((name || ' ' || booking_id || ' ' || mobile) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS memberships_search_trgm   ON memberships USING gin ((name || ' ' || mobile || ' ' || coalesce(organisation, '')) gin_trgm_ops);

COMMIT;
