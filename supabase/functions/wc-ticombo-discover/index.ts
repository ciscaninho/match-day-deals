// Discover real Ticombo World Cup event URLs from the official listing page
// and queue them into wc_ticombo_discovery_queue. Uses Firecrawl (map + scrape).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

const DEFAULT_ROOT =
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=group-date&key=bab812da-41b7-42b7-aabe-cb3908cbc347";

// Direct Ticombo event page heuristics:
//  - /en/event/<id> or /en/<sport>/<slug>-eXXXXXX
//  - any path with "world-cup" plus a numeric event id at the end
const EVENT_PATH_RE = /\/(en|de|fr|es|it|pt|nl)\/(event|events|tickets)\/[A-Za-z0-9._-]+/i;
const EVENT_ID_RE = /-(e?\d{5,})(?:[/?#]|$)/i;
const BAD_PATH_RE = /\/(schedule|search|category|categories|group-stage|tournaments?|teams?|sports-tickets)(\/|$|\?)/i;

const isEventUrl = (u: string): boolean => {
  try {
    const url = new URL(u);
    if (!url.hostname.includes("ticombo.com")) return false;
    const p = url.pathname + url.search;
    if (BAD_PATH_RE.test(url.pathname) && !EVENT_ID_RE.test(p)) return false;
    if (EVENT_PATH_RE.test(url.pathname)) return true;
    if (EVENT_ID_RE.test(p) && /world-cup|world.cup|fifa/i.test(p)) return true;
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

    const { count: pending } = await admin
      .from("wc_ticombo_discovery_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    return new Response(JSON.stringify({
      ok: true,
      root,
      discovered: candidates.length,
      newly_queued: inserted,
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
