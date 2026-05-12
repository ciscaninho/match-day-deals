## Goal

Two major product shifts before continuing batches:

1. Kill the `/app/*` "hidden app" feel — unify everything under the public website domain (`/profile`, `/favorites`, `/alerts`, `/passport`, `/settings`) using the same cinematic design system already used on `/`, `/stadiums`, `/clubs`.
2. Rebuild the admin into a real **Football Operations Center** with full entity visibility, inline/visual editing, relationship views, an admin AI copilot, and FR/EN localization.

---

## Part 1 — Remove the `/app/*` split, unify under the public website

### Routing changes (`src/App.tsx`)
- Add new public routes that reuse `WebsiteLayout` (the same shell as `/stadiums`, `/clubs`, etc.):
  - `/profile` → new `ProfilePage` (rebuilt on website shell)
  - `/favorites` → new `FavoritesPage`
  - `/alerts` → new `AlertsPage` (move from `/app/alerts`)
  - `/passport` → new `PassportPage` (Stadium Passport)
  - `/settings` → new `SettingsPage` (language, notifications, account)
- Keep `/app/*` routes alive as **301-style redirects** (via `<Navigate replace>`) so existing links, emails, deep links, and SEO don't 404:
  - `/app/home` → `/`
  - `/app/profile` → `/profile`
  - `/app/favorites` → `/favorites`
  - `/app/alerts` → `/alerts`
  - `/app/notifications` → `/alerts`
  - `/app/calendar` → `/matches`
  - `/app/matches` → `/matches`, `/app/matches/:id` → `/matches/:id`
  - `/app/match/:id` → `/matches/:id`
  - `/app/premium` → `/pricing`
  - `/app/upsell` → `/pricing`
  - `/app/admin` → `/admin`
  - `/app/daily-game`, `/app/rewards`, `/app/polls` → `/` (deprioritized, not part of website IA yet)

### Header / account dropdown (`HeaderAuthButton.tsx`)
- Point every menu item at the new public URLs:
  - Dashboard → removed (no more `/app/home`)
  - Profile → `/profile`
  - Favorites → `/favorites`
  - Passport → `/passport`
  - Alerts → `/alerts`
  - Settings → `/settings`
  - Admin → `/admin` (if `isAdmin`)
  - Sign out → `/`

### Pages
- Build minimal but on-brand pages wrapped in `WebsiteLayout`:
  - `src/pages/website/ProfilePage.tsx`
  - `src/pages/website/FavoritesPage.tsx`
  - `src/pages/website/AlertsPage.tsx`
  - `src/pages/website/PassportPage.tsx`
  - `src/pages/website/SettingsPage.tsx`
- They reuse existing data hooks (`useUserPreferences`, saved matches query, stadium visits) and the same hero/gradient pattern as `WebsiteHomePage` / `StadiumsPage`.
- All copy uses `t()` with FR + EN (and the other locales we already maintain).

### Bottom nav / `OnboardingBanner`
- Remove `BottomNav` from these new pages — it belongs to the app shell and is the main visual indicator of the "hidden app" feeling.
- Update `OnboardingBanner` CTA target to `/onboarding` (unchanged) but final redirect of onboarding stays `/`.

### Safety
- Stadium slugs, public SEO routes, `sitemap.xml`, JSON-LD, canonical tags are untouched.
- Stadium relations and production data untouched.
- No DB migration.

---

## Part 2 — Football Operations Center (Admin 2.0)

New admin shell at `/admin` replacing the current `AdminPage.tsx`, with sub-routes.

### Routes
```
/admin                       → Overview (KPIs + AI copilot)
/admin/clubs                 → Clubs browser
/admin/clubs/:slug           → Club editor (with stadium + ticketing relations)
/admin/stadiums              → Stadiums browser (table + map toggle)
/admin/stadiums/:slug        → Stadium editor (images, coords, aliases, SEO)
/admin/matches               → Matches browser (upcoming/past, filters)
/admin/matches/:id           → Match editor
/admin/leagues               → Leagues + their clubs
/admin/ticketing             → Club ticketing profiles browser
/admin/media                 → existing stadium media sync (kept)
/admin/map-review            → existing map review (kept)
/admin/suggestions           → existing stadium suggestions
/admin/assistant             → full-page AI copilot
```

All wrapped in a new `AdminShell` that provides:
- Left sidebar with sections + counts
- Top bar: global entity search, language switch (FR/EN), AI copilot drawer toggle
- All gated by `RequireAdmin`

### A) Full data visibility
- Each browser page = filterable table + card grid toggle, paginated, with quick-edit:
  - Clubs: name, slug, league, country, stadium relation, has ticketing profile?, hero image preview
  - Stadiums: name, slug, city, country, league, capacity, lat/lng, hero/thumb thumbnails, # related clubs, # upcoming matches
  - Matches: date, home/away (logos), stadium, ticket status, sources count
  - Leagues: derived from clubs/stadiums, shows club count, match count
  - Ticketing profiles: club, official URL, resale, membership flag

### B) Better editing
- **Inline edit drawers** (shadcn `Sheet`) — open on row click, no full page reload.
- **Side-by-side compare** for stadiums vs. master_staging (already partially exists; promote to first-class).
- **Image previews** for hero/thumbnail/background — drag-drop into `stadium-media` bucket using existing storage.
- **SEO panel** per stadium/club: title, description, og preview.
- **Aliases / slugs** editable as chip input.
- **Translations**: per-entity `name_fr`, `description_fr` fields surfaced (UI-only; if columns don't exist we render a "Coming soon" badge and don't crash).
- **Quick moderation** buttons (Approve / Reject / Merge) reused from existing staging cards.

### C) Relations visibility
- Each entity page shows linked entities as clickable chips:
  - Club editor → stadium card + upcoming matches list + ticketing profile card
  - Stadium editor → related clubs (`stadiums.clubs[]` + matches by stadium name) + upcoming matches
  - Match editor → stadium + both clubs
- A new `/admin/map` view (Leaflet, already approved in Batch 3) — pins for all stadiums, colored by data-completeness, click → drawer.

### D) Admin AI copilot
- Floating drawer + full page at `/admin/assistant`.
- Powered by a new edge function `admin-assistant` (Lovable AI Gateway, `google/gemini-2.5-flash`).
- Tools/functions it can call server-side:
  - `find_duplicate_stadiums({ query })` — fuzzy match in `stadiums` + `stadiums_master_staging`
  - `inspect_entity({ type, slug })` — returns conflicts, missing fields, risk flags
  - `search_entities({ query, type })`
  - `explain_conflicts({ slug })` — diffs between staging and prod
- Returns markdown rendered with `react-markdown`.
- Admin-only: edge function validates `has_role(user, 'admin')` server-side using JWT.

### E) Localization (FR + EN, plus other 7 locales)
- New `src/i18n/admin.ts` exporting an admin-only namespace, merged in `translations.ts`.
- Every admin label uses `t("admin.*")`.
- FR is the primary target; the other 7 locales fall back to EN (existing pattern).
- Language switch in the admin top bar mirrors the global one.

### Safety
- All admin pages gated by `RequireAdmin`.
- No destructive operations without confirmation dialog.
- No production stadium overwrites — writes go through existing staging tables where applicable; direct edits on `stadiums` are explicit and logged in `stadium_media_history` style notes.
- Existing routes `/admin/stadium-map-review`, `/admin/stadium-media-sync` preserved.

---

## Delivery order

Because this is large, I'll ship in **2 sub-batches** under your approval:

- **Sub-batch A (this loop)**: Part 1 (unify website, remove `/app/*`) + admin shell scaffolding (sidebar, routes, FR/EN i18n base, sub-pages stubbed with real data tables for clubs/stadiums/matches). No new DB changes.
- **Sub-batch B (next loop)**: full editors with inline drawers, image upload, relations panels, Leaflet map, `admin-assistant` edge function + copilot UI.

---

## Out of scope

- No new DB columns (translations `name_fr` etc. shown as UI placeholders only).
- No changes to public stadium slugs, SEO, sitemap.
- No removal of staging data.
- No payment / subscription changes.

Ready to ship Sub-batch A — confirm and I start.