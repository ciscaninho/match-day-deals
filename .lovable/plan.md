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
