
# Football Operations Center — v2 Polish

Scope split into 3 sub-batches so we ship value quickly and you can validate as we go.

---

## Sub-batch C1 — Readability + Inline Stadium Editor (HIGHEST PRIORITY)

### 1. Global admin readability pass
- Bump base text contrast: replace ad-hoc `text-[#2C3E50]/80`, `text-slate-500` with stronger semantic tokens (`text-foreground`, `text-foreground/90`, `text-muted-foreground`).
- Operations Copilot: assistant bubble background → `bg-card` with `text-foreground`; user bubble keeps dark + white; suggestion chips → solid white border + bold label.
- Overview cards: stronger heading weights, larger numbers, real divider lines, hover lift + border-emerald on interactive cards.
- Bottom mobile admin nav: increase height, bold active pill, underline on active, ensure 44px tap targets, sticky safe-area padding.
- Drawers/Sheets: solid `bg-background`, larger headers, section dividers, sticky save bar at bottom.

### 2. Inline stadium editor (fixes the "Edit redirects to map" bug)
- Rebuild `StadiumDrawer` as a tabbed inline editor (no navigation away):
  - **Overview** — hero image preview, status pills, quick stats
  - **Edit** — slug, city, country, league, lat/lng, capacity, hero image URL (+ upload to `stadium-media` bucket), description, aliases (chip input)
  - **Clubs** — searchable picker over `club_ticketing_profiles`, attach/detach via `stadium_slug` field, badge for national teams, list shown as cards with logos
  - **Matches** — live list of upcoming matches at this stadium (read-only, click to open match drawer later)
- Sticky footer: Save / Cancel / "Save & Next stadium". Save uses `supabase.from('stadiums').update(...)` with optimistic update + toast.
- Drawer opens from the list AND from map markers (replace current navigation behavior).
- After save, drawer stays open; list refreshes in the background.

### 3. Quick wins on the map page
- Map markers open the same `StadiumDrawer` (no separate page).
- "Edit" button on marker popup → opens drawer inline.

---

## Sub-batch C2 — Hierarchical Continent → Country → League → Club filters

Shared `<HierarchicalFilter />` component used in `AdminClubsPage`, `AdminStadiumsPage`, `AdminMatchesPage`.

- Continent dropdown (Europe / N. America / S. America / Asia / Africa / Oceania) — derived client-side from country mapping (small static `countryToContinent` map in `src/lib/geo.ts`).
- Country dropdown — populated from current dataset filtered by continent.
- League dropdown — filtered by country.
- Club dropdown (matches/stadiums only) — filtered by league.
- All filter state in URL params for shareable admin links.
- Filter chip row at top showing active filters with one-click remove.

---

## Sub-batch C3 — Copilot v2: memory + admin actions

### Conversation memory
- Persist chat thread per admin in new `admin_assistant_threads` + `admin_assistant_messages` tables (RLS: admin only).
- UI: thread sidebar inside `/admin/assistant` (New chat, recent threads, rename/delete).
- Send full message history to edge function on every turn so it can resolve "fix this stadium too", "merge these", "keep the previous image".

### Action system (preview → approve → execute)
- New table `admin_actions` (RLS admin-only): `id, kind, payload jsonb, status (proposed|approved|executed|rejected|rolled_back), preview jsonb, created_by, executed_at, undo_payload jsonb`.
- Edge function `admin-assistant` gains write tools that return **proposed actions** (never execute directly):
  - `propose_attach_club_to_stadium`
  - `propose_update_stadium` (slug/coords/capacity/image/aliases)
  - `propose_merge_stadiums` (keeps target, redirects matches+clubs by name, archives source)
  - `propose_replace_image`
  - `propose_enrich_coordinates` (uses existing geocode edge function)
- Each proposal is inserted into `admin_actions` with a human-readable preview diff and surfaced in the chat as an `<ActionCard>` with **Preview / Approve / Reject** buttons.
- Approve calls a separate edge function `admin-actions-execute` that:
  - Re-validates admin role
  - Captures `undo_payload` (current row before mutation)
  - Performs the mutation
  - Marks action `executed`
- Rollback button (admin-only) reverses using `undo_payload`.
- Audit log page `/admin/audit` lists all actions with filters.

### Copilot UX upgrades
- Streaming responses (SSE) for snappier feel.
- Entity chips in replies are clickable → open drawer inline.
- "Continue" suggestions after each turn ("Fix next gap", "Inspect related matches").

---

## Out of scope (this iteration)
- Public site changes
- New SEO/sitemap work
- Payments / subscription flows
- Production stadium row deletion (only soft-archive via merge)

## Delivery order
1. **C1 first** (your blocking pain — inline edit + readability)
2. **C2** (hierarchical filters)
3. **C3** (memory + actions + audit log)

Reply **"go C1"** (or just "go") to ship sub-batch C1 immediately. I can chain C2 and C3 right after, or wait for your feedback between each.
