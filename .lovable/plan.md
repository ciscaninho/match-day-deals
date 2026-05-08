## Official Ticketing Layer — Implementation Plan

Build a new "Official Ticketing" layer for top clubs, positioning Foot Ticket Finder as the fan companion for legitimate club access (not just resale comparison).

---

### 1. Data model

New table `club_ticketing_profiles` (Lovable Cloud / Supabase):

- `id` (uuid, pk)
- `slug` (text, unique) — e.g. `arsenal`, `psg`, `real-madrid`
- `club_name`, `short_name`
- `country`, `city`, `league`
- `stadium_name`, `stadium_slug` (optional link to `stadiums`)
- `logo_url`, `hero_image_url`
- `official_website`, `official_ticketing_url`
- `membership_required` (bool), `membership_name`, `membership_required_for_big_games` (bool)
- `public_sale_possible` (bool)
- `resale_exchange_available` (bool), `resale_exchange_name`, `resale_exchange_url`
- `average_difficulty` (enum text: `easy` / `medium` / `hard` / `extreme`)
- `ticket_release_process` (text)
- `important_restrictions` (text)
- `hospitality_available` (bool), `hospitality_url`
- `queue_system` (text)
- `ballot_system` (bool), `ballot_notes` (text)
- `local_fan_restrictions` (text)
- `notes` (text)
- `seo_title`, `seo_description`
- `last_verified_at` (timestamptz)
- timestamps

RLS: public read; admin write (uses existing `has_role(..,'admin')`).

Seeded with the 13 clubs listed (PSG, OM, Real Madrid, Barça, Liverpool, Arsenal, Man Utd, Man City, Bayern, Dortmund, Milan, Inter, Juventus). Uncertain details marked "May vary by match and competition" rather than invented.

---

### 2. Routes & pages

Add to public website (no login required):

- `/clubs` — index page listing all clubs, with cards (logo, league, difficulty badge, membership badge)
- `/clubs/:slug` — full club ticketing page

Wire into `App.tsx` routes and add a "Clubs" link in the website nav + footer.

---

### 3. Club page UI sections

Premium, mobile-first (cards, badges, generous spacing, no walls of text):

1. **Hero** — logo, club name, stadium, league, city/country, two CTAs (Official website / Official ticketing — both `target="_blank"`).
2. **Quick badges row** — Membership required?, Official resale exchange?, Difficulty indicator (color-coded easy→extreme).
3. **How ticket sales work** — concise structured blocks: release process, ballot, queue system, restrictions.
4. **Membership** — name, what it unlocks, link out.
5. **Official resale exchange** — name + link, or "Not available — be cautious of unofficial resale."
6. **Best matches to attend** — curated highlights (derbies / European nights), text-driven from `notes`/admin.
7. **Upcoming matches** — pulls from existing `matches` table filtered by club name (home or away), reusing `MatchCard`.
8. **Stadium atmosphere** — if `stadium_slug` matches a row in `stadiums`, show atmosphere/family/accessibility scores + link to stadium page.
9. **Trust note** — "May vary by match and competition" disclaimer + `last_verified_at` shown as "Last verified …".

---

### 4. SEO

- `useSEO` per club page: title `"{Club} Tickets — Official Access Guide | Foot Ticket Finder"`, meta description from `seo_description`, canonical `/clubs/{slug}`.
- JSON-LD `SportsTeam` + `BreadcrumbList`.
- Single H1 per page.

---

### 5. i18n

All visible labels via `t("clubs.*")` keys for all 9 locales (en, fr, es, de, it, pt, nl, ar, ru). Club-specific narrative (release process, restrictions, notes) stays in DB in English for v1 — labelled clearly; localization of body text deferred.

---

### 6. Files to create / edit

**Create**
- `supabase/migrations/...` — table + RLS + seed (via migration tool, then insert tool for seed rows).
- `src/hooks/useClubTicketing.ts` — list + by-slug queries.
- `src/pages/website/ClubsPage.tsx` — index.
- `src/pages/website/ClubDetailPage.tsx` — detail.
- `src/components/clubs/DifficultyBadge.tsx`
- `src/components/clubs/ClubBadges.tsx`
- `src/components/clubs/ClubUpcomingMatches.tsx`

**Edit**
- `src/App.tsx` — add routes.
- `src/components/website/WebsiteLayout.tsx` — add "Clubs" to nav + footer browse list.
- `src/i18n/LanguageContext.tsx` (and locale files) — add `clubs.*` keys for 9 locales.

---

### 7. Phase 1 scope guardrails

- Only the 13 clubs listed are seeded.
- Schema is generic so future clubs just need new rows (no code changes).
- No invented hard rules — uncertain fields use the "May vary by match and competition" placeholder.
- No affiliate/booking flow yet — CTAs deep-link to official channels only.
