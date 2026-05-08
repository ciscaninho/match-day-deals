# Fan-Experience Polish Pass

Transform Foot Ticket Finder from a "ticket alert app" into a premium football fan companion. Six workstreams, all reusing existing DB tables and i18n keys (9 locales).

---

## 1. Deep linking ecosystem

Wire the three core entities together so every page surfaces its neighbours.

### Match pages (`MatchDetailPage` + `WebsiteMatchDetailPage`)
Add a new "Plan your matchday" section under the existing ticket info card with:
- **Club guide cards** (home + away) → links to `/clubs/:slug` if a `club_ticketing_profiles` row exists for either team (matched by `club_name` / `short_name`).
- **Stadium card** → links to `/stadiums/:slug` if a `stadiums` row matches `match.stadium`. Show stadium image, atmosphere score, capacity.
- **Official ticketing CTA** → primary button using the home club's `official_ticketing_url` (falls back to existing "Where to buy" providers).
- **Atmosphere rating chip** → from the linked stadium's `atmosphere_score`.
- **Stadium passport CTA** → reuse existing `StadiumPassportButton` to log the visit.

New helper: `src/hooks/useMatchContext.ts` — given a match, returns `{ homeClub, awayClub, stadium }` by slug-matching the three tables in a single React Query call. New component: `src/components/match/MatchContextLinks.tsx`.

### Club pages (`ClubDetailPage`)
Already has upcoming matches via `ClubUpcomingMatches`. Add:
- **Linked stadium card** at top of the page (uses `stadium_slug` if present, else slug-match by `stadium_name`).
- A clearer "Ticket difficulty / Official process / Membership / Resale" 4-block grid (existing data is there but presentation is text-heavy — restructure into scannable cards with icons).

### Stadium pages (`StadiumDetailPage`)
Add:
- **Upcoming matches at this stadium** (filter `useMatches` by `stadium` name, next 5).
- **Related clubs** (any `club_ticketing_profiles` whose `stadium_slug` or `stadium_name` matches → link cards).
- **Best fan reviews** (top 3 from `stadium_reviews` ordered by overall rating, surfaced above the full reviews list).
- Atmosphere score, best sections, and fan tips already exist — make sure they're prominent above the fold.

New components: `src/components/stadium/StadiumUpcomingMatches.tsx`, `src/components/stadium/StadiumRelatedClubs.tsx`, `src/components/stadium/TopFanReviews.tsx`.

---

## 2. Premium repositioning

Rewrite all premium marketing copy in `LanguageContext`/`translations.ts` around fan-experience benefits, not "price alerts":

- **Hero**: "Never miss the matches that matter" — dream matches, derbies, finals.
- **Bullets**: official sales access · trusted ticket pathways · stadium atmosphere insights · football passport (visit collection) · priority alerts for big-match drops · ad-free fan companion.
- Updates apply to: `PremiumPage`, `PremiumUpsellPage`, `pricing` page hero/features, home `home.premium_cta` / `home.premium_desc`, premium CTA buttons in nav.

All copy added for 9 locales (en, fr, es, de, it, pt, nl, ar, ru). Keep keys small (`premium.hero.title`, `premium.benefits.officialAccess`, etc.).

---

## 3. Homepage storytelling

Restructure `HomePage` (mobile app) and `WebsiteHomePage` to feel emotional, football-centric:
- New hero subline + supporting visuals: iconic stadium atmosphere, dream matches, bucket-list trips.
- Add "Iconic stadiums" carousel (top 6 stadiums by `atmosphere_score`) → each card links to stadium page.
- Add "Dream matches this season" rail (existing featured matches but reframed copy: "Derby Day", "Champions League nights", etc., driven by competition tags).
- Add "Football journeys" mini-section → links to `/clubs` and `/stadiums` index pages with evocative copy.
- Reduce density of utility CTAs ("Open Match Calendar" button, etc.) — move secondary actions further down.

All new strings in i18n.

---

## 4. Mobile UX polish

Targeted, presentation-only:
- Standardise card padding (`p-4`), spacing (`space-y-4` between sections, `gap-3` inside).
- Stronger stadium visuals: use `hero_image_url` / `background_image_url` with gradient overlays on stadium hero and home rail.
- Consistent CTA hierarchy: one primary button per card, secondary as ghost/outline.
- Tighten typography scale; reduce repeated badge/icon noise on match cards.
- Audit `MatchCard`, `StadiumHero`, `ClubsPage` cards, `ClubDetailPage` blocks.

No layout rewrites — just polish passes.

---

## 5. Stadium social proof

New homepage + `/stadiums` index sections (data already in DB):
- **Top fan comments**: latest 3 high-rated `stadium_reviews` with comment text + stadium name.
- **Best-rated stadiums**: top 5 by overall computed score.
- **Most atmospheric**: top 5 by `atmosphere_score`.
- **Recently visited by the community**: latest 5 `stadium_visits` (anonymised — show stadium + city + date).

New hook: `src/hooks/useStadiumSocialProof.ts` (single React Query batching the 4 queries). New component: `src/components/stadium/StadiumSocialProof.tsx` rendered on `WebsiteHomePage` and `StadiumsPage`.

---

## 6. Architecture & i18n guardrails

- No fake data — every section reads from existing tables (`matches`, `stadiums`, `club_ticketing_profiles`, `stadium_reviews`, `stadium_visits`, `stadium_tips`).
- All visible strings via `t("…")`, added to all 9 locales in `src/i18n/translations.ts`.
- Keep components small; co-locate per domain (`components/match`, `components/club`, `components/stadium`).
- No new tables. No DB migration.
- Mobile-first: test long translations don't break layouts (truncate, `shrink-0`, gap).

---

## Files to create
- `src/hooks/useMatchContext.ts`
- `src/hooks/useStadiumSocialProof.ts`
- `src/components/match/MatchContextLinks.tsx`
- `src/components/stadium/StadiumUpcomingMatches.tsx`
- `src/components/stadium/StadiumRelatedClubs.tsx`
- `src/components/stadium/TopFanReviews.tsx`
- `src/components/stadium/StadiumSocialProof.tsx`
- `src/components/home/IconicStadiumsRail.tsx`
- `src/components/home/DreamMatchesRail.tsx`

## Files to edit
- `src/pages/MatchDetailPage.tsx`, `src/pages/website/WebsiteMatchDetailPage.tsx`
- `src/pages/website/ClubDetailPage.tsx`, `src/pages/website/StadiumDetailPage.tsx`, `src/pages/website/StadiumsPage.tsx`
- `src/pages/HomePage.tsx`, `src/pages/website/WebsiteHomePage.tsx`
- `src/pages/PremiumPage.tsx`, `src/pages/PremiumUpsellPage.tsx`, `src/pages/marketing/PricingPage.tsx`
- `src/i18n/translations.ts` (9 locales)
- `src/components/MatchCard.tsx`, `src/components/StadiumHero.tsx` (polish only)

## Out of scope (this pass)
- New DB tables or migrations
- Affiliate / booking flow
- Per-club editorial copy beyond what's already seeded
- New auth or premium billing logic
