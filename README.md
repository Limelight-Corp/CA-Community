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

## Admin access

The admin console is protected by an access gate (HTTP Basic auth). There is **no
built-in password**: the credentials come from environment variables, and the admin
answers `503 Admin console is locked` when they are not set.

### Local development credentials

| Field | Value |
|---|---|
| URL | http://localhost:3001 |
| Username | `preview` |
| Password | `Preview-Gate-2026` |

These only work after you set them. Create `apps/admin/.env.local` (gitignored) with:

```
ADMIN_GATE_USER=preview
ADMIN_GATE_PASSWORD=Preview-Gate-2026
```

Then start the admin and sign in with the username and password above when the browser asks.

> **Warning:** these are local development values. They are written in this README, so
> treat them as public. Never use them on staging or production. For any deployed
> environment, set `ADMIN_GATE_USER` and `ADMIN_GATE_PASSWORD` to a new username and a long
> random password (for example `openssl rand -base64 24`) in that server's environment or
> secret manager. `docker-compose.yml` refuses to start the admin without them.

For local development only, you can also skip the gate with `ADMIN_GATE_DISABLED=true`
in `apps/admin/.env.local`. This is ignored when `NODE_ENV=production`.

## Online payments (Razorpay)

Paid event registrations are saved as **Pending payment** until Razorpay is configured.
To enable online payments, set on the website server:

```
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

Use Razorpay **test** keys until the organisation authorises live payments.

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
