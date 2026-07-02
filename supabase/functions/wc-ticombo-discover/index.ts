// Discover real Ticombo World Cup event URLs from the official listing page
// and queue them into wc_ticombo_discovery_queue. Uses Firecrawl (map + scrape).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

const DEFAULT_ROOT =
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=group-date&key=bab812da-41b7-42b7-aabe-cb3908cbc347";

// Additional Ticombo pages to seed link discovery from. The overview only lists
// group-stage + a handful of knockout pages; the round/team/stadium routes
// expose the R16, QF, SF, 3P and per-team fixtures.
const EXTRA_SEED_URLS: string[] = [
  // Knockout round groupings
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=group-round",
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=group-stadium",
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=group-team",
  // Per-team pages (top FIFA seeds most likely to reach late rounds)
  "https://www.ticombo.com/en/football-tickets/national-teams/spain",
  "https://www.ticombo.com/en/football-tickets/national-teams/england",
  "https://www.ticombo.com/en/football-tickets/national-teams/france",
  "https://www.ticombo.com/en/football-tickets/national-teams/germany",
  "https://www.ticombo.com/en/football-tickets/national-teams/brazil",
  "https://www.ticombo.com/en/football-tickets/national-teams/argentina",
  "https://www.ticombo.com/en/football-tickets/national-teams/portugal",
  "https://www.ticombo.com/en/football-tickets/national-teams/netherlands",
  "https://www.ticombo.com/en/football-tickets/national-teams/belgium",
  "https://www.ticombo.com/en/football-tickets/national-teams/italy",
  // Host stadium pages
  "https://www.ticombo.com/en/football-tickets/stadiums/metlife-stadium",
  "https://www.ticombo.com/en/football-tickets/stadiums/sofi-stadium",
  "https://www.ticombo.com/en/football-tickets/stadiums/att-stadium",
  "https://www.ticombo.com/en/football-tickets/stadiums/mercedes-benz-stadium",
  "https://www.ticombo.com/en/football-tickets/stadiums/hard-rock-stadium",
  "https://www.ticombo.com/en/football-tickets/stadiums/gillette-stadium",
  "https://www.ticombo.com/en/football-tickets/stadiums/lincoln-financial-field",
  "https://www.ticombo.com/en/football-tickets/stadiums/lumen-field",
  "https://www.ticombo.com/en/football-tickets/stadiums/nrg-stadium",
  "https://www.ticombo.com/en/football-tickets/stadiums/levis-stadium",
  "https://www.ticombo.com/en/football-tickets/stadiums/arrowhead-stadium",
];

// Normalize any Ticombo URL to its canonical /en/ form so the queue dedup on
// the `url` unique index catches locale variants (/da/, /de/, /fr/, ...).
const LOCALE_RE = /^\/(en|da|de|fr|es|it|pt|nl|sv|no|pl)(\/|$)/i;
const canonicalizeUrl = (raw: string): string => {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.search = "";
    u.pathname = u.pathname.replace(LOCALE_RE, "/en$2");
    let out = u.toString();
    if (out.endsWith("/")) out = out.slice(0, -1);
    return out;
  } catch {
    return raw;
  }
};


// Direct Ticombo SINGLE-FIXTURE event page heuristics.
// We only accept pages that look like ONE specific match (Team A vs Team B at one stadium on one date).
// We REJECT stadium bundles, city packages, multi-match offers, hospitality, "follow team" products, etc.
const EVENT_PATH_RE = /\/(en|de|fr|es|it|pt|nl)\/(event|events|tickets|football-tickets)\/[A-Za-z0-9._-]+/i;
// Accept either a legacy numeric id OR a trailing UUID (new Ticombo schema).
const EVENT_ID_RE = /(?:-(e?\d{5,})(?:[/?#]|$))|\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?(?:[?#]|$)/i;
const SINGLE_FIXTURE_PATH_RE = /\/football-tickets\/match-/i;

// Hard blacklist of slug fragments that indicate non-single-fixture products.
const BLACKLIST_FRAGMENTS = [
  "all-",
  "matches-world-cup",
  "stadium-", // e.g. "los-angeles-stadium-8-matches"
  "-stadium-tickets",
  "package",
  "follow-",
  "group-matches",
  "hospitality",
  "venue-series",
  "vip-experience",
  "bundle",
  "series-pass",
];
const BAD_PATH_RE = /\/(schedule|search|category|categories|group-stage|tournaments?|teams?|sports-tickets|hospitality)(\/|$|\?)/i;

const hasBlacklistedFragment = (path: string): boolean => {
  const p = path.toLowerCase();
  return BLACKLIST_FRAGMENTS.some((frag) => p.includes(frag));
};

const isEventUrl = (u: string): boolean => {
  try {
    const url = new URL(u);
    if (!url.hostname.includes("ticombo.com")) return false;
    const path = url.pathname;
    const p = path + url.search;

    // Hard rejects first
    if (BAD_PATH_RE.test(path) && !SINGLE_FIXTURE_PATH_RE.test(path)) return false;
    if (hasBlacklistedFragment(path)) return false;

    // Strong accept: explicit single-fixture path pattern (new schema has no -vs- in slug)
    if (SINGLE_FIXTURE_PATH_RE.test(path)) return true;

    // Weaker accept: generic /event/<id> or /tickets/<slug>-eXXXXX or trailing UUID
    if (EVENT_PATH_RE.test(path) && EVENT_ID_RE.test(p)) return true;
    return false;
  } catch { return false; }
};

const fcMap = async (url: string) => {
  const r = await fetch("https://api.firecrawl.dev/v2/map", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, limit: 5000, includeSubdomains: false, search: "world-cup" }),
  });
  const j = await r.json();
  return (j.links ?? j.data?.links ?? []) as string[];
};

const fcScrapeLinks = async (url: string) => {
  const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["links", "markdown"], onlyMainContent: false, waitFor: 3000 }),
  });
  const j = await r.json();
  const links: string[] = j.links ?? j.data?.links ?? [];
  return links;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY is not configured");
    const body = await req.json().catch(() => ({}));
    const root: string = body.root_url ?? DEFAULT_ROOT;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. discover via map + scrape (run both, dedupe)
    const [mapped, scraped] = await Promise.all([
      fcMap(root).catch((e) => { console.error("map failed", e); return [] as string[]; }),
      fcScrapeLinks(root).catch((e) => { console.error("scrape failed", e); return [] as string[]; }),
    ]);
    const candidates = Array.from(new Set<string>([...mapped, ...scraped]))
      .map((u) => { try { const x = new URL(u); x.hash = ""; return x.toString(); } catch { return u; } })
      .filter(isEventUrl);

    // 2. queue (upsert on url uniqueness)
    let inserted = 0;
    for (const url of candidates) {
      const { data: existing } = await admin
        .from("wc_ticombo_discovery_queue")
        .select("id")
        .eq("url", url)
        .maybeSingle();
      if (!existing) {
        await admin.from("wc_ticombo_discovery_queue").insert({ url, status: "pending" });
        inserted++;
      }
    }

    // 3. retroactively purge pending/failed queue rows that no longer pass the
    // hardened single-fixture filter (stadium bundles, packages, follow-team, etc.)
    const { data: stale } = await admin
      .from("wc_ticombo_discovery_queue")
      .select("id, url")
      .in("status", ["pending", "failed"]);
    const toPurge = (stale ?? []).filter((r: { url: string }) => !isEventUrl(r.url));
    let purged = 0;
    if (toPurge.length) {
      const { error } = await admin
        .from("wc_ticombo_discovery_queue")
        .update({
          status: "failed",
          last_error: "non_single_fixture_page",
          processed_at: new Date().toISOString(),
          result: { rejection_code: "non_single_fixture_page", rejection_reason: "URL rejected by hardened discovery filter (stadium bundle / package / follow-team / multi-match)." },
        })
        .in("id", toPurge.map((r: { id: string }) => r.id));
      if (!error) purged = toPurge.length;
    }

    const { count: pending } = await admin
      .from("wc_ticombo_discovery_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    return new Response(JSON.stringify({
      ok: true,
      root,
      discovered: candidates.length,
      newly_queued: inserted,
      purged_non_single_fixture: purged,
      pending_total: pending ?? null,
      sample: candidates.slice(0, 10),
      raw_map_count: mapped.length,
      raw_scrape_count: scraped.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
