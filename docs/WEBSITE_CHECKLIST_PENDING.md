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
- [ ] Razorpay webhook (`payment.captured` / `payment.failed`) so a closed browser still confirms
- [ ] Downloadable PDF payment receipt (instead of browser print)
- [ ] Refund through Razorpay API from admin (today: manual "Mark refunded" only)

## Step 4 — Real member login & dashboard (§7, §8, §23)
- [ ] Real member accounts: hashed passwords, server-signed httpOnly session (today: mock login)
- [ ] Protect /dashboard and the pay page with a verified session
- [ ] Dashboard from real data: profile edit, my bookings (upcoming/past), receipts, certificates
- [ ] Member-only resources unlocked for logged-in members
- [ ] Profile photograph on the Join form

## Step 5 — Event lifecycle (§17, §27)
- [ ] Event reminder emails (scheduled endpoint, e.g. 1 day before)
- [ ] Admin: cancel / reschedule an event → notify registered attendees

## Step 6 — Security & compliance (§23, §24, §25)
- [ ] Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy) in Next config
- [ ] Cookie consent banner; load GA / Meta Pixel only after consent
- [ ] CAPTCHA (Cloudflare Turnstile) on public forms — site key **(client)**
- [ ] Daily backup script for data/*.json
- [ ] Meta Pixel via env (only if ads are used) **(client)**

## Step 7 — Smaller improvements
- [ ] Speakers linked to events by id, so renaming a speaker doesn't break events — §9
- [ ] Excel export as real .xlsx (today SpreadsheetML .xls) — §16
- [ ] Share buttons on resources — §14
- [ ] Homepage banner image upload in Site Settings — §15

## Content the organisation must provide (no code needed) — §29
- [ ] Testimonials (none yet, so the section is hidden)
- [ ] Team photos, background, LinkedIn; Secretary, Treasurer, wing conveners; advisory board
- [ ] Office address, phone, social media links (footer/contact currently show email only)
- [ ] Event agendas and event-specific terms

## Phase 2 / future (§18, §26)
- [ ] WhatsApp Business API confirmations/reminders **(client: WhatsApp API account)**
- [ ] Paid membership via Razorpay (plans are marked "proposed" — prices need confirmation)
- [ ] Real member directory (current /directory page uses sample data)
- [ ] Job board, mentorship programme, forum, online courses, referral programme
