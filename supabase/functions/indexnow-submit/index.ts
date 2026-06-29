// IndexNow broadcast — submits URLs to Bing, Yandex, Seznam, Naver, Yep
// and the shared IndexNow network (10,000+ search engines & crawlers).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = (Deno.env.get('SITE_URL') ?? 'https://masdiri.lovable.app').replace(//+$/, '');
const HOST = new URL(SITE).host;

const KEY = '8983aa8d243606bc9d23766a10bc007d';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

// IndexNow endpoints — submitting to any one propagates to all participants,
// but we hit several for redundancy/speed.
const ENDPOINTS = [
  'https://api.indexnow.org/IndexNow',
  'https://www.bing.com/IndexNow',
  'https://yandex.com/indexnow',
  'https://searchadvisor.naver.com/indexnow',
];

async function submitBatch(urls: string[]) {
  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  });
  const results = await Promise.allSettled(
    ENDPOINTS.map((ep) =>
      fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body,
      }).then(async (r) => ({ endpoint: ep, status: r.status, ok: r.ok }))
    )
  );
  return results.map((r) =>
    r.status === 'fulfilled' ? r.value : { endpoint: 'error', status: 0, ok: false, error: String(r.reason) }
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const mode: 'all' | 'urls' | 'recent' = body.mode || 'urls';
    let urls: string[] = Array.isArray(body.urls) ? body.urls.filter((u: unknown) => typeof u === 'string') : [];

    if (mode === 'all' || mode === 'recent') {
      const sb = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      let q = sb.from('articles').select('id, short_id').eq('is_published', true).order('created_at', { ascending: false });
      if (mode === 'recent') {
        const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
        q = q.gte('created_at', since);
      } else {
        q = q.limit(9000);
      }
      const { data } = await q;
      const rows = data || [];
      urls = [
        `${SITE}/`,
        `${SITE}/latest`,
        `${SITE}/breaking`,
        `${SITE}/most-read`,
        ...rows.map((r: any) => `${SITE}/${r.short_id || `article/${r.id}`}`),
      ];
    }

    if (!urls.length) {
      return new Response(JSON.stringify({ ok: false, message: 'لا توجد روابط للإرسال' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // IndexNow caps ~10,000 URLs per request — chunk for safety.
    const chunks: string[][] = [];
    for (let i = 0; i < urls.length; i += 9500) chunks.push(urls.slice(i, i + 9500));

    const all: any[] = [];
    for (const c of chunks) all.push(...(await submitBatch(c)));

    const okCount = all.filter((r) => r.ok || r.status === 202 || r.status === 200).length;
    return new Response(
      JSON.stringify({
        ok: true,
        message: `تم البث إلى ${okCount}/${all.length} محرك بحث · ${urls.length} رابط · ينتشر تلقائيًا على شبكة IndexNow (+10,000 جهة)`,
        urls: urls.length,
        endpoints: all,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
