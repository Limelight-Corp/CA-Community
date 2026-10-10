# WhatsApp booking updates — setup

The website sends WhatsApp messages through **Meta's WhatsApp Cloud API** (official, no
middleman). Only people who tick *"Send me my booking confirmation, reminders and event updates
on WhatsApp"* on the event registration form receive them.

| Message | Sent when | Sent by |
|---|---|---|
| `booking_confirmed` | free registration confirmed, payment received, admin "Mark paid" | website / admin |
| `event_reminder` | the day before the event (or on the day for late registrations) | website (hourly job) |
| `event_cancelled` | admin cancels the event | admin |
| `event_updated` | admin changes date / time / venue (with "Email registered attendees" ticked) | admin |

Until the keys are set, nothing is sent and the opt-in is hidden. With `WHATSAPP_DRY_RUN=true`
the opt-in is shown and every message is written to `data/outbox/*-whatsapp-*.json` instead of
being sent — useful while Meta reviews the templates. A failed send is also copied there.

## 1. Create the WhatsApp Business account (one time)

1. Go to <https://business.facebook.com> → create / choose your **Meta Business Portfolio**.
2. <https://developers.facebook.com/apps> → **Create app** → type **Business** → add the **WhatsApp** product.
3. In **WhatsApp → API setup**, add your business phone number (it must not already be used in the
   WhatsApp app) and verify it. Note the **Phone number ID**.
4. Business verification (Business Settings → Security Centre) is needed to message more than
   ~250 people a day.
5. Create a **System user** (Business Settings → Users → System users) with the app assigned and
   generate a **permanent access token** with `whatsapp_business_messaging` and
   `whatsapp_business_management` permissions.

## 2. Create the 4 message templates

WhatsApp Manager → **Message templates → Create template** → category **Utility**, language
**English** (`en`). The names and bodies must match exactly (variables in the same order).
Meta asks for a sample value per variable — use the examples given.

**`booking_confirmed`**
```
Hi {{1}}, your registration for {{2}} on {{3}} is confirmed. Booking ID: {{4}}. Your entry pass: {{5}}
```
Samples: {{1}} `Rahul` · {{2}} `AI for the Modern CA` · {{3}} `Sat, 9 Jan 2027, 4:00 PM` · {{4}} `ASC-AICA-7K2Q9X` · {{5}} `https://your-site/registration/ASC-AICA-7K2Q9X`

**`event_reminder`**
```
Hi {{1}}, a reminder that {{2}} is {{3}}. Where: {{4}}. Your booking and entry pass: {{5}}
```
Samples: {{1}} `Rahul` · {{2}} `AI for the Modern CA` · {{3}} `tomorrow at 4:00 PM` · {{4}} `Hotel Taj, Mumbai` · {{5}} `https://your-site/registration/ASC-AICA-7K2Q9X`

**`event_cancelled`**
```
Hi {{1}}, we are sorry — {{2}} scheduled for {{3}} has been cancelled. {{4}} Booking ID: {{5}}
```
Samples: {{1}} `Rahul` · {{2}} `AI for the Modern CA` · {{3}} `Sat, 9 Jan 2027, 4:00 PM` · {{4}} `We will announce a new date soon.` · {{5}} `ASC-AICA-7K2Q9X`

**`event_updated`**
```
Hi {{1}}, the details of {{2}} have changed: {{3}}. Your booking {{4}} stays valid. Details: {{5}}
```
Samples: {{1}} `Rahul` · {{2}} `AI for the Modern CA` · {{3}} `Date now Sat, 16 Jan 2027` · {{4}} `ASC-AICA-7K2Q9X` · {{5}} `https://your-site/registration/ASC-AICA-7K2Q9X`

If you name a template differently, set `WHATSAPP_TPL_<NAME>` (e.g. `WHATSAPP_TPL_EVENT_REMINDER`).

## 3. Configure the website and admin

Add to **both** `apps/web/.env.local` and `apps/admin/.env.local` (never commit these):

```
WHATSAPP_TOKEN=<permanent access token>
WHATSAPP_PHONE_NUMBER_ID=<phone number id>
WHATSAPP_TEMPLATE_LANG=en
```

Restart both apps. Register for an event with your own number and the WhatsApp box ticked to
test. If a message doesn't arrive, the reason is in the server log and in `data/outbox/`.

## Rules worth knowing

- Messages go only to Indian mobile numbers (+91, 10 digits starting 6–9).
- People can reply **STOP** to opt out in WhatsApp.
- Utility templates are charged per conversation by Meta (see Meta's current India pricing).
