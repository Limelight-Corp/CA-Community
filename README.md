# ASCEND — CA Community Platform

A Pan-India community platform for Chartered Accountants and allied professionals:
public website, event registration and an admin console with analytics.

| App | Path | Local URL |
|---|---|---|
| Public website (Next.js) | `apps/web` | http://localhost:3000 |
| Admin console (Next.js) | `apps/admin` | http://localhost:3001 |
| API (Express + Prisma) | `apps/api` | http://localhost:4000 |
| Shared data & content | `packages/shared` | — |
| Design system / UI components | `packages/ui` | — |

> The website and admin currently read and write content through a file store
> (`data/community-store.json`). Registrations, membership applications and contact
> messages are saved to `data/private-store.json`, which is gitignored because it holds
> personal data. Moving this to the Express API + PostgreSQL is a later phase.

## Requirements

- Node.js 20+ and npm 10+

## Setup

```bash
npm install
npm run build:packages
```

## Run locally

Website:

```bash
npm run dev:web
```

Admin console:

```bash
npm run dev:admin
```

Production-style build and start:

```bash
npm run build --workspace=@ascend/web && npm run start --workspace=@ascend/web
```

```bash
npm run build --workspace=@ascend/admin && npm run start --workspace=@ascend/admin
```

## Test data

```bash
npm run seed:test
```

Loads test data for local development (refuses to run with `NODE_ENV=production`):

- `data/seed/private-store.seed.json` → `data/private-store.json`: 84 test event
  registrations, 14 membership applications and 4 contact messages. All use `@example.com`
  addresses and clearly test names. Add `-- --force` to replace an existing private store
  (the old file is backed up as `data/private-store.backup-<time>.json`).
- The local development admin account (`admin` / `Admin@Ascend2027!`, see below), only if
  it does not exist yet.

`data/private-store.json` and `data/admin-users.json` stay gitignored: the real files hold
people's submissions, password hashes and the session signing secret.

## Admin access

The admin console has its own sign-in page at `/login`, and every admin page requires
sign-in. There is **no built-in password**. Admins sign in with:

1. **An admin account** stored in `data/admin-users.json` (gitignored; passwords are
   scrypt-hashed). Create accounts with the seed command below.
2. **Or, as a fallback**, `ADMIN_GATE_USER` / `ADMIN_GATE_PASSWORD` from the environment.

When neither exists, nobody can sign in and the login page says sign-in is not set up yet.

After a successful sign-in the admin gets a signed, httpOnly session cookie that lasts
12 hours. **Log out** is at the bottom of the sidebar (or the navigation drawer on
mobile). Failed sign-ins are limited to 5 attempts per 15 minutes.

### Seed an admin account

```bash
npm run admin:seed -- --username admin --password 'Admin@Ascend2027!' --name 'ASCEND Admin'
```

- Re-running for an existing username updates it. Passing `--password` changes the
  password and signs that admin out everywhere; leaving it out keeps the password.
- Without `--password`, a new account gets a random password that is printed once.
- `--role super_admin|admin` (the first account defaults to `super_admin`).
- Values can also come from `ADMIN_SEED_USERNAME`, `ADMIN_SEED_PASSWORD`,
  `ADMIN_SEED_NAME` and `ADMIN_SEED_ROLE`.
- The first run also creates a random secret in the same file for signing session cookies.

### Local development credentials

| Field | Value |
|---|---|
| URL | http://localhost:3001 |
| Username | `admin` |
| Password | `Admin@Ascend2027!` |

These work after running the seed command above (the same password the API's Prisma seed
uses for its Super Admin). The older environment login still works too: put
`ADMIN_GATE_USER=preview` and `ADMIN_GATE_PASSWORD=Preview-Gate-2026` in
`apps/admin/.env.local` (gitignored).

> **Warning:** these are local development values. They are written in this README, so
> treat them as public. Never use them on staging or production. On a deployed server,
> seed an admin with a long random password (for example `openssl rand -base64 24`), or
> leave `--password` out to have one generated. If you use the environment fallback, set
> `ADMIN_GATE_USER` / `ADMIN_GATE_PASSWORD` to new values in that server's secret manager.
> `docker-compose.yml` currently refuses to start the admin without them. Optionally set
> `ADMIN_SESSION_SECRET` to override the session signing secret. Behind a reverse proxy,
> make sure it sends `X-Forwarded-For` so the sign-in attempt limit is counted per visitor.
> `data/admin-users.json` must persist across deploys (keep the `data/` directory on a volume).

Scripts can still call the admin with HTTP Basic credentials (`curl -u user:password`).

For local development only, you can also skip the gate with `ADMIN_GATE_DISABLED=true`
in `apps/admin/.env.local`. This is ignored when `NODE_ENV=production`.

## Online payments (Razorpay)

Paid event registrations are saved as **Pending payment** until Razorpay is configured.
To enable online payments, set on the website server:

```
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

Use Razorpay **test** keys until the organisation authorises live payments. Put them in
`apps/web/.env.local` (gitignored) and restart the website.

**Payment methods.** Checkout shows **UPI first**: a QR code on computers and the UPI app
picker on mobile (BHIM, Google Pay, PhonePe, Paytm and any bank's UPI app), followed by
cards (RuPay, Visa, Mastercard) and net banking. Which methods appear also depends on what is
enabled in the Razorpay Dashboard (Account & Settings → Payment configuration).

**Registration and payment flow.** Anyone can fill in the registration form — no login.
For a **paid** event, *Continue to payment* saves the booking and opens a separate payment
page (`/registration/<bookingId>/pay`). Only that page asks the visitor to log in; after
login they come straight back to it and pay. The booking page links back to it while the
payment is pending. Free events are confirmed immediately. Member login is still a
prototype (the API is not wired to the website yet), so the server only checks that a member
session cookie is present — real token verification must be added when the member API goes
live.

## Analytics (optional)

Set `NEXT_PUBLIC_GA_ID=G-XXXXXXX` for the website to load Google Analytics 4.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run build` | Builds packages, API, web and admin |
| `npm run test` | Runs the API test suite |
| `npm run format` | Formats the codebase with Prettier |

## Project documents

- `REQUIREMENT_UNDERSTANDING.md` — Phase 0 analysis of requirements, current state and risks
- `ARCHITECTURE.md`, `DEPLOYMENT.md` — target architecture and deployment runbook
