#!/usr/bin/env -S npx tsx
/**
 * Prerender every public route into a static HTML file under dist/.
 * Covers:
 * - Home -> dist/index.html (augmented)
 * - Articles -> dist/{short_id}/index.html
 * - Categories -> dist/category/{slug}/index.html
 * - Tags -> dist/tag/{tag}/index.html
 * - Archives (year) -> dist/archive/{yyyy}/index.html
 *
 * Lovable's CDN serves these static files BEFORE the SPA fallback, so
 * Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, WhatsApp,
 * Facebook, LinkedIn, X and Discord all see real HTML + Open Graph +
 * JSON-LD before any JavaScript runs. The React SPA still hydrates on
 * top for human visitors.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const SUPABASE_URL = "https://texdxiafabzbampcswsn.supabase.co";
const ANON_KEY =
 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGR4aWFmYWJ6YmFtcGNzd3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODkwODUsImV4cCI6MjA4OTc2NTA4NX0.3FeZQivXN99E-ariQ-nj7IPeCj3Mb_GmJxHS3LJczb4";
const BASE_URL = "https://soutalbalad.lovable.app";
const DIST = resolve("dist");
const TEMPLATE_PATH = resolve("dist/index.html");

const esc = (s: any) =>
 String(s ?? "")
 .replace(/&/g, "&amp;")
 .replace(/</g, "&lt;")
 .replace(/>/g, "&gt;")
 .replace(/"/g, "&quot;")
 .replace(/'/g, "&#39;");

async function sb(path: string) {
 const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
 headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
 });
 if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text}`);
 return (await r.json) as any;
}

/** Wrap server-rendered content so it's visible to ALL crawlers (no hidden
 * styling that Google might penalise) yet React's `createRoot.render`
 * replaces it during hydration so human users see the SPA. */
function injectHead(template: string, headExtras: string): string {
 let html = template;
 html = html.replace(/<title>[^<]*<\/title>/i, "");
 html = html.replace(/<meta\s+name="description"[^>]*>/gi, "");
 html = html.replace(/<link\s+rel="canonical"[^>]*>/gi, "");
 html = html.replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "");
 html = html.replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, "");
 return html.replace("</head>", `${headExtras}\n </head>`);
}

function injectBody(template: string, bodyHtml: string): string {
 // TRUE SSG: render full HTML in a sibling container BEFORE #root so the
 // document is a complete, valid HTML page with no dependency on React
 // hydration. Crawlers (Googlebot, Bingbot, GPTBot, ClaudeBot,
 // PerplexityBot, WhatsApp, Facebook, LinkedIn, X, Discord) read this
 // directly from the raw HTML response — no JS execution required, and
 // the page is fully readable with JavaScript disabled.
 //
 // For human visitors, a tiny inline script removes the SSG container
 // as soon as React mounts into #root, so they only see the live SPA.
 const cleanup = `<script>(function{var r=document.getElementById('root');if(!r)return;var s=document.getElementById('ssg-content');if(!s)return;var mo=new MutationObserver(function{if(r.childNodes.length>0){s.parentNode&&s.parentNode.removeChild(s);mo.disconnect;}});mo.observe(r,{childList:true});setTimeout(function{if(r.childNodes.length>0&&s.parentNode){s.parentNode.removeChild(s);mo.disconnect;}},6000);});</script>`;
 // Ensure #root stays empty in the static HTML — React owns it at runtime.
 let html = template.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root"></div>`);
 // Inject the fully-rendered SSG body BEFORE #root.
 return html.replace(
 '<div id="root"></div>',
 `<main id="ssg-content" role="main">${bodyHtml}</main>\n <div id="root"></div>\n ${cleanup}`
 );
}

// -------- Article page ----------------------------------------------------
function articleHtml(template: string, a: any, related: any = , latest: any = ): string {
 const slug = a.short_id || `article/${a.id}`;
 const canonical = `${BASE_URL}/${slug}`;
 const title = a.title || "مصدري للأخبار المصرية والعالمية";
 const desc = (a.summary || a.content || a.title || "").toString.slice(0, 280);
 const ogImage = `${SUPABASE_URL}/functions/v1/og-image?id=${encodeURIComponent(
 a.short_id || a.id
 )}&v=${encodeURIComponent(a.updated_at || a.created_at || "1")}`;
 const category = a.categories?.name || "أخبار";
 const tags: string = Array.isArray(a.tags) ? a.tags.filter(Boolean) : ;

 const newsLd = {
 "@context": "https://schema.org",
 "@type": "NewsArticle",
 headline: title,
 description: desc,
 image: [a.image_url, ogImage].filter(Boolean),
 datePublished: a.created_at,
 dateModified: a.updated_at || a.created_at,
 mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
 articleSection: category,
 keywords: tags.join(", "),
 inLanguage: "ar",
 publisher: {
 "@type": "NewsMediaOrganization",
 name: "مصدري للأخبار المصرية والعالمية",
 logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon-192.png`, width: 192, height: 192 },
 },
 author: { "@type": "Organization", name: "صوت البلد", url: BASE_URL },
 };

 const webPageLd = {
 "@context": "https://schema.org",
 "@type": "WebPage",
 "@id": canonical,
 url: canonical,
 name: title,
 description: desc,
 inLanguage: "ar",
 isPartOf: { "@type": "WebSite", name: "مصدري للأخبار المصرية والعالمية", url: `${BASE_URL}/` },
 primaryImageOfPage: a.image_url ? { "@type": "ImageObject", url: a.image_url } : undefined,
 datePublished: a.created_at,
 dateModified: a.updated_at || a.created_at,
 };

 const breadcrumb = {
 "@context": "https://schema.org",
 "@type": "BreadcrumbList",
 itemListElement: [
 { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${BASE_URL}/` },
 ...(a.categories?.slug
 ? [{ "@type": "ListItem", position: 2, name: category, item: `${BASE_URL}/category/${a.categories.slug}` }]
 : ),
 { "@type": "ListItem", position: a.categories?.slug ? 3 : 2, name: title, item: canonical },
 ],
 };

 const head = `
 <title>${esc(title)} | صوت البلد</title>
 <meta name="description" content="${esc(desc)}" />
 <meta name="keywords" content="${esc(tags.join(", "))}" />
 <meta name="author" content="صوت البلد" />
 <meta name="news_keywords" content="${esc(tags.join(", "))}" />
 <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
 <link rel="canonical" href="${esc(canonical)}" />
 <meta property="og:type" content="article" />
 <meta property="og:site_name" content="مصدري للأخبار المصرية والعالمية" />
 <meta property="og:locale" content="ar_EG" />
 <meta property="og:title" content="${esc(title)}" />
 <meta property="og:description" content="${esc(desc)}" />
 <meta property="og:url" content="${esc(canonical)}" />
 <meta property="og:image" content="${esc(ogImage)}" />
 <meta property="og:image:secure_url" content="${esc(ogImage)}" />
 <meta property="og:image:width" content="1200" />
 <meta property="og:image:height" content="630" />
 <meta property="og:image:type" content="image/png" />
 <meta property="og:image:alt" content="${esc(title)}" />
 <meta property="article:published_time" content="${esc(a.created_at)}" />
 <meta property="article:modified_time" content="${esc(a.updated_at || a.created_at)}" />
 <meta property="article:section" content="${esc(category)}" />
 <meta property="article:publisher" content="${BASE_URL}" />
 ${tags.map((t) => `<meta property="article:tag" content="${esc(t)}" />`).join("\n ")}
 <meta name="twitter:card" content="summary_large_image" />
 <meta name="twitter:title" content="${esc(title)}" />
 <meta name="twitter:description" content="${esc(desc)}" />
 <meta name="twitter:image" content="${esc(ogImage)}" />
 <script type="application/ld+json">${JSON.stringify(newsLd)}</script>
 <script type="application/ld+json">${JSON.stringify(webPageLd)}</script>
 <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
 `;

 const linkList = (items: any) =>
 items
 .slice(0, 6)
 .map(
 (r) =>
 `<li><a href="/${esc(r.short_id || `article/${r.id}`)}">${esc(r.title)}</a></li>`
 )
 .join("");

 const body = `<article itemscope itemtype="https://schema.org/NewsArticle" dir="rtl" lang="ar">
 <nav aria-label="فتات الخبز"><a href="/">الرئيسية</a>${a.categories?.slug ? ` › <a href="/category/${esc(a.categories.slug)}">${esc(category)}</a>` : ""} › <span>${esc(title)}</span></nav>
 <header>
 <h1 itemprop="headline">${esc(title)}</h1>
 <p itemprop="description">${esc(desc)}</p>
 <time itemprop="datePublished" datetime="${esc(a.created_at)}">${esc(a.created_at)}</time>
 <address itemprop="publisher">مصدري للأخبار المصرية والعالمية</address>
 </header>
 ${a.image_url ? `<figure><img src="${esc(a.image_url)}" alt="${esc(title)}" itemprop="image" loading="eager" /><figcaption>${esc(title)}</figcaption></figure>` : ""}
 <section itemprop="articleBody">${esc(a.content || a.summary || "")
 .split(/\n+/)
 .map((p) => `<p>${p}</p>`)
 .join("\n")}</section>
 ${tags.length ? `<footer><nav aria-label="الوسوم">${tags.map((t) => `<a href="/tag/${encodeURIComponent(t)}" rel="tag">${esc(t)}</a>`).join("")}</nav></footer>` : ""}
 ${related.length ? `<aside aria-label="الأخبار ذات الصلة"><h2>الأخبار ذات الصلة</h2><ul>${linkList(related)}</ul></aside>` : ""}
 ${latest.length ? `<aside aria-label="آخر الأخبار"><h2>آخر الأخبار</h2><ul>${linkList(latest)}</ul></aside>` : ""}
 <nav aria-label="روابط مهمة"><a href="/">الرئيسية</a> · <a href="/latest">آخر الأخبار</a> · <a href="/most-read">الأكثر قراءة</a> · <a href="/breaking">عاجل</a>${a.categories?.slug ? ` · <a href="/category/${esc(a.categories.slug)}">${esc(category)}</a>` : ""}</nav>
 </article>`;

 return injectBody(injectHead(template, head), body);
}

// -------- Listing page (home / category / tag / archive) ------------------
function listingHtml(
 template: string,
 opts: { title: string; desc: string; canonical: string; h1: string; articles: any; rel?: string }
): string {
 const { title, desc, canonical, h1, articles } = opts;
 const head = `
 <title>${esc(title)}</title>
 <meta name="description" content="${esc(desc)}" />
 <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
 <link rel="canonical" href="${esc(canonical)}" />
 <meta property="og:type" content="website" />
 <meta property="og:site_name" content="مصدري للأخبار المصرية والعالمية" />
 <meta property="og:locale" content="ar_EG" />
 <meta property="og:title" content="${esc(title)}" />
 <meta property="og:description" content="${esc(desc)}" />
 <meta property="og:url" content="${esc(canonical)}" />
 <meta property="og:image" content="${BASE_URL}/favicon-512.png" />
 <meta name="twitter:card" content="summary_large_image" />
 <meta name="twitter:title" content="${esc(title)}" />
 <meta name="twitter:description" content="${esc(desc)}" />
 `;

 const itemList = {
 "@context": "https://schema.org",
 "@type": "ItemList",
 itemListElement: articles.slice(0, 30).map((a, i) => ({
 "@type": "ListItem",
 position: i + 1,
 url: `${BASE_URL}/${a.short_id || `article/${a.id}`}`,
 name: a.title,
 })),
 };

 const body = `<main dir="rtl" lang="ar">
 <header><h1>${esc(h1)}</h1><p>${esc(desc)}</p></header>
 <section aria-label="قائمة الأخبار"><ul>
 ${articles
 .slice(0, 30)
 .map(
 (a) =>
 `<li><article>
 <a href="/${esc(a.short_id || `article/${a.id}`)}"><h2>${esc(a.title)}</h2></a>
 ${a.summary ? `<p>${esc(String(a.summary).slice(0, 220))}</p>` : ""}
 <time datetime="${esc(a.created_at)}">${esc(a.created_at)}</time>
 </article></li>`
 )
 .join("\n ")}
 </ul></section>
 <script type="application/ld+json">${JSON.stringify(itemList)}</script>
 </main>`;

 return injectBody(injectHead(template, head + `\n<script type="application/ld+json">${JSON.stringify(itemList)}</script>`), body);
}

async function main {
 if (!existsSync(TEMPLATE_PATH)) {
 console.warn("[prerender] dist/index.html not found, skipping");
 return;
 }
 const template = readFileSync(TEMPLATE_PATH, "utf8");

 console.log("[prerender] fetching articles & categories…");
 const [articles, categories] = await Promise.all([
 sb(
 "articles?select=id,short_id,title,summary,content,image_url,created_at,updated_at,tags,category_id,categories(name,slug)&is_published=eq.true&order=created_at.desc&limit=2000"
 ),
 sb("categories?select=id,name,slug").catch( => ),
 ]);

 let ok = 0;

 // 1) Articles
 for (const a of articles) {
 const slug = a.short_id ? String(a.short_id) : a.id ? `article/${a.id}` : null;
 if (!slug) continue;
 try {
 const out = resolve(DIST, slug, "index.html");
 mkdirSync(dirname(out), { recursive: true });
 const related = articles
 .filter((x) => x.id !== a.id && (x.category_id === a.category_id || x.categories?.slug === a.categories?.slug))
 .slice(0, 6);
 const latest = articles.filter((x) => x.id !== a.id).slice(0, 6);
 writeFileSync(out, articleHtml(template, a, related, latest));
 ok++;
 } catch (e) {
 console.warn(`[prerender] skip article ${slug}:`, (e as Error).message);
 }
 }

 // 2) Home
 try {
 writeFileSync(
 resolve(DIST, "index.html"),
 listingHtml(template, {
 title: "مصدري للأخبار المصرية والعالمية — أحدث الأخبار المصرية والعربية",
 desc: "تابع آخر الأخبار العاجلة من مصر والعالم العربي على بوابة صوت البلد. سياسة، اقتصاد، رياضة، فن، وأسعار العملات لحظة بلحظة.",
 canonical: `${BASE_URL}/`,
 h1: "مصدري للأخبار المصرية والعالمية",
 articles,
 })
 );
 ok++;
 } catch (e) {
 console.warn("[prerender] skip home:", (e as Error).message);
 }

 // 3) Categories
 for (const c of categories) {
 if (!c.slug) continue;
 const list = articles.filter((a) => a.category_id === c.id || a.categories?.slug === c.slug);
 try {
 const out = resolve(DIST, "category", c.slug, "index.html");
 mkdirSync(dirname(out), { recursive: true });
 writeFileSync(
 out,
 listingHtml(template, {
 title: `${c.name} | صوت البلد`,
 desc: `أحدث أخبار قسم ${c.name} على بوابة مصدري للأخبار المصرية والعالمية.`,
 canonical: `${BASE_URL}/category/${c.slug}`,
 h1: c.name,
 articles: list,
 })
 );
 ok++;
 } catch (e) {
 console.warn(`[prerender] skip category ${c.slug}:`, (e as Error).message);
 }
 }

 // 4) Tags (top 200 unique)
 const tagSet = new Map<string, any>;
 for (const a of articles) {
 for (const t of (a.tags || ) as string) {
 if (!t) continue;
 const k = String(t).trim;
 if (!k) continue;
 if (!tagSet.has(k)) tagSet.set(k, );
 tagSet.get(k)!.push(a);
 }
 }
 let tagCount = 0;
 for (const [tag, list] of tagSet) {
 if (tagCount++ > 300) break;
 try {
 const out = resolve(DIST, "tag", encodeURIComponent(tag), "index.html");
 mkdirSync(dirname(out), { recursive: true });
 writeFileSync(
 out,
 listingHtml(template, {
 title: `#${tag} | صوت البلد`,
 desc: `كل الأخبار المرتبطة بـ ${tag} على بوابة صوت البلد.`,
 canonical: `${BASE_URL}/tag/${encodeURIComponent(tag)}`,
 h1: `#${tag}`,
 articles: list,
 })
 );
 ok++;
 } catch (e) {
 console.warn(`[prerender] skip tag ${tag}:`, (e as Error).message);
 }
 }

 // 5) Archives (year)
 const years = new Map<string, any>;
 for (const a of articles) {
 const y = (a.created_at || "").slice(0, 4);
 if (!/^\d{4}$/.test(y)) continue;
 if (!years.has(y)) years.set(y, );
 years.get(y)!.push(a);
 }
 for (const [y, list] of years) {
 try {
 const out = resolve(DIST, "archive", y, "index.html");
 mkdirSync(dirname(out), { recursive: true });
 writeFileSync(
 out,
 listingHtml(template, {
 title: `أرشيف ${y} | صوت البلد`,
 desc: `أرشيف الأخبار المنشورة عام ${y} على بوابة صوت البلد.`,
 canonical: `${BASE_URL}/archive/${y}`,
 h1: `أرشيف عام ${y}`,
 articles: list,
 })
 );
 ok++;
 } catch (e) {
 console.warn(`[prerender] skip archive ${y}:`, (e as Error).message);
 }
 }

 // 6) Google News RSS feed (/news.xml) — last 72h, full-fat fields
 try {
 const cutoff = Date.now - 72 * 3600 * 1000;
 const recent = articles.filter((a) => new Date(a.created_at).getTime >= cutoff).slice(0, 1000);
 const xe = (s: any) =>
 String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
 const items = recent.map((a) => {
 const link = `${BASE_URL}/${a.short_id || `article/${a.id}`}`;
 const pub = new Date(a.created_at).toUTCString;
 const excerpt = String(a.summary || a.content || a.title || "").slice(0, 600);
 return ` <item>
 <title>${xe(a.title)}</title>
 <link>${xe(link)}</link>
 <guid isPermaLink="true">${xe(link)}</guid>
 <pubDate>${pub}</pubDate>
 <dc:creator>صوت البلد</dc:creator>
 <author>news@soutalbalad.lovable.app (صوت البلد)</author>
 ${a.categories?.name ? `<category>${xe(a.categories.name)}</category>` : ""}
 <description>${xe(excerpt)}</description>
 <content:encoded><![CDATA[${a.content || a.summary || a.title || ""}]]></content:encoded>
 ${a.image_url ? `<enclosure url="${xe(a.image_url)}" type="image/jpeg" />` : ""}
 ${a.image_url ? `<media:content url="${xe(a.image_url)}" medium="image" />` : ""}
 </item>`;
 }).join("\n");
 const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
 <channel>
 <title>مصدري للأخبار المصرية والعالمية — Google News Feed</title>
 <link>${BASE_URL}/</link>
 <atom:link href="${BASE_URL}/news.xml" rel="self" type="application/rss+xml" />
 <description>أحدث الأخبار المصرية والعربية — تحديث فوري لجوجل نيوز.</description>
 <language>ar</language>
 <lastBuildDate>${new Date.toUTCString}</lastBuildDate>
${items}
 </channel>
</rss>`;
 writeFileSync(resolve(DIST, "news.xml"), rss);
 ok++;
 } catch (e) {
 console.warn("[prerender] skip news.xml:", (e as Error).message);
 }

 // 7) Dedicated Google News sitemap (/sitemap-news.xml) — last 48h
 try {
 const cutoff = Date.now - 48 * 3600 * 1000;
 const recent = articles.filter((a) => new Date(a.created_at).getTime >= cutoff).slice(0, 1000);
 const xe = (s: any) =>
 String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
 const urls = recent.map((a) => {
 const link = `${BASE_URL}/${a.short_id || `article/${a.id}`}`;
 const pub = new Date(a.created_at).toISOString;
 return ` <url>
 <loc>${xe(link)}</loc>
 <news:news>
 <news:publication><news:name>صوت البلد</news:name><news:language>ar</news:language></news:publication>
 <news:publication_date>${pub}</news:publication_date>
 <news:title>${xe(a.title)}</news:title>
 </news:news>
 ${a.image_url ? `<image:image><image:loc>${xe(a.image_url)}</image:loc><image:caption>${xe(a.title)}</image:caption></image:image>` : ""}
 </url>`;
 }).join("\n");
 const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
 xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
 xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
 writeFileSync(resolve(DIST, "sitemap-news.xml"), xml);
 ok++;
 } catch (e) {
 console.warn("[prerender] skip sitemap-news.xml:", (e as Error).message);
 }

 console.log(`[prerender] done — ${ok} pages written under dist/`);
}

main.catch((e) => {
 console.error("[prerender] failed:", e);
 process.exit(0);
});
