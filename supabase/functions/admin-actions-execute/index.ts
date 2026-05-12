// Admin Actions Execute — validates admin, executes a proposed action, captures undo payload
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-locale",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const isFrench = (locale?: string | null) => (locale || "").toLowerCase().startsWith("fr");

const quoteList = (items: string[]) => items.map((item) => `\`${item}\``).join(", ");

const sumReassigned = (reassigned: Record<string, number> | undefined) =>
  Object.values(reassigned || {}).reduce((acc, value) => acc + Number(value || 0), 0);

function buildAssistantMessage(kind: string, result: any, locale?: string | null) {
  const fr = isFrench(locale);

  if (kind === "merge_stadium_duplicate") {
    const canonical = result?.canonical;
    const archived = result?.archived;
    const reassigned = result?.reassigned || {};
    const aliasItems = Array.isArray(result?.aliases_added) ? result.aliases_added : [];
    const aliasLine = aliasItems.length
      ? fr
        ? `- Alias conservés : ${quoteList(aliasItems)}`
        : `- Preserved aliases: ${quoteList(aliasItems)}`
      : null;

    return [
      fr ? "Fusion du stade terminée." : "Stadium merge completed.",
      fr
        ? `- Stade conservé : **${canonical?.stadium_name || canonical?.slug}** (${quoteList([canonical?.id, canonical?.slug].filter(Boolean))})`
        : `- Surviving stadium: **${canonical?.stadium_name || canonical?.slug}** (${quoteList([canonical?.id, canonical?.slug].filter(Boolean))})`,
      fr
        ? `- Stade archivé : **${archived?.stadium_name || archived?.slug}** (${quoteList([archived?.id, archived?.slug].filter(Boolean))})`
        : `- Archived stadium: **${archived?.stadium_name || archived?.slug}** (${quoteList([archived?.id, archived?.slug].filter(Boolean))})`,
      fr ? `- Clubs réaffectés : ${reassigned.clubs ?? 0}` : `- Clubs reassigned: ${reassigned.clubs ?? 0}`,
      fr ? `- Matchs réaffectés : ${reassigned.matches ?? 0}` : `- Matches reassigned: ${reassigned.matches ?? 0}`,
      fr
        ? `- Relations remappées au total : ${sumReassigned(reassigned)}`
        : `- Total relations remapped: ${sumReassigned(reassigned)}`,
      aliasLine,
    ].filter(Boolean).join("\n");
  }

  if (kind === "stadium_update") {
    const fields = Array.isArray(result?.updated_fields) ? result.updated_fields : [];
    return fr
      ? `Stade mis à jour : **${result?.stadium?.stadium_name || result?.stadium?.slug}**.\n- Champs modifiés : ${fields.map((field: string) => `\`${field}\``).join(", ") || "—"}`
      : `Stadium updated: **${result?.stadium?.stadium_name || result?.stadium?.slug}**.\n- Updated fields: ${fields.map((field: string) => `\`${field}\``).join(", ") || "—"}`;
  }

  if (kind === "attach_club_to_stadium") {
    return fr
      ? `Club associé : **${result?.club?.club_name || result?.club?.slug}** → **${result?.stadium?.stadium_name || result?.stadium?.slug}**.`
      : `Club attached: **${result?.club?.club_name || result?.club?.slug}** → **${result?.stadium?.stadium_name || result?.stadium?.slug}**.`;
  }

  if (kind === "detach_club_from_stadium") {
    return fr
      ? `Club dissocié : **${result?.club?.club_name || result?.club?.slug}**.`
      : `Club detached: **${result?.club?.club_name || result?.club?.slug}**.`;
  }

  return fr ? "Action exécutée." : "Action executed.";
}

function buildRollbackMessage(kind: string, result: any, locale?: string | null) {
  const fr = isFrench(locale);
  if (kind === "restore_stadium_merge") {
    return fr
      ? `Fusion annulée.\n- Stade restauré : **${result?.restored?.stadium_name || result?.restored?.slug}** (${quoteList([result?.restored?.id, result?.restored?.slug].filter(Boolean))})`
      : `Merge rolled back.\n- Restored stadium: **${result?.restored?.stadium_name || result?.restored?.slug}** (${quoteList([result?.restored?.id, result?.restored?.slug].filter(Boolean))})`;
  }
  return fr ? "Annulation terminée." : "Rollback completed.";
}

async function fetchRows<T = any>(supabase: any, table: string, select: string, filter: (query: any) => any): Promise<T[]> {
  const { data, error } = await filter(supabase.from(table).select(select));
  if (error) throw error;
  return data || [];
}

function dedupeById<T extends { id?: string; slug?: string; user_id?: string }>(rows: T[]) {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = row.id || row.slug || row.user_id;
    if (key) map.set(key, row);
  }
  return Array.from(map.values());
}

async function captureMergeUndo(payload: any, supabase: any) {
  const canonicalSlug = payload?.canonical_slug;
  const duplicateSlug = payload?.duplicate_slug;
  if (!canonicalSlug || !duplicateSlug) throw new Error("invalid_payload");

  const { data: canonicalBefore, error: canonicalErr } = await supabase
    .from("stadiums")
    .select("id,slug,stadium_name,aliases,clubs")
    .eq("slug", canonicalSlug)
    .maybeSingle();
  if (canonicalErr) throw canonicalErr;

  const { data: duplicateBefore, error: duplicateErr } = await supabase
    .from("stadiums")
    .select("id,slug,stadium_name,aliases,clubs,archived_at,archived_reason,archived_into_stadium_id,archived_into_slug")
    .eq("slug", duplicateSlug)
    .maybeSingle();
  if (duplicateErr) throw duplicateErr;

  if (!canonicalBefore || !duplicateBefore) throw new Error("stadium_not_found");

  const [clubBySlug, clubByName, matchRows, experienceTipRows, reviewBySlug, reviewByName, tipRows, visitBySlug, visitByName, profileRows, preferenceRows, suggestionRows, mediaById, mediaBySlug, mediaByName, mediaByManualId, imageRows, masterRows] = await Promise.all([
    fetchRows(supabase, "club_ticketing_profiles", "slug,stadium_slug,stadium_name", (q) => q.eq("stadium_slug", duplicateBefore.slug)),
    fetchRows(supabase, "club_ticketing_profiles", "slug,stadium_slug,stadium_name", (q) => q.is("stadium_slug", null).eq("stadium_name", duplicateBefore.stadium_name)),
    fetchRows(supabase, "matches", "id", (q) => q.eq("stadium", duplicateBefore.stadium_name)),
    fetchRows(supabase, "stadium_experience_tips", "id", (q) => q.eq("stadium_slug", duplicateBefore.slug)),
    fetchRows(supabase, "stadium_reviews", "id,stadium_slug,stadium_name", (q) => q.eq("stadium_slug", duplicateBefore.slug)),
    fetchRows(supabase, "stadium_reviews", "id,stadium_slug,stadium_name", (q) => q.eq("stadium_name", duplicateBefore.stadium_name)),
    fetchRows(supabase, "stadium_tips", "id", (q) => q.eq("stadium_slug", duplicateBefore.slug)),
    fetchRows(supabase, "stadium_visits", "id,stadium_slug,stadium_name", (q) => q.eq("stadium_slug", duplicateBefore.slug)),
    fetchRows(supabase, "stadium_visits", "id,stadium_slug,stadium_name", (q) => q.eq("stadium_name", duplicateBefore.stadium_name)),
    fetchRows(supabase, "profiles", "user_id,favorite_stadium_slug", (q) => q.eq("favorite_stadium_slug", duplicateBefore.slug)),
    fetchRows(supabase, "user_preferences", "user_id,dream_stadium_slug", (q) => q.eq("dream_stadium_slug", duplicateBefore.slug)),
    fetchRows(supabase, "stadium_suggestions", "id,resulting_stadium_slug", (q) => q.eq("resulting_stadium_slug", duplicateBefore.slug)),
    fetchRows(supabase, "stadium_media_history", "id,matched_stadium_id,matched_stadium_slug,matched_stadium_name,manual_stadium_id", (q) => q.eq("matched_stadium_id", duplicateBefore.id)),
    fetchRows(supabase, "stadium_media_history", "id,matched_stadium_id,matched_stadium_slug,matched_stadium_name,manual_stadium_id", (q) => q.eq("matched_stadium_slug", duplicateBefore.slug)),
    fetchRows(supabase, "stadium_media_history", "id,matched_stadium_id,matched_stadium_slug,matched_stadium_name,manual_stadium_id", (q) => q.eq("matched_stadium_name", duplicateBefore.stadium_name)),
    fetchRows(supabase, "stadium_media_history", "id,matched_stadium_id,matched_stadium_slug,matched_stadium_name,manual_stadium_id", (q) => q.eq("manual_stadium_id", duplicateBefore.id)),
    fetchRows(supabase, "stadium_image_staging", "id,suggested_stadium_id,published_stadium_id", (q) => q.or(`suggested_stadium_id.eq.${duplicateBefore.id},published_stadium_id.eq.${duplicateBefore.id}`)),
    fetchRows(supabase, "stadiums_master_staging", "id,production_stadium_id", (q) => q.eq("production_stadium_id", duplicateBefore.id)),
  ]);

  return {
    kind: "restore_stadium_merge",
    payload: {
      canonical_before: canonicalBefore,
      duplicate_before: duplicateBefore,
      club_rows: dedupeById([...(clubBySlug || []), ...(clubByName || [])]),
      match_ids: matchRows.map((row: any) => row.id),
      experience_tip_ids: experienceTipRows.map((row: any) => row.id),
      review_rows: dedupeById([...(reviewBySlug || []), ...(reviewByName || [])]),
      tip_ids: tipRows.map((row: any) => row.id),
      visit_rows: dedupeById([...(visitBySlug || []), ...(visitByName || [])]),
      profile_rows: profileRows,
      preference_rows: preferenceRows,
      suggestion_rows: suggestionRows,
      media_rows: dedupeById([...(mediaById || []), ...(mediaBySlug || []), ...(mediaByName || []), ...(mediaByManualId || [])]),
      image_rows: imageRows,
      master_rows: masterRows,
    },
  };
}

async function rollbackStadiumMerge(payload: any, supabase: any) {
  const canonicalBefore = payload?.canonical_before;
  const duplicateBefore = payload?.duplicate_before;
  if (!canonicalBefore?.id || !duplicateBefore?.id) throw new Error("invalid_undo_payload");

  await supabase
    .from("stadiums")
    .update({ aliases: canonicalBefore.aliases || [], clubs: canonicalBefore.clubs || [], updated_at: new Date().toISOString() })
    .eq("id", canonicalBefore.id);

  await supabase
    .from("stadiums")
    .update({
      aliases: duplicateBefore.aliases || [],
      clubs: duplicateBefore.clubs || [],
      archived_at: duplicateBefore.archived_at,
      archived_reason: duplicateBefore.archived_reason,
      archived_into_stadium_id: duplicateBefore.archived_into_stadium_id,
      archived_into_slug: duplicateBefore.archived_into_slug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", duplicateBefore.id);

  for (const row of payload?.club_rows || []) {
    await supabase.from("club_ticketing_profiles").update({ stadium_slug: row.stadium_slug, stadium_name: row.stadium_name, updated_at: new Date().toISOString() }).eq("slug", row.slug);
  }
  if (payload?.match_ids?.length) {
    await supabase.from("matches").update({ stadium: duplicateBefore.stadium_name, updated_at: new Date().toISOString() }).in("id", payload.match_ids);
  }
  if (payload?.experience_tip_ids?.length) {
    await supabase.from("stadium_experience_tips").update({ stadium_slug: duplicateBefore.slug, updated_at: new Date().toISOString() }).in("id", payload.experience_tip_ids);
  }
  for (const row of payload?.review_rows || []) {
    await supabase.from("stadium_reviews").update({ stadium_slug: row.stadium_slug, stadium_name: row.stadium_name, updated_at: new Date().toISOString() }).eq("id", row.id);
  }
  if (payload?.tip_ids?.length) {
    await supabase.from("stadium_tips").update({ stadium_slug: duplicateBefore.slug }).in("id", payload.tip_ids);
  }
  for (const row of payload?.visit_rows || []) {
    await supabase.from("stadium_visits").update({ stadium_slug: row.stadium_slug, stadium_name: row.stadium_name, updated_at: new Date().toISOString() }).eq("id", row.id);
  }
  for (const row of payload?.profile_rows || []) {
    await supabase.from("profiles").update({ favorite_stadium_slug: row.favorite_stadium_slug, updated_at: new Date().toISOString() }).eq("user_id", row.user_id);
  }
  for (const row of payload?.preference_rows || []) {
    await supabase.from("user_preferences").update({ dream_stadium_slug: row.dream_stadium_slug, updated_at: new Date().toISOString() }).eq("user_id", row.user_id);
  }
  for (const row of payload?.suggestion_rows || []) {
    await supabase.from("stadium_suggestions").update({ resulting_stadium_slug: row.resulting_stadium_slug, updated_at: new Date().toISOString() }).eq("id", row.id);
  }
  for (const row of payload?.media_rows || []) {
    await supabase.from("stadium_media_history").update({
      matched_stadium_id: row.matched_stadium_id,
      matched_stadium_slug: row.matched_stadium_slug,
      matched_stadium_name: row.matched_stadium_name,
      manual_stadium_id: row.manual_stadium_id,
    }).eq("id", row.id);
  }
  for (const row of payload?.image_rows || []) {
    await supabase.from("stadium_image_staging").update({ suggested_stadium_id: row.suggested_stadium_id, published_stadium_id: row.published_stadium_id }).eq("id", row.id);
  }
  for (const row of payload?.master_rows || []) {
    await supabase.from("stadiums_master_staging").update({ production_stadium_id: row.production_stadium_id, updated_at: new Date().toISOString() }).eq("id", row.id);
  }

  return {
    restored: {
      id: duplicateBefore.id,
      slug: duplicateBefore.slug,
      stadium_name: duplicateBefore.stadium_name,
    },
  };
}

async function executeKind(kind: string, payload: any, supabase: any): Promise<{ undo: any; result: any }> {
  switch (kind) {
    case "stadium_update": {
      const { slug, fields } = payload;
      if (!slug || typeof fields !== "object") throw new Error("invalid_payload");
      const { data: before, error: beforeErr } = await supabase.from("stadiums").select("*").eq("slug", slug).maybeSingle();
      if (beforeErr) throw beforeErr;
      if (!before) throw new Error("stadium_not_found");
      const { error } = await supabase.from("stadiums").update(fields).eq("slug", slug).select();
      if (error) throw error;
      const undoFields: any = {};
      for (const k of Object.keys(fields)) undoFields[k] = before[k] ?? null;
      return {
        undo: { kind: "stadium_update", payload: { slug, fields: undoFields } },
        result: { stadium: { slug: before.slug, stadium_name: before.stadium_name }, updated_fields: Object.keys(fields) },
      };
    }
    case "attach_club_to_stadium": {
      const { club_slug, stadium_slug } = payload;
      const { data: before } = await supabase.from("club_ticketing_profiles").select("slug,club_name,stadium_slug").eq("slug", club_slug).maybeSingle();
      const { data: stadium } = await supabase.from("stadiums").select("slug,stadium_name").eq("slug", stadium_slug).maybeSingle();
      const { error } = await supabase.from("club_ticketing_profiles").update({ stadium_slug, stadium_name: stadium?.stadium_name ?? null, updated_at: new Date().toISOString() }).eq("slug", club_slug).select();
      if (error) throw error;
      return {
        undo: { kind: "attach_club_to_stadium", payload: { club_slug, stadium_slug: before?.stadium_slug ?? null } },
        result: { club: before, stadium },
      };
    }
    case "detach_club_from_stadium": {
      const { club_slug } = payload;
      const { data: before } = await supabase.from("club_ticketing_profiles").select("slug,club_name,stadium_slug").eq("slug", club_slug).maybeSingle();
      const { error } = await supabase.from("club_ticketing_profiles").update({ stadium_slug: null, stadium_name: null, updated_at: new Date().toISOString() }).eq("slug", club_slug).select();
      if (error) throw error;
      return {
        undo: { kind: "attach_club_to_stadium", payload: { club_slug, stadium_slug: before?.stadium_slug ?? null } },
        result: { club: before },
      };
    }
    case "merge_stadium_duplicate": {
      const undo = await captureMergeUndo(payload, supabase);
      const { data, error } = await supabase.rpc("merge_stadium_records", {
        p_canonical_slug: payload.canonical_slug,
        p_duplicate_slug: payload.duplicate_slug,
        p_reason: payload.reason ?? null,
      });
      if (error) throw error;
      return { undo, result: data };
    }
    case "restore_stadium_merge": {
      const result = await rollbackStadiumMerge(payload, supabase);
      return { undo: null, result };
    }
  }
  throw new Error("unknown_action_kind:" + kind);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const locale = req.headers.get("x-locale") || undefined;
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: roleRow } = await adminClient.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { action_id, mode } = await req.json();
    if (!action_id) throw new Error("missing_action_id");

    const { data: action, error: aErr } = await adminClient.from("admin_actions").select("*").eq("id", action_id).maybeSingle();
    if (aErr || !action) throw new Error("action_not_found");

    if (mode === "reject") {
      await adminClient.from("admin_actions").update({ status: "rejected", result: {} }).eq("id", action_id);
      return new Response(JSON.stringify({ ok: true, status: "rejected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "rollback") {
      if (action.status !== "executed" || !action.undo_payload) throw new Error("not_rollbackable");
      const undo = action.undo_payload;
      const execution = await executeKind(undo.kind, undo.payload, adminClient);
      const assistantMessage = buildRollbackMessage(undo.kind, execution.result, locale);
      await adminClient.from("admin_actions").update({ status: "rolled_back", result: execution.result || {} }).eq("id", action_id);
      if (action.thread_id && assistantMessage) {
        await adminClient.from("admin_assistant_messages").insert({ thread_id: action.thread_id, role: "assistant", content: assistantMessage });
        await adminClient.from("admin_assistant_threads").update({ updated_at: new Date().toISOString() }).eq("id", action.thread_id);
      }
      return new Response(JSON.stringify({ ok: true, status: "rolled_back", result: execution.result || {}, assistant_message: assistantMessage }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action.status !== "proposed") throw new Error("not_proposed");

    try {
      const execution = await executeKind(action.kind, action.payload, adminClient);
      const assistantMessage = buildAssistantMessage(action.kind, execution.result, locale);
      await adminClient.from("admin_actions").update({
        status: "executed",
        undo_payload: execution.undo,
        result: execution.result || {},
        error: null,
        executed_at: new Date().toISOString(),
        executed_by: userData.user.id,
      }).eq("id", action_id);
      if (action.thread_id && assistantMessage) {
        await adminClient.from("admin_assistant_messages").insert({ thread_id: action.thread_id, role: "assistant", content: assistantMessage });
        await adminClient.from("admin_assistant_threads").update({ updated_at: new Date().toISOString() }).eq("id", action.thread_id);
      }
      return new Response(JSON.stringify({ ok: true, status: "executed", result: execution.result || {}, assistant_message: assistantMessage }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await adminClient.from("admin_actions").update({ status: "failed", error: msg }).eq("id", action_id);
      throw err;
    }
  } catch (e) {
    console.error("admin-actions-execute error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
