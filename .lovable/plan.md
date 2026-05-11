## Foot Ticket Finder — Polish Phase Plan

This phase splits cleanly into 3 independent workstreams. Given the size (admin tooling, onboarding flow, public homepage UX), I want to confirm scope and sequencing before writing code so we don't break SEO, slugs, or stadium relations.

---

### 1. Admin Stadium Control Center (`/app/admin/stadium-directory`)

**New page** with three view modes (grid / table / map) over the `stadiums` + `stadiums_master_staging` tables.

- **Filters**: missing image, missing coords, duplicate risk, multi-club, low confidence, verified-only, production-only, staging-only.
- **Grouping**: country / league / club (collapsible accordions).
- **Search**: stadium / city / club / alias (client-side over fetched set).
- **Status badges** computed from row data: `VERIFIED LIVE`, `SAFE TO APPROVE`, `REVIEW RECOMMENDED`, `MULTI-CLUB`, `DUPLICATE RISK`, `MISSING METADATA`.
- **Edit drawer**: hero preview, production vs staging side-by-side, inline fields, quick-save, plain-English conflict reasons, slug auto-suggest, reverse-geocode city/country from lat/lng (Lovable AI).
- **Admin AI Assistant**: floating panel (admin routes only). Edge function `admin-stadium-assistant` calls Lovable AI Gateway with the current staging/production row as context. Read-only — proposes actions, never writes.

Routes added to `App.tsx` under `RequireAdmin`.

---

### 2. Premium Onboarding Flow (5 steps)

Rewrite `src/pages/OnboardingPage.tsx`. Stores into existing `user_preferences` + 2 new columns.

```text
Step 1  Your Football Heart       teams + leagues (max 5)
Step 2  Matchday Style            Ultra / Premium / Family / Explorer
Step 3  Dream Stadium             cinematic carousel of curated stadiums
Step 4  Football Passport         0–5 / 5–20 / 20–50 / 50+
Step 5  Alerts (optional)         tickets / price drops / nearby / dream
```

**Final redirect**: `/` (website homepage), not `/app/home`.

Schema additions (migration):
- `user_preferences.matchday_style text`
- `user_preferences.dream_stadium_slug text`
- `user_preferences.stadiums_visited_bucket text`
- `user_preferences.alert_preferences jsonb default '{}'`

i18n: all new strings via `t()` for all 9 locales.

---

### 3. Homepage — "Your Next Football Experience"

Replace the "Top rated stadiums" / "Fans de foot, vraies expériences" block on `WebsiteHomePage` with an emotional, cinematic rail.

- New component `src/components/home/NextExperienceRail.tsx`.
- Each card: curated hero (via `BrandedStadiumImage`), city, vibe chip (🔥 Intense / 👨‍👩‍👧‍👦 Family / 🏟 Historic / 🎶 Loud / 💎 Premium / 🌍 Hidden gem), upcoming-match count, difficulty badge, ticket-availability hint.
- Vibes derived from existing `stadiums.atmosphere_score`, `family_friendly_score`, `popularity_score`, `capacity`, `opened_year` — no schema changes.
- Click → existing `/stadiums/:slug` route (already shows upcoming matches + tickets).
- Personalization: when logged in and onboarded, sort by user's favorite leagues/clubs + dream stadium first.

**Safety**: no changes to slugs, stadium relations, sitemap, or SEO meta. Staging data stays admin-only.

---

### Technical Notes (collapsible details)

- New edge function: `admin-stadium-assistant` (Lovable AI Gateway, model `google/gemini-3-flash-preview`, admin-gated via JWT + `has_role` check, read-only access to `stadiums` + `stadiums_master_staging`).
- Reverse geocode for edit drawer: Lovable AI prompt with lat/lng → JSON `{city,country}` (no external geocode key needed since one isn't configured for this use).
- Map view: lightweight — use Leaflet via existing pattern if present; otherwise a simple SVG world map with pins. **Question for you below.**
- All new admin UI guarded by `RequireAdmin`.

---

### Suggested order of delivery

Because this is large, I propose shipping in 3 PR-sized batches in this order:

1. **Onboarding rewrite + redirect to `/`** (smallest, user-visible win, unblocks personalization)
2. **Homepage "Next Experience" rail** (depends on onboarding for personalization signal)
3. **Admin Control Center + AI Assistant** (largest, isolated to `/app/admin/*`)

---

### Open questions

1. **Map view library** — OK to add `leaflet` + `react-leaflet` for the admin map view? (~40KB gz, admin-only chunk)
2. **Dream Stadium carousel source** — use the curated 4 you uploaded (San Siro, Signal Iduna Park, Allianz Arena, Camp Nou) + top 6 from `stadiums` by `popularity_score`?
3. **Batch order** — ship in the 1→2→3 order above, or do you want admin first?

Reply with answers (or "go ahead, you decide") and I'll start implementing.
