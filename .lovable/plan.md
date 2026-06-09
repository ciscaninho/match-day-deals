
# Admin Affiliate Links — Dual-Key Resolver (admin-only)

Single file changed: `src/pages/admin/AdminMarketingAffiliatePage.tsx`.
Zero changes to public WC pages, `useWorldCupTicketCoverage`, `WorldCupTicketsSection`, `transformAffiliateUrl`, or any affiliate redirect.
Zero DB writes, no new crawl, no remapping.

## What changes

1. Keep current `coverageByMatch` (primary key = `match_id`) untouched.
2. Add `resolvedCoverageByFixture`: for each official fixture, append any coverage row not already matched where
   - `sameDay(cov.event_date, fixture.date)` AND
   - `teamMentioned(home_label + away_label + event_name, fixture.home_team)` AND
   - `teamMentioned(..., fixture.away_team)`.
3. Feed `resolvedCoverageByFixture` (instead of `coverageByMatch`) into the existing row builder. The existing `validateCoverage()` is unchanged and still runs on every resolved row — stadium / date / generic-title / URL checks stay strict.
4. Recompute `orphanCoverage` as "rows not resolved to any fixture via either key" (was: rows with null/unknown `match_id`).
5. Coverage drawer, Copy gating, Campaign gating, and the metrics row all read from the new resolver. No UI rewrites, just the data source swap.

## Behavior preserved

- Validator unchanged. Stadium mismatch still hard-fails → status = `reconcile`, Copy and Campaign remain disabled.
- Wrong-URL risk stays 0: teams + date are still required before any row can become a candidate.
- Public WC2026 page continues to read `wc_ticket_coverage` exactly as today.

## Expected post-deploy metrics (admin page only)

Based on current DB snapshot of 72 confirmed fixtures and 65 active coverage rows:

| Metric | Before | After |
|---|---|---|
| Active | 6 | ~8 (only the 4 dual-key rows whose stadium also matches: Brazil×Morocco, France×Iraq, England×Ghana, Canada×Switzerland) |
| Needs Reconciliation | 12 | ~18 (gains 6 dual-key rows with stadium conflict: NED×JPN, BEL×IRN, ECU×GER, CUR×CIV, CRO×GHA, CPV×KSA) |
| Missing | 54 | 46 |
| Coverage % | 8% | ~11% |
| Fixtures recovered by resolver | — | **+10** (4 surface as Active, 6 surface as Reconcile) |
| Orphan coverage rows | 39 | 29 |

Exact numbers will be reported from the live page after deploy.

Awaiting switch to build mode to apply.
