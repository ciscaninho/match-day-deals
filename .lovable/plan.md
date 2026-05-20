# World Cup inside Stadiums admin

Goal: manage WC2026 host stadiums from the existing `/admin/stadiums` workflow — no parallel admin. Enrich once, surface as premium content on the public World Cup page.

## 1. Schema additions (single migration)

Extend `stadiums` with optional fields used for WC + enrichment (all nullable, safe defaults):

- `is_world_cup_host boolean default false`
- `world_cup_edition text` (e.g. `'wc2026'`)
- `world_cup_role text` (host_city / final / opening / group / knockout)
- `host_city_context text`
- `architecture_notes text`
- `seat_recommendations text`
- `fan_zones text`
- `transport_notes text`
- `hospitality_notes text`
- `ticket_guidance text`
- `matchday_advice text`
- `travel_notes text`
- `historical_facts text`
- `enrichment_status text default 'draft'` (draft/in_review/approved)
- `enrichment_updated_at timestamptz`

New table `stadium_enrichment_proposals` (Copilot proposals → review → approve):
- `stadium_id uuid`, `field text`, `proposed_value text`, `rationale text`, `source text`, `status text default 'pending'` (pending/approved/rejected), `created_by uuid`, `reviewed_by uuid`, `reviewed_at timestamptz`, timestamps
- RLS: admins manage all; nothing public.

Public read of new `stadiums` columns is fine under the existing public SELECT policy (active rows only).

## 2. `/admin/stadiums` — World Cup tab

`AdminStadiumsPage.tsx`: add a top-level toggle `Active | Archived | World Cup`. In WC mode:
- Query `stadiums where is_world_cup_host = true`
- Replace grid with a denser table view showing: Host stadium · Country · Host city · Publication status · **Media coverage** (hero ✓ + gallery count from `stadium_media` approved) · **Match coverage** (count of upcoming WC matches via `matches.competition` like 'World Cup%') · **Ticket coverage** (any active `ticket_offers` / club profile) · **Readiness %** (weighted: hero 25 + ≥3 gallery 15 + ≥3 enrichment fields approved 25 + matches 20 + tickets 15)
- Each row opens an enhanced `StadiumDrawer` with a new **World Cup** tab.

Also add a small "Mark as WC host" action in the regular `StadiumDrawer` header so any stadium can be promoted into the WC section.

## 3. Enhanced StadiumDrawer — World Cup tab

Tabs (new): `Overview · Media · World Cup`.

**Media** reuses existing `StadiumMediaTab` (upload, hero assignment, gallery, moderation — all backed by `stadium_media`). No new media plumbing.

**World Cup** tab:
- Role/edition selectors
- Editable enrichment fields list (the 11 new columns), each showing current approved value + pending Copilot proposals
- **Copilot panel**: button "Propose enrichment" → calls new edge function `wc-copilot-enrich` (Lovable AI Gateway, `google/gemini-2.5-pro`) which returns structured proposals for missing/weak fields and inserts them into `stadium_enrichment_proposals`
- Each proposal row: Approve (writes value to `stadiums`, marks proposal approved) / Reject / Edit-then-approve
- "Auto-enrich on save" toggle that re-runs Copilot when a host is first added

## 4. Edge function `wc-copilot-enrich`

- Input: `{ stadium_id, fields?: string[] }`
- Loads stadium row, asks Lovable AI for JSON-shaped proposals (one per missing field) grounded with `stadium_name + city + country + capacity + opened_year`
- Inserts proposals; returns the list
- Admin-only (verify JWT + `has_role admin`)

## 5. Public World Cup page

Existing `WorldCupHostsBlock` (from prior PR) switches data source to:
```
stadiums where is_world_cup_host = true and publication_status = 'published' and enrichment_status = 'approved'
```
Cards use approved hero media from `stadium_media` and surface approved enrichment fields (host city context, fan zones, transport, ticket guidance). Raw/unapproved data never renders publicly.

## 6. Out of scope

- No new parallel `wc2026_destinations_staging` UI — the previously proposed staging table stays internal/dormant; WC is now driven entirely by promoting existing stadiums.
- No revenue/analytics changes.
- No new localization keys beyond labels for the WC tab + readiness badges (added to all 9 locales).

## Files touched

- migration (new columns + `stadium_enrichment_proposals`)
- `src/pages/admin/AdminStadiumsPage.tsx` (WC tab + table view)
- `src/components/admin/StadiumDrawer.tsx` (tabs + WC tab body)
- `src/components/admin/WorldCupEnrichmentPanel.tsx` (new)
- `src/hooks/useWorldCupReadiness.ts` (new)
- `supabase/functions/wc-copilot-enrich/index.ts` (new)
- `src/components/destinations/WorldCupHostsBlock.tsx` (data source switch)
- `src/i18n/admin.ts` (+ WC labels in 9 locales)

Ship in this order: migration → admin UI → copilot function → public page rewire.
