# Database design — moving from JSON files to PostgreSQL

Status: **live — the web and admin apps read and write PostgreSQL (database `ascend`). The JSON
files in data/ are a frozen pre-go-live snapshot and are no longer used by the apps.**

Files:

| File | What it is |
|---|---|
| `packages/db/prisma/schema.prisma` | Tables, relations, enums, unique keys and indexes (Prisma 5) |
| `packages/db/prisma/migrations/0001_init/migration.sql` | SQL generated from the schema (30 tables, 73 indexes, 24 foreign keys) |
| `packages/db/sql/10-constraints.sql` | CHECK constraints, partial unique indexes, trigram search indexes |
| `packages/db/sql/20-security.sql` | Database roles, least-privilege grants, audit-log and guard triggers |

## 1. What the apps store today

| JSON file | Collections | Becomes |
|---|---|---|
| `community-store.json` | events, speakers, wings, news, resources, gallery, team, testimonials, initiatives, jobs, settings | one table each; `events.speakerSlugs` → `event_speakers`; `events.agenda` → `event_agenda_items`; settings → `site_settings` (single row); `settings.taxonomies` → `taxonomy_terms` |
| `private-store.json` | registrations, members, messages, mentors, mentorshipRequests | `event_registrations`, `memberships` (+ `membership_payments`, `membership_interests`), `contact_messages`, `mentors` (+ `mentor_wings`), `mentorship_requests` (+ `mentorship_request_wings`) |
| `member-accounts.json` | accounts (+ profile, verify/reset tokens), sessionSecret | `member_accounts`, `member_profiles`, `auth_tokens`; **sessionSecret moves to an env var** |
| `admin-users.json` | users, sessionSecret | `admin_users`; **sessionSecret moves to an env var** |
| `data/outbox/` | queued/failed emails | `notification_outbox` |
| in-memory `Map`s | login lockouts, form rate limits | `rate_limit_buckets` (shared across instances and restarts) |
| — | (new) | `audit_logs` — who changed what in the admin console |

Normalisation choices:

- **Wings are referenced by id**, not by name or number. Today resources, team and jobs store the
  wing *name* and events store the wing *number*, so renaming or renumbering a wing has to rewrite
  other records. With foreign keys a rename is a single-row update and a wing that is still in use
  cannot be deleted (`ON DELETE RESTRICT`), which is the same rule the admin enforces today.
- **Speakers are linked through `event_speakers`**, so a speaker slug change needs no relinking.
- **Categories stay as text** on content (`citext`, case-insensitive) with the managed list in
  `taxonomy_terms`. That keeps today's behaviour: retiring a category does not change old items.
- **Registrations keep `event_title`** as a snapshot so receipts and certificates stay correct
  after an event is renamed.

## 2. Indexes — chosen from the queries the code actually runs

| Query in the apps | Index |
|---|---|
| Event page `/events/[slug]` | `events.slug` UNIQUE |
| Event listings (published, by date), homepage featured, wing pages | `(is_published, date)`, partial `events_published_upcoming`, `(featured, date)`, `(wing_id, date)` |
| Booking link / receipt / pay page (`bookingId` + token) | `booking_id` UNIQUE, `access_token_hash` UNIQUE |
| Razorpay webhook / verify (`order_id`) | `gateway_order_id` UNIQUE, `gateway_payment_id` UNIQUE |
| Certificate verify page | `certificate_id` UNIQUE |
| Check-in scanner (QR code) | `checkin_code_hash` UNIQUE |
| Admin event dashboard, seat holds | `(event_id, status, updated_at)`, partial `event_registrations_holds` |
| Member dashboard "my bookings", duplicate check | `email` (citext), `account_id`, partial unique `(event_id, email) WHERE CONFIRMED` |
| Admin pending-payments badge / payments list | `(payment_status, created_at DESC)` |
| Reminder job | partial `event_registrations_reminder_due` |
| Login, register, forgot password | `member_accounts.email` UNIQUE (citext) |
| Verify-email / reset links | `auth_tokens.token_hash` UNIQUE |
| Admin members list filters, renewal reminders | `(status, created_at DESC)`, `plan`, `city`, `(status, valid_until)` |
| Mentor capacity (`matched` per mentor), admin queue | `(mentor_id, status)`, `(status, created_at DESC)` |
| Directory | `member_profiles (directory_opt_in, city)` |
| Careers board | partial `jobs_open`, `(is_published, deadline)` |
| Site search and admin search (substring) | trigram GIN on events, news, resources, speakers, jobs, registrations, memberships |
| Many-to-many lookups from the wing side | `(wing_id)` on every join table |

Every foreign key column has an index (Postgres does not add them automatically), so joins and
`ON DELETE` checks never scan a whole table.

## 3. Validation — three layers

1. **App (zod)** — every API route already validates and strips unknown fields. Stays as is.
2. **Schema types** — lengths (`varchar(n)`), `citext` for emails/usernames, enums for every status,
   `numeric(10,2)` for money, `date` vs `timestamptz` used deliberately, `NOT NULL` where required.
3. **Database CHECKs** (`10-constraints.sql`) — the last line of defence if an app bug or a stolen
   app credential tries to write bad data:
   - emails, mobile numbers, slugs, hex colours, https-only external links, and site links that
     reject `javascript:`, `data:` and `//host`;
   - money ≥ 0, member fee ≤ fee, refund ≤ amount paid, seats ≥ 0, mentor capacity 1–20;
   - booking status and payment status must agree (e.g. CONFIRMED is only NOT_REQUIRED or PAID);
   - only `scrypt$…` password hashes and 64-hex SHA-256 token hashes are accepted, so a plaintext
     password or token can never be stored by mistake;
   - private resource files must match `/resource-files/<timestamp>-<12 hex>.<ext>`;
   - business rules as partial unique indexes: one confirmed booking per email per event, one
     open mentorship request per member, one live token per account and purpose.

## 4. Security model

**Least privilege (`20-security.sql`).**

| Role | Used by | Can | Cannot |
|---|---|---|---|
| `ascend_owner` | migrations only | own and alter the schema | — (never used by the running apps) |
| `ascend_web` | website | read published content; write bookings, accounts, applications, messages, mentorship; bump `seats_taken` / `downloads` only | read `admin_users` or `audit_logs`; edit content; delete anything; approve members or mentors (trigger-enforced) |
| `ascend_admin` | admin console | manage content and back office; INSERT audit rows | alter the schema; read member password hashes or tokens; UPDATE/DELETE audit rows |
| `ascend_readonly` | reporting | SELECT | read any hash, token or secret column |

`PUBLIC` gets nothing, app roles have `CONNECTION LIMIT`s, `statement_timeout`,
`lock_timeout` and `idle_in_transaction_session_timeout`, so a runaway query or a slow-query
attack cannot exhaust the database.

**Secrets never stored in plaintext.**
- Passwords: scrypt hashes (CHECK-enforced).
- Booking access tokens, check-in codes, email-verify and reset tokens: SHA-256 hashes only.
  *Today the booking token and check-in code are stored in plaintext in `private-store.json`;
  this fixes that.*
- Session signing secrets: environment variables (`MEMBER_SESSION_SECRET`, `ADMIN_SESSION_SECRET`),
  not the database — a database dump alone cannot forge sessions.
- Admin TOTP secret (when 2FA is added): encrypted by the app with a key from the environment.

**Tamper-proof audit log.** `audit_logs` is append-only: a trigger rejects UPDATE, DELETE and
TRUNCATE for every role, and only the owner can drop the trigger.

**Injection.** All access goes through Prisma's parameterised queries. Raw SQL (`$queryRaw`) must
use the tagged-template form only; `$queryRawUnsafe` / `$executeRawUnsafe` are not to be used
(add an ESLint `no-restricted-properties` rule when the apps move over).

**Operating requirements (set when the server is provisioned):**
- PostgreSQL 16+, `password_encryption = scram-sha-256`, `ssl = on`; apps connect with
  `sslmode=verify-full`.
- `pg_hba.conf`: only the app hosts, `hostssl … scram-sha-256`; no `trust`. The database port is
  never public (docker-compose already binds it to 127.0.0.1).
- Strong, unique passwords per role from a secret manager; rotate on staff changes.
- Encrypted volumes, daily encrypted off-site backups, WAL archiving for point-in-time recovery,
  and a restore drill.
- `pgaudit` (or `log_statement = 'ddl'`) for schema-change logging.

**Optional next step: row-level security.** Member-owned tables (`event_registrations`,
`memberships`, `mentors`, `mentorship_requests`, `member_profiles`) can additionally get RLS
policies keyed on `current_setting('app.account_id')`, so even a bug in a website query cannot
return another member's rows. It needs the app to set that value in each transaction, so it is
left for the migration phase.

## 5. Performance

- Connection pooling: PgBouncer (transaction mode) or Prisma Accelerate in front of Postgres;
  `connection_limit` in the Prisma URL sized to the pool.
- The current per-request full-file parse disappears: each page reads only the rows it needs
  through the indexes above.
- Writes become transactional: `SELECT … FOR UPDATE` on the event row (or a single
  `UPDATE events SET seats_taken = seats_taken + 1 WHERE id = $1 AND seats_taken < seats_total`)
  removes the lost-update and overbooking races that exist with JSON files.
- `log_min_duration_statement` is set per role to catch slow queries; review
  `pg_stat_statements` after launch.

## Running it

```bash
# once per machine / server (needs DATABASE_MIGRATION_URL in packages/db/.env)
npm run setup --workspace=@ascend/db     # database, migrations, constraints, security, app roles, .env.local keys
npm run import --workspace=@ascend/db    # one-time copy of data/*.json (refuses if the DB already has data)
npm run backup                           # pg_dump of the database + uploaded files (also runs daily)
```

- App roles: the website connects as `ascend_web`, the admin console as `ascend_admin` (written to
  each app's `.env.local` by setup). `BOOKING_TOKEN_KEY` (both apps), `MEMBER_SESSION_SECRET` (web)
  and `ADMIN_SESSION_SECRET` (admin) also live there — never in the database.
- `import -- --replace` refuses when the live site has created records that are not in the JSON
  files. Only `--discard-new-data` overrides it — do not use it after go-live without a backup.
- Changes to `packages/db` need a rebuild of both apps (Next.js bundles the workspace package).

## What changed in the apps

- `lib/community-store.ts` in both apps is a thin async layer over `@ascend/db`'s `store`
  (same function names as before). Every read-modify-write of the JSON files became a targeted
  query or a transaction:
  - bookings lock the event row (`SELECT … FOR UPDATE`): duplicate check, seat holds and the
    insert cannot interleave — verified with 10 simultaneous bookings for 3 seats → exactly 3;
  - payment verify and the Razorpay webhook lock the booking row, so a payment is confirmed (and a
    seat taken) exactly once;
  - membership payments lock the membership row; the open order amount is stored in
    `order_amount` because the website role may not change the approved `fee`;
  - reminders claim rows with `UPDATE … WHERE reminder_sent_at IS NULL RETURNING`, so several
    servers never send the same reminder twice;
  - admin booking actions, mentor matching and category renames run in single transactions.
- Contact messages are inserted without reading them back: the website role can write to the
  inbox but never read it.

## Verification

- Import: every count matches; a field-by-field comparison of what the app reads back against the
  JSON found 0 differences (3,818 fields).
- End-to-end on PostgreSQL 17: logins 38/38; bookings, payments, memberships, messages, admin
  content, registration actions, check-in and mentorship 69/69; all public pages render.
- Backup: `pg_dump` custom-format dump restorable with `pg_restore` (all 31 tables).

