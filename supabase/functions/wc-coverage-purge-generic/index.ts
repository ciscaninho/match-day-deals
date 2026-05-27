import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GENERIC_RE = /^\s*(Match\s+\d+\s+Group\s+[A-L]|Group\s+Stage\s+Match|World\s+Cup\s+Match)/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const dryRun: boolean = body.dry_run !== false; // default true for safety
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: rows, error } = await admin
      .from("wc_ticket_coverage")
      .select("id,event_name,event_date,stadium_slug,provider_event_id,extraction_source,stadium_confidence")
      .is("archived_at", null);
    if (error) throw error;

    // Cluster lookup
    const cluster = new Map<string, number>();
    for (const r of rows ?? []) {
      if (!r.event_date || !r.stadium_slug) continue;
      const k = `${r.stadium_slug}|${String(r.event_date).slice(0,10)}`;
      cluster.set(k, (cluster.get(k) ?? 0) + 1);
    }

    const toArchive: { id: string; reason: string }[] = [];
    const counts = { generic_title: 0, no_event_id: 0, generic_extraction: 0, bulk_cluster_lowconf: 0 };

    for (const r of rows ?? []) {
      const reasons: string[] = [];
      if (r.event_name && GENERIC_RE.test(r.event_name)) { reasons.push("generic_title"); counts.generic_title++; }
      if ((!r.provider_event_id || !String(r.provider_event_id).trim()) && r.extraction_source !== "manual") {
        reasons.push("no_event_id"); counts.no_event_id++;
      }
      if (r.extraction_source === "schedule_page" || r.extraction_source === "search_page") {
        reasons.push("generic_extraction"); counts.generic_extraction++;
      }
      if (r.stadium_confidence === "low" && r.event_date && r.stadium_slug) {
        const k = `${r.stadium_slug}|${String(r.event_date).slice(0,10)}`;
        if ((cluster.get(k) ?? 0) > 5) { reasons.push("bulk_cluster_lowconf"); counts.bulk_cluster_lowconf++; }
      }
      if (reasons.length) toArchive.push({ id: r.id, reason: reasons.join(",") });
    }

    let archived = 0;
    if (!dryRun && toArchive.length) {
      for (const t of toArchive) {
        const { error: uErr } = await admin
          .from("wc_ticket_coverage")
          .update({ archived_at: new Date().toISOString(), archived_reason: t.reason, active: false, status: "archived" })
          .eq("id", t.id);
        if (!uErr) archived++;
      }
    }

    return new Response(JSON.stringify({ ok: true, dry_run: dryRun, candidates: toArchive.length, archived, counts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
