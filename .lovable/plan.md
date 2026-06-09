# Sprint Newsletter 1 — Brevo Integration & Lead Capture

Brevo connector linked, sender `support@footticketfinder.com`, list auto-created on first run. Build order below.

Untouched: World Cup 2026, affiliate, payments, Marketing Hub, SEO infra.

---

## 1. Migration — extend `newsletter_signups`

Add columns + indexes (single migration):

| Column | Type |
|---|---|
| `status` | text default `'pending'` (pending / confirmed / unsubscribed / bounced) |
| `confirmation_token` | uuid unique |
| `confirmed_at` | timestamptz |
| `unsubscribe_token` | uuid default `gen_random_uuid()` unique |
| `unsubscribed_at` | timestamptz |
| `unsubscribe_reason` | text |
| `consent_given` | boolean default false |
| `consent_at` | timestamptz |
| `consent_ip` | text |
| `brevo_contact_id` | bigint |
| `last_synced_at` | timestamptz |

Plus: small `app_config` table (`key text pk, value jsonb`) to persist the auto-created `brevo_list_id` (admin-read, service-role write).

Tighten RLS: drop the existing anon insert policy on `newsletter_signups` (edge functions use service role going forward). Keep admin SELECT.

## 2. Edge functions (4 new, gateway-routed Brevo calls)

All use `Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${BREVO_API_KEY}` against `https://connector-gateway.lovable.dev/brevo/...`.

1. **`newsletter-subscribe`** (public POST, Zod-validated)
   - Requires `consent=true`, valid email, honeypot empty.
   - Captures IP (`x-forwarded-for`), UA, UTM, source, favourite team, language, page_path.
   - Upsert row by email; if existing & confirmed → re-send confirmation only if pending.
   - Ensures Brevo list exists (read `app_config.brevo_list_id`; if null → `POST /contacts/lists` with name "Foot Ticket Finder — Subscribers", folder auto, save id).
   - Upserts Brevo contact (`POST /contacts` with `updateEnabled:true`) with attributes `FAVOURITE_TEAM, SOURCE, UTM_SOURCE/MEDIUM/CAMPAIGN/CONTENT, LANGUAGE, DOUBLE_OPT_IN=false`.
   - Sends confirmation email via `POST /smtp/email` (sender `support@footticketfinder.com`, branded HTML, CTA → `/newsletter/confirm?token=…`, plus footer unsubscribe → `/newsletter/unsubscribe?token=…`).

2. **`newsletter-confirm`** (public POST `{ token }`)
   - Validates token, sets `status='confirmed'`, `confirmed_at=now()`.
   - Brevo: `POST /contacts/lists/{id}/contacts/add` + `PUT /contacts/{email}` with `DOUBLE_OPT_IN=true`.
   - Idempotent (already-confirmed returns success).

3. **`newsletter-unsubscribe`** (public POST `{ token, reason? }`)
   - Validates `unsubscribe_token`, sets `status='unsubscribed'`, `unsubscribed_at`, optional `unsubscribe_reason`.
   - Brevo: `POST /contacts/lists/{id}/contacts/remove` + `PUT /contacts/{email}` with `emailBlacklisted:true`.
   - Idempotent.

4. **`newsletter-brevo-webhook`** (public POST, HMAC-validated against a stored secret)
   - Handles `hard_bounce`, `unsubscribed`, `spam` events → updates `status`.
   - Webhook URL surfaced to user post-deploy to register in Brevo dashboard.

## 3. Frontend — updated `NewsletterCTA`

- Add **required GDPR consent checkbox** with link to `/privacy`, unchecked by default.
- Add hidden honeypot input.
- Replace direct insert with `supabase.functions.invoke("newsletter-subscribe", { body })`.
- Success state: "Check your inbox to confirm" (double opt-in copy).
- i18n keys added to all 9 locales: `newsletter.consent_label`, `newsletter.consent_required`, `newsletter.check_inbox_title`, `newsletter.check_inbox_body`, `newsletter.privacy_link`, `newsletter.resend_*`.

## 4. New CTA placements

Reuse the same `NewsletterCTA` component with distinct `source` props:

- **HomePage** (`src/pages/website/WebsiteHomePage.tsx`) — full section, `source="home"`.
- **MatchesPage** (`src/pages/website/WebsiteMatchesPage.tsx`) — banner after results grid, `source="matches"`.
- **Footer** (`src/components/website/WebsiteLayout.tsx`) — compact inline form, `source="footer"`.
- **PricingPage** (`src/pages/marketing/PricingPage.tsx`) — block under plans, `source="pricing"`.
- **PremiumPage / PremiumUpsellPage** — block at bottom, `source="premium"`.

World Cup CTA stays as-is.

## 5. New public pages

- `/newsletter/confirm` — reads `?token=`, calls confirm function, renders success / already-confirmed / invalid.
- `/newsletter/unsubscribe` — reads `?token=`, optional reason textarea, calls unsubscribe function, renders confirmation. Both routes added to `App.tsx`, both i18n'd, both linked from `MarketingLayout` for trust.

## 6. Admin Newsletter Dashboard

New page `src/pages/admin/AdminNewsletterPage.tsx`, behind `RequireAdmin`, linked from `AdminShell` nav under "Marketing → Newsletter".

- Stat cards (deduped by email): total, confirmed, pending, unsubscribed, conversion %, last 7d / 30d signups.
- Breakdowns: by `source` (bar), top 20 `favourite_team`, top UTM source/campaign.
- Recent signups paginated table (email, status badge, source, team, created_at, confirmed_at).
- CSV export of filtered list.
- Read-only; no Brevo writes from the dashboard.

## 7. GDPR

- Unchecked consent checkbox blocks submission.
- Persist `consent_given/at/ip` server-side (cannot be spoofed client-side).
- Unsubscribe link in every email (Brevo native + our token-based).
- Privacy policy text updated via `src/i18n/legal.ts` to mention Brevo as processor.

---

## Tech notes

- Brevo gateway base: `https://connector-gateway.lovable.dev/brevo`. List endpoints: `POST /contacts/lists`, `POST /contacts/lists/{id}/contacts/add|remove`. Contact: `POST /contacts`, `PUT /contacts/{identifier}`. Email: `POST /smtp/email`.
- Confirmation/unsubscribe URLs use `https://footticketfinder.com` in production (env-aware).
- All edge functions: CORS via `npm:@supabase/supabase-js@2/cors`, Zod validation, structured error responses.
- Tokens are UUIDs (single-use for confirm, persistent for unsubscribe).

Switch to build mode to proceed in the order above.
