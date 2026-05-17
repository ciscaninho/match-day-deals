# Ticketing Operations Center

Transform `/admin/ticketing` from a flat club list into the operational cockpit for ticketing coverage, source verification, affiliate management, and monetization readiness.

This is a large surface. I'll structure it in **3 deliverable waves** so we ship value incrementally and you can validate each layer before we extend it.

---

## Wave 1 — Foundation: data model + coverage dashboard

Goal: see the entire ticketing landscape at a glance, with the data model ready for affiliate tracking.

### Schema additions (club_ticketing_profiles)

New columns on `club_ticketing_profiles`:

- `verification_status` text default `'unverified'` — `unverified | verified | stale | broken`
- `source_confidence` text default `'medium'` — `low | medium | high`
- `geo_restrictions` text[] (ISO country codes)
- `tickets_last_checked_at` timestamptz
- `tickets_checked_by` uuid

New table `ticket_sources` (one club → many sources):

- `id`, `club_slug` (fk via slug), `kind` (`official | hospitality | resale | affiliate`)
- `provider_name`, `url`, `deeplink_template`
- `affiliate_network` (`partnerize | awin | impact | cj | custom | none`)
- `campaign_id`, `tracking_params` jsonb
- `monetization_enabled` bool, `priority` int
- `verification_status`, `last_checked_at`, `notes`
- RLS: admin write, public read

Editorial publication rule (soft, in code — not a DB constraint):
A club may be `published` only if it has at least one `official` source OR a `verified` trusted source. Otherwise the publish action shows a warning + requires an override reason (stored in `notes`).

### Coverage dashboard at `/admin/ticketing`

Top of page — KPI strip:
- Clubs with ticketing / total
- Missing ticketing
- Official source coverage %
- Affiliate-enabled coverage %
- Verified coverage %
- Hospitality coverage %

Two breakdown tables:
- By league: name • clubs • coverage % • verified % (sortable, colored bars)
- By country: same shape

---

## Wave 2 — Fast enrichment UX

Goal: enrich 100+ clubs without form fatigue.

- **Compact club row** (replaces current card grid): logo, name, league/country, status chips (Official / Resale / Affiliate / Verified / Hospitality / Missing), last-checked timestamp, "Open source" external icon, "Quick edit" pencil.
- **Quick Edit popover** (right side, no full drawer): paste official URL, pick verification status, mark monetization on/off, save. Optimistic update.
- **Bulk actions toolbar**: select rows → bulk mark verified, bulk set "stale", bulk export CSV for offline research, bulk re-check.
- **Filters**: missing official URL • unverified • stale (>90 days) • no affiliate • league • country • coverage status. Uses the unified `normalize.ts` search.
- **Inline validation**: URL format check, duplicate-URL warning across clubs, geo-restriction hints.
- **Smart suggestions**: if a club has no official URL but the stadium does, suggest copying it. If multiple clubs in same league share an affiliate template, propose applying it.

---

## Wave 3 — Sources panel + affiliate plumbing

Goal: manage the multi-source model + make every click monetization-ready.

- **Sources tab inside ClubDrawer** (new drawer, mirroring StadiumDrawer pattern): list `ticket_sources` rows, add/edit/remove, reorder by priority, per-source verification.
- **Affiliate builder**: pick network → template field auto-filled (`{url}?utm_source=footticket&campaign={campaign_id}`), preview rendered URL.
- **Verification workflow**: "Verify now" button → opens URL in new tab + marks `last_checked_at` + prompts status. Stale badge after 90 days.
- **Audit trail**: every source edit logged to `admin_actions` (reuses existing infra).

---

## i18n

All new strings added to `src/i18n/admin.ts` for all 9 locales (en, fr, es, de, it, pt, nl, ar, ru).

---

## Technical notes (for reference)

- Frontend: extends `AdminTicketingPage.tsx`, adds `ClubTicketingDrawer.tsx`, `QuickEditPopover.tsx`, `TicketSourcesPanel.tsx`, `CoverageKPIs.tsx`, `useTicketingCoverage.ts` hook (aggregates client-side from existing query — no edge function needed Wave 1).
- DB: 2 migrations — add columns to `club_ticketing_profiles`, create `ticket_sources` table with RLS.
- Reuses: `FootballFilterBar`, `PublicationStatusControl`, `normalize.ts`, `admin-actions-execute` for audit.
- Out of scope this phase: price comparison engine, alerts pipeline, public "how to buy" guides, conversion analytics dashboards — Wave 4+.

---

## Proposed execution order

1. Wave 1 migration + dashboard (ship, you review)
2. Wave 2 enrichment UX (ship, you enrich a batch, validate ergonomics)
3. Wave 3 sources + affiliate (ship, monetization-ready)

**One question before I start building:** do you want me to ship **all 3 waves in this turn** (large changeset, ~10 new files + migrations), or **just Wave 1** first so you can validate the data model and KPI dashboard before we build the enrichment UX on top?
