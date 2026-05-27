import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GENERIC_RE = /^\s*(Match\s+\d+\s+Group\s+[A-L]|Group\s+Stage\s+Match|World\s+Cup\s+Match)/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Fetch all active rows
    const { data: rows, error } = await admin
      .from("wc_ticket_coverage")
      .select("id,event_name,event_date,stadium_slug,provider_event_id,extraction_source,stadium_confidence,quality_score,archived_at")
      .is("archived_at", null);
    if (error) throw error;

    // Cluster map (stadium+date)
    const cluster = new Map<string, number>();
    for (const r of rows ?? []) {
      if (!r.event_date || !r.stadium_slug) continue;
      const k = `${r.stadium_slug}|${String(r.event_date).slice(0,10)}`;
      cluster.set(k, (cluster.get(k) ?? 0) + 1);
    }

    // Touch each row so the trigger recomputes quality
    let updated = 0;
    for (const r of rows ?? []) {
      const { error: uErr } = await admin
        .from("wc_ticket_coverage")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", r.id);
      if (!uErr) updated++;
    }

    // Compute KPIs after recompute
    const { data: after } = await admin
      .from("wc_ticket_coverage")
      .select("quality_score,quality_reasons,archived_at,event_name,provider_event_id,stadium_confidence,stadium_slug,event_date");

    const kpis = { high: 0, medium: 0, low: 0, archived: 0, suspicious_clusters: 0, generic_titles: 0, missing_event_id: 0, stadium_fallback: 0 };
    const seenCluster = new Set<string>();
    for (const r of after ?? []) {
      if (r.archived_at) { kpis.archived++; continue; }
      if (r.quality_score === "high") kpis.high++;
      else if (r.quality_score === "medium") kpis.medium++;
      else kpis.low++;
      if (r.event_name && GENERIC_RE.test(r.event_name)) kpis.generic_titles++;
      if (!r.provider_event_id) kpis.missing_event_id++;
      if (r.stadium_confidence === "low") kpis.stadium_fallback++;
      if (r.event_date && r.stadium_slug) {
        const k = `${r.stadium_slug}|${String(r.event_date).slice(0,10)}`;
        if ((cluster.get(k) ?? 0) > 5 && !seenCluster.has(k)) { kpis.suspicious_clusters++; seenCluster.add(k); }
      }
    }

    return new Response(JSON.stringify({ ok: true, updated, kpis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
