// Admin-only: apply (or partially apply) a pending WC match import batch.
//
// Input: { batch_id, accepted_slugs?: string[] }
// Inserts matches with publication_status='draft', lifecycle='upcoming',
// competition='FIFA World Cup 2026', ticket_status='not_released' and
// empty ticket_sources. Ticket enrichment is a separate downstream pipeline.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await userClient
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { batch_id, accepted_slugs } = await req.json().catch(() => ({}));
    if (!batch_id) {
      return new Response(JSON.stringify({ error: "missing_batch_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: batch, error: batchErr } = await admin
      .from("wc_match_import_batches")
      .select("id, status, proposed")
      .eq("id", batch_id)
      .single();
    if (batchErr || !batch) throw batchErr || new Error("batch_not_found");
    if (batch.status === "applied") {
      return new Response(JSON.stringify({ error: "already_applied" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const proposed = (batch.proposed as any[]) || [];
    const acceptSet = accepted_slugs ? new Set(accepted_slugs as string[]) : null;
    const toInsert = proposed
      .filter((p) => p.status === "ready")
      .filter((p) => !acceptSet || acceptSet.has(p.row.slug))
      .map((p) => ({
        id: `wc_${p.row.slug}`,
        slug: p.row.slug,
        competition: "FIFA World Cup 2026",
        country: p.row.country,
        date: p.row.kickoffUtc,
        kickoff_local: p.row.kickoffLocal ?? null,
        stadium: p.stadium_name || p.row.venue,
        stadium_id: p.stadium_id,
        city: p.row.city,
        home_team: p.row.homeTeam,
        away_team: p.row.awayTeam,
        home_short: p.row.homeShort,
        away_short: p.row.awayShort,
        phase: p.row.phase,
        matchday: p.row.matchday,
        group_code: p.row.groupCode ?? null,
        ticket_status: "not_released",
        ticket_sources: [],
        publication_status: "draft",
        lifecycle_status: "upcoming",
        verified: true,
        import_source: p.row.import_source || "fifa_seed",
        import_batch_id: batch.id,
      }));

    let inserted = 0;
    if (toInsert.length) {
      const { error: upErr, count } = await admin
        .from("matches")
        .upsert(toInsert, { onConflict: "slug", ignoreDuplicates: true, count: "exact" });
      if (upErr) throw upErr;
      inserted = count ?? toInsert.length;
    }

    await admin
      .from("wc_match_import_batches")
      .update({
        status: "applied",
        applied_at: new Date().toISOString(),
        applied_by: user.id,
        summary: {
          ...((batch as any).summary || {}),
          inserted,
          attempted: toInsert.length,
        },
      })
      .eq("id", batch.id);

    return new Response(JSON.stringify({ inserted, attempted: toInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("wc-import-apply error:", err);
    const message =
      err instanceof Error
        ? err.message
        : err && typeof err === "object"
          ? err.message || err.details || err.hint || JSON.stringify(err)
          : String(err);
    return new Response(JSON.stringify({ error: message, raw: err }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
