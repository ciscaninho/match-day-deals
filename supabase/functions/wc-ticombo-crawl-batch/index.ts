// Crawl a batch of pending Ticombo event URLs, extract structured event data
// (forcing quantity = 1 for the price), validate, upsert into wc_ticket_coverage,
// link to the canonical FIFA fixture, and archive any low-quality generic
// duplicates for the same match.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

const GENERIC_RE = /^\s*(Match\s+\d+\s+Group\s+[A-L]|Group\s+Stage\s+Match|World\s+Cup\s+Match)/i;

const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");

const EVENT_SCHEMA = {
  type: "object",
  properties: {
    provider_event_id: { type: "string", description: "Numeric Ticombo event id (from URL or page)" },
    event_name: { type: "string" },
    home_team: { type: "string" },
    away_team: { type: "string" },
    group_code: { type: "string", description: "Single letter A..L for group stage, else empty" },
    phase: { type: "string" },
    stadium_name: { type: "string" },
    city: { type: "string" },
    country: { type: "string" },
    kickoff_iso: { type: "string" },
    lowest_single_ticket_price: {
      type: "number",
      description:
        "The LOWEST visible price for ONE single ticket (quantity = 1), in EUR, after the '1 Ticket' filter is applied. Read the minimum offer in the price list, NOT category averages, NOT bundles of 2+ seats. Must reflect what the customer pays for exactly one seat including the displayed fees.",
    },
    currency: { type: "string" },
    image_url: { type: "string" },
    ticket_url: { type: "string" },
  },
  required: ["provider_event_id", "event_name", "stadium_name", "kickoff_iso"],
};

type Extracted = {
  provider_event_id?: string;
  event_name?: string;
  home_team?: string;
  away_team?: string;
  group_code?: string;
  phase?: string;
  stadium_name?: string;
  city?: string;
  country?: string;
  kickoff_iso?: string;
  lowest_single_ticket_price?: number;
  currency?: string;
  image_url?: string;
  ticket_url?: string;
};

type FailureCode =
  | "firecrawl_parse_failed"
  | "provider_event_id_missing"
  | "generic_title_detected"
  | "no_event_name"
  | "no_kickoff"
  | "bad_kickoff_iso"
  | "kickoff_outside_tolerance"
  | "stadium_alias_unresolved"
  | "no_match_candidate"
  | "invalid_price"
  | "no_visible_ticket_price"
  | "db_insert_failed"
  | "db_update_failed"
  | "unknown";

type BatchLog = {
  ok: boolean;
  url: string;
  scrape_url: string;
  extraction?: Record<string, unknown>;
  provider_event_id?: string | null;
  title?: string | null;
  stadium?: string | null;
  kickoff?: string | null;
  price_eur?: number | null;
  image_url?: string | null;
  matched_fixture_id?: string | null;
  match_confidence?: string | null;
  stadium_confidence?: string | null;
  archived_generic_rows?: number;
  final_action?: "inserted" | "updated" | "rejected";
  rejection_code?: FailureCode | null;
  rejection_reason?: string | null;
  upsert_result?: "inserted" | "updated";
  error?: string;
};

const normalizeFailure = (message: string): { code: FailureCode; reason: string } => {
  if (message.startsWith("firecrawl ")) return { code: "firecrawl_parse_failed", reason: message };
  if (message === "no_event_id") return { code: "provider_event_id_missing", reason: message };
  if (message.startsWith("generic_title:")) return { code: "generic_title_detected", reason: message.slice("generic_title:".length) || message };
  if (message === "no_event_name") return { code: "no_event_name", reason: message };
  if (message === "no_kickoff") return { code: "no_kickoff", reason: message };
  if (message.startsWith("bad_kickoff_iso")) return { code: "bad_kickoff_iso", reason: message };
  if (message.startsWith("stadium_unresolved:")) return { code: "stadium_alias_unresolved", reason: message.slice("stadium_unresolved:".length) || message };
  if (message === "kickoff_outside_tolerance") return { code: "kickoff_outside_tolerance", reason: message };
  if (message === "no_match_candidate") return { code: "no_match_candidate", reason: message };
  if (message === "invalid_price") return { code: "invalid_price", reason: message };
  if (message === "no_visible_ticket_price") return { code: "no_visible_ticket_price", reason: message };
  if (message.startsWith("db_insert:")) return { code: "db_insert_failed", reason: message.slice("db_insert:".length) || message };
  if (message.startsWith("db_update:")) return { code: "db_update_failed", reason: message.slice("db_update:".length) || message };
  return { code: "unknown", reason: message };
};

// Force the Ticombo page into "1 Ticket" mode using known query params so the
// price list and the structured payload reflect a single seat.
const forceQty1 = (url: string): string => {
  try {
    const u = new URL(url);
    u.searchParams.set("q", "1");
    u.searchParams.set("quantity", "1");
    u.searchParams.set("tickets", "1");
    return u.toString();
  } catch { return url; }
};

const fcScrape = async (url: string) => {
  const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: [
        "markdown",
        {
          type: "json",
          schema: EVENT_SCHEMA,
          prompt:
            "Extract real event data from this Ticombo event page. The page MUST be read as if the '1 Ticket' filter is active. For lowest_single_ticket_price, return the minimum visible price for ONE seat (not bundles, not category averages, not 2-ticket defaults). Do not invent values; if unsure leave blank.",
        },
      ],
      onlyMainContent: true,
      waitFor: 4000,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `firecrawl ${r.status}`);
  const data = (j.json ?? j.data?.json ?? {}) as Extracted;
  const markdown = (j.markdown ?? j.data?.markdown ?? "") as string;
  return { data, markdown };
};

const extractIdFromUrl = (url: string): string | null => {
  const m = url.match(/-e?(\d{5,})(?:[/?#]|$)/i) ?? url.match(/\/(\d{6,})(?:[/?#]|$)/);
  return m ? m[1] : null;
};

// Fallback: scan the page markdown for the smallest € amount in plausible
// single-ticket range (filters out aggregate "€1,097 – 98,345" headers).
const minPriceFromMarkdown = (md: string): number | null => {
  if (!md) return null;
  const re = /€\s?([0-9][0-9.,]{1,7})/g;
  let m: RegExpExecArray | null;
  const nums: number[] = [];
  while ((m = re.exec(md)) !== null) {
    const n = Number(m[1].replace(/[.,](?=\d{3}\b)/g, "").replace(",", "."));
    if (Number.isFinite(n) && n >= 20 && n <= 50000) nums.push(n);
  }
  if (!nums.length) return null;
  return Math.min(...nums);
};

const validateAndUpsert = async (
  admin: ReturnType<typeof createClient>,
  url: string,
  ex: Extracted,
  markdown: string,
) => {
  const provider_event_id = ex.provider_event_id?.trim() || extractIdFromUrl(url);
  if (!provider_event_id) throw new Error("no_event_id");
  const event_name = (ex.event_name ?? "").trim();
  if (!event_name) throw new Error("no_event_name");
  if (GENERIC_RE.test(event_name)) throw new Error(`generic_title:${event_name}`);
  if (!ex.kickoff_iso) throw new Error("no_kickoff");
  if (!ex.stadium_name) throw new Error("no_stadium");

  const kickoff = new Date(ex.kickoff_iso);
  if (isNaN(kickoff.getTime())) throw new Error(`bad_kickoff_iso:${ex.kickoff_iso}`);

  // Resolve stadium
  const folded = fold(ex.stadium_name);
  const { data: stadia } = await admin
    .from("stadiums")
    .select("id, slug, stadium_name, city, country, aliases")
    .eq("is_world_cup_host", true);
  let stadium = (stadia ?? []).find(
    (s: { stadium_name: string; slug: string }) => fold(s.stadium_name) === folded || fold(s.slug) === folded,
  );
  let stadium_confidence: "verified" | "alias_match" | "low" = stadium ? "verified" : "low";
  if (!stadium) {
    stadium = (stadia ?? []).find((s: { aliases: string[] | null }) =>
      (s.aliases ?? []).some((a) => fold(a) === folded),
    );
    if (stadium) stadium_confidence = "alias_match";
  }
  if (!stadium) {
    const { data: aliases } = await admin
      .from("stadium_aliases")
      .select("canonical_stadium_id, provider_name")
      .ilike("provider_name", ex.stadium_name);
    const hit = (aliases ?? [])[0] as { canonical_stadium_id: string } | undefined;
    if (hit) {
      const s = (stadia ?? []).find((x: { id: string }) => x.id === hit.canonical_stadium_id);
      if (s) { stadium = s; stadium_confidence = "alias_match"; }
    }
  }
  if (!stadium) throw new Error(`stadium_unresolved:${ex.stadium_name}`);
  const s = stadium as { id: string; slug: string; stadium_name: string; city: string | null; country: string | null };

  // Resolve canonical FIFA match
  const windowMs = 6 * 3600 * 1000;
  const { data: candidates } = await admin
    .from("matches")
    .select("id, date, home_team, away_team, group_code, stadium_id, fifa_match_number")
    .eq("competition", "FIFA World Cup 2026")
    .eq("fixture_origin", "official_import")
    .eq("stadium_id", s.id)
    .gte("date", new Date(kickoff.getTime() - windowMs).toISOString())
    .lte("date", new Date(kickoff.getTime() + windowMs).toISOString());

  if (!(candidates ?? []).length) throw new Error("kickoff_outside_tolerance");

  let match_id: string | null = null;
  let link_confidence: "exact" | "high" | "medium" | "low" = "low";
  for (const c of (candidates ?? []) as Array<{ id: string; date: string; home_team: string; away_team: string; group_code: string | null }>) {
    const diffMin = Math.abs(new Date(c.date).getTime() - kickoff.getTime()) / 60000;
    const teamMatch = !!ex.home_team && !!ex.away_team &&
      (fold(c.home_team).includes(fold(ex.home_team)) || fold(ex.home_team).includes(fold(c.home_team))) &&
      (fold(c.away_team).includes(fold(ex.away_team)) || fold(ex.away_team).includes(fold(c.away_team)));
    if (diffMin <= 15 && teamMatch) { match_id = c.id; link_confidence = "exact"; break; }
    if (diffMin <= 120 && ex.group_code && c.group_code === ex.group_code) { match_id = c.id; link_confidence = "high"; }
    else if (!match_id && diffMin <= 12 * 60) { match_id = c.id; link_confidence = "medium"; }
  }

  if (!match_id) throw new Error("no_match_candidate");

  // Quantity-aware price: prefer the structured value; fall back to markdown min.
  const mdMin = minPriceFromMarkdown(markdown);
  let single = ex.lowest_single_ticket_price ?? null;
  if (single == null || !Number.isFinite(single) || single <= 0) single = mdMin;
  // Sanity: if structured value is suspiciously high vs markdown min, prefer markdown.
  if (single != null && mdMin != null && mdMin > 0 && single > mdMin * 1.25) single = mdMin;
  if (single == null) throw new Error("no_visible_ticket_price");
  if (!Number.isFinite(single) || single <= 0) throw new Error("invalid_price");

  const event_slug = `ticombo-${provider_event_id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const row = {
    provider: "ticombo",
    provider_event_id,
    url,
    ticket_url: ex.ticket_url ?? url,
    event_name,
    event_slug,
    event_date: kickoff.toISOString(),
    home_label: ex.home_team ?? null,
    away_label: ex.away_team ?? null,
    stadium_slug: s.slug,
    stadium_name: s.stadium_name,
    city: s.city,
    country: s.country,
    starting_price: single,
    lowest_single_ticket_price: single,
    quantity_basis: 1,
    currency: ex.currency ?? "EUR",
    image_url: ex.image_url ?? null,
    match_id,
    kind: "resale",
    ticket_source_type: "event_page",
    extraction_source: "direct_event_page",
    stadium_confidence,
    active: true,
    status: "active",
    last_sync_at: new Date().toISOString(),
    last_sync_status: "ok",
    url_type: "event",
    manual_overrides: { link_confidence },
  };

  const { data: existing } = await admin
    .from("wc_ticket_coverage")
    .select("id")
    .eq("provider", "ticombo")
    .eq("provider_event_id", provider_event_id)
    .maybeSingle();

  let upsertResult: "inserted" | "updated";
  if (existing) {
    const { error } = await admin.from("wc_ticket_coverage").update(row).eq("id", (existing as { id: string }).id);
    if (error) throw new Error(`db_update:${error.message}`);
    upsertResult = "updated";
  } else {
    const { error } = await admin.from("wc_ticket_coverage").insert(row);
    if (error) throw new Error(`db_insert:${error.message}`);
    upsertResult = "inserted";
  }

  // Generic-row replacement: if we now have a clean direct-event row for a
  // canonical match, archive any other low-quality generic rows pointing to it.
  let archived_generic = 0;
  if (match_id) {
    const { data: dupes } = await admin
      .from("wc_ticket_coverage")
      .select("id, quality_score, extraction_source, provider_event_id, archived_at")
      .eq("match_id", match_id)
      .neq("provider_event_id", provider_event_id)
      .is("archived_at", null);
    const stale = (dupes ?? []).filter((d: { quality_score: string | null; extraction_source: string | null }) =>
      d.quality_score !== "high" || (d.extraction_source ?? "") !== "direct_event_page"
    );
    if (stale.length) {
      const { error } = await admin
        .from("wc_ticket_coverage")
        .update({ archived_at: new Date().toISOString(), archived_reason: `superseded_by_direct_event:${provider_event_id}`, active: false })
        .in("id", stale.map((d: { id: string }) => d.id));
      if (!error) archived_generic = stale.length;
    }
  }

  return {
    provider_event_id,
    title: event_name,
    stadium: s.stadium_name,
    kickoff: kickoff.toISOString(),
    image_url: ex.image_url ?? null,
    match_id,
    link_confidence,
    stadium_confidence,
    price_eur: single,
    upsertResult,
    archived_generic,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY is not configured");
    const body = await req.json().catch(() => ({}));
    const limit: number = Math.min(Math.max(Number(body.limit ?? 25), 1), 50);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: pending } = await admin
      .from("wc_ticombo_discovery_queue")
      .select("id, url, attempts")
      .eq("status", "pending")
      .order("discovered_at", { ascending: true })
      .limit(limit);

    const queue = (pending ?? []) as Array<{ id: string; url: string; attempts: number }>;
    const results: Array<Record<string, unknown>> = [];
    let ok = 0, failed = 0;

    for (const q of queue) {
      const scrapeUrl = forceQty1(q.url);
      const log: Record<string, unknown> = { url: q.url, scrape_url: scrapeUrl };
      try {
        const { data: ex, markdown } = await fcScrape(scrapeUrl);
        log.extracted = {
          provider_event_id: ex.provider_event_id ?? extractIdFromUrl(q.url),
          title: ex.event_name,
          kickoff: ex.kickoff_iso,
          stadium: ex.stadium_name,
          teams: [ex.home_team, ex.away_team],
          group_code: ex.group_code,
          price_payload: ex.lowest_single_ticket_price,
          md_min_price: minPriceFromMarkdown(markdown),
        };
        const meta = await validateAndUpsert(admin, q.url, ex, markdown);
        Object.assign(log, meta, { ok: true });
        await admin.from("wc_ticombo_discovery_queue").update({
          status: "done", processed_at: new Date().toISOString(), attempts: q.attempts + 1, result: log,
        }).eq("id", q.id);
        results.push(log);
        ok++;
      } catch (e) {
        const msg = String((e as Error).message ?? e).slice(0, 800);
        log.ok = false;
        log.error = msg;
        await admin.from("wc_ticombo_discovery_queue").update({
          status: q.attempts + 1 >= 3 ? "failed" : "pending",
          attempts: q.attempts + 1,
          last_error: msg,
          processed_at: new Date().toISOString(),
          result: log,
        }).eq("id", q.id);
        results.push(log);
        failed++;
      }
    }

    const { count: still_pending } = await admin
      .from("wc_ticombo_discovery_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    return new Response(JSON.stringify({
      ok: true,
      processed: queue.length,
      succeeded: ok,
      failed,
      still_pending: still_pending ?? 0,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
