## Football Data Integrity & Operations Pass

Confirmed via DB inspection: the four stadium duplicates you flagged ARE archived correctly (`archived_at` + `archived_into_slug` set), but they still surface in the UI. Root cause is policy/query filtering — the merge pipeline itself works. Inter Milan also exists as two unmerged club rows. So this pass has two halves: (1) plug the leaks for stadiums, (2) bring clubs to the same maturity level, then layer league ops on top.

---

### Part 1 — Stadium merge leak fix (quick, high impact)

**Root cause**: the `Public view active stadiums` RLS policy correctly filters `archived_at IS NULL` for the `public` role, but `public` in Postgres covers anon **and** authenticated. The `Admins can view archived stadiums` policy adds an OR for authenticated users, so every signed-in user (not just admins) sees archived rows. Plus most app queries don't add a defensive `.is('archived_at', null)`.

Fix in three layers:
1. Tighten RLS: scope the archived-view policy to admins only via `has_role(auth.uid(),'admin')` (it already does in `USING`, but combined with the public policy any authenticated user gets the union — the fix is to make the public policy `TO anon, authenticated` explicitly and ensure the admin policy doesn't widen it for non-admins; cleanest is one unified `SELECT` policy `archived_at IS NULL OR has_role(auth.uid(),'admin')`).
2. Add `.is('archived_at', null)` defensively in every public-facing query (`useStadium`, `useStadiumSocialProof`, `StadiumsPage`, `OnboardingPage`, map layers, search index, club-related stadium lookups).
3. Admin lists: keep showing archived rows but visually mark them with an "Archived → canonical" pill, and exclude them from duplicate-detection candidate pools.

Also: when a stadium is merged, the `clubs[]` array on archived row is cleared by the SQL function — verify match/club relations actually point to the canonical slug going forward by re-running a cleanup pass against the four known examples.

---

### Part 2 — Club duplicate & merge system (mirror of stadium system)

Currently `club_ticketing_profiles` has no archive columns, no merge function, no duplicate detection beyond the `import-clubs-from-matches` scanner.

**Schema migration**:
- Add `archived_at`, `archived_reason`, `archived_into_club_id`, `archived_into_slug`, `aliases text[]` to `club_ticketing_profiles`.
- Create SECURITY DEFINER function `merge_club_records(p_canonical_slug, p_duplicate_slug, p_reason)` that:
  - merges `aliases`, picks best non-null fields when canonical is missing data,
  - reassigns `matches.home_team / away_team` references where they match the duplicate's name/short_name to the canonical name,
  - reassigns any `profiles.favorite_club_slug` / saved references,
  - archives the duplicate.
- Tighten RLS the same way as stadiums (single SELECT policy with archived filter).

**Admin UI** (`AdminClubsPage`):
- Duplicate review queue: detect via normalized name + same country + same stadium_slug + logo URL match. Surface as a "Possible duplicates" tab with side-by-side compare and a Merge button.
- Per-club drawer (new `ClubDrawer` mirroring `StadiumDrawer`) showing: stadium, country, league, linked matches count, aliases, conflict warnings, missing-data warnings, plus inline edit + Merge / Archive actions.
- Auto-suggest Inter Milan ↔ FC Internazionale Milano on first load to validate.

**Audit trail**: log every merge into `admin_actions` with `kind='club_merge'` and `undo_payload` containing the archived row snapshot for rollback.

---

### Part 3 — League operations center

Extend `AdminLeaguesPage` with:
- League detail drawer listing every club in the league (from `club_ticketing_profiles.league`) plus matches count.
- "Clubs without a league" bucket.
- "Move clubs between leagues" — multi-select clubs → choose target league → bulk update with audit log entry. Common cases preset: Serie A↔B, Championship↔Premier League promotion/relegation.
- Inconsistency detector: clubs whose `league` field disagrees with the league of their recent matches; clubs sharing a stadium but in different leagues; clubs with country/league mismatch (e.g. Premier League club with country=Spain).

---

### Part 4 — Relationship visibility

**Inside `AdminClubsPage` cards & drawer**:
- Stadium chip (linked), country, league, # of upcoming matches, duplicate-warning badge if name normalization collides with another active row, missing-data badges (no logo / no ticketing URL / no stadium).

**Inside `AdminStadiumsPage` / `StadiumDrawer`**:
- "Clubs playing here" list (from `clubs[]` + back-reference from `club_ticketing_profiles.stadium_slug`), historical aliases, archive/conflict status, leagues represented.

---

### Part 5 — Verification

- Re-query the four flagged stadiums and Inter Milan after the fixes; confirm only the canonical row is publicly visible.
- Add a small `/admin/health` data-integrity panel: counts of archived-but-leaking rows (should be 0), orphaned matches, clubs without leagues, duplicate suspects.

---

### Technical files touched

- DB migrations: stadiums RLS rewrite; club archive columns; `merge_club_records` function; club RLS rewrite.
- New: `src/components/admin/ClubDrawer.tsx`, `src/pages/admin/AdminClubDuplicatesPage.tsx`, `src/pages/admin/AdminHealthPage.tsx`.
- Edited: `AdminClubsPage.tsx`, `AdminLeaguesPage.tsx`, `AdminStadiumsPage.tsx`, `StadiumDrawer.tsx`, `useStadium.ts`, `useStadiumSocialProof.ts`, `StadiumsPage.tsx`, `OnboardingPage.tsx`, `AdminWorldMapPage.tsx`, `useClubTicketing.ts`.

---

### Suggested execution order

1. **Part 1** (stadium leak) — ship today, immediate visible win on the four duplicates.
2. **Part 2** (club merge system) — biggest scope, ~1 batch.
3. **Part 4** (relationship visibility) — piggybacks on Part 2's drawer work.
4. **Part 3** (league ops) — cleanest once club data is canonical.
5. **Part 5** (health panel) — wraps it up.

Want me to start with Part 1 alone (fast fix + you can verify immediately), or proceed straight through Parts 1+2 in this batch?
