// Crawl a batch of pending Ticombo event URLs, extract structured event data
// via Firecrawl, then validate + upsert into wc_ticket_coverage and link to
// the canonical FIFA fixture. Stadium-only fallback is rejected.
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
    provider_event_id: { type: "string", description: "The numeric Ticombo event id (from URL or page metadata)" },
    event_name: { type: "string", description: "Full event title, e.g. 'Mexico vs Canada — FIFA World Cup 2026'" },
    home_team: { type: "string" },
    away_team: { type: "string" },
    group_code: { type: "string", description: "Single letter A..L if it's a group stage match, else empty" },
    phase: { type: "string", description: "group_stage | round_of_32 | round_of_16 | quarter_final | semi_final | third_place | final | opening_match" },
    stadium_name: { type: "string" },
    city: { type: "string" },
    country: { type: "string" },
    kickoff_iso: { type: "string", description: "ISO 8601 kickoff datetime with timezone if available" },
    starting_price_eur: { type: "number" },
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
  starting_price_eur?: number;
  currency?: string;
  image_url?: string;
  ticket_url?: string;
};

const fcScrape = async (url: string): Promise<{ data: Extracted; markdown?: string }> => {
  const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown", { type: "json", schema: EVENT_SCHEMA, prompt: "Extract real event data from this Ticombo event page. Use only what is shown on the page; do not invent." }],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `firecrawl ${r.status}`);
  const data = (j.json ?? j.data?.json ?? {}) as Extracted;
  return { data, markdown: j.markdown ?? j.data?.markdown };
};

const extractIdFromUrl = (url: string): string | null => {
  const m = url.match(/-e?(\d{5,})(?:[/?#]|$)/i) ?? url.match(/\/(\d{6,})(?:[/?#]|$)/);
  return m ? m[1] : null;
};

const validateAndUpsert = async (admin: ReturnType<typeof createClient>, url: string, ex: Extracted) => {
  const provider_event_id = ex.provider_event_id?.trim() || extractIdFromUrl(url);
  if (!provider_event_id) throw new Error("no_event_id");
  const event_name = (ex.event_name ?? "").trim();
  if (!event_name) throw new Error("no_event_name");
  if (GENERIC_RE.test(event_name)) throw new Error("generic_title");
  if (!ex.kickoff_iso) throw new Error("no_kickoff");
  if (!ex.stadium_name) throw new Error("no_stadium");

  const kickoff = new Date(ex.kickoff_iso);
  if (isNaN(kickoff.getTime())) throw new Error("bad_kickoff_iso");

  // Resolve stadium via stadiums + stadium_aliases
  const folded = fold(ex.stadium_name);
  const { data: stadia } = await admin
    .from("stadiums")
    .select("id, slug, stadium_name, city, country, aliases")
    .eq("is_world_cup_host", true);
  let stadium = (stadia ?? []).find((s: { stadium_name: string; slug: string }) => fold(s.stadium_name) === folded || fold(s.slug) === folded);
  let stadium_confidence: "verified" | "alias_match" | "low" = stadium ? "verified" : "low";
  if (!stadium) {
    stadium = (stadia ?? []).find((s: { aliases: string[] | null }) => (s.aliases ?? []).some((a) => fold(a) === folded));
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

  // Find candidate FIFA fixture (no stadium-only fallback)
  const windowMs = 6 * 3600 * 1000;
  const { data: candidates } = await admin
    .from("matches")
    .select("id, date, home_team, away_team, group_code, stadium_id, fifa_match_number")
    .eq("competition", "FIFA World Cup 2026")
    .eq("fixture_origin", "official_import")
    .eq("stadium_id", s.id)
    .gte("date", new Date(kickoff.getTime() - windowMs).toISOString())
    .lte("date", new Date(kickoff.getTime() + windowMs).toISOString());

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
    starting_price: ex.starting_price_eur ?? null,
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

  if (existing) {
    await admin.from("wc_ticket_coverage").update(row).eq("id", (existing as { id: string }).id);
  } else {
    await admin.from("wc_ticket_coverage").insert(row);
  }
  return { match_id, link_confidence, stadium_confidence };
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
    const results: Array<{ url: string; ok: boolean; error?: string; meta?: unknown }> = [];
    let ok = 0, failed = 0;

    for (const q of queue) {
      try {
        const { data: ex } = await fcScrape(q.url);
        const meta = await validateAndUpsert(admin, q.url, ex);
        await admin.from("wc_ticombo_discovery_queue").update({
          status: "done", processed_at: new Date().toISOString(), attempts: q.attempts + 1, result: meta,
        }).eq("id", q.id);
        results.push({ url: q.url, ok: true, meta });
        ok++;
      } catch (e) {
        const msg = String((e as Error).message ?? e).slice(0, 500);
        await admin.from("wc_ticombo_discovery_queue").update({
          status: q.attempts + 1 >= 3 ? "failed" : "pending",
          attempts: q.attempts + 1,
          last_error: msg,
          processed_at: new Date().toISOString(),
        }).eq("id", q.id);
        results.push({ url: q.url, ok: false, error: msg });
        failed++;
      }
    }

    const { count: still_pending } = await admin
      .from("wc_ticombo_discovery_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    return new Response(JSON.stringify({ ok: true, processed: queue.length, succeeded: ok, failed, still_pending: still_pending ?? 0, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
