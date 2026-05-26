// wc-ticket-sync — World Cup ticket extraction.
// Loads active coverage rows, classifies URLs (search/landing/discovery/event),
// expands search/landing/discovery URLs into individual event rows by crawling
// the Ticombo WC2026 schedule hub (server-rendered list of all 104 matches),
// then scrapes per-event metadata. Parents are kept active and marked 'expanded'.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const TICOMBO_SCHEDULE_HUB = "https://www.ticombo.com/en/world-cup-2026/schedule";

// ---------- URL classification ----------
type UrlType = "search" | "landing" | "discovery" | "event" | "unknown";

function classifyUrl(u: string | null | undefined): UrlType {
  if (!u) return "unknown";
  try {
    const url = new URL(u);
    if (/\/search\b/i.test(url.pathname) || url.searchParams.has("query") || url.searchParams.has("q")) return "search";
    if (/world-cup-2026\/schedule/i.test(url.pathname)) return "discovery";
    // Event detail pages: ticombo's "sports-tickets/.../<uuid>"
    if (/\/sports-tickets\/.+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url.pathname)) return "event";
    if (/\/(world-cup-2026|fifa)\/?$/i.test(url.pathname)) return "landing";
    return "unknown";
  } catch { return "unknown"; }
}

// ---------- Fetch ----------
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" }, redirect: "follow" });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

// ---------- Slug parsing ----------
type SlugInfo = {
  event_name: string;
  event_date: string | null;     // YYYY-MM-DD
  event_time: string | null;     // HH:MM
  event_status: string | null;
  home_label: string | null;
  away_label: string | null;
  uuid: string | null;
};

function parseEventUrl(eventUrl: string): SlugInfo {
  const info: SlugInfo = { event_name: "", event_date: null, event_time: null, event_status: null, home_label: null, away_label: null, uuid: null };
  try {
    const u = new URL(eventUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    const uuid = parts[parts.length - 1];
    if (/^[0-9a-f-]{30,}$/i.test(uuid)) info.uuid = uuid;
    const slug = parts[parts.length - 2] ?? "";

    // Date: YYMMDDhhmm at the end of the slug (Ticombo convention)
    const dm = slug.match(/-(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:-|$)/);
    if (dm) {
      info.event_date = `20${dm[1]}-${dm[2]}-${dm[3]}`;
      const hh = dm[4], mm = dm[5];
      if (!(hh === "23" && mm === "59")) info.event_time = `${hh}:${mm}`;
    }

    // Phase detection
    const lower = slug.toLowerCase();
    if (/(^|-)final(-|$)/.test(lower) && !lower.includes("bronze")) info.event_status = "final";
    else if (lower.includes("bronze")) info.event_status = "third_place";
    else if (/-sf-/.test(lower) || lower.includes("semi-final")) info.event_status = "semi_final";
    else if (/-qf-/.test(lower) || lower.includes("quarter")) info.event_status = "quarter_final";
    else if (/-r16(-|$)/.test(lower) || lower.includes("round-of-16")) info.event_status = "round_of_16";
    else if (/-r32(-|$)/.test(lower) || lower.includes("round-of-32")) info.event_status = "round_of_32";
    else if (lower.includes("group")) info.event_status = "group_stage";
    else if (lower.includes("opening")) info.event_status = "opening_match";

    // Match-1 → opening
    if (/^match-1-/.test(lower) && info.event_status === "group_stage") info.event_status = "opening_match";

    // Teams: "match-N-X-vs-Y-football-..." or "follow-Country-all-3-..."
    const vs = slug.match(/-([a-z0-9]+(?:-[a-z0-9]+)*)-vs-([a-z0-9]+(?:-[a-z0-9]+)*)-football/i);
    if (vs) {
      info.home_label = vs[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      info.away_label = vs[2].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Name: clean human-readable form
    const cleaned = slug
      .replace(/-\d{10,}$/, "")
      .replace(/-football-world-cup-2026/i, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
    info.event_name = cleaned || "World Cup match";
  } catch { /* ignore */ }
  return info;
}

// ---------- Event link discovery ----------
function extractEventLinks(html: string, baseUrl: string): string[] {
  const out = new Set<string>();
  const base = new URL(baseUrl);
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1], base);
      if (u.host !== base.host) continue;
      if (classifyUrl(u.toString()) === "event") {
        out.add(u.toString().split("#")[0].split("?")[0]);
      }
    } catch { /* ignore */ }
    if (out.size >= 200) break;
  }
  return [...out];
}

// ---------- Lightweight event-page enrichment ----------
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

type EventEnrichment = {
  image_url: string | null;
  starting_price: number | null;
  currency: string | null;
  stadium: string | null;
  city: string | null;
};

function enrichFromHtml(html: string): EventEnrichment {
  const out: EventEnrichment = { image_url: null, starting_price: null, currency: null, stadium: null, city: null };
  out.image_url = extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");
  for (const block of extractJsonLd(html)) {
    const arr = Array.isArray(block) ? block : [block];
    for (const n of arr) {
      const t = String(n?.["@type"] ?? "").toLowerCase();
      if (!t.includes("event")) continue;
      const loc = Array.isArray(n.location) ? n.location[0] : n.location;
      if (loc) {
        if (!out.stadium && typeof loc.name === "string") out.stadium = loc.name;
        if (!out.city && typeof loc.address?.addressLocality === "string") out.city = loc.address.addressLocality;
      }
      const offers = Array.isArray(n.offers) ? n.offers : n.offers ? [n.offers] : [];
      for (const o of offers) {
        const p = Number(o?.lowPrice ?? o?.price);
        if (Number.isFinite(p) && p > 0 && (out.starting_price == null || p < out.starting_price)) out.starting_price = p;
        if (!out.currency && typeof o?.priceCurrency === "string") out.currency = o.priceCurrency;
      }
    }
  }
  if (out.starting_price == null) {
    const m = html.match(/(?:from|à partir de|ab|desde)\s*[€£$]\s*(\d{2,5})/i) ?? html.match(/[€£$]\s*(\d{2,5})/);
    if (m) {
      const p = Number(m[1]);
      if (Number.isFinite(p) && p > 0) { out.starting_price = p; if (!out.currency) out.currency = "EUR"; }
    }
  }
  return out;
}

// ---------- Main ----------
type CoverageRow = {
  id: string;
  active: boolean | null;
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
  url_type: string | null;
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
    const provider = (body.provider as string | undefined) ?? "ticombo";
    const limit = Math.min(Number(body.limit ?? 50), 200);
    const maxEvents = Math.min(Number(body.maxEvents ?? 30), 120);

    // Load source rows
    const { data: allRowsRaw, error: loadErr } = await supabase
      .from("wc_ticket_coverage")
      .select("*")
      .ilike("provider", provider)
      .limit(limit * 4);
    if (loadErr) throw loadErr;

    const allRows = ((allRowsRaw ?? []) as CoverageRow[]);
    const rowsSkippedInactive = allRows.filter((r) => r.active === false).length;
    const rowsSkippedMissingUrl = allRows.filter((r) => !(r.ticket_url ?? r.url)).length;
    const rows = allRows
      .filter((r) => r.active !== false)
      .filter((r) => !!(r.ticket_url ?? r.url))
      .slice(0, limit);

    const rowsLoaded = rows.length;
    let rowsProcessed = 0;
    let urlsFetched = 0;
    let eventsExtracted = 0;
    let created = 0;
    let expanded = 0;
    let failed = 0;
    let linked = 0;
    const debug: any[] = [];

    // Cache hub fetch and discovered event links across iterations
    let hubLinks: string[] | null = null;
    const enrichedSlugs = new Set<string>();

    const discoverFromHub = async (dbg: any): Promise<string[]> => {
      if (hubLinks) return hubLinks;
      const html = await fetchHtml(TICOMBO_SCHEDULE_HUB);
      urlsFetched++; dbg.urls_fetched++;
      if (!html) { hubLinks = []; dbg.reason = "hub_fetch_failed"; return hubLinks; }
      hubLinks = extractEventLinks(html, TICOMBO_SCHEDULE_HUB);
      return hubLinks;
    };

    // Optional: match-id linking from existing WC matches by stadium+date
    const { data: wcMatches } = await supabase
      .from("matches")
      .select("id,date,stadium")
      .ilike("competition", "%world cup%");
    const stadiumDateIndex = new Map<string, string>();
    for (const m of (wcMatches ?? []) as any[]) {
      const day = m.date ? String(m.date).slice(0, 10) : null;
      if (!day || !m.stadium) continue;
      stadiumDateIndex.set(`${String(m.stadium).toLowerCase()}|${day}`, m.id);
    }

    const insertEventRow = async (parent: CoverageRow, eventUrl: string, info: SlugInfo, enr: EventEnrichment, dbg: any) => {
      // Minimal validation: only require URL + a title. Title falls back to slug or "World Cup Tickets".
      if (!eventUrl) {
        dbg.rejected++;
        dbg.rejection_reasons.push("missing_url");
        return false;
      }
      const eventName = (info.event_name && info.event_name.trim().length > 0)
        ? info.event_name
        : "World Cup Tickets";

      const slugTail = eventUrl.split("/").pop()?.split("?")[0] ?? "";
      const eventSlug = info.uuid
        ? `ticombo-${info.uuid}`
        : `ticombo-${slugTail || Math.abs([...eventUrl].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)).toString(36)}`;

      if (enrichedSlugs.has(eventSlug)) { dbg.skipped++; return false; }
      enrichedSlugs.add(eventSlug);

      const stadiumName = enr.stadium ?? parent.stadium_name ?? "FIFA World Cup 2026";
      const stadiumSlug = parent.stadium_slug ?? "wc-2026-hub";
      let match_id: string | null = null;
      if (info.event_date && stadiumName) {
        match_id = stadiumDateIndex.get(`${stadiumName.toLowerCase()}|${info.event_date}`) ?? null;
        if (match_id) linked++;
      }

      const row = {
        active: true,
        stadium_slug: stadiumSlug,
        stadium_name: stadiumName,
        city: enr.city ?? parent.city,
        country: parent.country,
        kind: parent.kind ?? "resale",
        provider: parent.provider,
        url: eventUrl,
        ticket_url: eventUrl,
        currency: enr.currency ?? parent.currency ?? "EUR",
        status: "active",
        priority: parent.priority ?? 100,
        url_type: "event",
        event_slug: eventSlug,
        event_name: eventName,
        event_date: info.event_date,
        event_time: info.event_time,
        event_status: info.event_status ?? "draft",
        home_label: info.home_label,
        away_label: info.away_label,
        image_url: enr.image_url,
        starting_price: enr.starting_price,
        ticket_source_type: parent.kind ?? "resale",
        match_id,
        is_available: true,
        last_price_check: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        last_sync_status: "ok",
      };
      // Strategy: try upsert; if ON CONFLICT spec unsupported, fall back to manual lookup → update/insert.
      let persistStatus: "inserted" | "updated" | "skipped" | "conflict" | "failed" = "inserted";
      let { error } = await supabase
        .from("wc_ticket_coverage")
        .upsert(row as never, { onConflict: "event_slug,provider", ignoreDuplicates: false });

      if (error && /no unique or exclusion constraint matching the ON CONFLICT/i.test(error.message)) {
        dbg.conflict_errors = (dbg.conflict_errors ?? 0) + 1;
        const { data: existing } = await supabase
          .from("wc_ticket_coverage")
          .select("id")
          .eq("event_slug", eventSlug)
          .eq("provider", parent.provider)
          .maybeSingle();
        if (existing?.id) {
          const { error: updErr } = await supabase
            .from("wc_ticket_coverage").update(row as never).eq("id", existing.id);
          error = updErr ?? null;
          persistStatus = updErr ? "failed" : "updated";
        } else {
          const { error: insErr } = await supabase
            .from("wc_ticket_coverage").insert(row as never);
          error = insErr ?? null;
          persistStatus = insErr ? "failed" : "inserted";
        }
      }

      if (error) {
        dbg.rejected++;
        dbg.rejection_reasons.push(`db:${error.message}`);
        dbg.failed_urls.push(`${eventUrl} :: ${error.message}`);
        dbg.persist_failed = (dbg.persist_failed ?? 0) + 1;
        return false;
      }
      if (persistStatus === "updated") dbg.persist_updated = (dbg.persist_updated ?? 0) + 1;
      else dbg.persist_inserted = (dbg.persist_inserted ?? 0) + 1;
      created++; dbg.created++; dbg.accepted++; eventsExtracted++; dbg.extracted++;
      if (dbg.preview.length < 8) {
        dbg.preview.push({ url: eventUrl, name: eventName, date: info.event_date, status: info.event_status ?? "draft", price: enr.starting_price, persist: persistStatus });
      }
      return true;
    };

    for (const r of rows) {
      rowsProcessed++;
      const sourceUrl = (r.ticket_url ?? r.url)!;
      const urlType = (r.url_type as UrlType) || classifyUrl(sourceUrl);
      const dbg: any = {
        id: r.id, parsed_url: sourceUrl, url_type: urlType,
        urls_fetched: 0, detected: 0, extracted: 0, created: 0, skipped: 0,
        accepted: 0, rejected: 0, rejection_reasons: [] as string[],
        failed_urls: [] as string[], reason: null as string | null, preview: [] as any[],
      };

      if (urlType === "search" || urlType === "landing" || urlType === "discovery") {
        // Try the source itself first, then fall back to the schedule hub
        let links: string[] = [];
        if (urlType === "discovery") {
          links = await discoverFromHub(dbg);
        } else {
          const html = await fetchHtml(sourceUrl);
          urlsFetched++; dbg.urls_fetched++;
          if (html) links = extractEventLinks(html, sourceUrl);
          if (links.length === 0) {
            // Fallback to global hub
            links = await discoverFromHub(dbg);
          }
        }
        dbg.detected = links.length;
        if (links.length === 0) {
          dbg.reason = dbg.reason ?? "no_event_links";
          failed++;
          await supabase.from("wc_ticket_coverage").update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "no_event_links",
          }).eq("id", r.id);
          debug.push(dbg);
          continue;
        }

        for (const link of links.slice(0, maxEvents)) {
          const info = parseEventUrl(link);
          // Enrich only first N to limit fetches
          let enr: EventEnrichment = { image_url: null, starting_price: null, currency: null, stadium: null, city: null };
          if (dbg.extracted < 12) {
            const html = await fetchHtml(link);
            urlsFetched++; dbg.urls_fetched++;
            if (html) enr = enrichFromHtml(html);
          }
          await insertEventRow(r, link, info, enr, dbg);
        }

        // Keep parent ACTIVE; just mark as expanded.
        await supabase.from("wc_ticket_coverage").update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "expanded",
          url_type: urlType,
        }).eq("id", r.id);
        expanded++;
        debug.push(dbg);
        continue;
      }

      if (urlType === "event") {
        const html = await fetchHtml(sourceUrl);
        urlsFetched++; dbg.urls_fetched++;
        if (!html) {
          failed++;
          await supabase.from("wc_ticket_coverage").update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "scrape_failed",
          }).eq("id", r.id);
          dbg.reason = "fetch_failed";
          debug.push(dbg);
          continue;
        }
        const info = parseEventUrl(sourceUrl);
        const enr = enrichFromHtml(html);
        const patch: Record<string, unknown> = {
          last_sync_at: new Date().toISOString(),
          last_price_check: new Date().toISOString(),
          last_sync_status: "ok",
          url_type: "event",
          event_slug: r.event_slug ?? (info.uuid ? `ticombo-${info.uuid}` : null),
          event_name: info.event_name,
          event_date: info.event_date,
          event_time: info.event_time,
          event_status: info.event_status,
          home_label: info.home_label,
          away_label: info.away_label,
          image_url: enr.image_url,
          starting_price: enr.starting_price,
          currency: enr.currency ?? r.currency ?? "EUR",
        };
        const { error: upErr } = await supabase.from("wc_ticket_coverage").update(patch).eq("id", r.id);
        if (upErr) { failed++; dbg.reason = upErr.message; debug.push(dbg); continue; }
        eventsExtracted++; dbg.extracted++;
        dbg.preview.push({ url: sourceUrl, name: info.event_name, date: info.event_date, status: info.event_status, price: enr.starting_price });
        debug.push(dbg);
        continue;
      }

      // unknown type
      dbg.reason = "unknown_url_type";
      await supabase.from("wc_ticket_coverage").update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "unknown_url_type",
      }).eq("id", r.id);
      debug.push(dbg);
    }

    return new Response(JSON.stringify({
      rows_loaded: rowsLoaded,
      rows_skipped_inactive: rowsSkippedInactive,
      rows_skipped_missing_url: rowsSkippedMissingUrl,
      rows_processed: rowsProcessed,
      urls_fetched: urlsFetched,
      events_extracted: eventsExtracted,
      scanned: rowsProcessed,
      created, expanded, failed, linked,
      accepted: debug.reduce((s: number, d: any) => s + (d.accepted ?? 0), 0),
      rejected: debug.reduce((s: number, d: any) => s + (d.rejected ?? 0), 0),
      hub_links: hubLinks?.length ?? 0,
      debug,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
