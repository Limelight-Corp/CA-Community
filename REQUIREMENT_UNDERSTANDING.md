# CA-Community — Requirement Understanding (Phase 0)

| | |
|---|---|
| **Status** | Phase 0 deliverable. Analysis only: no application code, schema, or data was changed. |
| **Date** | 9 October 2026 |
| **Repository** | `C:\Users\user\Desktop\CA-Community` · branch `main` (clean, up to date with `origin/main`, HEAD `134cc30`) |
| **Remote** | `github.com/Limelight-Corp/CA-Community` |

---

## 0. Sources and their status

| Document | Expected path | Actual status |
|---|---|---|
| Website Checklist (functional requirements) | `/docs/requirements/Website_Checklist.docx` | **Not found.** It isn't in the repo, and `Website Checklist (1).docx` isn't in `Downloads`, `Desktop` or `Documents`. **I have not read it, and nothing in this document comes from it.** |
| Blueprint deck | `/docs/requirements/Blueprint_.pptx` and `/slides` | Not in the repo. I read it from `Downloads/Blueprint .pptx`. It has 7 slides, each a single full-slide image with no text layer, so I read them visually. There is no `/slides` folder. |
| Organisational Structure & Wing Activities | `/docs/requirements/Organisational_Structure___Wing_Activities.pdf` | Not in the repo. I read it from `Downloads/Organisational Structure & Wing Activities.pdf`. It has 2 image-only pages, which I read visually. Its content is identical to Blueprint slides 3 and 6. |

> The repo has no `docs/requirements/` folder. `docs/` holds only `openapi.json` and `openapi.yaml`. I suggest committing the source documents to `docs/requirements/` (still to be decided — see Q1).

---

## 1. Existing architecture (verified by reading the code)

### 1.1 Monorepo layout

This is an npm-workspaces monorepo written in **TypeScript** (not plain JavaScript), Node ≥ 20. Its working name is **"ASCEND CA Community"**.

```
apps/api      Express 4 + Prisma 5 (PostgreSQL) + ioredis + jose (JWT) + argon2 + otplib + zod
apps/web      Next.js 15 App Router: public site + member portal + PWA (port 3000)
apps/admin    Next.js 15 App Router: admin console (port 3001)
packages/shared  Zod schemas, RBAC constants, prototype seed data, OpenAPI registry
packages/ui      Token-driven React components (CVA + Tailwind preset + ThemeProvider)
data/community-store.json   JSON file used as a CMS by the Next apps (see 1.3)
docker-compose.yml, nginx/, .github/workflows/ci.yml, ARCHITECTURE.md, DEPLOYMENT.md
```

### 1.2 Backend (`apps/api`): layered, but has gaps

- **Structure:** Composition root in `container.ts` (manual DI), then routes → controllers → services → repositories, with a central `errorHandler`, an `AppError` hierarchy, a zod `validate()` middleware, and an `ApiResponse<T>` envelope. This is a good base to extend.
- **Modules:** auth (member + admin), content (news, wings, speakers, content blocks), events, payments (Razorpay behind an `IPaymentProvider` interface), resources, members, theme (draft, publish, rollback, WCAG audit), audit.
- **Mounting:** Public routes are under `/api/v1/*`. Admin routes are under `/admin-api/v1/*` and mount only when `ADMIN_API_ENABLED=true`. Swagger UI is at `/api-docs`.
- **Database:** `prisma/schema.prisma` defines 22 models (User, RefreshToken, MemberProfile, Wing, MemberWing, Speaker, Event, EventSpeaker, EventRegistration, Resource, News, ContentBlock, Order, Payment, Refund, Invoice, WebhookEvent, ThemeSettings, ThemeHistory, AuditLog, Notification). **There is no `prisma/migrations/` folder.** The documented command is `prisma migrate dev`, which is a development command.
- **Redis:** Used only through a small get/set/del cache (OTP, pending 2FA secrets, token denylist). **BullMQ is a declared dependency but is never imported.** There are no queues and no workers. The in-memory fallback never actually activates: the Redis constructor doesn't throw, and errors are silenced.
- **Seed (`prisma/seed.ts`):** Creates a super admin, 10 wings, speakers, events, news, content blocks and themes from `packages/shared` prototype data.

### 1.3 Frontend (`apps/web`, `apps/admin`): mostly not connected to the API

- **Data source:** Almost all content (events, gallery, speakers, wings, news, resources) is read from **`data/community-store.json` through a Next.js route handler, `/api/community`**, not from Express/PostgreSQL. Admin create, update and delete also write to that JSON file.
- **Express API usage:** Only the web login page calls the Express API (`/auth/send-otp`, `/auth/verify-otp`, `/auth/login-email`).
- **Member auth state:** Kept in `localStorage` (`ascend_member_user`, `ascend_member_token`). If a token exists with no profile, the app shows a hardcoded fallback profile, "CA Kavya Reddy".
- **Event registration and payment:** Simulated in the browser. `setTimeout` produces a random `ASC27-XXX-NNNN` booking code and stores it in `localStorage`. No order is created, and neither Razorpay nor the database is involved.
- **Admin login:** Fake. Any email and password moves to a TOTP step, and any 6 characters there redirects to `/dashboard`. **The admin app has no route guard or middleware.**
- **Web pages present:** `/`, about, contact, dashboard, directory, events, events/[slug], events/[slug]/register, gallery, legal, login, membership, news, news/[slug], resources, search, speakers, speakers/[slug], wings, manifest.
- **Admin pages present:** login, dashboard (one 2,305-line page), events (placeholder), theme (theme studio UI).
- **PWA:** Hand-written `public/sw.js` plus `manifest.json`/`manifest.ts`. `@serwist/next` is installed but not used.

### 1.4 Baseline build and test status (run on 9 Oct 2026, after `npm ci`)

| Check | Result |
|---|---|
| `npm ci` | ✅ Succeeded. npm's `allow-scripts` policy blocked the install scripts for argon2, prisma, esbuild and msgpackr-extract. |
| `npm run build:packages` (shared + ui) | ✅ Pass |
| `prisma generate` / `prisma validate` | ✅ Pass (`validate` needs `DATABASE_URL` set) |
| API `tsc --noEmit` | ✅ 0 errors |
| API tests (`tsx --test`) | ⚠️ **11/12 pass.** `razorpay.provider.test.ts` fails unless `RAZORPAY_KEY_SECRET` is set, because the test's fallback secret differs from `env.ts`'s default. It passes in CI because CI sets the variable. The "e2e" suite uses a mocked container with no real database. |
| `next build`, web | ✅ Pass (21 routes) |
| `next build`, admin | ✅ Pass (10 routes) |
| `next lint` | ❌ Not configured. ESLint prompts for interactive setup. There are no ESLint configs in the repo. |
| Database / Redis integration tests | ⏭️ None exist. Not run, because no local Postgres or Redis was started. |

`git status` was still clean after these checks: build outputs are gitignored.

---

## 2. Existing vs. missing features

Legend: ✅ works end to end · 🟡 partial, prototype, or not wired · ❌ missing

| Area | Status | Notes |
|---|---|---|
| Public pages: home, about, wings list, events, event detail, speakers, news, resources, gallery, contact, legal, search, membership | 🟡 | Render from the JSON store, so no PostgreSQL. Content is prototype placeholder. |
| Leadership page | ❌ | Not present. |
| Partners/sponsors page | ❌ | Not present. |
| Individual wing detail pages (`/wings/[slug]`) | ❌ | Not present. |
| Podcast / Insights pages | ❌ | Not present. The Blueprint lists them (Q5). |
| SEO: per-page metadata, sitemap, robots, JSON-LD schema, analytics | ❌ | Only root-layout metadata exists. |
| Member registration with password, email verification, refresh/session | ❌ | `register` takes no password. The schema has no name field (the name is discarded). `RefreshToken` is never written. There is no `/refresh` endpoint, no email verification, and lockout counters are never used. |
| Mobile OTP login | 🟡 | The OTP is stored in Redis, but **no SMS is ever sent**. Dev OTP is `123456`. The OTP uses `Math.random`. Verifying an unknown mobile auto-creates an *active* member with a placeholder email and city "New Delhi". |
| Member portal: profile, my events, directory | 🟡 | The UI exists. The API has `/members/me` and `/members/directory`. The front end doesn't call them. |
| My wings, certificates, notifications | ❌ | The `Notification` model exists but has no API or UI. Certificates don't exist. |
| Membership purchase and activation | ❌ | Prices are hardcoded in the payments service. A paid membership order never activates or extends a membership. There is no plan table, no renewal and no expiry handling. |
| Event discovery and detail | 🟡 | API endpoints exist. The UI uses JSON. |
| Event registration, capacity, booking ID, receipt | 🟡 / ❌ | The API has registration plus a transactional seat increment. The UI is fully simulated (see risks). |
| Razorpay checkout, verification, webhook, refunds | 🟡 | Signature verification exists. The webhook can't verify correctly (see risks). The Refund model and the refund flow are unimplemented. No front end opens Razorpay Checkout. |
| GST invoice | 🟡 | A record is created. There is no PDF and no email. The numbering scheme is unsafe. |
| Reminders, confirmations, email | ❌ | No email provider is wired up. `SMTP_*` exists only in `.env.example`. |
| Attendance / check-in | ❌ | `checkedInAt` and `qrCode` exist in the schema. There is no endpoint or UI. |
| Admin: real auth with 2FA | 🟡 | The API flow exists, including TOTP setup and sudo tokens. The admin UI never calls it. `requireSudo()` is defined but never applied. |
| Admin: events, registrations, attendees, payments, members, plans, org structure, content, exports, reports, audit-log viewer | 🟡 / ❌ | The dashboard edits the JSON store. The API admin routes cover only: create/update event, approve member, update content block, create news, create resource, read invoice, and theme. |
| Theme settings, database-backed | 🟡 | The API is complete (draft, publish, rollback, history, WCAG check). The admin theme page and the web app don't load the theme from the API. Tokens are static CSS. |
| PWA | 🟡 | Installable. The caching policy is unsafe (see risks). There is no push. |
| Wing Convener scoped access | ❌ | No such role and no wing-assignment model. |
| Organisation structure (office bearers, committees, city/Young/Women CA leads, partners) | ❌ | No models. |

---

## 3. Design system and reusable components (visual source of truth)

- **Tokens:** `packages/ui/src/styles/tokens.css` defines a dark-first palette: `--bg #03050F`, `--card #0A1130`, `--fg #E8EFF8`, primary `--lime #2F5BFF` (blue, despite the name), `--cobalt #0F38C0`, `--navy`, `--sky`, `--mist`, plus status tokens `--ok/--warn/--bad`. There is a `[data-theme="light"]` override and radius tokens `--r*`. The section spacing token is `--sec`.
- **Typography:** Inter (body), Inter Tight (display), Instrument Serif (accent), Geist Mono (mono). Fonts load through `next/font` plus a Google Fonts `@import`. Geist Mono loads only through the import.
- **Tailwind:** `packages/ui/src/tailwind-preset.js` maps every token to utility names: `bg`, `card`, `fg`, `muted`, `lime`, `ok`, `rounded-token`, and so on.
- **Components (`@ascend/ui`):** Badge, BottomNav, Button (CVA variants), CalendarPreview, Card, Drawer, EventCard, GrowthChart, Input, MetricCard, Modal, Navbar, PricingTierCard, Select, Table, Tabs, Toast, Typography, WingRow, icons, ThemeProvider, theme-utils. 24 app files import `@ascend/ui`.
- **Debt:** 206 hardcoded hex colours across `apps/web/src` and `apps/admin/src`, plus many inline gradients (for example `from-[#4A72FF] to-[#1F45D6]`). These will be moved onto tokens in Phase 1.
- **Brand mismatch to resolve:** The Blueprint uses a **navy + gold** premium palette with mountain/eagle imagery and a multicolour per-wing scheme. The current code is **dark navy + electric blue** ("ASCEND"). Your instructions say the existing project is the visual source of truth, so I will keep the existing theme. I need you to confirm whether gold accents and per-wing colours from the Blueprint should be added as tokens (Q3).

---

## 4. Verified organisational structure (from the PDF and Blueprint slide 3)

### 4.1 Core leadership and executive structure

| Level | Detail stated in the document |
|---|---|
| President | **CA Sandeep Garg** |
| Vice President | **CA Abhinav Aggarwal** |
| Secretary | Position shown, **no name given** |
| Treasurer | Position shown, **no name given** |
| Executive Council | President, Vice President, Secretary, Treasurer and the Wing Conveners |
| Wing Conveners | 1 per wing |
| Wing Committee | 3 members (per wing, as I read the chart) |
| Young Professional Coordinators | 2 members (per wing is implied but not stated — Q7) |
| Members | Forum members across all categories |

### 4.2 The 10 professional wings

| # | Wing | Focus areas (verbatim) | Proposed activities (verbatim, 10 per wing) |
|---|---|---|---|
| 1 | Tax & Regulatory | Direct Tax · International Tax · GST · Customs · Regulatory | Tax Update Live (monthly), Case Law Café, Tax Masterclass, Cross-Border Conversations, GST Clinic, Tax Litigation Room, Ask the Expert, Tax Leader Roundtable, Tax Debate, Annual Tax Summit |
| 2 | Audit, Assurance & Finance | Audit · Assurance · Accounting · Financial Reporting · Risk | Audit Update Hour, Standards Simplified, CFO Conversations, Audit Case Room, Risk & Controls Forum, Financial Reporting Masterclass, Audit Technology Lab, Emerging CFO Series, Peer Review Exchange, Annual Audit & Finance Summit |
| 3 | Practice & Entrepreneurship | Practice Growth · Business Building · Client Acquisition · Leadership | Build Your Practice, The Modern CA Firm, Practice Growth Clinic, Pricing Your Expertise, Client Acquisition Lab, Partner's Playbook, From Solo to Scale, CA Entrepreneur Stories, Practice Succession Roundtable, CA Business Leaders Summit |
| 4 | Industry & Leadership | CFO Ecosystem · Corporate Leadership · Career Progression · Board Readiness | Inside the CFO Office, CA to CXO, Leadership Without a Title, Boardroom Conversations, Industry CA Connect, Career Switch Stories, Women in Corporate Leadership, CEO/CFO Fireside, Leadership Masterclass, Future CFO Summit |
| 5 | AI, Technology & Automation | AI for CAs · Automation · Tools · Digital Transformation | AI for the Modern CA, Automation Friday, AI Tax Lab, AI Audit Lab, Prompt Engineering for Professionals, Build Your First AI Workflow, Tools of the Month, No-Code Automation Challenge, AI Leaders Roundtable, Future of the CA Profession Summit |
| 6 | Young Professionals & Career | Students · Young CAs · Career · Mentorship · Leadership | CA Career Compass, First 100 Days as a CA, Partner's Career Stories, Interview Room, CV & LinkedIn Clinic, Young CA Speed Networking, Mentor Match, Industry Exposure Series, Young Leaders Roundtable, Young CA Leadership Summit |
| 7 | Women Professionals | Leadership · Entrepreneurship · Mentoring · Career Growth | Women Who Lead, Beyond the Balance, Return & Rise, Women Entrepreneur Circle, MentorHer, Women CFO Conversations, Career Reboot, Women Networking Brunch, Financial Independence Forum, Women Leadership Summit |
| 8 | Sports, Fitness & Wellness | Sports · Fitness · Wellness · Mental Health · Family Engagement | CA Cricket League, CA Badminton Cup, CA Football Meet, Run for the Profession, 30-Day Fitness Challenge, Weekend Fitness Club, Mind & Work, Nutrition for Professionals, Family Sports Day, Annual CA Sports Festival |
| 9 | Social Impact & Community | Financial Literacy · Education · CSR · Volunteering · Mentoring | CA Gives Back, Financial Literacy Drive, Teach & Mentor, Student Scholarship Initiative, Pro Bono Professional Day, Community Service Weekend, Financial Awareness for Entrepreneurs, Green Professional Initiative, Annual Social Impact Project, Community Impact Summit |
| 10 | Global Network & International Relations | Global CA Connect · International Tax · Study Tours · Global Networking | Global CA Connect, CA Across Borders, International Tax Conversations, Global Career Series, Meet the Global CFO, International Practice Exchange, Global CA Networking Night, Professional Delegation, International Learning Tour, Global CA Summit |

The documents label these activities **"Proposed"**. They are activity *formats*, not scheduled events, and no dates, venues, fees or speakers are given.

**Existing data that conflicts with the documents:**
- Wing 10 is named "Global Network & International" in the code but "…& International Relations" in the documents.
- The code's focus-area tags are truncated. For example, wing 1 is missing "Regulatory" and wing 2 is missing "Assurance".
- The code keeps only 6 of the 10 activities per wing.
- Seeded speakers (e.g. "CA Rohan Mehta", "CA Priya Sharma") and events (dates, fees, seat counts) are prototype placeholders. The names appear only as UI mock-ups in the Blueprint. **They are not verified people or events.**

### 4.3 Parallel community structures

| Structure | Stated purpose |
|---|---|
| City Leads (regional/city communities) | City-level networking & events; member acquisition & engagement; local partnerships; reporting to central leadership |
| Experienced CA Community (FCA/ACA) | Senior network; leadership & mentoring; knowledge sharing; industry & practice guidance |
| Young CA Leads (young CA & student engagement) | Young CA & student community; career programmes & mentorship; networking & leadership initiatives; city-wise young CA representatives |
| Women CA Leads | Women CA community; leadership & mentoring; career & entrepreneurship initiatives; wellness & networking; city-wise women CA representatives |
| Allied Professionals (Advocates, CS, CMA, CPA, finance professionals, technology professionals, consultants, others) | Cross-professional networking; joint events; knowledge exchange; industry connect |
| Partners / Sponsors | Knowledge, technology, event and wing partners; annual strategic partners |

### 4.4 Vision, mission, purposes (Blueprint slides 1, 2, 7)

- **Positioning:** "A Professional Community for Chartered Accountants & Beyond". A pan-India network with the pillars *Learn · Connect · Grow · Transform · Thrive · Contribute*.
- **Vision and mission:** The documents give exact wording. I will put it into seed content verbatim and won't paraphrase it.
- **Guiding principles:** Member First · Value Driven · Inclusive Community · Innovative & Future-Ready · Ethical & Professional · National & Global Perspective.
- **Launch:** **1 January 2027, pan-India.** The 90-day plan runs October–December 2026. Targets: 250+ expressions of interest, 100+ confirmed founding members, and 500+ registered members by the end of December. The plan also calls for the Q1 2027 event calendar to be locked, 10 wings operational, and **"test registration, payments and member login" in December**.
- **Forum name:** The October plan says *"Finalise forum name & brand identity"*. "ASCEND" is used throughout the code and domains (`ascend-ca.in`) but **appears nowhere in the documents** (Q2).

---

## 5. Membership (Blueprint slide 4)

### 5.1 Plans (proposed — must be configurable)

| Plan | Audience | Price stated | Ideal for |
|---|---|---|---|
| **Core Member** | CA professionals | ₹1,000 / year | Practice CA, Industry CA, Entrepreneur CA, FCA, ACA, Young CA, Women CA |
| **Associate Member** | Allied professionals | ₹1,000 / year | Advocates, CS, CMA, CPA, finance professionals, technology professionals, consultants, others |
| **Student Member** | CA students | ₹499 / year **or Free (introductory)** | CA students and emerging professionals |

**Benefits listed for Core and Associate:** community membership; digital profile and directory; networking groups; selected free webinars; member-only discussions; professional resources; discounts on paid events; annual networking event; wing membership; community newsletter; member opportunities.

**Benefits listed for Student:** community membership, student network, selected free webinars, mentorship, career guidance sessions, selected resources, discounts on paid events, networking opportunities, participation certificates, newsletter and updates, future opportunities.

The documents don't specify GST treatment, renewal or grace rules, pro-rating, refunds, or how much the event discount is (Q9, Q10).

### 5.2 Member identity communities (self-selected tags)

- **CA community:** Practice CA, Industry CA, Entrepreneur CA, FCA, ACA, Young CA, Student CA, Women CA.
- **Allied community:** Advocates, Company Secretaries, CMA, CPA, Finance Professionals, Technology Professionals, Consultants, Others.

### 5.3 Nine-step member journey (verbatim order)

1. **Discover:** learn about the community.
2. **Register:** sign up and create your account.
3. **Become a Member:** choose your membership plan.
4. **Create Profile:** build your professional profile.
5. **Select Interests:** choose your wings and communities.
6. **Attend Events:** join webinars, networking and activities.
7. **Network:** connect with peers across cities and industries.
8. **Contribute:** volunteer, share knowledge and support.
9. **Grow into a Leader:** take on leadership roles in wings, city and community initiatives.

---

## 6. Digital ecosystem scope (Blueprint slide 5) compared with your brief

| Blueprint module | Items | Scope per your brief |
|---|---|---|
| Public website | About, Leadership, Membership, Wings, Events, Speakers, **Podcast**, **Insights**, Partners, Contact | In scope. For Podcast and Insights, see Q5. Your brief says "news" and "resources". |
| Member portal | Profile, directory & networking, wings & interest groups, event registration, **discussions**, resources & toolkits, **mentorship**, payments & history, certificates, notifications | In scope, except discussions/forum, which is future scope per your brief. Mentorship scope: Q6. |
| CRM (central DB) | Member data, segmentation, engagement tracking, event history, renewal management, communication, analytics & reporting | Becomes the admin panel and reports. |
| Event management | Registration, payments, attendance tracking, feedback, certificates, event analytics | **Highest priority.** |
| Communications | WhatsApp/Telegram groups, email newsletters, event reminders, personalised updates, announcements | Email first. WhatsApp is future scope (extension hook only). |

---

## 7. Proposed user roles and permissions

The organisational titles in section 4 are **not** the same thing as system permissions. I propose keeping two separate concepts:

**A. Platform roles (security, enforced server-side)**

| Role | Proposed capabilities |
|---|---|
| `SUPER_ADMIN` | Everything, including role management and theme publish (sudo). |
| `ADMIN` | Everything except role management. Refunds and theme publish require sudo. |
| `MODERATOR` | Content and events editing. No finance. |
| **`WING_CONVENER` (new)** | Create and edit events, and view registrations and attendance, **only for wings assigned to them**. Manage wing content. No finance beyond their own wing's event reports (Q8). |
| **`CITY_LEAD` / community leads (new, optional)** | Possibly scoped to a city or community. Only if you approve it (Q8). |
| `MEMBER` | Portal, directory, registrations, own payments, invoices and certificates. |
| `GUEST` (registered, not a member) | Register for open events at the non-member price. No directory access. |
| Anonymous | Public pages, event registration where guest checkout is allowed (Q11). |

**B. Organisational positions (display data)**

`OrgPosition` records, such as President, VP, Secretary, Treasurer, Convener of wing N, committee member, YP coordinator, City Lead (city), and Women/Young CA Lead. These drive the Leadership page. Where relevant they are linked to a user, and assigning a Convener position can grant the scoped `WING_CONVENER` role.

### Key entities (to be specified in Phase 2)

New entities:
- MembershipPlan (configurable price, duration, benefits, active flag)
- Membership (user, plan, start, end, status, order)
- IdentityTag and MemberIdentity
- OrgPosition and WingAssignment
- Community (city, Young CA, Women CA, Allied)
- Partner/Sponsor
- WingActivity (format catalogue)
- SeatHold / reservation (with expiry)
- Certificate
- EmailOutbox / NotificationDelivery (dedupe keys)
- GalleryItem
- Session (refresh tokens)
- EmailVerificationToken

Existing entities to fix:
- User needs a name.
- Money must be stored in **paise**.
- Event needs real `startsAt`/`endsAt` timestamps instead of strings.
- The event category and mode enums need fixing.
- Registration status needs `PENDING_PAYMENT` and `EXPIRED`.
- Order needs an expiry and an idempotency key.
- Refund needs status enums.

### Primary user journeys to support

1. A visitor discovers an event, registers (free, or paid via Razorpay), and receives a booking ID, a receipt and an email.
2. A visitor registers, verifies their email, buys a membership, completes their profile, and selects wings and identity tags.
3. A member sees My Events, My Wings, invoices, certificates and notifications, and browses the directory.
4. A Wing Convener manages their own wing's events and attendance.
5. An admin manages events, registrations and check-in, payments and refunds, members and plans, org structure, content, exports, reports, audit logs and theme.

---

## 8. Event and payment requirements (highest priority)

These must hold. Wherever the current code doesn't meet a requirement, a ⚠️ marks it.

1. **Price is computed on the server** from the database: the member price applies only if the user has an *active* membership. ⚠️ Today any logged-in user gets the member price.
2. **Capacity is guaranteed in PostgreSQL**, using a conditional atomic update or row lock. A seat hold with expiry is created at order time and released by a sweeper when it expires. ⚠️ Today seats aren't held at order time, so a paid user can find the event full after paying.
3. **Booking IDs** are unique and collision-free: generated from a DB sequence or with a retry on conflict, never from `seatsTaken+1`. ⚠️ The current scheme collides under concurrency.
4. **Free events** skip Razorpay entirely. ⚠️ The current code would create a ₹0 Razorpay order, and Razorpay requires at least ₹1.
5. **Verification:** Client-side `verify` is checked with HMAC, and **the webhook is the source of truth**. Both paths call the same idempotent `fulfilOrder()` inside one DB transaction (payment + order status + registration + invoice). Duplicate calls are no-ops.
6. **The webhook verifies against the raw request body** and handles `payment.captured`, `payment.failed`, `order.paid` and `refund.processed`.
7. **Retries:** a failed or abandoned payment can be retried on the same order or a new one while the hold is valid.
8. **Refunds** are admin-only, require sudo, are audited, and update the registration and seat count.
9. **Receipts and invoices:** per-financial-year sequential numbering from a DB sequence. A PDF is generated. GST rules must be confirmed (Q10).
10. **Notifications:** confirmation, then reminders (for example T-24h and T-1h, to be confirmed), sent through an outbox table with a unique dedupe key and processed by a retry-safe BullMQ worker.
11. **Attendance:** QR or booking-code check-in by admins or conveners, with exports and reports.

---

## 9. Security risks found in the current code

The table below is ordered by severity. **None of these has been fixed: Phase 0 makes no code changes.**

| # | Severity | Finding | Location |
|---|---|---|---|
| S1 | **Critical** | `/api/community` (on **both** the web app and the admin app) lets **anyone create, update or delete** all events, news, speakers, wings, resources and gallery items. It has no auth and uses `Access-Control-Allow-Origin: *`. | `apps/web/src/app/api/community/route.ts`, `apps/admin/src/app/api/community/route.ts` |
| S2 | **Critical** | `/api/upload` on the public web app accepts **any file type and size with no auth**, and writes it into `public/uploads` of both apps. That allows stored XSS (for example an uploaded `.html` or `.svg`), defacement, and filling the disk. | `apps/*/src/app/api/upload/route.ts` |
| S3 | **Critical** | Admin UI login is fake, and admin pages have no guard. Anyone who can reach the admin host gets the dashboard, which can edit the JSON store through S1. | `apps/admin/src/app/login/page.tsx` |
| S4 | **High** | `POST /api/v1/events/:slug/register` has no validation and **no payment check**. Anyone can register for a paid event and set `feePaid`/`orderId` in the request body. | `events.controller.ts`, `events.service.ts` |
| S5 | **High** | `GET /api/v1/payments/invoices/:id` uses *optional* auth, and the ownership check is skipped when there is no user. **Anonymous users can read any invoice**, including attendee PII and GSTIN. `GET /events/registrations/:bookingCode` is also public and returns attendee PII. | `payments.service.ts#getInvoice`, `events.routes.ts` |
| S6 | **High** | The member directory is **public** and returns member emails. | `members.routes.ts`, `members.repository.ts` |
| S7 | **High** | The webhook signature is computed over `JSON.stringify(parsedBody)` instead of the raw body, so real Razorpay webhooks will fail verification. On `payment.captured`, the handler calls `verifyPayment` with a placeholder signature, which then fails, so **the webhook can never fulfil an order**. It also checks idempotency *before* verifying the signature, and falls back to a `Date.now()` event ID. | `payments.controller.ts`, `payments.service.ts` |
| S8 | **High** | Fulfilment isn't atomic. Payment, invoice and registration are written in separate transactions, so a failure halfway through leaves an order marked PAID with no registration. Invoice numbers are 2 random bytes, which will collide, and the financial-year label is based on the calendar year. | `payments.service.ts#verifyPayment` |
| S9 | **High** | Member session: the cookie holds the *refresh* token, but `authenticate` verifies the cookie as an *access* token (different secret), so cookie auth always fails. Refresh tokens are never stored, rotated or revocable. There is no CSRF protection. The front end keeps tokens in `localStorage`, which XSS can steal. | `auth.controller.ts`, `authenticate.ts`, `AuthContext.tsx` |
| S10 | **High** | OTP: no SMS is sent. The OTP comes from `Math.random`. Brute-force protection is only an IP rate limit (no per-number attempt counter). Verifying auto-creates **ACTIVE** members, and `createMemberUser` marks email and mobile as verified without checking either. | `auth.service.ts`, `auth.repository.ts` |
| S11 | **Medium** | `requireSudo()` is never used, so refunds and theme publish don't require re-auth, contrary to the docs. Sudo accepts a request with no TOTP code. The admin cookie lasts 1 hour but the token lasts 10 minutes, and there is no admin refresh. | `rbac.ts`, `admin-*.routes.ts`, `auth.service.ts` |
| S12 | **Medium** | The seed hardcodes the super-admin password `Admin@Ascend2027!` in source, and the seed email doesn't match `DEPLOYMENT.md`. `.env.example` contains realistic-looking sample secrets that are easy to deploy unchanged. | `prisma/seed.ts`, `.env.example` |
| S13 | **Medium** | The service worker pre-caches `/dashboard` and caches **every** successful navigation, so private member pages can be served from cache on shared devices after logout. | `apps/web/public/sw.js` |
| S14 | **Medium** | Most admin and member write endpoints have no zod validation (`members/me PUT`, events create/update, payments). Admin event create and update pass `req.body` straight to Prisma (mass assignment). | various |
| S15 | **Low** | Redis outage behaviour: the in-memory fallback never triggers. If Redis is down, auth checks throw, so the API fails closed but with 500s. Rate limiting is per process and in memory. `rate-limit-redis` is installed but unused. | `lib/redis.ts`, `rateLimiter.ts` |
| S16 | **Low** | AES key derivation uses a static salt. `decryptField` returns the ciphertext when decryption fails, which hides errors. | `lib/crypto.ts` |

**Key takeaway:** Some project docs (`ARCHITECTURE.md`, `DEPLOYMENT.md`) describe capabilities that aren't implemented: BullMQ workers, GST PDF invoices, email, SSR theme injection, Cloudflare isolation, and admin 2FA in the UI. Treat those docs as aspirational. I'll update them as features become real.

---

## 10. Dependencies, conflicts and assumptions

**Data-layer conflict (most important architectural decision):** There are two sources of truth: the JSON file through Next route handlers, and PostgreSQL through Express. **I recommend retiring `/api/community`, `/api/upload` and `data/community-store.json`** and making the Express API plus PostgreSQL the single source of truth for both apps. Existing JSON content would be migrated into the seed, but only content that is verified (Q4).

**Other dependencies and conflicts:**
- No migrations exist yet. Phase 2 must create a baseline migration. Is there an existing database deployed anywhere? If there is, a baseline must be taken *from that database* instead of generated fresh (Q12).
- `prisma migrate dev` must not run in production. The deployment docs should use `migrate deploy`.
- BullMQ is installed but unused. I will use it for email, reminders and seat-hold expiry. Redis is already in the stack, so this adds no new infrastructure.
- **New dependencies I expect to propose** (each to be confirmed in its phase):
  - `cookie-parser` and a CSRF strategy (double-submit token)
  - an email provider SDK, or `nodemailer` (SMTP vars already exist)
  - a PDF generator for invoices and certificates (e.g. `pdfkit`)
  - possibly `@serwist/next` (already installed)
  - an ESLint config
  - Playwright for end-to-end tests (Q13)
- **Assumptions (to be confirmed):**
  - Currency is INR only.
  - Timezone is IST.
  - English only.
  - Amounts are stored in paise.
  - Guest (non-member) event registration is allowed.
  - The Razorpay account is in test mode until you authorise live mode.
- Your instructions mention JavaScript. The repo is TypeScript throughout, so I will continue in TypeScript.

---

## 11. Open questions

**Blocking: needed before Phase 1 or 2**

1. **Website Checklist:** Please put `Website Checklist.docx` in `docs/requirements/` or share its path. It is the main functional-requirements source and I haven't seen it. Should I copy the PDF and PPTX into `docs/requirements/` too?
2. **Forum name and brand:** Is "ASCEND" the approved name, and is `ascend-ca.in` the domain? The Blueprint says the name is still to be finalised.
3. **Visual direction:** Keep the current dark navy + electric blue theme as is? Or add the Blueprint's gold accent and per-wing colours as tokens?
4. **Content verification:** Which current placeholder content may go live: speakers, events, news, gallery, stats like "seats taken"? My default is to seed only the verified wings, activities, leadership and plans, and mark everything else as draft or sample.
5. **Podcast and Insights:** In scope for launch, or treated as News/Resources categories?
6. **Mentorship:** In launch scope as a portal feature, or future?
7. **Committee structure:** Are the Wing Committee (3) and Young Professional Coordinators (2) **per wing**? Are names available for the Secretary, Treasurer, conveners and leads?
8. **Scoped roles:** Confirm the new `WING_CONVENER` role, scoped to assigned wings. Should City / Young CA / Women CA leads get any admin rights at launch?
9. **Membership rules:** Student plan: ₹499 or free at launch? Is the membership year 12 months from purchase or a fixed financial year? Renewal reminders and grace period? Is ICAI membership-number verification manual (admin approval) or not required? Should members need approval before becoming ACTIVE?
10. **GST and invoicing:** Is the entity GST-registered? Are prices GST-inclusive or exclusive? Which legal name, GSTIN and address go on invoices? Refund policy?
11. **Events:** Guest checkout without an account, yes or no? Seat-hold duration (I propose 15 minutes)? Is a waitlist needed? Multiple tickets per order, or one attendee per registration? What is the cancellation and refund window? Reminder schedule? Are certificates issued for attendance, and what do they contain (CPE hours?)?
12. **Environments:** Is there any deployed database or staging environment today? Do you have Razorpay *test* keys, an email provider, and analytics (GA4 / Plausible)?
13. **Testing tooling:** Is adding Playwright (E2E) and ESLint acceptable?

**Non-blocking**

14. Do the current per-wing activity lists define a schedulable "format" catalogue, so events link to an activity type?
15. Is OTP login wanted at launch? If it is, an SMS provider (MSG91, Twilio, etc.) is needed. Otherwise, email + password with email verification.

---

## 12. Proposed implementation phases and acceptance criteria

Each phase ends with a report and a **stop for your approval**. Security fixes S1–S3 are urgent, but because Phase 0 prohibits changes, I propose doing them **first in Phase 1**, as a small containment patch, if you approve.

| Phase | Scope | Acceptance criteria |
|---|---|---|
| **1. Design system and shared components** (+ containment) | Disable or lock down `/api/community` and `/api/upload` (S1, S2). Block access to the admin app until real auth exists (S3). Move hardcoded colours onto tokens. Add the missing tokens (Q3). Consolidate shared components: Section, PageHeader, WingCard, LeaderCard, PartnerLogo, EmptyState, Skeleton, FormField, Stepper. Set up ESLint. | No unauthenticated write or upload endpoints. Zero new hardcoded hex values in components, with the remaining count reported. Both apps build. Visual parity on key pages, checked at mobile and desktop widths. |
| **2. ERD, schema, migrations, API contracts, verified seed** | Baseline migration. New models (section 7). Money in paise. Seat holds. Sequences for booking and invoice numbers. Constraints and indexes. Zod + OpenAPI contracts for every endpoint. Seed with only verified data. | `prisma migrate deploy` succeeds on an empty database. Seed is idempotent. ERD is committed. OpenAPI covers all endpoints. **No destructive migration without your approval.** |
| **3. Backend modules** | Auth: password + email verification, rotating refresh sessions in httpOnly cookies, CSRF, lockout. RBAC with wing scope. Membership plans and activation. Events with holds and atomic fulfilment. Razorpay: raw-body webhook, idempotent, refunds. Outbox + BullMQ workers. Certificates. Notifications. Admin endpoints. Audit. Fixes S4–S16. | Tests pass for: auth, role boundaries (including a convener denied another wing), concurrent bookings that never oversell, payment verification, duplicate webhooks that cause no double fulfilment, retry after a failed payment, and refunds. Type check clean. |
| **4. Public website and SEO** | Wire every page to the API. Add Leadership, Partners and wing detail pages, plus Podcast/Insights if approved. Per-page metadata, `sitemap.xml`, `robots.txt`, JSON-LD (Organization, Event), analytics hook. | No page reads the JSON store. Lighthouse SEO ≥ 95 and accessibility ≥ 90 on key pages. Real event registration works end to end with Razorpay test mode. |
| **5. Member portal and PWA** | Profile, directory (members only), memberships, My Wings, My Events/passes, invoices, certificates, notifications. Service worker rebuilt so it never caches authenticated pages or API responses. | The nine-step journey can be completed in test mode. After logout, no private page loads from cache. Installable PWA. |
| **6. Admin panel and theme persistence** | Real admin login with TOTP. Sudo for sensitive actions. Events, registrations and check-in, payments and refunds, members and plans, org structure, content, exports (CSV), reports, audit-log viewer. Theme studio saves, publishes and propagates to web, portal and PWA. | Every admin action is enforced on the server and audited. A convener sees only their own wings. A published theme appears on web and PWA without a redeploy. |
| **7. Email, analytics, security review, regression, deployment docs** | Transactional email templates, reminders, analytics events, security review (OWASP checklist), full regression and E2E, `migrate deploy` in the runbook, honest updates to `ARCHITECTURE.md` and `DEPLOYMENT.md`. | All test suites green. Security findings closed or explicitly accepted. Staging deploy verified. **No production deploy or live payments without your authorisation.** |

---

*End of Phase 0. Waiting for your explicit approval and answers to the blocking questions before starting Phase 1.*
