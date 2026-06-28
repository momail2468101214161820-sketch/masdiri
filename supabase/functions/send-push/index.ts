// Edge function: send-push
// Sends Web Push notifications to all stored subscriptions using VAPID.
// Body: { title, body, url?, image?, breaking?, tag? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
 "Access-Control-Allow-Origin": "*",
 "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin",
 "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function verifyAdmin(req: Request, supa: any): Promise<boolean> {
 const provided = req.headers.get("x-admin-pin") || req.headers.get("X-Admin-Pin");
 if (!provided) return false;
 const { data } = await supa.from("admin_settings").select("value").eq("key", "admin_code").maybeSingle;
 const current = (data?.value && typeof data.value === "string") ? data.value : (Deno.env.get("ADMIN_PIN") ?? "7777");
 return provided === current;
}

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

function b64urlToBytes(s: string): Uint8Array {
 s = s.replace(/-/g, "+").replace(/_/g, "/");
 while (s.length % 4) s += "=";
 const bin = atob(s);
 const out = new Uint8Array(bin.length);
 for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
 return out;
}
function bytesToB64url(b: Uint8Array): string {
 let s = "";
 for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
 return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function concat(...arrs: Uint8Array): Uint8Array {
 const len = arrs.reduce((s, a) => s + a.length, 0);
 const out = new Uint8Array(len);
 let off = 0;
 for (const a of arrs) { out.set(a, off); off += a.length; }
 return out;
}
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
 const key = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
 const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
 const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
 const t = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, concat(info, new Uint8Array([1]))));
 return t.slice(0, length);
}

async function importVapidPrivate: Promise<CryptoKey> {
 const d = b64urlToBytes(VAPID_PRIVATE);
 const pub = b64urlToBytes(VAPID_PUBLIC); // 65 bytes 0x04||X||Y
 const x = pub.slice(1, 33), y = pub.slice(33, 65);
 const jwk = {
 kty: "EC", crv: "P-256",
 d: bytesToB64url(d), x: bytesToB64url(x), y: bytesToB64url(y),
 ext: true,
 };
 return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

async function buildVapidAuth(audience: string): Promise<string> {
 const header = { typ: "JWT", alg: "ES256" };
 const payload = {
 aud: audience,
 exp: Math.floor(Date.now / 1000) + 12 * 3600,
 sub: VAPID_SUBJECT,
 };
 const enc = (o: any) => bytesToB64url(new TextEncoder.encode(JSON.stringify(o)));
 const signingInput = `${enc(header)}.${enc(payload)}`;
 const key = await importVapidPrivate;
 const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder.encode(signingInput)));
 const jwt = `${signingInput}.${bytesToB64url(sig)}`;
 return `vapid t=${jwt}, k=${VAPID_PUBLIC}`;
}

async function encryptPayload(payload: Uint8Array, p256dh: string, auth: string) {
 const clientPub = b64urlToBytes(p256dh);
 const authSecret = b64urlToBytes(auth);

 // Ephemeral server keypair
 const serverKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
 const serverPubJwk = await crypto.subtle.exportKey("jwk", serverKeyPair.publicKey);
 const serverPub = concat(new Uint8Array([4]), b64urlToBytes(serverPubJwk.x!), b64urlToBytes(serverPubJwk.y!));

 // Import client public key
 const clientKey = await crypto.subtle.importKey(
 "jwk",
 {
 kty: "EC", crv: "P-256",
 x: bytesToB64url(clientPub.slice(1, 33)),
 y: bytesToB64url(clientPub.slice(33, 65)),
 ext: true,
 },
 { name: "ECDH", namedCurve: "P-256" },
 true,
 ,
 );
 const sharedBits = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeyPair.privateKey, 256));

 // aes128gcm per RFC 8291
 const salt = crypto.getRandomValues(new Uint8Array(16));
 const keyInfo = concat(new TextEncoder.encode("WebPush: info\0"), clientPub, serverPub);
 const ikm = await hkdf(authSecret, sharedBits, keyInfo, 32);
 const cek = await hkdf(salt, ikm, new TextEncoder.encode("Content-Encoding: aes128gcm\0"), 16);
 const nonce = await hkdf(salt, ikm, new TextEncoder.encode("Content-Encoding: nonce\0"), 12);

 // Pad: 0x02 delimiter (last record)
 const padded = concat(payload, new Uint8Array([2]));

 const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
 const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded));

 // Header: salt(16) || rs(4 = 4096) || idlen(1) || keyid(serverPub 65)
 const rs = new Uint8Array([0, 0, 0x10, 0]); // 4096
 const idlen = new Uint8Array([serverPub.length]);
 const header = concat(salt, rs, idlen, serverPub);
 return concat(header, ct);
}

async function sendOne(sub: { endpoint: string; p256dh: string; auth: string }, payloadObj: any) {
 const url = new URL(sub.endpoint);
 const audience = `${url.protocol}//${url.host}`;
 const authHeader = await buildVapidAuth(audience);
 const body = new TextEncoder.encode(JSON.stringify(payloadObj));
 const enc = await encryptPayload(body, sub.p256dh, sub.auth);
 const res = await fetch(sub.endpoint, {
 method: "POST",
 headers: {
 Authorization: authHeader,
 "Content-Encoding": "aes128gcm",
 "Content-Type": "application/octet-stream",
 TTL: "86400",
 Urgency: payloadObj.breaking ? "high" : "normal",
 },
 body: enc,
 });
 return { status: res.status, endpoint: sub.endpoint };
}

Deno.serve(async (req) => {
 if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 try {
 const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
 if (!(await verifyAdmin(req, supa))) {
 return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
 }
 const payload = await req.json.catch( => ({}));
 if (!payload.title || !payload.body) {
 return new Response(JSON.stringify({ error: "title and body required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
 }
 const { data: subs, error } = await supa.from("push_subscriptions").select("endpoint,p256dh,auth");
 if (error) throw error;

 const results = await Promise.allSettled((subs || ).map((s) => sendOne(s as any, payload)));
 const stale: string = ;
 let ok = 0, fail = 0;
 results.forEach((r, i) => {
 if (r.status === "fulfilled") {
 if (r.value.status >= 200 && r.value.status < 300) ok++;
 else { fail++; if (r.value.status === 404 || r.value.status === 410) stale.push(r.value.endpoint); }
 } else { fail++; }
 });
 if (stale.length) await supa.from("push_subscriptions").delete.in("endpoint", stale);

 return new Response(JSON.stringify({ sent: ok, failed: fail, removed: stale.length, total: subs?.length || 0 }), {
 headers: { ...corsHeaders, "Content-Type": "application/json" },
 });
 } catch (e: any) {
 return new Response(JSON.stringify({ error: e.message || String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
 }
});
