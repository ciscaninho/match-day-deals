// Shared Brevo client (direct API, key in BREVO_API_KEY).
import { createClient } from "npm:@supabase/supabase-js@2";

const BREVO_BASE = "https://api.brevo.com/v3";
const LIST_NAME = "Foot Ticket Finder — Subscribers";
const LIST_CONFIG_KEY = "brevo_list_id";

export const SENDER = { name: "Foot Ticket Finder", email: "support@footticketfinder.com" };
export const SITE_URL = "https://footticketfinder.com";

const apiKey = () => {
  const k = Deno.env.get("BREVO_API_KEY");
  if (!k) throw new Error("BREVO_API_KEY not configured");
  return k;
};

export const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

async function brevo(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BREVO_BASE}${path}`, {
    ...init,
    headers: {
      "api-key": apiKey(),
      "content-type": "application/json",
      accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  if (!res.ok) {
    console.error("[brevo]", path, res.status, text);
    throw new Error(`brevo_${res.status}:${json?.code || text.slice(0, 200)}`);
  }
  return json;
}

export async function getOrCreateListId(): Promise<number> {
  const sb = admin();
  const { data: cfg } = await sb.from("app_config").select("value").eq("key", LIST_CONFIG_KEY).maybeSingle();
  const existing = cfg?.value?.id;
  if (typeof existing === "number") return existing;

  // Try to find an existing list by name first
  try {
    const lists = await brevo("/contacts/lists?limit=50&offset=0");
    const match = (lists?.lists ?? []).find((l: any) => l?.name === LIST_NAME);
    if (match?.id) {
      await sb.from("app_config").upsert({ key: LIST_CONFIG_KEY, value: { id: match.id, name: LIST_NAME } });
      return match.id;
    }
  } catch (e) { console.warn("[brevo] list lookup failed, will create", e); }

  // Need a folder; get first folder or create one
  let folderId: number | null = null;
  try {
    const folders = await brevo("/contacts/folders?limit=10&offset=0");
    folderId = folders?.folders?.[0]?.id ?? null;
  } catch { /* ignore */ }
  if (!folderId) {
    const folder = await brevo("/contacts/folders", {
      method: "POST",
      body: JSON.stringify({ name: "Foot Ticket Finder" }),
    });
    folderId = folder.id;
  }

  const created = await brevo("/contacts/lists", {
    method: "POST",
    body: JSON.stringify({ name: LIST_NAME, folderId }),
  });
  const id = created.id as number;
  await sb.from("app_config").upsert({ key: LIST_CONFIG_KEY, value: { id, name: LIST_NAME, folderId } });
  return id;
}

export async function upsertContact(opts: {
  email: string;
  attributes?: Record<string, any>;
  listIds?: number[];
}) {
  return brevo("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email: opts.email,
      attributes: opts.attributes ?? {},
      listIds: opts.listIds ?? [],
      updateEnabled: true,
    }),
  });
}

export async function updateContact(email: string, attributes: Record<string, any>, listIds?: number[]) {
  return brevo(`/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    body: JSON.stringify({ attributes, ...(listIds ? { listIds } : {}) }),
  });
}

export async function addToList(listId: number, emails: string[]) {
  return brevo(`/contacts/lists/${listId}/contacts/add`, {
    method: "POST",
    body: JSON.stringify({ emails }),
  });
}

export async function removeFromList(listId: number, emails: string[]) {
  return brevo(`/contacts/lists/${listId}/contacts/remove`, {
    method: "POST",
    body: JSON.stringify({ emails }),
  });
}

export async function blacklistContact(email: string) {
  return brevo(`/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    body: JSON.stringify({ emailBlacklisted: true }),
  });
}

export async function sendEmail(opts: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
}) {
  return brevo("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: SENDER,
      to: opts.to,
      subject: opts.subject,
      htmlContent: opts.htmlContent,
      textContent: opts.textContent,
      tags: opts.tags,
    }),
  });
}

export function confirmationEmail(opts: { confirmUrl: string; unsubscribeUrl: string }) {
  const { confirmUrl, unsubscribeUrl } = opts;
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <tr><td style="padding:32px 32px 8px">
          <div style="font-size:22px;font-weight:800">Confirm your subscription</div>
          <p style="font-size:14px;line-height:1.6;color:#475569;margin:12px 0 24px">
            Thanks for joining <strong>Foot Ticket Finder</strong>. Please confirm your email address to start receiving fixture and ticket-release alerts.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${confirmUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px">Confirm my email</a>
          </div>
          <p style="font-size:12px;color:#64748b">Or paste this link into your browser:<br><a href="${confirmUrl}" style="color:#7c3aed;word-break:break-all">${confirmUrl}</a></p>
        </td></tr>
        <tr><td style="padding:16px 32px 28px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8">
          You received this email because you signed up at footticketfinder.com. If this wasn't you, ignore this message or <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline">unsubscribe</a>.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
  const text = `Confirm your subscription to Foot Ticket Finder by opening this link:\n${confirmUrl}\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { html, text };
}
