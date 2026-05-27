// wc-groups-resync — admin-only.
// Sweeps every WC fixture and replaces unresolved placeholders (A1..L4)
// from wc_group_slots, deletes duplicate seed rows, and returns a full
// validation report (counts per group, duplicates, unresolved placeholders).
//
// Body: { dry_run?: boolean, delete_duplicates?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLACEHOLDER = /^[A-L][1-4]$/;
const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

const SHORT_OVERRIDES: Record<string, string> = {
  "Mexico": "MEX", "Canada": "CAN", "United States": "USA", "USA": "USA",
  "South Africa": "RSA", "South Korea": "KOR", "Korea Republic": "KOR",
  "Czech Republic": "CZE", "Czechia": "CZE",
  "Switzerland": "SUI", "Qatar": "QAT",
  "Bosnia and Herzgovina": "BIH", "Bosnia and Herzegovina": "BIH",
};

function shortFor(name: string, fallback: string | null): string {
  if (SHORT_OVERRIDES[name]) return SHORT_OVERRIDES[name];
  if (fallback && fallback.length >= 2 && fallback.length <= 4) return fallback.toUpperCase();
  return name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "not_admin" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;
    const deleteDuplicates = body?.delete_duplicates !== false; // default true

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load all WC fixtures + all slots in parallel
    const [matchesRes, slotsRes] = await Promise.all([
      admin.from("matches").select("id, home_team, away_team, home_short, away_short, group_code, matchday, phase").eq("competition", "FIFA World Cup 2026"),
      admin.from("wc_group_slots" as never).select("group_code, slot_position, team_name, team_short"),
    ]);
    if (matchesRes.error) throw matchesRes.error;
    if (slotsRes.error) throw slotsRes.error;

    const slotMap = new Map<string, { name: string; short: string }>();
    for (const s of (slotsRes.data as any[]) ?? []) {
      if (!s.team_name) continue;
      const key = `${(s.group_code as string).toUpperCase()}${s.slot_position}`;
      slotMap.set(key, { name: s.team_name, short: shortFor(s.team_name, s.team_short) });
    }

    const matches = (matchesRes.data ?? []) as any[];

    // 1) Sweep: replace unresolved placeholders
    const updates: { id: string; patch: Record<string, unknown> }[] = [];
    const unresolved: { id: string; placeholder: string; side: "home" | "away" }[] = [];
    for (const m of matches) {
      const patch: Record<string, unknown> = {};
      const ht = (m.home_team ?? "").trim();
      const at = (m.away_team ?? "").trim();
      if (PLACEHOLDER.test(ht)) {
        const slot = slotMap.get(ht);
        if (slot) { patch.home_team = slot.name; patch.home_short = slot.short; patch.home_team_status = "confirmed"; }
        else unresolved.push({ id: m.id, placeholder: ht, side: "home" });
      } else {
        // fix collisions on shorts when name is real but short still equals placeholder or is wrong
        const groupCode = m.group_code as string | null;
        if (groupCode) {
          // find slot for this team
          const slot = [...slotMap.entries()].find(([k, v]) => k.startsWith(groupCode) && v.name === ht)?.[1];
          if (slot && m.home_short !== slot.short) { patch.home_short = slot.short; }
        }
      }
      if (PLACEHOLDER.test(at)) {
        const slot = slotMap.get(at);
        if (slot) { patch.away_team = slot.name; patch.away_short = slot.short; patch.away_team_status = "confirmed"; }
        else unresolved.push({ id: m.id, placeholder: at, side: "away" });
      } else {
        const groupCode = m.group_code as string | null;
        if (groupCode) {
          const slot = [...slotMap.entries()].find(([k, v]) => k.startsWith(groupCode) && v.name === at)?.[1];
          if (slot && m.away_short !== slot.short) { patch.away_short = slot.short; }
        }
      }
      if (Object.keys(patch).length > 0) updates.push({ id: m.id, patch });
    }

    let updated = 0;
    if (!dryRun) {
      for (const u of updates) {
        const { error } = await admin.from("matches").update(u.patch).eq("id", u.id);
        if (!error) updated++;
      }
    }

    // 2) Detect duplicates: any group with > 6 fixtures, and any fixture with id NOT matching canonical pattern
    const canonicalPattern = /^wc_wc2026-g[a-l]-md[1-3]-[1-4]v[1-4]$/;
    const byGroup: Record<string, any[]> = {};
    for (const m of matches) {
      if (!m.group_code) continue;
      (byGroup[m.group_code] ??= []).push(m);
    }
    const duplicates: { id: string; group: string; reason: string }[] = [];
    for (const g of GROUPS) {
      const rows = byGroup[g] ?? [];
      // If group has > 6 rows, mark non-canonical IDs as duplicates
      if (rows.length > 6) {
        for (const r of rows) {
          if (!canonicalPattern.test(r.id)) duplicates.push({ id: r.id, group: g, reason: "non_canonical_id_in_oversized_group" });
        }
      }
    }

    let duplicates_deleted = 0;
    if (!dryRun && deleteDuplicates && duplicates.length > 0) {
      const { error, count } = await admin.from("matches").delete({ count: "exact" }).in("id", duplicates.map((d) => d.id));
      if (!error) duplicates_deleted = count ?? duplicates.length;
    }

    // 3) Re-read after mutations for the report
    const finalMatches = dryRun ? matches : (await admin.from("matches").select("id, home_team, away_team, group_code, phase").eq("competition", "FIFA World Cup 2026")).data ?? [];

    const groupReport: Record<string, { count: number; expected: number; ok: boolean; unresolved: string[] }> = {};
    for (const g of GROUPS) {
      const rows = (finalMatches as any[]).filter((m) => m.group_code === g);
      const unresolvedHere = rows.flatMap((r) => {
        const out: string[] = [];
        if (PLACEHOLDER.test((r.home_team ?? "").trim())) out.push(r.home_team);
        if (PLACEHOLDER.test((r.away_team ?? "").trim())) out.push(r.away_team);
        return out;
      });
      groupReport[g] = { count: rows.length, expected: 6, ok: rows.length === 6 && unresolvedHere.length === 0, unresolved: unresolvedHere };
    }

    const invalidGroups = Object.entries(groupReport).filter(([, v]) => !v.ok).map(([k]) => k);

    return new Response(JSON.stringify({
      ok: true,
      dry_run: dryRun,
      slots_filled: slotMap.size,
      placeholder_updates: updates.length,
      fixtures_updated: updated,
      duplicates_found: duplicates,
      duplicates_deleted,
      unresolved_remaining: unresolved.filter((u) => !slotMap.has(u.placeholder)),
      group_report: groupReport,
      invalid_groups: invalidGroups,
      valid: invalidGroups.length === 0,
    }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
