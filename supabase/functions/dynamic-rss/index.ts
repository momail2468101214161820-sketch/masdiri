// RSS 2.0 feed — general + per-category (?category=<slug>).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabase = createClient(
 Deno.env.get("SUPABASE_URL")!,
 Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BASE_URL = "https://soutalbalad.lovable.app";

const xmlEscape = (s: string) =>
 s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const headers = {
 "Access-Control-Allow-Origin": "*",
 "Content-Type": "application/rss+xml; charset=utf-8",
 "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
};

async function fetchArticles(categorySlug: string | null) {
 let categoryId: string | null = null;
 let categoryName = "كل الأخبار";
 if (categorySlug) {
 const { data: cat } = await supabase.from("categories").select("id, name").eq("slug", categorySlug).maybeSingle;
 if (cat) { categoryId = cat.id; categoryName = cat.name; }
 }
 let q = supabase
 .from("articles")
 .select("id, short_id, title, summary, image_url, created_at, updated_at, is_breaking, categories(name, slug)")
 .eq("is_published", true)
 .order("created_at", { ascending: false })
 .limit(50);
 if (categoryId) q = q.eq("category_id", categoryId);
 if (categorySlug === "__breaking__") {
 q = supabase
 .from("articles")
 .select("id, short_id, title, summary, image_url, created_at, updated_at, is_breaking, categories(name, slug)")
 .eq("is_published", true)
 .eq("is_breaking", true)
 .order("created_at", { ascending: false })
 .limit(50);
 categoryName = "الأخبار العاجلة";
 }
 const { data } = await q;
 return { articles: data || , categoryName };
}

serve(async (req) => {
 try {
 const url = new URL(req.url);
 const categorySlug = url.searchParams.get("category");
 const type = url.searchParams.get("type");
 const slugOrFlag = type === "breaking" ? "__breaking__" : categorySlug;
 const { articles, categoryName } = await fetchArticles(slugOrFlag);

 const channelTitle = categorySlug
 ? `صوت البلد | ${categoryName}`
 : "مصدري للأخبار المصرية والعالمية";
 const channelLink = categorySlug ? `${BASE_URL}/category/${categorySlug}` : `${BASE_URL}/`;
 const selfLink = categorySlug
 ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/dynamic-rss?category=${categorySlug}`
 : `${Deno.env.get("SUPABASE_URL")}/functions/v1/dynamic-rss`;

 const items = articles.map((a: any) => {
 const link = `${BASE_URL}/${a.short_id || `article/${a.id}`}`;
 const desc = a.summary || a.title;
 return [
 ` <item>`,
 ` <title>${xmlEscape(a.title)}</title>`,
 ` <link>${xmlEscape(link)}</link>`,
 ` <guid isPermaLink="true">${xmlEscape(link)}</guid>`,
 ` <pubDate>${new Date(a.created_at).toUTCString}</pubDate>`,
 ` <description>${xmlEscape(desc)}</description>`,
 a.categories?.name ? ` <category>${xmlEscape(a.categories.name)}</category>` : null,
 a.image_url ? ` <enclosure url="${xmlEscape(a.image_url)}" type="image/jpeg" />` : null,
 ` </item>`,
 ].filter(Boolean).join("\n");
 }).join("\n");

 const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
 <channel>
 <title>${xmlEscape(channelTitle)}</title>
 <link>${xmlEscape(channelLink)}</link>
 <atom:link href="${xmlEscape(selfLink)}" rel="self" type="application/rss+xml" />
 <description>أحدث أخبار صوت البلد لحظة بلحظة.</description>
 <language>ar</language>
 <lastBuildDate>${new Date.toUTCString}</lastBuildDate>
${items}
 </channel>
</rss>`;
 return new Response(xml, { headers });
 } catch (e) {
 console.error("rss error", e);
 return new Response(`<?xml version="1.0"?><rss version="2.0"><channel><title>صوت البلد</title></channel></rss>`, { headers });
 }
});
