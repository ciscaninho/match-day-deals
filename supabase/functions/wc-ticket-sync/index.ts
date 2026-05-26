// wc-ticket-sync — enrich World Cup ticket coverage from existing URLs (best-effort scrape).
// Auth: admins only. Never creates fake matches; only links match_id when a real WC fixture matches.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_FROM_TEXT = (t: string): string | null => {
  const s = t.toLowerCase();
  if (s.includes("opening")) return "opening_match";
  if (s.includes("final") && !s.includes("semi") && !s.includes("quarter") && !s.includes("third")) return "final";
  if (s.includes("third")) return "third_place";
  if (s.includes("semi")) return "semi_final";
  if (s.includes("quarter")) return "quarter_final";
  if (s.includes("round of 16") || s.includes("r16")) return "round_of_16";
  if (s.includes("round of 32") || s.includes("r32")) return "round_of_32";
  if (s.includes("group")) return "group_stage";
  return null;
};

function extractMeta(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  const m = html.match(re);
  return m?.[1] ?? null;
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

function parseMatchup(title: string | null): { home: string | null; away: string | null } {
  if (!title) return { home: null, away: null };
  const cleaned = title.replace(/\s*[-–|·].*$/, "").trim();
  const m = cleaned.match(/^(.+?)\s+(?:vs?\.?|v|–|-)\s+(.+)$/i);
  if (!m) return { home: null, away: null };
  return { home: m[1].trim(), away: m[2].trim() };
}

async function scrapeEvent(url: string): Promise<{
  event_name: string | null;
  home_label: string | null;
  away_label: string | null;
  event_date: string | null;
  image_url: string | null;
  starting_price: number | null;
  event_status: string | null;
} | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 FootTicketBot" }, redirect: "follow" });
    if (!res.ok) return null;
    const html = await res.text();

    const title = extractMeta(html, "og:title") ?? html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null;
    const image = extractMeta(html, "og:image");
    const desc = extractMeta(html, "og:description");

    let event_date: string | null = null;
    let event_name: string | null = title?.trim() ?? null;
    let starting_price: number | null = null;
    let event_status: string | null = null;

    for (const block of extractJsonLd(html)) {
      const arr = Array.isArray(block) ? block : [block];
      for (const n of arr) {
        const t = String(n["@type"] ?? "").toLowerCase();
        if (t.includes("event")) {
          event_name = event_name ?? (typeof n.name === "string" ? n.name : null);
          if (typeof n.startDate === "string") {
            const d = new Date(n.startDate);
            if (!Number.isNaN(d.getTime())) event_date = d.toISOString().slice(0, 10);
          }
          const offers = Array.isArray(n.offers) ? n.offers : n.offers ? [n.offers] : [];
          for (const o of offers) {
            const p = Number(o.lowPrice ?? o.price);
            if (Number.isFinite(p) && p > 0 && (starting_price == null || p < starting_price)) starting_price = p;
          }
        }
      }
    }

    if (!event_status && (event_name || desc)) {
      event_status = STATUS_FROM_TEXT(`${event_name ?? ""} ${desc ?? ""}`);
    }

    const { home, away } = parseMatchup(event_name);

    return {
      event_name,
      home_label: home,
      away_label: away,
      event_date,
      image_url: image,
      starting_price,
      event_status,
    };
  } catch {
    return null;
  }
}

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
    const provider = body.provider as string | undefined;
    const limit = Math.min(Number(body.limit ?? 25), 100);

    let q = supabase.from("wc_ticket_coverage").select("*").eq("status", "active");
    if (provider) q = q.eq("provider", provider);
    const { data: rows, error } = await q.limit(limit);
    if (error) throw error;

    // Pre-fetch WC fixtures for match linking
    const { data: wcMatches } = await supabase
      .from("matches")
      .select("id,date,stadium,home_team,away_team")
      .ilike("competition", "%world cup%");

    const stadiumDateIndex = new Map<string, Array<{ id: string; date: string; home: string; away: string }>>();
    for (const m of (wcMatches ?? []) as any[]) {
      const day = m.date ? String(m.date).slice(0, 10) : null;
      if (!day || !m.stadium) continue;
      const key = `${String(m.stadium).toLowerCase()}|${day}`;
      const arr = stadiumDateIndex.get(key) ?? [];
      arr.push({ id: m.id, date: day, home: m.home_team, away: m.away_team });
      stadiumDateIndex.set(key, arr);
    }

    const results: any[] = [];
    let scanned = 0, enriched = 0, linked = 0, failed = 0;

    for (const r of rows as any[]) {
      scanned++;
      const scrape = await scrapeEvent(r.url);
      if (!scrape) {
        failed++;
        await supabase.from("wc_ticket_coverage").update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "scrape_failed",
        }).eq("id", r.id);
        results.push({ id: r.id, status: "scrape_failed" });
        continue;
      }

      const patch: Record<string, unknown> = {
        last_sync_at: new Date().toISOString(),
        last_sync_status: "ok",
        last_price_check: new Date().toISOString(),
      };
      if (!r.event_name && scrape.event_name) patch.event_name = scrape.event_name;
      if (!r.home_label && scrape.home_label) patch.home_label = scrape.home_label;
      if (!r.away_label && scrape.away_label) patch.away_label = scrape.away_label;
      if (!r.event_date && scrape.event_date) patch.event_date = scrape.event_date;
      if (!r.image_url && scrape.image_url) patch.image_url = scrape.image_url;
      if (!r.event_status && scrape.event_status) patch.event_status = scrape.event_status;
      if (scrape.starting_price != null) patch.starting_price = scrape.starting_price;

      // Match linking
      const day = (patch.event_date ?? r.event_date) as string | null;
      if (!r.match_id && day && r.stadium_name) {
        const key = `${String(r.stadium_name).toLowerCase()}|${day}`;
        const candidates = stadiumDateIndex.get(key) ?? [];
        const home = (patch.home_label ?? r.home_label) as string | null;
        const away = (patch.away_label ?? r.away_label) as string | null;
        let pick = candidates[0];
        if (home && away) {
          const found = candidates.find((c) =>
            (c.home?.toLowerCase().includes(home.toLowerCase()) || home.toLowerCase().includes((c.home ?? "").toLowerCase())) &&
            (c.away?.toLowerCase().includes(away.toLowerCase()) || away.toLowerCase().includes((c.away ?? "").toLowerCase()))
          );
          if (found) pick = found;
        }
        if (pick) { patch.match_id = pick.id; linked++; }
      }

      // Generate event_slug if missing and we now have date + matchup
      if (!r.event_slug && (patch.event_date ?? r.event_date) && ((patch.home_label ?? r.home_label) || (patch.event_name ?? r.event_name))) {
        const seed = `${patch.event_date ?? r.event_date}-${(patch.home_label ?? r.home_label ?? patch.event_name ?? r.event_name ?? "wc").toString()}-${(patch.away_label ?? r.away_label ?? r.stadium_slug)}`;
        patch.event_slug = seed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
      }

      const { error: upErr } = await supabase.from("wc_ticket_coverage").update(patch).eq("id", r.id);
      if (upErr) { failed++; results.push({ id: r.id, status: "update_failed", error: upErr.message }); continue; }
      enriched++;
      results.push({ id: r.id, status: "ok", patched: Object.keys(patch) });
    }

    return new Response(JSON.stringify({ scanned, enriched, linked, failed, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
