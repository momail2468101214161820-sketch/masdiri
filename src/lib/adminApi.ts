// Client-side wrapper around the `admin-action` edge function.
// The admin PIN is stored only in sessionStorage and is sent as the
// `X-Admin-Pin` header on every privileged call. All real authorization
// happens server-side: this header is verified against the current PIN
// inside the edge function before any DB mutation runs.

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-action`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const PIN_KEY = "sb_admin_pin";

export const getAdminPin = : string | null =>
 sessionStorage.getItem(PIN_KEY);

export const setAdminPin = (pin: string) =>
 sessionStorage.setItem(PIN_KEY, pin);

export const clearAdminPin = => sessionStorage.removeItem(PIN_KEY);

type Json = Record<string, unknown>;

async function call(body: Json, withPin = true): Promise<any> {
 const headers: Record<string, string> = {
 "Content-Type": "application/json",
 Authorization: `Bearer ${ANON_KEY}`,
 apikey: ANON_KEY,
 };
 if (withPin) {
 const pin = getAdminPin;
 if (!pin) throw new Error("لم يتم التحقق من رمز الأدمن");
 headers["X-Admin-Pin"] = pin;
 }
 const res = await fetch(FN_URL, {
 method: "POST",
 headers,
 body: JSON.stringify(body),
 });
 const json = await res.json.catch( => ({}));
 if (!res.ok) {
 // PIN no longer valid (expired / changed / wrong) — force re-auth so the
 // admin sees exactly why writes are silently failing.
 if (res.status === 401 && withPin) {
 clearAdminPin;
 const msg = "انتهت صلاحية رمز الأدمن — يرجى إعادة إدخال الـ PIN لاستئناف الحفظ";
 if (typeof window !== "undefined") {
 setTimeout( => window.location.reload, 1500);
 }
 throw new Error(msg);
 }
 throw new Error(json.error || `HTTP ${res.status}`);
 }
 return json;
}

export const verifyAdminPin = async (pin: string) => {
 await call({ op: "verify", pin }, false);
 setAdminPin(pin);
 return true;
};

export const changeAdminPin = async (newPin: string) => {
 await call({ op: "change_pin", new_pin: newPin });
 setAdminPin(newPin);
};

export const adminInsert = (table: string, data: Json | Json) =>
 call({ op: "insert", table, data });

export const adminUpsert = (
 table: string,
 data: Json | Json,
 options?: Json,
) => call({ op: "upsert", table, data, options });

export const adminUpdate = (table: string, match: Json, data: Json) =>
 call({ op: "update", table, match, data });

export const adminDelete = (table: string, match: Json) =>
 call({ op: "delete", table, match });

export const adminReadSettings = => call({ op: "read_settings" });

export const adminListMessages = (status?: string, limit = 100) =>
 call({ op: "list_messages", status, limit });

// Client-side resize+compress raster images, then upload the BINARY blob
// directly to Supabase Storage using a one-time signed upload URL minted by
// the admin gateway. This avoids the Edge Function ~6 MB body limit that
// silently broke uploads of phone photos.
const compressImage = (file: File, maxWidth = 1920, quality = 0.85): Promise<Blob> =>
 new Promise((resolve) => {
 const passthrough = file.type === "image/svg+xml" || file.type === "image/gif";
 if (passthrough) return resolve(file);
 const reader = new FileReader;
 reader.onerror = => resolve(file);
 reader.onload = => {
 const img = new Image;
 img.onerror = => resolve(file);
 img.onload = => {
 try {
 const scale = Math.min(1, maxWidth / img.width);
 const w = Math.round(img.width * scale);
 const h = Math.round(img.height * scale);
 const canvas = document.createElement("canvas");
 canvas.width = w;
 canvas.height = h;
 const ctx = canvas.getContext("2d");
 if (!ctx) return resolve(file);
 ctx.drawImage(img, 0, 0, w, h);
 canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", quality);
 } catch {
 resolve(file);
 }
 };
 img.src = reader.result as string;
 };
 reader.readAsDataURL(file);
 });

export const adminUploadImage = async (file: File): Promise<string> => {
 if (file.size > 50 * 1024 * 1024) {
 throw new Error("حجم الصورة يتجاوز 50 ميجابايت");
 }
 const blob = await compressImage(file);
 const baseName =
 (file.name || "image").replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "image";
 const ext =
 blob.type === "image/jpeg"
 ? "jpg"
 : file.type === "image/svg+xml"
 ? "svg"
 : file.type === "image/gif"
 ? "gif"
 : "jpg";
 const filename = `${baseName}.${ext}`;

 // 1) Mint a one-time signed upload URL through the admin gateway.
 const signed = await call({
 op: "signed_upload_url",
 bucket: "article-images",
 filename,
 });

 // 2) Upload the binary directly to Storage using the Supabase client
 // (handles the signed-URL POST contract correctly).
 const { supabase } = await import("@/integrations/supabase/client");
 const { error: upErr } = await supabase.storage
 .from("article-images")
 .uploadToSignedUrl(signed.path, signed.token, blob, {
 contentType: blob.type || "image/jpeg",
 upsert: true,
 });
 if (upErr) {
 throw new Error(`فشل الرفع إلى المخزن السحابي: ${upErr.message}`);
 }
 return signed.public_url as string;
};

// Upload an arbitrary binary file (e.g. APK) to a given public bucket
// using a signed upload URL. Returns the public URL.
export const adminUploadFile = async (
 file: File,
 bucket = "videos",
): Promise<{ url: string; size: number }> => {
 if (file.size > 200 * 1024 * 1024) {
 throw new Error("حجم الملف يتجاوز 200 ميجابايت");
 }
 const safe = (file.name || `file-${Date.now}`).replace(/[^a-zA-Z0-9._-]/g, "_");
 const signed = await call({ op: "signed_upload_url", bucket, filename: safe });
 const { supabase } = await import("@/integrations/supabase/client");
 const { error: upErr } = await supabase.storage
 .from(bucket)
 .uploadToSignedUrl(signed.path, signed.token, file, {
 contentType: file.type || "application/vnd.android.package-archive",
 upsert: true,
 });
 if (upErr) throw new Error(`فشل الرفع: ${upErr.message}`);
 return { url: signed.public_url as string, size: file.size };
};



