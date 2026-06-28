import { corsHeaders as baseCors } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
 ...baseCors,
 'Access-Control-Allow-Headers': `${baseCors['Access-Control-Allow-Headers'] || 'authorization, x-client-info, apikey, content-type'}, x-admin-pin`,
};

const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';
const SITE_URL = 'https://soutalbalad.lovable.app/';

const supaAdmin = createClient(
 Deno.env.get('SUPABASE_URL')!,
 Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function verifyAdmin(req: Request): Promise<boolean> {
 const provided = req.headers.get('x-admin-pin') || req.headers.get('X-Admin-Pin');
 if (!provided) return false;
 const { data } = await supaAdmin.from('admin_settings').select('value').eq('key', 'admin_code').maybeSingle;
 const current = (data?.value && typeof data.value === 'string') ? data.value : (Deno.env.get('ADMIN_PIN') ?? '7777');
 return provided === current;
}

function headers {
 return {
 Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
 'X-Connection-Api-Key': Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY') ?? '',
 'Content-Type': 'application/json',
 };
}

Deno.serve(async (req) => {
 if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
 if (!(await verifyAdmin(req))) {
 return new Response(JSON.stringify({ ok: false, message: 'Unauthorized' }), {
 status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
 });
 }

 try {
 const { action, url } = await req.json.catch( => ({ action: 'submit_sitemap' }));

 if (action === 'submit_sitemap') {
 const sitemapUrl = `${SITE_URL}sitemap.xml`;
 const path = `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
 const r = await fetch(`${GATEWAY}${path}`, { method: 'PUT', headers: headers });
 const body = await r.text;
 return new Response(
 JSON.stringify({ ok: r.ok, status: r.status, message: r.ok ? 'تم إرسال خريطة الموقع لجوجل ✓' : body }),
 { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
 );
 }

 if (action === 'inspect_url') {
 const inspectionUrl = url || SITE_URL;
 const r = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
 method: 'POST',
 headers: headers,
 body: JSON.stringify({ inspectionUrl, siteUrl: SITE_URL }),
 });
 const data = await r.json.catch( => ({}));
 const verdict = data?.inspectionResult?.indexStatusResult?.verdict ?? 'UNKNOWN';
 const coverage = data?.inspectionResult?.indexStatusResult?.coverageState ?? '—';
 return new Response(
 JSON.stringify({
 ok: r.ok,
 status: r.status,
 verdict,
 coverage,
 message: r.ok ? `الحالة: ${verdict} | ${coverage}` : (data?.error?.message || 'فشل الفحص'),
 }),
 { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
 );
 }

 if (action === 'list_sitemaps') {
 const path = `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps`;
 const r = await fetch(`${GATEWAY}${path}`, { headers: headers });
 const data = await r.json.catch( => ({}));
 return new Response(JSON.stringify({ ok: r.ok, status: r.status, data }), {
 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
 });
 }

 if (action === 'top_queries') {
 // Top Google search queries that lead users to the site (last 28 days)
 const end = new Date;
 const start = new Date;
 start.setDate(end.getDate - 28);
 const fmt = (d: Date) => d.toISOString.slice(0, 10);
 const path = `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
 const r = await fetch(`${GATEWAY}${path}`, {
 method: 'POST',
 headers: headers,
 body: JSON.stringify({
 startDate: fmt(start),
 endDate: fmt(end),
 dimensions: ['query'],
 rowLimit: 500,
 dataState: 'all',
 }),
 });
 const data = await r.json.catch( => ({}));
 if (!r.ok) {
 return new Response(JSON.stringify({ ok: false, message: data?.error?.message || 'فشل جلب الكلمات المفتاحية' }), {
 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
 });
 }
 const rows = (data.rows || ).map((row: any) => ({
 query: row.keys?.[0] ?? '',
 clicks: row.clicks ?? 0,
 impressions: row.impressions ?? 0,
 ctr: row.ctr ?? 0,
 position: row.position ?? 0,
 }));
 return new Response(JSON.stringify({ ok: true, rows, range: { start: fmt(start), end: fmt(end) } }), {
 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
 });
 }

 return new Response(JSON.stringify({ ok: false, message: 'action غير معروف' }), {
 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
 status: 400,
 });
 } catch (e) {
 return new Response(JSON.stringify({ ok: false, message: String(e) }), {
 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
 status: 500,
 });
 }
});
