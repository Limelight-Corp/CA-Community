# ASCEND CA Community — Production Deployment & Operations Runbook

This document details the production deployment, orchestration, security controls, and disaster recovery procedures for the **ASCEND CA Community** platform.

---

## 1. System Architecture & Topology

The platform runs as a coordinated monorepo deployment with physical domain and process isolation:

```
                            [ Cloudflare Edge CDN / SSL ]
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  ascend-ca.in                    api.ascend-ca.in                admin.ascend-ca.in
(Public Web & Member)           (Express API Cluster)          (Isolated Admin Console)
   [Next.js :3000]                 [Node.js :4000]                 [Next.js :3001]
        │                                │                                │
        │                          ┌─────┴─────┐                          │
        └──────────────────────────► PostgreSQL│◄─────────────────────────┘
                                   │  Port 5432│
                                   └─────┬─────┘
                                         │
                                   ┌─────┴─────┐
                                   │  Redis 7  │ (Token denylists, Theme cache,
                                   │  Port 6379│  Rate limiting, BullMQ)
                                   └───────────┘
```

### Domain Routing & Port Mapping
| Domain | Service | Internal Port | Access Policy |
|---|---|:---:|---|
| `ascend-ca.in` | `@ascend/web` | `3000` | Public Internet, Installable Mobile PWA |
| `api.ascend-ca.in` | `@ascend/api` | `4000` | Rate-limited API Gateway (`/api/v1` and `/admin-api/v1`) |
| `admin.ascend-ca.in` | `@ascend/admin` | `3001` | Cloudflare Zero Trust / IP Allowlist only; anti-indexing headers |

---

## 2. Prerequisites & Server Sizing

### Minimum Production Specifications
- **Operating System**: Ubuntu 22.04 LTS / Debian 12 / Rocky Linux 9
- **CPU / RAM**: Minimum 2 vCPUs, 4 GB RAM (Recommended: 4 vCPUs, 8 GB RAM)
- **Disk Storage**: 50 GB NVMe SSD with automated daily snapshots
- **Runtime Dependencies**: Docker Engine 24+ & Docker Compose 2.20+, OpenSSL 3.0+

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

### Critical Keys Generation
Generate high-entropy cryptographic keys using OpenSSL:

```bash
# Generate JWT Secrets
openssl rand -hex 32  # Use for JWT_ACCESS_SECRET
openssl rand -hex 32  # Use for JWT_REFRESH_SECRET
openssl rand -hex 32  # Use for JWT_ADMIN_SECRET

# Generate 32-byte AES-256-GCM Encryption Key for PII (ICAI MRN, Phone)
openssl rand -hex 16  # Exactly 32 hex characters / 16 bytes raw or 32 ascii chars
```

Configure Razorpay live API credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) obtained from the Razorpay Dashboard under **Settings → API Keys**.

---

## 4. Orchestration with Docker Compose

### 4.1 Launch Services
Start all containers in detached mode:

```bash
docker compose up -d --build
```

### 4.2 Validate Health Probes
```bash
# Check container status
docker compose ps

# Test API Readiness Probe
curl -i http://localhost:4000/healthz

# Test Web Service
curl -i http://localhost:3000/

# Test Admin Service
curl -i http://localhost:3001/login
```

---

## 5. Database Provisioning & Seed Data

### 5.1 Run Prisma Migrations
Apply production database migrations against PostgreSQL:

```bash
docker compose exec api npm run db:migrate --workspace=@ascend/api
```

### 5.2 Seed Founding Content & Admin Accounts
Seed the 10 professional wings, prototype events, keynote speakers, editorial news, default dark theme tokens, and initial Super Admin:

```bash
docker compose exec api npm run db:seed --workspace=@ascend/api
```

### Seeded Super Admin Credentials:
- **Email**: `superadmin@admin.ascend-ca.in`
- **Password**: Configured during initial setup (min 12 chars, upper, lower, number, special symbol)
- **TOTP 2FA**: Prompted on first login with QR code secret initialization.

---

## 6. Security Hardening & Zero Trust Isolation

### 6.1 Admin Panel Physical Isolation
- **Audience Segregation**: Member JWTs have `aud: ascend-web`. Admin JWTs have `aud: ascend-admin`. Crossing boundaries immediately yields HTTP 403 Forbidden.
- **Sensitive Action Re-Authentication (Sudo Mode)**:
  - Theme publishing, GST refunds, and role alterations mandate entering the administrative password.
  - Sudo sessions expire strictly after 5 minutes (enforced via Redis timestamp tokens).
- **Anti-Search Engine Indexing**:
  - `admin.ascend-ca.in` sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` on all responses.
  - Recommended Cloudflare Zero Trust Access rule requiring email PIN or enterprise IdP before reaching the admin port.

### 6.2 Data Protection & Encryption at Rest
- Sensitive Member PII (such as ICAI Membership Numbers and mobile numbers) is encrypted using AES-256-GCM before database insertion.
- Database backups do not reveal plain text member identification numbers without the `DATA_ENCRYPTION_KEY`.

---

## 7. Payments & GST Tax Invoicing Operations

### 7.1 Webhook URL Configuration
In Razorpay Dashboard under **Settings → Webhooks**:
- **URL**: `https://api.ascend-ca.in/api/v1/payments/webhook`
- **Secret**: Must match `RAZORPAY_WEBHOOK_SECRET`
- **Subscribed Events**:
  - `payment.captured`
  - `payment.failed`
  - `refund.processed`

### 7.2 GST Tax Invoicing Compliance
- Statutory service code: **SAC 998399** (Other professional, technical and business services).
- Automatic tax breakdown:
  - Intrastate transactions: 9% CGST + 9% SGST.
  - Interstate transactions: 18% IGST.
- Invoices are sequential per financial year (`ASC/26-27/0001`) with immutable audit trails.

---

## 8. Mobile PWA & Offline Digital Passes

### 8.1 PWA Feature Checklist
- **App Manifest**: Served at `/manifest.webmanifest` and `/manifest.json`, dynamically reflecting live theme colors (`#03050F`).
- **Service Worker (`/sw.js`)**: Pre-caches the application shell and provides network-first navigation with offline fallback (`/offline.html`).
- **Digital Pass Offline Persistence**:
  - Admission tickets booked on `/events/[slug]/register` are automatically written to device `localStorage` (`ascend_offline_passes`).
  - Members can present their SVG QR code at venue check-in without mobile reception.

---

## 9. Backup, Disaster Recovery & Rollback

### 9.1 Automated PostgreSQL Backup
Create an automated daily cron job:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/ascend_pg"
mkdir -p $BACKUP_DIR

docker exec -t ascend-postgres pg_dump -U ascend_admin -F c ascend_ca > "$BACKUP_DIR/ascend_backup_$TIMESTAMP.dump"
gzip "$BACKUP_DIR/ascend_backup_$TIMESTAMP.dump"

# Retain 14 days
find $BACKUP_DIR -name "*.dump.gz" -mtime +14 -exec rm {} \;
```

### 9.2 Zero-Downtime Rollback of Themes
If an unverified theme is published with suboptimal contrast:
1. Log into `admin.ascend-ca.in/theme`.
2. Locate the prior version in the **Version History** panel.
3. Click **Roll Back to this Version**.
4. Sudo authenticate to instantly restore prior tokens across web and mobile.
