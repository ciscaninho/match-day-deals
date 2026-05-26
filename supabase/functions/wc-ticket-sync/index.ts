// wc-ticket-sync — resilient World Cup ticket extraction pipeline.
// Strategies (in order): JSON-LD Event → OpenGraph → __NEXT_DATA__ → script[type=application/json]
// → DOM event cards → URL parsing. Falls back to draft event with hashed slug when all fail.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const STATUS_FROM_TEXT = (t: string): string | null => {
  const s = t.toLowerCase();
  if (s.includes("opening")) return "opening_match";
  if (s.includes("final") && !s.includes("semi") && !s.includes("quarter") && !s.includes("third")) return "final";
  if (s.includes("third")) return "third_place";
  if (s.includes("semi")) return "semi_final";
  if (s.includes("quarter")) return "quarter_final";
  if (s.includes("round of 16") || s.includes("r16")) return "round_of_16";
  if (s.includes("round of 32") || s.includes("r32")) return "round_of_32";
  if (s.includes("group")) return "group_stage";
  return null;
};

// ---------- Primitive extractors ----------
function extractMeta(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  return html.match(re)?.[1] ?? null;
}

function extractJsonLd(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { out.push(JSON.parse(m[1].trim())); } catch { /* ignore */ }
  }
  return out;
}

function extractNextData(html: string): any | null {
  const m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

function extractAllJsonScripts(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { out.push(JSON.parse(m[1].trim())); } catch { /* ignore */ }
  }
  return out;
}

function walkJson(node: any, visit: (n: any) => void, depth = 0) {
  if (!node || depth > 12) return;
  if (Array.isArray(node)) { for (const n of node) walkJson(n, visit, depth + 1); return; }
  if (typeof node === "object") {
    visit(node);
    for (const k of Object.keys(node)) walkJson(node[k], visit, depth + 1);
  }
}

function parseMatchup(title: string | null): { home: string | null; away: string | null } {
  if (!title) return { home: null, away: null };
  const cleaned = title.replace(/\s*[-–|·].*$/, "").trim();
  const m = cleaned.match(/^(.+?)\s+(?:vs?\.?|v|–|-)\s+(.+)$/i);
  if (!m) return { home: null, away: null };
  return { home: m[1].trim(), away: m[2].trim() };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

async function hashSlug(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(hash)).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isGenericLanding(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    if (/\/search\b/i.test(path)) return true;
    if (/\/(world[- ]cup|fifa)[- ]?2026?\b/i.test(path)) return true;
    const segs = path.split("/").filter(Boolean);
    if (segs.length <= 2) return true;
    if (!/event|match|fixture|ticket|game|\d{5,}/i.test(path)) return true;
    return false;
  } catch { return true; }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

// ---------- Multi-strategy event scrape ----------
type ScrapeResult = {
  event_name: string | null;
  home_label: string | null;
  away_label: string | null;
  event_date: string | null;
  event_time: string | null;
  image_url: string | null;
  starting_price: number | null;
  currency: string | null;
  city: string | null;
  stadium: string | null;
  event_status: string | null;
  available: boolean | null;
  metadata_score: number;
  strategies: string[];
};

function emptyScrape(): ScrapeResult {
  return {
    event_name: null, home_label: null, away_label: null,
    event_date: null, event_time: null, image_url: null,
    starting_price: null, currency: null, city: null, stadium: null,
    event_status: null, available: null, metadata_score: 0, strategies: [],
  };
}

function applyDate(r: ScrapeResult, iso: string | null | undefined) {
  if (!iso || typeof iso !== "string") return;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return;
  if (!r.event_date) r.event_date = d.toISOString().slice(0, 10);
  if (!r.event_time && /T\d{2}:\d{2}/.test(iso)) r.event_time = iso.match(/T(\d{2}:\d{2})/)?.[1] ?? null;
}

function applyJsonLdEvent(r: ScrapeResult, n: any) {
  if (!n) return;
  if (!r.event_name && typeof n.name === "string") r.event_name = n.name.trim();
  applyDate(r, n.startDate);
  if (!r.image_url) {
    const img = Array.isArray(n.image) ? n.image[0] : n.image;
    if (typeof img === "string") r.image_url = img;
    else if (img && typeof img.url === "string") r.image_url = img.url;
  }
  const loc = n.location;
  if (loc) {
    const ls = Array.isArray(loc) ? loc[0] : loc;
    if (ls) {
      if (!r.stadium && typeof ls.name === "string") r.stadium = ls.name;
      const addr = ls.address;
      if (addr && typeof addr === "object" && !r.city && typeof addr.addressLocality === "string") r.city = addr.addressLocality;
    }
  }
  const offers = Array.isArray(n.offers) ? n.offers : n.offers ? [n.offers] : [];
  for (const o of offers) {
    const p = Number(o.lowPrice ?? o.price);
    if (Number.isFinite(p) && p > 0 && (r.starting_price == null || p < r.starting_price)) r.starting_price = p;
    if (!r.currency && typeof o.priceCurrency === "string") r.currency = o.priceCurrency;
    if (r.available == null && typeof o.availability === "string") {
      r.available = !/SoldOut|OutOfStock/i.test(o.availability);
    }
  }
}

function parseScrapeMulti(html: string, sourceUrl: string): ScrapeResult {
  const r = emptyScrape();

  // 1. JSON-LD
  for (const block of extractJsonLd(html)) {
    const arr = Array.isArray(block) ? block : [block];
    for (const n of arr) {
      const t = String(n["@type"] ?? "").toLowerCase();
      if (t.includes("event")) { applyJsonLdEvent(r, n); if (!r.strategies.includes("jsonld")) r.strategies.push("jsonld"); }
      if (Array.isArray(n["@graph"])) {
        for (const g of n["@graph"]) {
          if (String(g["@type"] ?? "").toLowerCase().includes("event")) {
            applyJsonLdEvent(r, g);
            if (!r.strategies.includes("jsonld")) r.strategies.push("jsonld");
          }
        }
      }
    }
  }

  // 2. OpenGraph + meta
  const ogTitle = extractMeta(html, "og:title") ?? extractMeta(html, "twitter:title") ?? html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null;
  const ogImage = extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");
  const ogDesc = extractMeta(html, "og:description") ?? extractMeta(html, "description");
  if (ogTitle || ogImage) r.strategies.push("og");
  if (!r.event_name && ogTitle) r.event_name = ogTitle.trim();
  if (!r.image_url && ogImage) r.image_url = ogImage;
  if (!r.event_status && (r.event_name || ogDesc)) r.event_status = STATUS_FROM_TEXT(`${r.event_name ?? ""} ${ogDesc ?? ""}`);

  // 3. __NEXT_DATA__
  const next = extractNextData(html);
  if (next) {
    r.strategies.push("next_data");
    walkJson(next, (n) => {
      if (!n || typeof n !== "object") return;
      if (!r.event_date && typeof n.startDate === "string") applyDate(r, n.startDate);
      if (!r.event_date && typeof n.date === "string") applyDate(r, n.date);
      if (!r.event_name && typeof n.title === "string" && n.title.length > 4 && n.title.length < 200) r.event_name = n.title;
      if (!r.event_name && typeof n.eventName === "string") r.event_name = n.eventName;
      if (!r.stadium && typeof n.venue === "string") r.stadium = n.venue;
      if (!r.stadium && typeof n.venueName === "string") r.stadium = n.venueName;
      if (!r.city && typeof n.city === "string") r.city = n.city;
      if (!r.image_url && typeof n.imageUrl === "string") r.image_url = n.imageUrl;
      if (r.starting_price == null) {
        const p = Number(n.minPrice ?? n.lowestPrice ?? n.fromPrice ?? n.startingPrice);
        if (Number.isFinite(p) && p > 0) r.starting_price = p;
      }
      if (!r.currency && typeof n.currency === "string") r.currency = n.currency;
    });
  }

  // 4. Generic application/json scripts (hydration)
  if (!r.event_date || !r.starting_price) {
    for (const blob of extractAllJsonScripts(html)) {
      walkJson(blob, (n) => {
        if (!n || typeof n !== "object") return;
        if (!r.event_date && typeof n.startDate === "string") applyDate(r, n.startDate);
        if (r.starting_price == null) {
          const p = Number(n.minPrice ?? n.lowestPrice ?? n.fromPrice);
          if (Number.isFinite(p) && p > 0) r.starting_price = p;
        }
      });
    }
    if (r.event_date || r.starting_price != null) r.strategies.push("json_scripts");
  }

  // 5. DOM fallback — look for "from €123" text
  if (r.starting_price == null) {
    const m = html.match(/(?:from|à partir de|ab|desde)\s*[€£$]\s*(\d{2,5})/i)
      ?? html.match(/[€£$]\s*(\d{2,5})/);
    if (m) {
      const p = Number(m[1]);
      if (Number.isFinite(p) && p > 0) { r.starting_price = p; r.strategies.push("dom_price"); }
    }
  }

  // 6. URL parsing fallback (Ticombo slugs often: /e/team-a-vs-team-b-2026-06-15-stadium)
  if (!r.event_name || !r.event_date) {
    try {
      const path = new URL(sourceUrl).pathname;
      const dateM = path.match(/(\d{4})[-_/](\d{2})[-_/](\d{2})/);
      if (!r.event_date && dateM) { r.event_date = `${dateM[1]}-${dateM[2]}-${dateM[3]}`; r.strategies.push("url_parse"); }
      const slugMatch = path.split("/").filter(Boolean).pop() ?? "";
      const vs = slugMatch.replace(/\d{4}[-_]?\d{2}[-_]?\d{2}/, "").match(/([a-z0-9-]+?)-vs?-([a-z0-9-]+)/i);
      if (!r.event_name && vs) {
        const home = vs[1].replace(/-/g, " ").trim();
        const away = vs[2].replace(/-/g, " ").trim();
        r.event_name = `${home} vs ${away}`;
        r.home_label = r.home_label ?? home;
        r.away_label = r.away_label ?? away;
        if (!r.strategies.includes("url_parse")) r.strategies.push("url_parse");
      }
    } catch { /* ignore */ }
  }

  // Derive matchup from name if still missing
  if ((!r.home_label || !r.away_label) && r.event_name) {
    const { home, away } = parseMatchup(r.event_name);
    if (!r.home_label) r.home_label = home;
    if (!r.away_label) r.away_label = away;
  }

  // Phase status fallback
  if (!r.event_status && r.event_name) r.event_status = STATUS_FROM_TEXT(r.event_name);

  // Score: 1pt each for name/date/image/price/stadium
  r.metadata_score =
    (r.event_name ? 1 : 0) +
    (r.event_date ? 1 : 0) +
    (r.image_url ? 1 : 0) +
    (r.starting_price != null ? 1 : 0) +
    (r.stadium ? 1 : 0);

  return r;
}

// ---------- Landing page event link discovery ----------
function extractEventLinks(html: string, baseUrl: string): string[] {
  const out = new Set<string>();
  const base = new URL(baseUrl);

  // a) From __NEXT_DATA__ — find ticket_url / url fields
  const next = extractNextData(html);
  if (next) {
    walkJson(next, (n) => {
      if (!n || typeof n !== "object") return;
      for (const k of ["url", "ticketUrl", "ticket_url", "permalink", "slug", "path"]) {
        const v = n[k];
        if (typeof v === "string" && v.length < 300) {
          try {
            const u = new URL(v.startsWith("/") || v.startsWith("http") ? v : `/${v}`, base);
            if (u.host === base.host && !isGenericLanding(u.toString())) out.add(u.toString().split("#")[0]);
          } catch { /* ignore */ }
        }
      }
    });
  }

  // b) JSON-LD ItemList
  for (const block of extractJsonLd(html)) {
    walkJson(block, (n) => {
      if (!n || typeof n !== "object") return;
      if (typeof n.url === "string") {
        try {
          const u = new URL(n.url, base);
          if (u.host === base.host && !isGenericLanding(u.toString())) out.add(u.toString().split("#")[0]);
        } catch { /* ignore */ }
      }
    });
  }

  // c) DOM anchors
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1];
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:")) continue;
    try {
      const u = new URL(raw, base);
      if (u.host !== base.host) continue;
      if (isGenericLanding(u.toString())) continue;
      out.add(u.toString().split("#")[0]);
    } catch { /* ignore */ }
    if (out.size >= 60) break;
  }
  return [...out];
}

type CoverageRow = {
  id: string;
  active?: boolean | null;
  stadium_slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  kind: string;
  provider: string;
  url: string | null;
  ticket_url: string | null;
  currency: string | null;
  status: string;
  priority: number | null;
  event_slug: string | null;
  event_name: string | null;
  event_date: string | null;
  home_label: string | null;
  away_label: string | null;
  image_url: string | null;
  event_status: string | null;
  match_id: string | null;
  last_sync_status: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const provider = body.provider as string | undefined;
    const limit = Math.min(Number(body.limit ?? 25), 100);
    const onlyFailed = body.onlyFailed === true;

    let sourceQ = supabase.from("wc_ticket_coverage").select("*");
    if (provider) sourceQ = sourceQ.ilike("provider", provider);
    const { data: sourceRows, error } = await sourceQ.limit(limit * 4);
    if (error) throw error;

    const allRows = ((sourceRows ?? []) as CoverageRow[]);
    const rowsSkippedInactive = allRows.filter((row) => row.active === false).length;
    const rowsSkippedMissingUrl = allRows.filter((row) => !(row.ticket_url ?? row.url)).length;
    const rows = allRows
      .filter((row) => row.active !== false)
      .filter((row) => !!(row.ticket_url ?? row.url))
      .filter((row) => !onlyFailed || !row.event_slug || row.last_sync_status !== "ok")
      .slice(0, limit);

    const { data: wcMatches } = await supabase
      .from("matches")
      .select("id,date,stadium,home_team,away_team")
      .ilike("competition", "%world cup%");

    const stadiumDateIndex = new Map<string, Array<{ id: string; date: string; home: string; away: string }>>();
    for (const m of (wcMatches ?? []) as any[]) {
      const day = m.date ? String(m.date).slice(0, 10) : null;
      if (!day || !m.stadium) continue;
      const key = `${String(m.stadium).toLowerCase()}|${day}`;
      const arr = stadiumDateIndex.get(key) ?? [];
      arr.push({ id: m.id, date: day, home: m.home_team, away: m.away_team });
      stadiumDateIndex.set(key, arr);
    }

    const debug: any[] = [];
    let scanned = 0, enriched = 0, linked = 0, failed = 0, expanded = 0, created = 0, drafts = 0;
    let urlsFetched = 0, eventsExtracted = 0;
    const rowsLoaded = rows.length;
    let rowsProcessed = 0;

    const seenUrls = new Set<string>();

    const buildChildRow = async (parent: CoverageRow, link: string, s: ScrapeResult, isDraft: boolean) => {
      let slug: string | null = null;
      if (!isDraft && s.event_date && (s.home_label || s.event_name)) {
        slug = slugify(`${s.event_date}-${s.home_label ?? s.event_name ?? "wc"}-${s.away_label ?? parent.stadium_slug ?? ""}`);
      } else if (!isDraft && s.event_date && parent.stadium_slug && parent.provider) {
        slug = slugify(`wc-${parent.stadium_slug}-${s.event_date}-${parent.provider}`);
      } else {
        slug = `wc-draft-${await hashSlug(link)}`;
      }

      let match_id: string | null = null;
      if (s.event_date && parent.stadium_name) {
        const cands = stadiumDateIndex.get(`${String(parent.stadium_name).toLowerCase()}|${s.event_date}`) ?? [];
        const pick = (s.home_label && s.away_label)
          ? cands.find((c) => `${c.home} ${c.away}`.toLowerCase().includes((s.home_label ?? "").toLowerCase().slice(0, 4)))
          : cands[0];
        if (pick) { match_id = pick.id; linked++; }
      }

      return {
        active: !isDraft,
        stadium_slug: parent.stadium_slug,
        stadium_name: parent.stadium_name,
        city: s.city ?? parent.city,
        country: parent.country,
        kind: parent.kind,
        provider: parent.provider,
        url: link,
        ticket_url: link,
        currency: s.currency ?? parent.currency ?? "EUR",
        status: isDraft ? "draft" : "active",
        priority: parent.priority ?? 100,
        event_slug: slug,
        event_name: s.event_name ?? (isDraft ? "World Cup tickets" : null),
        event_date: s.event_date,
        event_time: s.event_time,
        home_label: s.home_label,
        away_label: s.away_label,
        event_status: s.event_status,
        image_url: s.image_url,
        starting_price: s.starting_price,
        ticket_source_type: parent.kind,
        match_id,
        is_available: s.available !== false,
        last_price_check: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        last_sync_status: isDraft ? "missing_metadata" : "ok",
      };
    };

    for (const r of rows) {
      scanned++;
      rowsProcessed++;
      const sourceUrl = (r.ticket_url ?? r.url)!;
      const isLanding = isGenericLanding(sourceUrl);
      const dbg: any = {
        id: r.id, parsed_url: sourceUrl, landing: isLanding,
        urls_fetched: 0, detected: 0, extracted: 0, created: 0, drafts: 0, skipped: 0,
        avg_score: 0, failed_urls: [] as string[], strategies: [] as string[], reason: null,
        preview: [] as any[],
      };

      // ---- Landing page expansion ----
      if (isLanding) {
        const html = await fetchHtml(sourceUrl);
        urlsFetched++; dbg.urls_fetched++;
        if (!html) {
          failed++;
          await supabase.from("wc_ticket_coverage").update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "scrape_failed",
          }).eq("id", r.id);
          dbg.reason = "fetch_failed";
          dbg.failed_urls.push(sourceUrl);
          debug.push(dbg);
          continue;
        }
        const links = extractEventLinks(html, sourceUrl);
        dbg.detected = links.length;
        if (links.length === 0) {
          // Try treating the landing itself as an event (might be a fallback hub)
          const s = parseScrapeMulti(html, sourceUrl);
          if (s.metadata_score >= 2) {
            const childRow = await buildChildRow(r, sourceUrl, s, false);
            const { error: insErr } = await supabase.from("wc_ticket_coverage")
              .upsert(childRow as never, { onConflict: "event_slug,provider", ignoreDuplicates: false });
            if (!insErr) { created++; dbg.created++; eventsExtracted++; dbg.extracted++; }
          }
          await supabase.from("wc_ticket_coverage").update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: dbg.created ? "ok" : "no_events_found",
          }).eq("id", r.id);
          if (!dbg.created) dbg.reason = "no_event_links";
          debug.push(dbg);
          continue;
        }

        let scoreSum = 0; let scoreCount = 0;
        for (const link of links.slice(0, 25)) {
          if (seenUrls.has(link)) { dbg.skipped++; continue; }
          seenUrls.add(link);
          const childHtml = await fetchHtml(link);
          urlsFetched++; dbg.urls_fetched++;
          if (!childHtml) { dbg.skipped++; dbg.failed_urls.push(link); continue; }
          const s = parseScrapeMulti(childHtml, link);
          scoreSum += s.metadata_score; scoreCount++;
          for (const st of s.strategies) if (!dbg.strategies.includes(st)) dbg.strategies.push(st);

          const isDraft = s.metadata_score < 2;
          const childRow = await buildChildRow(r, link, s, isDraft);
          const { error: insErr } = await supabase.from("wc_ticket_coverage")
            .upsert(childRow as never, { onConflict: "event_slug,provider", ignoreDuplicates: false });
          if (insErr) { dbg.skipped++; continue; }
          if (isDraft) { drafts++; dbg.drafts++; } else { created++; dbg.created++; }
          eventsExtracted++; dbg.extracted++;
          if (dbg.preview.length < 5) {
            dbg.preview.push({ url: link, name: s.event_name, date: s.event_date, price: s.starting_price, score: s.metadata_score, draft: isDraft });
          }
        }
        dbg.avg_score = scoreCount ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0;

        await supabase.from("wc_ticket_coverage").update({
          active: false,
          status: "archived",
          last_sync_at: new Date().toISOString(),
          last_sync_status: "expanded",
        }).eq("id", r.id);
        expanded++;
        debug.push(dbg);
        continue;
      }

      // ---- Single event scrape ----
      const html = await fetchHtml(sourceUrl);
      urlsFetched++; dbg.urls_fetched++;
      if (!html) {
        failed++;
        await supabase.from("wc_ticket_coverage").update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "scrape_failed",
        }).eq("id", r.id);
        dbg.reason = "fetch_failed";
        dbg.failed_urls.push(sourceUrl);
        debug.push(dbg);
        continue;
      }
      const s = parseScrapeMulti(html, sourceUrl);
      eventsExtracted++; dbg.extracted++;
      dbg.avg_score = s.metadata_score;
      dbg.strategies = s.strategies;

      const patch: Record<string, unknown> = {
        last_sync_at: new Date().toISOString(),
        last_price_check: new Date().toISOString(),
      };
      if (!r.event_name && s.event_name) patch.event_name = s.event_name;
      if (!r.home_label && s.home_label) patch.home_label = s.home_label;
      if (!r.away_label && s.away_label) patch.away_label = s.away_label;
      if (!r.event_date && s.event_date) patch.event_date = s.event_date;
      if (!r.image_url && s.image_url) patch.image_url = s.image_url;
      if (!r.event_status && s.event_status) patch.event_status = s.event_status;
      if (s.starting_price != null) patch.starting_price = s.starting_price;
      if (s.currency && !r.currency) patch.currency = s.currency;

      const day = (patch.event_date ?? r.event_date) as string | null;
      if (!r.match_id && day && r.stadium_name) {
        const cands = stadiumDateIndex.get(`${String(r.stadium_name).toLowerCase()}|${day}`) ?? [];
        const home = (patch.home_label ?? r.home_label) as string | null;
        const away = (patch.away_label ?? r.away_label) as string | null;
        let pick = cands[0];
        if (home && away) {
          const found = cands.find((c) =>
            (c.home?.toLowerCase().includes(home.toLowerCase()) || home.toLowerCase().includes((c.home ?? "").toLowerCase())) &&
            (c.away?.toLowerCase().includes(away.toLowerCase()) || away.toLowerCase().includes((c.away ?? "").toLowerCase()))
          );
          if (found) pick = found;
        }
        if (pick) { patch.match_id = pick.id; linked++; }
      }

      // Slug fallback (incl. hash for drafts)
      if (!r.event_slug) {
        const eDate = (patch.event_date ?? r.event_date) as string | null;
        const home = (patch.home_label ?? r.home_label) as string | null;
        const name = (patch.event_name ?? r.event_name) as string | null;
        if (eDate && (home || name)) {
          patch.event_slug = slugify(`${eDate}-${home ?? name}-${(patch.away_label ?? r.away_label) ?? r.stadium_slug}`);
          patch.last_sync_status = "ok";
        } else if (eDate && r.stadium_slug && r.provider) {
          patch.event_slug = slugify(`wc-${r.stadium_slug}-${eDate}-${r.provider}`);
          patch.last_sync_status = "ok";
        } else {
          patch.event_slug = `wc-draft-${await hashSlug(sourceUrl)}`;
          patch.status = "draft";
          patch.active = false;
          patch.last_sync_status = "missing_metadata";
          patch.event_name = patch.event_name ?? "World Cup tickets";
          drafts++; dbg.drafts++;
          dbg.reason = "missing_metadata";
        }
      } else {
        patch.last_sync_status = "ok";
      }

      const { error: upErr } = await supabase.from("wc_ticket_coverage").update(patch).eq("id", r.id);
      if (upErr) { failed++; dbg.reason = upErr.message; debug.push(dbg); continue; }
      enriched++;
      if (dbg.preview.length < 5) {
        dbg.preview.push({ url: sourceUrl, name: patch.event_name ?? r.event_name, date: patch.event_date ?? r.event_date, price: patch.starting_price ?? null, score: s.metadata_score, draft: patch.status === "draft" });
      }
      debug.push(dbg);
    }

    return new Response(JSON.stringify({
      rows_loaded: rowsLoaded,
      rows_skipped_inactive: rowsSkippedInactive,
      rows_skipped_missing_url: rowsSkippedMissingUrl,
      rows_processed: rowsProcessed,
      urls_fetched: urlsFetched,
      events_extracted: eventsExtracted,
      scanned, enriched, expanded, created, drafts, linked, failed,
      debug,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
