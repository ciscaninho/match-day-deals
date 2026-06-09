/**
 * Sitemap generator — runs via predev / prebuild npm hooks.
 *
 * Writes public/sitemap.xml combining:
 *   - Static marketing / product routes
 *   - Upcoming match pages          (/matches/:id)
 *   - World Cup 2026 hub + stadium pages
 *   - Editorial guides              (/guides/:slug)
 *
 * Deliberately EXCLUDED (SEO Sprint 1 scope):
 *   - /clubs and /clubs/:slug          (page-level noindex + robots block)
 *   - /stadiums and /stadiums/:slug    (page-level noindex + robots block)
 *   - /destinations and /destinations/:slug
 *   - /app/* and /admin/* and auth/account routes
 *
 * Future expansion: add a new section in `collectEntries()` and push entries.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://match-day-deals.lovable.app";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://efhbpagnaaafdmvlwqbp.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaGJwYWduYWFhZmRtdmx3cWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDkwMTUsImV4cCI6MjA5MjUyNTAxNX0.ifDRQUQJIaL802J-dGBUgoQPApq39WTzHSWIPHvbTMg";

type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- static

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/",                      changefreq: "daily",   priority: "1.0" },
  { path: "/matches",               changefreq: "daily",   priority: "0.9" },
  { path: "/leagues",               changefreq: "weekly",  priority: "0.7" },
  { path: "/world-cup-2026",        changefreq: "daily",   priority: "0.9" },
  { path: "/world-cup-2026/stadiums", changefreq: "weekly", priority: "0.8" },
  { path: "/guides",                changefreq: "weekly",  priority: "0.7" },
  { path: "/about",                 changefreq: "monthly", priority: "0.5" },
  { path: "/pricing",               changefreq: "monthly", priority: "0.5" },
  { path: "/faq",                   changefreq: "monthly", priority: "0.5" },
  { path: "/how-it-works",          changefreq: "monthly", priority: "0.5" },
  { path: "/contact",               changefreq: "yearly",  priority: "0.3" },
  { path: "/editorial-policy",      changefreq: "yearly",  priority: "0.3" },
  { path: "/ticket-policy",         changefreq: "yearly",  priority: "0.3" },
  { path: "/affiliate-disclosure",  changefreq: "yearly",  priority: "0.3" },
  { path: "/cookies",               changefreq: "yearly",  priority: "0.3" },
  { path: "/legal/privacy",         changefreq: "yearly",  priority: "0.3" },
  { path: "/legal/terms",           changefreq: "yearly",  priority: "0.3" },
  { path: "/legal/refund",          changefreq: "yearly",  priority: "0.3" },
];

// ---------------------------------------------------------------- supabase

async function sb<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    console.warn(`[sitemap] ${path} -> ${res.status}; skipping section`);
    return [];
  }
  return (await res.json()) as T[];
}

async function upcomingMatchEntries(): Promise<SitemapEntry[]> {
  const nowIso = new Date().toISOString();
  const rows = await sb<{ id: string; date: string; updated_at?: string }>(
    `matches?select=id,date,updated_at&date=gte.${nowIso}&order=date.asc`,
  );
  return rows.map((m) => ({
    path: `/matches/${m.id}`,
    lastmod: (m.updated_at ?? m.date).slice(0, 10),
    changefreq: "daily",
    priority: "0.8",
  }));
}

async function worldCupStadiumEntries(): Promise<SitemapEntry[]> {
  const rows = await sb<{ slug: string; updated_at?: string }>(
    `stadiums?select=slug,updated_at&is_world_cup_host=eq.true&archived_at=is.null&slug=not.is.null`,
  );
  return rows
    .filter((r) => r.slug)
    .map((s) => ({
      path: `/world-cup-2026/stadiums/${s.slug}`,
      lastmod: (s.updated_at ?? today()).slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
    }));
}

// ---------------------------------------------------------------- guides

async function guideEntries(): Promise<SitemapEntry[]> {
  // Pulls slugs from the static content module so we don't hit the network.
  const mod = (await import("../src/i18n/guidesContent.ts")) as {
    guidesContent: Record<string, Record<string, { slug: string }>>;
  };
  const slugs = new Set<string>();
  for (const locale of Object.values(mod.guidesContent ?? {})) {
    for (const guide of Object.values(locale)) {
      if (guide?.slug) slugs.add(guide.slug);
    }
  }
  return [...slugs].map((slug) => ({
    path: `/guides/${slug}`,
    lastmod: today(),
    changefreq: "monthly",
    priority: "0.6",
  }));
}

// ---------------------------------------------------------------- assemble

async function collectEntries(): Promise<SitemapEntry[]> {
  const sections = await Promise.allSettled([
    upcomingMatchEntries(),
    worldCupStadiumEntries(),
    guideEntries(),
  ]);
  const dynamic = sections.flatMap((s) =>
    s.status === "fulfilled" ? s.value : [],
  );
  return [...STATIC_ENTRIES, ...dynamic];
}

function render(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

async function main() {
  const entries = await collectEntries();
  writeFileSync(resolve("public/sitemap.xml"), render(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main().catch((err) => {
  console.error("[sitemap] generation failed:", err);
  // Don't fail the build — keep last good sitemap.xml in place.
  process.exit(0);
});
