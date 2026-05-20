## Phase B — Destinations Foot

Visual direction locked: **Stadium Emerald** palette, **DM Serif Display + Fira Sans**, **Cinematic hero + Bento** layout. Builds on existing media, matches, ticketing, journeys.

This phase is too large for a single ship. Splitting into 3 sequential PRs. Each is independently shippable.

---

### PR 1 — Rename + Cinematic shell (foundation)

**Route + naming**
- Add `/destinations` route → `DestinationsPage` (new). Keep `/stadiums` as alias redirect for backlinks.
- Add `/destinations/:slug` → `DestinationDetailPage` (wraps existing `StadiumDetailPage` logic but with new editorial composition).
- Rename nav label "Stadiums" → "Destinations" in all 9 locales (`website.nav.stadiums` reused, new copy).
- New i18n namespace `src/i18n/destinations.ts` with all section copy.

**Cinematic hero (index page)**
- Full-bleed rotating carousel of 5–7 approved `stadium_media` heroes (status='approved', is_hero=true) joined to `stadiums` (published only).
- Crossfade every 6s, pause on hover, respects `prefers-reduced-motion`.
- Overlay: serif headline ("Choose your next football destination"), city · country · stadium chip, CTA `Explore destinations`.
- Uses DM Serif Display for headline, Fira Sans for meta. Emerald accent on CTA.

**Bento grid below hero**
- 4–6 featured destinations as mixed-size tiles (1 large + several small). Pulls from `useStadiumSocialProof().popular` (already filters to stadiums with upcoming matches).

---

### PR 2 — Editorial sections on destination detail

Compose on `DestinationDetailPage`, ordered:

1. **Immersive hero** (existing `StadiumHero` restyled with serif).
2. **"Where should I sit?"** — new component `SeatingExperienceChooser.tsx`. 4 cards: The End / Side Stand / Family / Hospitality. Each card pulls real data when available (`ultras_section`, `best_sections`, `family_section`, `vip_available`) and falls back to editorial copy. Links to ticket section.
3. **Local Football Secrets** — new component `LocalSecrets.tsx`. Renders only fields with content: supporter HQ, anthem, fanshop, food, drinks, arrival tips, pre-match timing, photo spot, walking routes. Requires new optional columns on `stadiums`:
   - `supporter_hq text`, `club_anthem text`, `fanshop_info text`, `food_nearby text`, `drinks_nearby text`, `arrival_tips text`, `pre_match_timing text`, `photo_spot text`, `walking_routes text`.
4. **Matchday & Travel** — keep existing `MatchdayJourney` + `TravelEssentials`, wrap in renamed section header.
5. **Community Experience Scores** — new `ExperienceScoreCard.tsx` + new table `destination_experience_scores` (atmosphere/architecture/accessibility/rarity/overall + optional memory text). Lightweight, not "reviews". Aggregated averages shown publicly; submission requires auth.
6. **Discovery footer** — See matches / See ticket prices / Plan trip / Save wishlist (existing favorite hook) / Open ticket options. No dead ends.

---

### PR 3 — World Cup 2026 staging + block

**Schema**
- New table `wc2026_destinations_staging` mirroring host city/stadium fields + `status` (pending/approved/rejected), `matched_stadium_id`, `merge_action` (create/merge/skip).
- Admin-only RLS.

**Admin workflow** (`/admin/destinations/wc2026`)
- List staged rows with match candidates (fuzzy match against `stadiums.stadium_name + city`).
- Per row: Approve → upsert into `stadiums` (merge if matched, create if not) + tag with `wc2026 = true` flag on stadiums (new boolean column).
- Reject / Skip.
- No auto-publish.

**Public block on `/destinations`**
- `WorldCupHostsBlock.tsx` — only renders when verified WC2026 destinations exist.
- Each card: city, country, host stadium hero, upcoming matches count, starting price, ticket provider badge, affiliate CTA.
- Reuses `useMatches` + `useTicketOffers` + `useClubTicketing` — no parallel logic.
- Drops "Coming soon" once `starting_price` exists.

---

### Technical details

- All copy via `useLanguage().t()` with translations for en/fr/es/de/it/pt/nl/ar/ru.
- DM Serif Display + Fira Sans loaded via Google Fonts in `index.html`. New CSS classes `font-display` / `font-body` in `tailwind.config.ts`, applied scoped to `/destinations` routes only (does not affect rest of app).
- New semantic tokens added in `index.css` if needed (palette is already current brand, so likely zero changes).
- Existing TBD/lifecycle filters in `useMatches` continue to apply.
- Mobile: bento collapses to single column, hero carousel preserves 16:9, sections stack with generous vertical rhythm.
- Affiliate tracking (Phase A.2) already integrated — reused as-is on ticket CTAs.

### Files touched (estimate)

PR 1: ~6 new files (page, hero, carousel, bento, i18n, route) + nav rename.
PR 2: ~5 new files + 1 migration (stadium columns + experience_scores table) + detail page rewrite.
PR 3: ~4 new files + 1 migration (wc2026_staging + stadiums.wc2026) + admin page.

### Out of scope (deferred)

- Trip-planner multi-stadium itinerary builder.
- Stadium passport gamification expansion.
- Map view of destinations (existing world map page is admin-only).
- SEO schema/sitemap updates (Phase A.SEO).

---

Approve and I'll ship PR 1 immediately, then continue with PR 2 and PR 3 in sequence.