## Coverage quality pass: purge generic rows, rebuild from real event pages only

The Matches table is now correct (104 official FIFA fixtures). The remaining problem is `wc_ticket_coverage`: most rows came from generic Ticombo schedule/search pages, so they have placeholder titles like "Match 1 Group A", fall back to SoFi Stadium, share dates, and have no `provider_event_id`. We will purge those rows, harden ingestion to only accept real event pages, and add a quality score visible in admin.

### 1. Database — quality + provenance columns (migration)

Add to `public.wc_ticket_coverage`:
- `quality_score TEXT NOT NULL DEFAULT 'low'` — values `high | medium | low`
- `quality_reasons TEXT[] NOT NULL DEFAULT '{}'` — e.g. `{generic_title, stadium_fallback, no_event_id}`
- `extraction_source TEXT` — `direct_event_page | schedule_page | search_page | manual`
- `stadium_confidence TEXT NOT NULL DEFAULT 'low'` — `verified | alias_match | low`
- `archived_at TIMESTAMPTZ`, `archived_reason TEXT` — soft delete instead of hard delete so we can audit
- Partial index on `(quality_score, archived_at)` for admin filters

A trigger `wc_coverage_compute_quality()` recomputes `quality_score` + `quality_reasons` on insert/update based on: presence of `provider_event_id`, non-generic title, unique `url`, `stadium_confidence`, `event_date` not colliding with >5 siblings at same stadium.

### 2. Edge function `wc-coverage-quality-audit`

Idempotent, admin-only. For every active row:
1. Recompute quality via the same rules as the trigger (single source of truth lives in SQL function, edge fn just calls it via `UPDATE ... RETURNING`).
2. Detect "suspicious clusters": >5 rows sharing `(stadium_slug, event_date::date)` → flag with reason `bulk_cluster`.
3. Detect generic titles via regex `^\s*Match\s+\d+\s+Group\s+[A-L]\s*$` and other placeholder patterns.
4. Return KPIs: `{high, medium, low, archived, suspicious_clusters, generic_titles, missing_event_id, stadium_fallback}`.

### 3. Edge function `wc-coverage-purge-generic`

Admin-only, supports `dry_run`. Archives (sets `archived_at`, `archived_reason`) rows matching ANY of:
- title regex generic ("Match X Group Y", "Group Stage Match", "World Cup Match #N")
- `provider_event_id IS NULL` AND `extraction_source != 'manual'`
- `stadium_confidence = 'low'` AND part of a bulk cluster (>5 sharing stadium+date)
- `event_date` conflicts with the canonical FIFA fixture for the same teams (date mismatch >24h)

Returns counts per reason. Never hard-deletes; archived rows stay queryable for admins.

### 4. Edge function `wc-ticombo-ingest-event` (replaces generic scraping path)

Strict ingestion that ONLY accepts a single direct event page URL (admin paste-or-list). Rejects with explicit error if:
- URL is a schedule/search/landing page (heuristics: path contains `/schedule`, `/search`, `/group-stage`, or page has >1 event listed)
- No unique `provider_event_id` extractable from URL or page metadata
- Title matches the generic placeholder regex
- Stadium name cannot be resolved via `stadiums` or `stadium_aliases`
- Kickoff date is more than 24h away from any FIFA fixture at that stadium

Successful rows are stored with `extraction_source='direct_event_page'`, `stadium_confidence='verified'|'alias_match'`, and immediately linked to a `match_id` via the resolver (kickoff proximity + stadium alias + group code + teams; never stadium-only).

The existing generic `wc-ticket-sync` is kept for safety but the schedule/search code paths are removed — it becomes a thin wrapper that delegates to `wc-ticombo-ingest-event` when called with a single event URL, and throws otherwise.

### 5. Resolver upgrade

In `wc-ticombo-ingest-event` and the existing resolver helper:
- Match candidate FIFA fixtures using: same stadium (via alias resolver), kickoff within ±6h, optional group code, optional team confirmation, optional `fifa_match_number` if present in URL/title.
- Confidence levels: `exact` (stadium + ±15min + teams), `high` (stadium + ±2h + group), `medium` (stadium + same day), `low` (stadium only — REJECTED, not linked).
- Stadium-only fallback is no longer allowed to create a link.

### 6. Admin UI — Coverage tab upgrade

In `src/pages/admin/wc2026/CoverageTab.tsx`:
- New KPI strip at top: High / Medium / Low / Archived / Suspicious clusters.
- New filter chips: `quality:high`, `quality:medium`, `quality:low`, `archived`, `cluster_suspect`, `generic_title`, `no_event_id`, `stadium_fallback`.
- New column "Quality" with colored badge + tooltip listing `quality_reasons`.
- New action buttons in the header:
  - "Run quality audit" → calls `wc-coverage-quality-audit`
  - "Purge generic coverage" → confirm dialog, then calls `wc-coverage-purge-generic` with `dry_run=false`
  - "Ingest single Ticombo event" → opens a small dialog accepting a direct event URL, calls `wc-ticombo-ingest-event`
- Archived rows hidden by default, shown when the `archived` chip is active.

Banner at the top of the tab: "Coverage is now rebuilt from direct event pages only. Generic schedule extractions are blocked."

### 7. Goal state

- 0 rows with generic titles
- 0 rows linked via stadium-only fallback
- 100% of remaining rows have `provider_event_id` and `extraction_source='direct_event_page'`
- High-confidence rows visible first; medium/low surfaced for review.

### Out of scope (this turn)

- Public UI changes (coverage badges on cards): once quality data is stable we'll surface it publicly.
- Auto-crawling Ticombo: admins paste/upload event URLs for now; we'll automate later once the quality model is proven.

### Migration / rollout steps for the admin

1. Apply DB migration (adds quality columns + trigger).
2. Open Coverage tab → click "Run quality audit" to score existing rows.
3. Review the audit numbers, then click "Purge generic coverage" (starts as `dry_run`, then commit).
4. Use "Ingest single Ticombo event" to add back the high-quality rows from real event pages.
5. Re-run audit → expect all remaining rows to be `high` or `medium`.

After you approve the plan, I will (a) submit the migration, then (b) ship the three edge functions and the Coverage tab upgrade in a single follow-up.
