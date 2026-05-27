# World Cup 2026 — controlled match import workflow

Goal: matches are never created manually or from ticket URLs. The system imports the official WC2026 schedule, auto-links each fixture to an existing host stadium, and only then runs ticket enrichment. Admin reviews, never authors.

## Source priority

1. **Official FIFA schedule** (canonical seed file shipped with the app — JSON of the 104 WC2026 fixtures: date, venue, city, country, matchday, phase, group).
2. **Existing connected datasets** (Football-Data.org once they publish the WC competition; reuse `sync-football-data` patterns).
3. **Manual CSV import** as fallback (admin uploads, same shape as the seed JSON).

Ticket providers are never a match source.

## Schema

Extend `matches` (single migration, all nullable so existing rows are unaffected):

- `phase text` — group / r32 / r16 / qf / sf / 3p / final
- `matchday integer`
- `group_code text` — A..L
- `kickoff_local time`
- `slug text unique` — `wc2026-{matchday}-{home_short}-{away_short}`
- `publication_status text default 'draft'`
- `stadium_id uuid` — fk-style link to `stadiums.id` (no hard FK, resolved by importer)
- `import_source text` — `fifa_seed` / `football_data` / `csv` / `copilot`
- `import_batch_id uuid`

New table `wc_match_import_batches`:
- `id`, `source text`, `status text` (pending/applied/rejected), `summary jsonb` (counts), `proposed jsonb` (array of candidate rows), `created_by`, `created_at`, `applied_at`

Admin-only RLS on `wc_match_import_batches`. `matches` keeps existing public read.

## Stadium auto-linking

Resolver (shared TS util `src/lib/wcStadiumResolver.ts`, mirrored in the edge function):
1. Exact slug / stadium_name match on `stadiums where is_world_cup_host = true`.
2. Alias match (`aliases` array, accent-folded via existing `foldText`).
3. City + country match (single host in that city wins).
4. Coordinates within 5km (when seed has lat/lng).

If no host stadium matches → row goes into the batch as `needs_stadium` and is **not** imported. Admin must promote a stadium to WC host first.

No duplicate matches: dedupe by `(date, home_team, away_team)` and by generated `slug`.

## Edge functions

- `wc-import-schedule` (admin-only)
  - Input: `{ source: 'fifa_seed' | 'csv', payload? }`
  - Loads candidate rows, runs resolver, dedupes against `matches`, writes a `wc_match_import_batches` row with `status='pending'` and the proposed inserts. Returns the batch id + counts.
- `wc-import-apply` (admin-only)
  - Input: `{ batch_id, accepted_ids?: string[] }` (default: all matched rows)
  - Inserts the accepted rows into `matches` with `competition='FIFA World Cup 2026'`, `publication_status='draft'`, `lifecycle_status='upcoming'`, `import_source`, `import_batch_id`, `stadium_id` resolved.
- `wc-copilot-propose-match` (admin-only, new)
  - Input: `{ stadium_id }`
  - Looks at host stadium + FIFA seed; if a scheduled fixture exists for that venue with no matching `matches` row, returns a single proposal row to be reviewed and inserted via `wc-import-apply`.

Existing `wc-copilot-enrich` stays untouched.

## Seed data

`src/data/wc2026Schedule.ts` — typed array of the 104 fixtures (date UTC, venue canonical name, city, country, matchday, phase, group). Used both by the edge function (re-exported) and by the admin UI preview before applying.

## Admin UI

New section inside `/admin/stadiums` World Cup view:

- **"Import schedule" toolbar action** opens `WorldCupImportDialog.tsx`:
  - Source picker: FIFA seed (default) / CSV upload
  - Runs `wc-import-schedule`, shows a table grouped by status:
    - `ready` (resolved stadium + new) — checked by default
    - `duplicate` (already in `matches`) — skipped
    - `needs_stadium` (no host match) — disabled, with hint "Promote stadium first"
  - "Apply selected" → `wc-import-apply`, refreshes match list.
- **Per-stadium WC tab**: new "Matches" sub-section listing linked `matches`, with a "Propose missing match" button → `wc-copilot-propose-match` → opens same dialog with that single row preselected.

## Ticket enrichment (after matches exist)

Out of scope for this PR's logic — but the apply step intentionally leaves `ticket_sources=[]` and `ticket_status='not_released'`. A follow-up runs the existing `ticketing-enrich-suggest` pipeline keyed on `(stadium_id, date)`, attaching official / hospitality / trusted resale / affiliate links. Ticket sources never create or modify matches.

## Files

- migration (matches new cols + `wc_match_import_batches`)
- `src/data/wc2026Schedule.ts` (new — seed)
- `src/lib/wcStadiumResolver.ts` (new — shared resolver)
- `supabase/functions/wc-import-schedule/index.ts` (new)
- `supabase/functions/wc-import-apply/index.ts` (new)
- `supabase/functions/wc-copilot-propose-match/index.ts` (new)
- `src/components/admin/WorldCupImportDialog.tsx` (new)
- `src/pages/admin/AdminStadiumsPage.tsx` (toolbar action in WC view)
- `src/components/admin/StadiumDrawer.tsx` (Matches sub-section in WC tab)
- `src/i18n/admin.ts` (+ import dialog labels in 9 locales)

Ship order: migration → seed file + resolver → import + apply edge functions → admin dialog → copilot propose.

---

# Addendum — World Cup 2026 operations hub & editorial quality

Builds on top of the import workflow above. The import pipeline stays as-is; this addendum defines the **admin operations surface** at `/admin/world-cup-2026` and the **public rendering rules**. Nothing here ships before the screenshots in §I are produced.

## A. Admin route & tabs

New route `/admin/world-cup-2026` (admin-gated, added to `AdminShell` nav with `Trophy` icon).

Tabs (URL-hash synced):

```
Overview · Matches · Groups · Coverage · Resolver · Analytics
```

`Groups` is mandatory and replaces ad-hoc team editing on individual fixtures.

## B. Groups tab — single source of truth for team slots

Goal: edit teams **once per slot**, propagate everywhere. Admins must never hand-edit 104 fixtures.

### Data model
New table `wc_group_slots` (single migration):

- `id uuid pk`
- `group_code text` — A..L
- `position smallint` — 1..4
- `team_name text null`
- `team_short text null`
- `team_country_code text null`
- `source text not null default 'projection'` — `fifa | manual | provider | projection`
- `status text not null default 'draft'` — `draft | confirmed`
- `locked boolean not null default false`
- `updated_by uuid`, `updated_at timestamptz default now()`
- unique `(group_code, position)`
- admin-only RLS; `GRANT` block for `authenticated` + `service_role`

Seed 48 rows (12 groups × 4) at migration time. Prelock host slots:

```
Mexico → A1   Canada → B1   USA → D1   (locked=true, source='fifa', status='confirmed')
```

### Slot → fixture propagation
Edge function `wc-groups-apply` (admin-only):

- Input: optional `{ group_code? }` for a partial apply, otherwise all groups
- Reads `wc_group_slots`, finds every `matches` row whose `home_team` or `away_team` equals a slot reference (stored as `Group A1`, `Group A2`, … in seed rows that still reference slots) **or** whose previous team name matches a slot's prior value
- Rewrites `home_team` / `away_team` / `home_short` / `away_short` accordingly
- Updates `home_team_status` / `away_team_status` from slot `status`
- Bumps `matches.updated_at` so caches invalidate
- Returns `{ updated: number, by_group: {...} }`

The seed file (`src/data/wc2026Schedule.ts`) is extended to record each fixture's slot references (`{ homeSlot: 'A1', awaySlot: 'A2' }` for group stage; bracket fixtures keep their existing projected references). Knockout fixtures resolve via `bracket_link` (winner-of/runner-up-of) once those slots themselves point to a concrete team — out of scope for this PR, the apply step simply leaves bracket rows untouched until their feeder slots are confirmed.

### UI columns
`Slot · Team · Source · Status · Locked · Updated`

Row actions: **Edit team**, **Replace team** (with confirmation showing affected match count via dry-run apply), **Lock / Unlock**, **Restore source** (re-fetches FIFA value from seed), **Import official draw** (toolbar — bulk overwrite from a CSV/JSON the admin pastes in), **Preview impact** (calls `wc-groups-apply` in dry-run mode), **Apply changes** (commits + propagates).

Hosts (`A1`, `B1`, `D1`) render with a lock icon and an `Unlock` action gated behind a confirm dialog. Source values: `fifa | manual | provider | projection`.

A single edit must update: linked matches → public match cards → ticket cards → resolver suggestions → search index → SEO metadata. All of these already read from `matches`, so propagation = `wc-groups-apply` + react-query invalidation of `["matches"]`, `["wc-ticket-coverage"]`, and `["search-index"]`.

## C. Matches tab — table + bracket modes

Toggle at top: **Table** / **Bracket**.

### Table mode
Columns: `#` (matchday) · Phase · Group · Home · Away · Date · Stadium · City · Ticket status · Provider · Lowest price · Public.

Filters: missing tickets · published only · phase · host city · stadium.

Row actions: Open provider · Link event (deep-links into Resolver scoped to this fixture) · Detach · Refresh (triggers `wc-ticket-sync` with `refreshIds=[match_id]`) · Publish toggle · Hide.

### Bracket mode
Columns of nodes left → right:

```
Groups (A..L) → R32 → R16 → QF → SF → Final
                                   ↘ 3rd-place
```

Each node shows: coverage status dot · lowest price · ticket count · published state · click → opens the fixture's row in Table mode.

## D. Coverage tab — every provider event + blockers

Columns: Provider · Title · Parsed teams · Parsed date · Parsed stadium · Price · Image · Matched fixture · Confidence · Status · **Publish blockers**.

Blocker chips (any combination):

```
missing_match · missing_price · missing_image · missing_provider ·
missing_date · unresolved · manual_override
```

Click a blocker chip → filters the table to rows sharing that blocker.

Row actions: Approve · Reject · Merge · Manual edit (existing inline editor, sets `manual_overrides`) · Open source.

### Coverage health widget (also rendered in Overview)
```
Total events · Matched · Public · With prices · Missing
```
Each number is clickable → opens Coverage tab pre-filtered.

## E. Resolver tab — strict linking

Suggestion priority (must match in order, never fall through to stadium-only):

```
provider_event_id  →  date  →  stadium  →  teams
```

If combined confidence < `high` for at least two criteria → row stays **unmatched** (no auto-link). Admin must bind manually.

Toolbar actions: **Approve all high confidence** (binds every row where ≥3 priority signals agree) and **Reject all low confidence** (marks status=`rejected` for rows with only stadium or only date matches).

## F. Public World Cup page — display modes

Toggle: **Cards** / **Calendar**.

### Cards
Compact, equal-height, max-width `360px`, 3 columns desktop / 2 tablet / 1 mobile, `16:10` image ratio.

### Calendar
Day-grouped vertical list: `Date · Match · Price · CTA`. Grouped by host date (local), sticky day headers.

Only fixtures with `match_id IS NOT NULL` AND `event_slug IS NOT NULL` AND `is_available != false` are rendered in either mode.

## G. Public card content rules

Title resolution (in order):

```
1. Real confirmed teams        → "Mexico vs South Africa"
2. Group slot references       → "Group A1 vs Group A2"
3. Phase label (knockouts only)→ "Round of 16 · Match 53"
```

**Never** render: `Opening Match`, `Group Stage`, `Match X`, em-dash placeholders, `Invalid Date`, slot tokens like `TBD`/`TBA`/`Winner of …` raw.

Required body:

```
{Home} vs {Away}
{11 June 2026} • {20:00}
{Estadio Azteca}
From €{189}     OR     Tickets available
View tickets →
```

No "Approx.", no "Price coming soon", no "Find seats →".

## H. Image rule

Priority chain:

```
1. provider event image (coverage.image_url)
2. matched stadium hero (stadiums.hero_image_url via stadium_slug join)
3. competition fallback (single curated WC2026 graphic — CSS placeholder OK)
```

Never random / editorial / city pool. The renderer enforces "no same stadium image >2 consecutive cards" by shifting in the next eligible card when the rule would be violated (pure client-side ordering).

## I. Admin QA gate — no ship without these

Required screenshots before merge:

1. `/admin/world-cup-2026` Overview (KPIs + health widget)
2. Groups tab (with at least one edited slot)
3. Matches tab — Table mode
4. Matches tab — Bracket mode
5. Coverage tab (with at least one blocker filter active)
6. Resolver tab (one manual bind demonstrated)
7. Public WC page — Cards mode
8. Public WC page — Calendar mode

Required metrics screenshot (Overview tab):

```
Imported       /104
Ticketed       /104
Published      /104
Price coverage  %
Image coverage  %
Unique stadium  %
```

## File delta vs base plan

**New**
- migration: `wc_group_slots` table + 48-row seed + host locks + GRANTs + admin RLS
- `supabase/functions/wc-groups-apply/index.ts`
- `src/pages/admin/AdminWorldCup2026Page.tsx`
- `src/components/admin/wc2026/{OverviewTab,MatchesTab,GroupsTab,CoverageTab,ResolverTab,AnalyticsTab,BracketView,CoverageHealthWidget}.tsx`
- `src/hooks/useWorldCup2026Admin.ts`
- `src/components/website/wc2026/{CardsMode,CalendarMode}.tsx`

**Edited**
- `src/App.tsx` — new admin route
- `src/pages/admin/AdminShell.tsx` — nav entry
- `src/i18n/admin.ts` — labels for all tabs, group actions, blockers, modes in all 9 locales
- `src/data/wc2026Schedule.ts` — add `homeSlot` / `awaySlot` to group fixtures
- `src/components/website/WorldCupTicketsSection.tsx` — replace internals with Cards/Calendar toggle, apply §G/§H rules
- `src/hooks/useWorldCupTicketCoverage.ts` — tighten publishable filter (`match_id` required)

**Out of scope (still)**
- Changes to `wc-ticket-sync` extraction.
- New affiliate networks.
- Bracket auto-resolution of winner-of/runner-up-of slots (post-draw work).
