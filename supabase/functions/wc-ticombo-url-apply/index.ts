// Applies a reviewed list of {match_id, ticombo_url} mappings.
// Admin-only. Validates each URL belongs to ticombo.com.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Mapping = { match_id: string; ticombo_url: string | null };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userRes } = await supabase.auth.getUser(token);
    const userId = userRes?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const mappings: Mapping[] = Array.isArray(body?.mappings) ? body.mappings : [];
    if (mappings.length === 0) {
      return new Response(JSON.stringify({ error: "no_mappings" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: Array<{ match_id: string; status: "updated" | "cleared" | "skipped"; reason?: string }> = [];
    for (const m of mappings) {
      if (!m.match_id) { results.push({ match_id: String(m.match_id), status: "skipped", reason: "missing_match_id" }); continue; }
      let value: string | null = null;
      if (m.ticombo_url) {
        const url = String(m.ticombo_url).trim();
        if (!/^https:\/\/(www\.)?ticombo\.com\//i.test(url)) {
          results.push({ match_id: m.match_id, status: "skipped", reason: "invalid_url" });
          continue;
        }
        value = url;
      }
      const { error } = await supabase
        .from("matches")
        .update({ ticombo_url: value, updated_at: new Date().toISOString() })
        .eq("id", m.match_id)
        .eq("competition", "FIFA World Cup 2026");
      if (error) {
        results.push({ match_id: m.match_id, status: "skipped", reason: error.message });
      } else {
        results.push({ match_id: m.match_id, status: value ? "updated" : "cleared" });
      }
    }

    const updated = results.filter((r) => r.status === "updated").length;
    const cleared = results.filter((r) => r.status === "cleared").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    return new Response(JSON.stringify({ updated, cleared, skipped, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unhandled", detail: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
