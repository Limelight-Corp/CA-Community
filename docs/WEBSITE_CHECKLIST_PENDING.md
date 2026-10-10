# Website Checklist — pending work

Audit of the site against "Website Checklist.docx" (30 sections), dated 10 Oct 2026.
Already complete and not listed here: home sections, About, events listing/detail/filters,
registration form, Razorpay payment with retry, legal pages, search, admin CMS, event
dashboard + CSV/Excel export, certificates, QR check-in, PWA, the menu.

Legend: `[ ]` pending · `[x]` done · **(client)** needs data/keys from the organisation

## Step 1 — Quick fixes
- [x] Resources: allow PDF/document upload (today only images can be uploaded) — §11
- [x] Resources: members-only items are locked even for logged-in members — §8, §11
- [x] Header: add a "Join the Community" button next to "Register for an event" — §30
- [x] Sitemap: add /wings and /wings/[slug] — §20
- [x] Site-wide Organization + WebSite JSON-LD; Search Console verification via env — §20, §25
- [x] Document `NEXT_PUBLIC_GA_ID` in .env.example — §25
- [x] Event schema lists 6 categories, site uses 8 (Social, Online missing) — §4
- [x] Unpaid bookings never expire → abandoned payment blocks re-registration — §6

## Step 2 — Email notifications (§5, §6, §17)
- [x] Mailer (SMTP via env; without SMTP, emails are written to a local outbox so it can be tested)
- [x] User: registration confirmed / complete-payment, payment receipt, payment failure, booking cancelled/refunded, membership application received
- [x] Admin: new registration, successful payment, contact form submission, new member application
- [x] Remove the misleading "confirmation email will be sent" text unless mail is configured
- [ ] SMTP credentials **(client)**

## Step 3 — Payments hardening (§6, §15)
- [x] Razorpay webhook (`payment.captured` / `order.paid` / `payment.failed`) so a closed browser still confirms
- [x] Downloadable PDF payment receipt (free bookings get a PDF confirmation)
- [x] Refund through Razorpay API from admin ("Mark refunded" kept for offline refunds)
- [ ] Webhook secret + admin Razorpay keys in env **(client)**

## Step 4 — Real member login & dashboard (§7, §8, §23)
- [x] Real member accounts: scrypt-hashed passwords, signed httpOnly session, email verification, forgot/reset password, login lockout
- [x] Protect /dashboard, the pay page and payment retry with a verified session
- [x] Dashboard from real data: profile edit, my bookings (upcoming/past), receipts, certificates, membership status, change password
- [x] Member-only resources unlocked for approved members (verified email + approved application)
- [x] Profile photograph (uploaded from the dashboard; the Join form points there)
- [ ] Mobile OTP login — needs an SMS provider (e.g. MSG91) **(client)**

## Step 5 — Event lifecycle (§17, §27)
- [x] Event reminder emails (day before / same day; hourly in-server + /api/cron/reminders, never sent twice)
- [x] Admin: cancel (with message) / undo cancel / reschedule an event → registered attendees emailed; cancelled events shown on the site

## Step 6 — Security & compliance (§23, §24, §25)
- [x] Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy, nosniff) on web and admin
- [x] Cookie consent banner + "Cookie settings" footer link; GA / Meta Pixel load only after "Accept all"
- [x] CAPTCHA (Cloudflare Turnstile) on contact, join, event registration, sign-up, forgot password — switched on by adding keys
- [ ] Turnstile keys TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY **(client)**
- [x] Daily backup of data/ (in-server daily run + `npm run backup`, keeps 14)
- [x] Meta Pixel support via META_PIXEL_ID (consent-gated, conversion events mapped)
- [ ] GA4 / Meta Pixel IDs, if used **(client)**

## Step 7 — Smaller improvements
- [x] Renaming a speaker's URL (or deleting a speaker) updates every event that lists them — §9
- [x] Excel export is a real .xlsx (bold frozen header, filters, column widths) — §16
- [x] Share button on every resource (native share / LinkedIn / WhatsApp / X / Facebook / copy link) — §14
- [x] Homepage banner background photo upload in Site Settings — §15
- [x] Fix: images uploaded after a build were not served (404) — now served by /uploads route in both apps

## Content the organisation must provide (no code needed) — §29
- [ ] Testimonials (none yet, so the section is hidden)
- [ ] Team photos, background, LinkedIn; Secretary, Treasurer, wing conveners; advisory board
- [ ] Office address, phone, social media links (footer/contact currently show email only)
- [ ] Event agendas and event-specific terms

## Phase 2 / future (§18, §26)
- [x] WhatsApp (Meta Cloud API): opt-in on registration; booking confirmed, reminder, cancelled, updated — see docs/WHATSAPP_SETUP.md
- [ ] WhatsApp Business account, approved templates and keys **(client)**
- [x] Paid membership via Razorpay: pay after approval, 12 months from payment, early renewal extends, renewal reminder 14 days before expiry, offline payments, fees in Site Settings (Core ₹1,000 · Associate ₹1,000 · Student ₹499)
- [x] Real member directory: approved members who opt in; members-only; search + city / wing / plan filters; no contact details exposed
- [x] Job & articleship board (/careers): admin-posted openings, filters, members-only apply option, auto-expiry, Google JobPosting data
- [x] Mentorship programme (/mentorship + dashboard tab + admin matching): mentor applications, requests, capacity-aware matching, email introductions
- [ ] Forum, online courses, referral programme
