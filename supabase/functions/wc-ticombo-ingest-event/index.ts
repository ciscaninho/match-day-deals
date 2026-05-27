// Strict ingestion: only accepts a direct Ticombo event page payload.
// Admin pastes URL + extracted metadata via the admin UI; this function validates
// and links to the canonical FIFA fixture using kickoff proximity + stadium alias
// + optional group/teams. Stadium-only matching is rejected.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GENERIC_RE = /^\s*(Match\s+\d+\s+Group\s+[A-L]|Group\s+Stage\s+Match|World\s+Cup\s+Match)/i;
const BAD_PATH_RE = /\/(schedule|search|group-stage|tournaments?|categories?)(\/|$)/i;

const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const {
      url,
      provider_event_id,
      event_name,
      event_date, // ISO
      stadium_name,
      home_label,
      away_label,
      group_code,
      starting_price,
      currency = "EUR",
      image_url,
      ticket_url,
      provider = "ticombo",
    } = body ?? {};

    // ---- strict validation ----
    if (!url || typeof url !== "string") throw new Error("url required");
    if (BAD_PATH_RE.test(url)) throw new Error("rejected: URL looks like a schedule/search/landing page");
    if (!provider_event_id || !String(provider_event_id).trim()) throw new Error("rejected: provider_event_id missing");
    if (!event_name) throw new Error("rejected: event_name missing");
    if (GENERIC_RE.test(event_name)) throw new Error("rejected: generic placeholder title");
    if (!event_date) throw new Error("rejected: event_date missing");
    if (!stadium_name) throw new Error("rejected: stadium_name missing");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // ---- resolve stadium via stadiums + stadium_aliases ----
    const folded = fold(stadium_name);
    const { data: stadia } = await admin
      .from("stadiums")
      .select("id, slug, stadium_name, city, country, aliases")
      .eq("is_world_cup_host", true);
    let stadium = (stadia ?? []).find((s) => fold(s.stadium_name) === folded || fold(s.slug) === folded);
    let stadium_confidence: "verified" | "alias_match" | "low" = stadium ? "verified" : "low";
    if (!stadium) {
      stadium = (stadia ?? []).find((s) => (s.aliases ?? []).some((a: string) => fold(a) === folded));
      if (stadium) stadium_confidence = "alias_match";
    }
    if (!stadium) {
      const { data: aliases } = await admin
        .from("stadium_aliases")
        .select("canonical_stadium_id, provider_name")
        .ilike("provider_name", stadium_name);
      const aliasHit = (aliases ?? [])[0];
      if (aliasHit) {
        const s = (stadia ?? []).find((x) => x.id === aliasHit.canonical_stadium_id);
        if (s) { stadium = s; stadium_confidence = "alias_match"; }
      }
    }
    if (!stadium) throw new Error(`rejected: stadium "${stadium_name}" not resolvable (no canonical match or alias)`);

    // ---- find candidate FIFA fixture (no stadium-only fallback) ----
    const kickoff = new Date(event_date);
    const windowMs = 6 * 3600 * 1000;
    const { data: candidates } = await admin
      .from("matches")
      .select("id, date, home_team, away_team, group_code, stadium_id, fifa_match_number, fixture_origin")
      .eq("competition", "FIFA World Cup 2026")
      .eq("fixture_origin", "official_import")
      .eq("stadium_id", stadium.id)
      .gte("date", new Date(kickoff.getTime() - windowMs).toISOString())
      .lte("date", new Date(kickoff.getTime() + windowMs).toISOString());

    let match_id: string | null = null;
    let link_confidence: "exact" | "high" | "medium" | "low" = "low";
    for (const c of candidates ?? []) {
      const diffMin = Math.abs(new Date(c.date).getTime() - kickoff.getTime()) / 60000;
      const teamMatch =
        home_label && away_label &&
        ((fold(c.home_team).includes(fold(home_label)) || fold(home_label).includes(fold(c.home_team))) &&
         (fold(c.away_team).includes(fold(away_label)) || fold(away_label).includes(fold(c.away_team))));
      if (diffMin <= 15 && teamMatch) { match_id = c.id; link_confidence = "exact"; break; }
      if (diffMin <= 120 && group_code && c.group_code === group_code) { match_id = c.id; link_confidence = "high"; }
      else if (!match_id && diffMin <= 12 * 60) { match_id = c.id; link_confidence = "medium"; }
    }
    // Stadium-only fallback intentionally NOT allowed.

    const event_slug = `ticombo-${String(provider_event_id).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    const row = {
      provider,
      provider_event_id: String(provider_event_id),
      url,
      ticket_url: ticket_url ?? url,
      event_name,
      event_slug,
      event_date: kickoff.toISOString(),
      home_label: home_label ?? null,
      away_label: away_label ?? null,
      stadium_slug: stadium.slug,
      stadium_name: stadium.stadium_name,
      city: stadium.city,
      country: stadium.country,
      starting_price: starting_price ?? null,
      currency,
      image_url: image_url ?? null,
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
      .eq("provider", provider)
      .eq("provider_event_id", String(provider_event_id))
      .maybeSingle();

    let saved;
    if (existing) {
      const { data, error } = await admin.from("wc_ticket_coverage").update(row).eq("id", existing.id).select().single();
      if (error) throw error;
      saved = data;
    } else {
      const { data, error } = await admin.from("wc_ticket_coverage").insert(row).select().single();
      if (error) throw error;
      saved = data;
    }

    return new Response(JSON.stringify({ ok: true, row: saved, link_confidence, stadium_confidence }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
