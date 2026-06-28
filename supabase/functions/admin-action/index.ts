// Admin gateway — every privileged DB write goes through here.
// Requires the request to carry the correct PIN in the `X-Admin-Pin` header.
// The PIN is compared against the current `admin_settings.admin_code` row
// (falling back to the `ADMIN_PIN` env secret on first boot).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ALLOWED_TABLES = new Set([
  "articles",
  "ads",
  "categories",
  "videos",
  "admin_settings",
  "app_releases",
  "messages",
]);

function normalizePin(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) return trimmed;

  // Older writes accidentally saved the text column as a JSON-looking string
  // (for example: '"0000"'). Accept and repair that shape safely.
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string" && /^\d{4}$/.test(parsed)) return parsed;
  } catch {
    // Not JSON; fall through to null.
  }

  return null;
}

async function getCurrentPin(): Promise<string> {
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "admin_code")
    .maybeSingle();
  const storedPin = normalizePin(data?.value);
  if (storedPin) return storedPin;
  return Deno.env.get("ADMIN_PIN") ?? "7777";
}

function unauthorized(msg = "Unauthorized") {
  return new Response(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bad(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad("POST only");

  let payload: any;
  try { payload = await req.json(); } catch { return bad("Invalid JSON"); }
  const op: string = payload?.op;
  if (!op) return bad("Missing op");

  const currentPin = await getCurrentPin();

  // ----- public verify entrypoint (PIN comes in body, not header) -----
  if (op === "verify") {
    const pin = String(payload.pin ?? "");
    if (pin !== currentPin) return unauthorized("Wrong PIN");
    return ok({ ok: true });
  }

  // every other op REQUIRES the PIN as header
  const headerPin = req.headers.get("X-Admin-Pin") ?? "";
  if (headerPin !== currentPin) return unauthorized();

  // ----- change PIN -----
  if (op === "change_pin") {
    const next = String(payload.new_pin ?? "");
    if (!/^\d{4}$/.test(next)) return bad("PIN must be 4 digits");
    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        { key: "admin_code", value: next, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) return bad(error.message);
    return ok({ ok: true });
  }

  // ----- generic table write proxy -----
  if (op === "insert" || op === "update" || op === "delete" || op === "upsert") {
    const table: string = payload.table;
    if (!ALLOWED_TABLES.has(table)) return bad("Table not allowed");

    let q = supabase.from(table) as any;
    if (op === "insert") {
      const { data, error } = await q.insert(payload.data).select();
      if (error) return bad(error.message);
      return ok({ data });
    }
    if (op === "upsert") {
      const { data, error } = await q
        .upsert(payload.data, payload.options ?? {})
        .select();
      if (error) return bad(error.message);
      return ok({ data });
    }
    if (op === "update") {
      let req = q.update(payload.data);
      for (const [col, val] of Object.entries(payload.match ?? {})) {
        req = req.eq(col, val);
      }
      const { data, error } = await req.select();
      if (error) return bad(error.message);
      return ok({ data });
    }
    if (op === "delete") {
      let req = q.delete();
      for (const [col, val] of Object.entries(payload.match ?? {})) {
        req = req.eq(col, val);
      }
      const { error } = await req;
      if (error) return bad(error.message);
      return ok({ ok: true });
    }
  }

  // ----- upload an image to the article-images bucket (legacy / small files) -----
  if (op === "upload") {
    const bucket: string = payload.bucket || "article-images";
    const filename: string = payload.filename || `f-${Date.now()}`;
    const dataUrl: string = payload.data_url || "";
    const m = dataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!m) return bad("Invalid data_url");
    const contentType = m[1];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType, upsert: false,
    });
    if (error) return bad(error.message);
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return ok({ url: pub.publicUrl, path });
  }

  // ----- create a signed upload URL so the browser uploads the file
  //       directly to Storage (no Edge body-size limit) -----
  if (op === "signed_upload_url") {
    const bucket: string = payload.bucket || "article-images";
    const filename: string = String(payload.filename || `f-${Date.now()}`);
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_") || `f-${Date.now()}`;
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error || !data) return bad(error?.message || "Failed to create signed URL");
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return ok({
      signed_url: data.signedUrl,
      token: data.token,
      path,
      public_url: pub.publicUrl,
    });
  }

  // ----- read admin-only settings -----
  if (op === "read_settings") {
    const { data, error } = await supabase.from("admin_settings").select("*");
    if (error) return bad(error.message);
    return ok({ data });
  }

  // ----- list messages (admin inbox) -----
  if (op === "list_messages") {
    const status = payload.status as string | undefined;
    const limit = Math.min(Number(payload.limit) || 100, 500);
    let q = supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(limit);
    if (status && ["Unread", "Read", "Replied"].includes(status)) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return bad(error.message);
    const { count: unread } = await supabase
      .from("messages").select("id", { count: "exact", head: true }).eq("status", "Unread");
    return ok({ data, unread: unread ?? 0 });
  }

  return bad("Unknown op");
});

