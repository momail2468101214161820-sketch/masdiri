// Dynamic sitemap with image + Google News extensions, per-category sitemaps,
// and a sitemap-index mode. Cached at the edge for speed.
//
// Routes (path or query):
//   /functions/v1/dynamic-sitemap                       → main urlset (home, categories, all articles)
//   /functions/v1/dynamic-sitemap?type=index            → sitemap index pointing at child sitemaps
//   /functions/v1/dynamic-sitemap?type=news             → Google News sitemap (last 48h)
//   /functions/v1/dynamic-sitemap?category=<slug>       → per-category sitemap
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BASE_URL = Deno.env.get("SITE_URL") ?? "https://masdiri.lovable.app";
const FN_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1/dynamic-sitemap`;

const baseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/xml; charset=utf-8",
  // Strong CDN caching for crawlers; news endpoint overrides to shorter TTL
  "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=86400",
};

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function urlEntry(opts: {
  loc: string; lastmod?: string; changefreq?: string; priority?: string;
  image?: { url: string; caption?: string }; news?: { title: string; published: string };
}) {
  const parts = [`  <url>`, `    <loc>${xmlEscape(opts.loc)}</loc>`];
  if (opts.lastmod) parts.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) parts.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority) parts.push(`    <priority>${opts.priority}</priority>`);
  if (opts.image) {
    parts.push(`    <image:image>`);
    parts.push(`      <image:loc>${xmlEscape(opts.image.url)}</image:loc>`);
    if (opts.image.caption) parts.push(`      <image:caption>${xmlEscape(opts.image.caption)}</image:caption>`);
    parts.push(`    </image:image>`);
  }
  if (opts.news) {
    parts.push(`    <news:news>`);
    parts.push(`      <news:publication><news:name>مصدري للأخبار المصرية والعالمية</news:name><news:language>ar</news:language></news:publication>`);
    parts.push(`      <news:publication_date>${opts.news.published}</news:publication_date>`);
    parts.push(`      <news:title>${xmlEscape(opts.news.title)}</news:title>`);
    parts.push(`    </news:news>`);
  }
  parts.push(`  </url>`);
  return parts.join("\n");
}

function wrapUrlset(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${body}
</urlset>`;
}

async function buildIndex(): Promise<string> {
  const { data: cats } = await supabase.from("categories").select("slug");
  const now = new Date().toISOString();
  const children: string[] = [
    `  <sitemap><loc>${FN_BASE}</loc><lastmod>${now}</lastmod></sitemap>`,
    `  <sitemap><loc>${FN_BASE}?type=news</loc><lastmod>${now}</lastmod></sitemap>`,
    `  <sitemap><loc>${FN_BASE}?type=image</loc><lastmod>${now}</lastmod></sitemap>`,
  ];
  for (const c of cats || []) {
    children.push(`  <sitemap><loc>${FN_BASE}?category=${encodeURIComponent(c.slug)}</loc><lastmod>${now}</lastmod></sitemap>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children.join("\n")}
</sitemapindex>`;
}

async function buildNews(): Promise<string> {
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: articles } = await supabase
    .from("articles")
    .select("id, short_id, title, created_at, updated_at, image_url")
    .eq("is_published", true)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1000);

  const entries = (articles || []).map((a: any) => urlEntry({
    loc: `${BASE_URL}/${a.short_id || `article/${a.id}`}`,
    lastmod: new Date(a.updated_at || a.created_at).toISOString(),
    image: a.image_url ? { url: a.image_url, caption: a.title } : undefined,
    news: { title: a.title, published: new Date(a.created_at).toISOString() },
  })).join("\n");
  return wrapUrlset(entries);
}

async function buildImage(): Promise<string> {
  const { data: articles } = await supabase
    .from("articles")
    .select("id, short_id, title, updated_at, created_at, image_url, images")
    .eq("is_published", true)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);
  const entries = (articles || []).map((a: any) => {
    const loc = `${BASE_URL}/${a.short_id || `article/${a.id}`}`;
    const imgs: string[] = [];
    if (a.image_url) imgs.push(a.image_url);
    if (Array.isArray(a.images)) for (const u of a.images) {
      const url = typeof u === "string" ? u : (u && typeof u === "object" ? (u.url || u.src || u.image_url) : null);
      if (url && !imgs.includes(url)) imgs.push(url);
    }
    const imgXml = imgs.map((u) => `    <image:image><image:loc>${xmlEscape(u)}</image:loc><image:caption>${xmlEscape(a.title)}</image:caption></image:image>`).join("\n");
    return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${new Date(a.updated_at || a.created_at).toISOString()}</lastmod>\n${imgXml}\n  </url>`;
  }).join("\n");
  return wrapUrlset(entries);
}



async function buildCategory(slug: string): Promise<string> {
  const { data: cat } = await supabase.from("categories").select("id, slug").eq("slug", slug).maybeSingle();
  if (!cat) return wrapUrlset("");
  const { data: articles } = await supabase
    .from("articles")
    .select("id, short_id, title, created_at, updated_at, image_url, is_breaking")
    .eq("is_published", true)
    .eq("category_id", cat.id)
    .order("created_at", { ascending: false })
    .limit(2000);

  const entries: string[] = [
    urlEntry({
      loc: `${BASE_URL}/category/${slug}`,
      lastmod: articles?.[0]?.updated_at ? new Date(articles[0].updated_at).toISOString() : new Date().toISOString(),
      changefreq: "hourly", priority: "0.9",
    }),
    ...(articles || []).map((a: any) => urlEntry({
      loc: `${BASE_URL}/${a.short_id || `article/${a.id}`}`,
      lastmod: new Date(a.updated_at || a.created_at).toISOString(),
      changefreq: a.is_breaking ? "always" : "daily",
      priority: a.is_breaking ? "0.9" : "0.7",
      image: a.image_url ? { url: a.image_url, caption: a.title } : undefined,
    })),
  ];

  return wrapUrlset(entries.join("\n"));
}

async function buildMain(): Promise<string> {
  const { data: articles } = await supabase
    .from("articles")
    .select("id, short_id, title, updated_at, created_at, image_url, is_breaking")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(5000);

  const { data: categories } = await supabase.from("categories").select("slug");

  const entries: string[] = [
    urlEntry({ loc: `${BASE_URL}/`, lastmod: new Date().toISOString(), changefreq: "hourly", priority: "1.0" }),
    urlEntry({ loc: `${BASE_URL}/latest`, changefreq: "hourly", priority: "0.9" }),
    urlEntry({ loc: `${BASE_URL}/breaking`, changefreq: "always", priority: "0.9" }),
    urlEntry({ loc: `${BASE_URL}/most-read`, changefreq: "hourly", priority: "0.8" }),
    urlEntry({ loc: `${BASE_URL}/sitemap`, changefreq: "weekly", priority: "0.6" }),
    urlEntry({ loc: `${BASE_URL}/search`, changefreq: "weekly", priority: "0.4" }),
    urlEntry({ loc: `${BASE_URL}/about`, changefreq: "monthly", priority: "0.5" }),
    urlEntry({ loc: `${BASE_URL}/contact`, changefreq: "monthly", priority: "0.5" }),
    urlEntry({ loc: `${BASE_URL}/privacy`, changefreq: "yearly", priority: "0.3" }),
    urlEntry({ loc: `${BASE_URL}/terms`, changefreq: "yearly", priority: "0.3" }),
    urlEntry({ loc: `${BASE_URL}/cookies`, changefreq: "yearly", priority: "0.3" }),
    urlEntry({ loc: `${BASE_URL}/editorial-policy`, changefreq: "monthly", priority: "0.6" }),
    urlEntry({ loc: `${BASE_URL}/corrections`, changefreq: "monthly", priority: "0.6" }),
    urlEntry({ loc: `${BASE_URL}/ownership`, changefreq: "monthly", priority: "0.5" }),
    urlEntry({ loc: `${BASE_URL}/results/prep`, changefreq: "weekly", priority: "0.6" }),
  ];

  for (const cat of categories || []) {
    entries.push(urlEntry({
      loc: `${BASE_URL}/category/${cat.slug}`, changefreq: "hourly", priority: "0.8",
    }));
  }

  // Governorates
  const GOVS = ["cairo","giza","alexandria","dakahlia","sharqia","gharbia","monufia","qalyubia","beheira","kafr-elsheikh","damietta","port-said","ismailia","suez","north-sinai","south-sinai","fayoum","beni-suef","minya","assiut","sohag","qena","luxor","aswan","red-sea","matrouh","new-valley"];
  for (const g of GOVS) entries.push(urlEntry({ loc: `${BASE_URL}/governorate/${g}`, changefreq: "daily", priority: "0.6" }));

  // Distinct tags (from latest 500 articles)

  const { data: tagged } = await supabase.from("articles").select("tags").eq("is_published", true).order("created_at", { ascending: false }).limit(500);
  const tagSet = new Set<string>();
  for (const r of tagged || []) for (const t of (r as any).tags || []) if (t) tagSet.add(t);
  for (const t of tagSet) entries.push(urlEntry({ loc: `${BASE_URL}/tag/${encodeURIComponent(t)}`, changefreq: "weekly", priority: "0.5" }));


  for (const a of articles || []) {
    entries.push(urlEntry({
      loc: `${BASE_URL}/${a.short_id || `article/${a.id}`}`,
      lastmod: new Date(a.updated_at || a.created_at).toISOString(),
      changefreq: a.is_breaking ? "always" : "daily",
      priority: a.is_breaking ? "0.9" : "0.7",
      image: a.image_url ? { url: a.image_url, caption: a.title } : undefined,
    }));
  }

  return wrapUrlset(entries.join("\n"));
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const category = url.searchParams.get("category");

    let xml: string;
    let headers = { ...baseHeaders };
    if (type === "index") xml = await buildIndex();
    else if (type === "news") {
      xml = await buildNews();
      headers["Cache-Control"] = "public, max-age=300, s-maxage=300";
    }
    else if (type === "image") xml = await buildImage();
    else if (category) xml = await buildCategory(category);
    else xml = await buildMain();

    return new Response(xml, { headers });
  } catch (e) {
    console.error("sitemap error", e);
    return new Response(wrapUrlset(""), { headers: baseHeaders });
  }
});
