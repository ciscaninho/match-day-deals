// Official Fixture Audit — compares imported WC2026 fixtures against the
// canonical resolution layer (host stadiums + stadium_aliases) and surfaces
// every kind of data-quality issue that would break the public rollout.
//
// This audit is read-only. It NEVER mutates fixtures (they are locked).
// It writes nothing — the admin UI consumes the report and lets the user
// resolve aliases / link stadiums through dedicated endpoints.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const WC = "FIFA World Cup 2026";
const WC_WINDOW_START = Date.parse("2026-06-11T00:00:00Z");
const WC_WINDOW_END   = Date.parse("2026-07-19T23:59:59Z");

const fold = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

type Issue = {
  match_id: string;
  slug: string | null;
  kind: string;
  severity: "high" | "med" | "low";
  expected: string | null;
  current: string | null;
  source: string;
  fix_hint: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    const [matchesRes, hostsRes, aliasesRes, covRes] = await Promise.all([
      sb.from("matches")
        .select("id,slug,home_team,away_team,home_team_status,away_team_status,date,stadium,stadium_id,city,country,phase,group_code,fixture_origin,fifa_match_number")
        .eq("competition", WC),
      sb.from("stadiums")
        .select("id,slug,stadium_name,city,country,aliases,is_world_cup_host")
        .eq("is_world_cup_host", true)
        .is("archived_at", null),
      sb.from("stadium_aliases").select("id,provider_name,canonical_stadium_id,confidence,manually_verified"),
      sb.from("wc_ticket_coverage" as never).select("match_id").not("match_id", "is", null),
    ]);

    if (matchesRes.error) throw matchesRes.error;
    if (hostsRes.error) throw hostsRes.error;

    const matches = matchesRes.data ?? [];
    const hosts = (hostsRes.data ?? []) as any[];
    const aliases = (aliasesRes.data ?? []) as any[];
    const coveredIds = new Set(((covRes.data ?? []) as any[]).map(c => c.match_id));

    // Build resolution index
    const hostByName = new Map<string, any>();
    const hostById = new Map<string, any>();
    for (const h of hosts) {
      hostById.set(h.id, h);
      hostByName.set(fold(h.stadium_name), h);
      for (const a of (h.aliases ?? [])) hostByName.set(fold(a), h);
    }
    const aliasByName = new Map<string, any>();
    for (const a of aliases) aliasByName.set(fold(a.provider_name), a);

    const resolveStadium = (text: string | null) => {
      if (!text) return { stadium: null as any, via: "none" as const, confidence: "low" as const, verified: false };
      const f = fold(text);
      const direct = hostByName.get(f);
      if (direct) return { stadium: direct, via: "name" as const, confidence: "high" as const, verified: true };
      const alias = aliasByName.get(f);
      if (alias) {
        const s = hostById.get(alias.canonical_stadium_id);
        return { stadium: s ?? null, via: "alias" as const, confidence: alias.confidence as any, verified: !!alias.manually_verified };
      }
      return { stadium: null as any, via: "none" as const, confidence: "low" as const, verified: false };
    };

    const issues: Issue[] = [];
    const PLACEHOLDER = /^[A-L][1-4]$|^W\d+$|^L\d+$|^RU[A-L]$|^TBD$/i;

    let kpi_stadium_mismatch = 0;
    let kpi_unresolved_alias = 0;
    let kpi_kickoff_mismatch = 0;
    let kpi_missing_coverage = 0;
    let kpi_unresolved_placeholders = 0;
    let kpi_official = 0;
    let kpi_generated = 0;
    let kpi_verified_stadium_mappings = 0;
    let kpi_total = matches.length;
    let sum_confidence = 0; let count_confidence = 0;

    for (const m of matches) {
      const r = resolveStadium(m.stadium);
      if (m.fixture_origin === "official_import") kpi_official++; else kpi_generated++;
      if (r.via !== "none") {
        const score = r.confidence === "high" ? 1 : r.confidence === "medium" ? 0.6 : 0.3;
        sum_confidence += score; count_confidence++;
        if (r.verified) kpi_verified_stadium_mappings++;
      }

      // Unresolved alias / missing host
      if (!r.stadium) {
        kpi_unresolved_alias++;
        issues.push({
          match_id: m.id, slug: m.slug, kind: "unresolved_alias", severity: "high",
          expected: "Linked to a host stadium (via name or alias)",
          current: m.stadium ?? "(empty)",
          source: "stadium_aliases",
          fix_hint: `Create an alias mapping "${m.stadium}" → canonical host stadium`,
        });
      } else {
        // Stadium id mismatch
        if (m.stadium_id && m.stadium_id !== r.stadium.id) {
          kpi_stadium_mismatch++;
          issues.push({
            match_id: m.id, slug: m.slug, kind: "stadium_id_mismatch", severity: "med",
            expected: r.stadium.stadium_name, current: `stadium_id=${m.stadium_id}`,
            source: r.via, fix_hint: "Relink match.stadium_id to canonical stadium",
          });
        }
        // City mismatch (folded)
        if (fold(m.city) && fold(r.stadium.city) && fold(m.city) !== fold(r.stadium.city)) {
          issues.push({
            match_id: m.id, slug: m.slug, kind: "city_mismatch", severity: "low",
            expected: r.stadium.city, current: m.city, source: r.via,
            fix_hint: "Verify provider city naming vs canonical",
          });
        }
        if (!r.verified && r.via === "alias") {
          issues.push({
            match_id: m.id, slug: m.slug, kind: "alias_unverified", severity: "low",
            expected: r.stadium.stadium_name, current: m.stadium,
            source: "stadium_aliases", fix_hint: "Mark alias as verified in resolver",
          });
        }
      }

      // Placeholder team names
      if (PLACEHOLDER.test((m.home_team ?? "").trim()) || PLACEHOLDER.test((m.away_team ?? "").trim())) {
        kpi_unresolved_placeholders++;
        issues.push({
          match_id: m.id, slug: m.slug, kind: "unresolved_placeholder", severity: "med",
          expected: "Confirmed team name",
          current: `${m.home_team} vs ${m.away_team}`,
          source: "wc_group_slots",
          fix_hint: "Propagate confirmed team via Groups tab",
        });
      }

      // Kickoff window
      const t = m.date ? Date.parse(m.date) : NaN;
      if (!Number.isFinite(t) || t < WC_WINDOW_START || t > WC_WINDOW_END) {
        kpi_kickoff_mismatch++;
        issues.push({
          match_id: m.id, slug: m.slug, kind: "kickoff_out_of_window", severity: "high",
          expected: "Between 2026-06-11 and 2026-07-19 UTC",
          current: m.date, source: "FIFA window",
          fix_hint: "Re-import official fixture (locked)",
        });
      }

      // Missing coverage
      if (!coveredIds.has(m.id)) {
        kpi_missing_coverage++;
        issues.push({
          match_id: m.id, slug: m.slug, kind: "missing_provider_mapping", severity: "med",
          expected: "≥1 wc_ticket_coverage row linked",
          current: "0 linked",
          source: "wc_ticket_coverage",
          fix_hint: "Run ticket sync / link coverage in Coverage tab",
        });
      }
    }

    const verified_pct = kpi_total ? Math.round((kpi_verified_stadium_mappings / kpi_total) * 100) : 0;
    const confidence_pct = count_confidence ? Math.round((sum_confidence / count_confidence) * 100) : 0;

    return new Response(JSON.stringify({
      ok: true,
      generated_at: new Date().toISOString(),
      kpis: {
        total_fixtures: kpi_total,
        official: kpi_official,
        generated: kpi_generated,
        stadium_mismatches: kpi_stadium_mismatch,
        unresolved_aliases: kpi_unresolved_alias,
        kickoff_mismatches: kpi_kickoff_mismatch,
        missing_coverage: kpi_missing_coverage,
        unresolved_placeholders: kpi_unresolved_placeholders,
        verified_stadium_mappings_pct: verified_pct,
        provider_confidence_pct: confidence_pct,
        issue_count: issues.length,
      },
      issues,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
