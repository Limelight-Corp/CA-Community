# Deploying on Vercel with Supabase PostgreSQL

The web and admin apps keep their data in PostgreSQL. On Vercel the database must be a hosted one;
these steps use Supabase. Nothing here prints a password — keep them in a password manager and
never paste them into chat or commit them.

## 1. Create the Supabase project

1. supabase.com → New project. Region: **South Asia (Mumbai)**.
2. Set a long **database password** (letters and digits only, 24+ characters — then it needs no URL
   escaping). Save it in your password manager.
3. **Project Settings → Data API → turn off "Enable Data API".** The apps talk to the database
   directly; Supabase's public REST API is not used. (Our `sql/30-hosted.sql` also revokes every
   privilege of Supabase's `anon` / `authenticated` roles and enables row level security, so the
   tables stay closed even if the API is switched on later.)

## 2. Copy the connection string

Supabase dashboard → **Connect** → **Connection string** → **Session pooler** (works over IPv4).
It looks like:

```
postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

Replace `[YOUR-PASSWORD]` with the database password.

## 3. Create the tables, security and app roles (from your PC)

In the project folder, run (Git Bash; put your URL between the quotes):

```bash
DATABASE_MIGRATION_URL="<session pooler URL>" ASCEND_DB_NAME=postgres npm run setup --workspace=@ascend/db -- --vercel
```

This applies the migrations, constraints, security and row level security, creates the app roles
`ascend_web` and `ascend_admin` with random passwords, and writes everything Vercel needs to
**`packages/db/.env.vercel`** (gitignored). Your local `.env.local` files are not touched.

## 4. Copy the data

```bash
DATABASE_MIGRATION_URL="<session pooler URL>" ASCEND_DB_NAME=postgres npm run import --workspace=@ascend/db
```

It imports `data/*.json` (events, bookings, members, admin and member logins …) in one
transaction and prints a count report — every line must match. Admins and members keep their
current passwords.

## 5. Environment variables in Vercel

Open `packages/db/.env.vercel` and copy the values into each Vercel project
(**Settings → Environment Variables**, environment **Production**, and **Preview** if you use it):

| Vercel project | Variable | Value from `.env.vercel` |
|---|---|---|
| **web** | `DATABASE_URL` | `WEB_DATABASE_URL` |
| web | `BOOKING_TOKEN_KEY` | `BOOKING_TOKEN_KEY` |
| web | `MEMBER_SESSION_SECRET` | `MEMBER_SESSION_SECRET` |
| **admin** | `DATABASE_URL` | `ADMIN_DATABASE_URL` |
| admin | `BOOKING_TOKEN_KEY` | `BOOKING_TOKEN_KEY` (same value as web) |
| admin | `ADMIN_SESSION_SECRET` | `ADMIN_SESSION_SECRET` |

Also:

- **Delete `ADMIN_GATE_DISABLED`** from the admin project if it exists (it would open the admin to
  everyone — production ignores it anyway).
- `ADMIN_GATE_USER` / `ADMIN_GATE_PASSWORD` are optional now: admins come from the database.
- Keep the variables you already have (SMTP, Razorpay, `NEXT_PUBLIC_APP_URL` / `WEBSITE_URL` …).
- Do **not** use the `POSTGRES_*` variables that Supabase's Vercel integration may add — the apps
  read only `DATABASE_URL` (which must be the app-role URL above, never the `postgres` user).
- Optional: **Settings → Functions → Region → Mumbai (bom1)**, next to the database.

Then **delete `packages/db/.env.vercel`** from your PC.

## 6. Deploy

The PostgreSQL version of the code is on the `jaspreet` branch. Merge it into `main` only after
steps 1–5 are done (a deploy without `DATABASE_URL` cannot start). Pushing `main` deploys both
projects.

## 7. Check

- Website: home, events, an event page, news, careers; register a free test booking.
- Admin: sign in with your existing admin username and password; open Events, Registrations,
  Members; cancel the test booking.
- Supabase → Table Editor shows the new booking.

## Notes

- **Uploads:** images and documents uploaded in the admin are saved to the server's disk, which
  Vercel does not keep. Use image links for now; moving uploads to Supabase Storage is a separate step.
- **Backups:** Supabase's free plan keeps limited backups. From your PC:
  `BACKUP_DATABASE_URL="<session pooler URL>" npm run backup` (pg_dump; needs PostgreSQL installed).
- **Schema changes later:** run step 3 again — it is safe to repeat and keeps the role passwords
  stored in `packages/db/.env.vercel` (or creates new ones — then update Vercel).
- **Never** run `import -- --replace` against the live database without a backup: it refuses when
  the site has created data, unless `--discard-new-data` is given.
