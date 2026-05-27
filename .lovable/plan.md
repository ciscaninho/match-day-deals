## Pivot: Official FIFA 2026 fixtures as source of truth

### Goal
Stop generating WC fixtures from group templates. Import the 104 official FIFA World Cup 2026 fixtures as canonical, immutable rows. Groups only enrich team labels. Providers only attach coverage.

### 1. Data layer (migration)

Add to `public.matches`:
- `fixture_origin TEXT NOT NULL DEFAULT 'generated'` — values: `official_import` | `generated`
- `fifa_match_number INTEGER` — official 1..104 ordering
- `kickoff_locked BOOLEAN NOT NULL DEFAULT false`
- `stadium_locked BOOLEAN NOT NULL DEFAULT false`

Add immutability trigger `wc_lock_official_fixture_fields()`:
- On `UPDATE` of a row where `competition='FIFA World Cup 2026'` AND `fixture_origin='official_import'`:
  - Block changes to: `date`, `stadium`, `stadium_id`, `city`, `country`, `phase`, `group_code`, `matchday`, `fifa_match_number`
  - Allow changes to: `home_team`, `away_team`, `home_short`, `away_short`, `home_logo`, `away_logo`, `home_team_status`, `away_team_status`, `publication_status`, ticket fields
- Raises exception if locked fields touched.

Backfill: mark any existing rows imported via `wc-import-apply` as `official_import`; everything else stays `generated` (visible in admin so we can clean them up).

### 2. Canonical schedule dataset

Create `supabase/functions/_shared/wc2026Official.ts` — exports the full 104-fixture array:
```ts
{ fifa_match_number, phase, group_code|null, matchday|null,
  kickoff_utc, stadium_slug, stadium_name, city, country,
  home_slot, away_slot }  // slot = "A1" | "Winner Match 73" | actual team
```
Initial dataset uses FIFA's published schedule (June 11 – July 19, 2026, 16 host cities, 48 teams). Group stage = 72 fixtures, knockouts = 32.

### 3. Edge functions

**New: `wc-import-official`** (admin-only)
- Iterates the canonical dataset
- Upserts by `fifa_match_number` (stable id like `wc2026-m001`..`wc2026-m104`)
- Sets `fixture_origin='official_import'`, `kickoff_locked=true`, `stadium_locked=true`
- Resolves `stadium_id` from `stadiums` table by slug
- Returns `{inserted, updated, skipped, total}`

**New: `wc-purge-generated`** (admin-only)
- Deletes WC matches where `fixture_origin='generated'` and `id NOT LIKE 'wc2026-m%'`
- Returns count for confirmation; supports `dry_run`

**Modify: `wc-groups-apply`**
- Update only `home_team/away_team/home_short/away_short/*_status` on matching fixtures
- Explicitly never touch date/stadium/city/phase/matchday
- Add comment: "Groups enrich labels only — fixture identity is locked."

**Modify: `wc-ticket-sync`**
- Already had an immutability guard; extend it: refuse to insert any new WC fixture. Only allow updates to `ticket_*` fields on existing fixtures matched by `fifa_match_number` or `id`.

**Deprecate: `wc-groups-resync`**
- Keep the validator part (count unresolved placeholders) but remove any code that creates/deletes fixtures.

### 4. Admin UI

**Overview tab**: add KPI card
- "Official: X / 104 · Generated: Y · Unresolved placeholders: Z"
- Two buttons: "Import official schedule" (calls `wc-import-official`), "Purge generated fixtures" (calls `wc-purge-generated` with confirm dialog).

**Matches tab**: add badge column
- `Official` (green) when `fixture_origin='official_import'`
- `Generated` (amber, "will be removed") otherwise

**Groups tab**: add banner
- "Groups enrich team labels only. Stadium, date and city come from the official fixture import and are locked."

### 5. Migration steps for the user
1. Apply DB migration (adds columns + trigger)
2. Run "Import official schedule" → seeds 104 canonical rows
3. Review Matches: every fixture badged `Official`
4. Run "Purge generated fixtures" → cleans synthetic rows
5. Re-run Groups apply for A & B → only team labels propagate

### Out of scope (this turn)
- Public UI polish
- Coverage redesign
- Knockout team-resolver (Winner Match 73 etc.) — fixtures will display slot labels until a future "Bracket" tab

### Required after approval
After you approve the plan, I will (a) submit the migration, then (b) implement the edge functions, the canonical dataset, and the admin UI changes in a single follow-up.