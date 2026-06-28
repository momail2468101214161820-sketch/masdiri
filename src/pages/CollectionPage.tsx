import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs, { Crumb } from "@/components/Breadcrumbs";
import { getArticlePrimaryImage } from "@/lib/articleImages";
import { governorateName } from "@/lib/governorates";

const SITE_URL = "https://soutalbalad.lovable.app";

type Mode =
  | "latest"
  | "breaking"
  | "most-read"
  | "tag"
  | "governorate"
  | "entity"
  | "archive"
  | "search";

interface Props {
  mode: Mode;
}

interface Row {
  id: string;
  short_id?: number | null;
  title: string;
  summary: string | null;
  image_url: string | null;
  content?: string | null;
  images?: any;
  is_breaking: boolean;
  created_at: string;
  categories: { name: string } | null;
}

const titleFor = (mode: Mode, params: Record<string, string | undefined>, q?: string) => {
  switch (mode) {
    case "latest": return { name: "آخر الأخبار", path: "/latest" };
    case "breaking": return { name: "الأخبار العاجلة", path: "/breaking" };
    case "most-read": return { name: "الأكثر قراءة", path: "/most-read" };
    case "tag": return { name: `وسم: ${decodeURIComponent(params.slug || "")}`, path: `/tag/${params.slug}` };
    case "governorate": return { name: `محافظة ${governorateName(params.slug || "")}`, path: `/governorate/${params.slug}` };
    case "entity": return { name: `شخصية/جهة: ${decodeURIComponent(params.slug || "")}`, path: `/entity/${params.slug}` };
    case "archive": {
      const { yyyy, mm, dd } = params;
      const parts = [yyyy, mm, dd].filter(Boolean).join("/");
      return { name: `أرشيف ${parts}`, path: `/archive/${parts}` };
    }
    case "search": return { name: `نتائج البحث${q ? `: ${q}` : ""}`, path: `/search${q ? `?q=${encodeURIComponent(q)}` : ""}` };
  }
};

const CollectionPage = ({ mode }: Props) => {
  const params = useParams<Record<string, string>>();
  const [sp] = useSearchParams();
  const q = sp.get("q") || "";

  const meta = useMemo(() => titleFor(mode, params, q), [mode, params, q]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let qb = supabase
        .from("articles")
        .select("id, short_id, title, summary, image_url, content, images, is_breaking, created_at, categories(name)")
        .eq("is_published", true);

      switch (mode) {
        case "latest":
          qb = qb.order("created_at", { ascending: false }).limit(60); break;
        case "breaking":
          qb = qb.eq("is_breaking", true).order("created_at", { ascending: false }).limit(60); break;
        case "most-read":
          qb = qb.order("view_count", { ascending: false }).order("created_at", { ascending: false }).limit(60); break;
        case "tag": {
          const slug = decodeURIComponent(params.slug || "");
          qb = qb.contains("tags", [slug]).order("created_at", { ascending: false }).limit(60); break;
        }
        case "governorate":
          qb = qb.eq("governorate", params.slug || "").order("created_at", { ascending: false }).limit(60); break;
        case "entity": {
          const slug = decodeURIComponent(params.slug || "");
          const { data: ents } = await supabase
            .from("article_entities").select("article_id").eq("entity_slug", slug).limit(200);
          const ids = (ents || []).map((e: any) => e.article_id);
          if (!ids.length) { if (!cancelled) { setRows([]); setLoading(false); } return; }
          qb = qb.in("id", ids).order("created_at", { ascending: false }); break;
        }
        case "archive": {
          const { yyyy, mm, dd } = params;
          if (yyyy) {
            const y = Number(yyyy); const m = mm ? Number(mm) - 1 : 0; const d = dd ? Number(dd) : 1;
            const start = new Date(Date.UTC(y, m, d));
            const end = new Date(start);
            if (dd) end.setUTCDate(end.getUTCDate() + 1);
            else if (mm) end.setUTCMonth(end.getUTCMonth() + 1);
            else end.setUTCFullYear(end.getUTCFullYear() + 1);
            qb = qb.gte("created_at", start.toISOString()).lt("created_at", end.toISOString())
                   .order("created_at", { ascending: false }).limit(120);
          }
          break;
        }
        case "search": {
          if (!q) { if (!cancelled) { setRows([]); setLoading(false); } return; }
          qb = qb.or(`title.ilike.%${q}%,summary.ilike.%${q}%,content.ilike.%${q}%`)
                 .order("created_at", { ascending: false }).limit(60); break;
        }
      }

      const { data } = await qb;
      if (cancelled) return;
      const normalized = (data as any[] || []).map((a) => ({ ...a, image_url: getArticlePrimaryImage(a) }));
      setRows(normalized);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [mode, params.slug, params.yyyy, params.mm, params.dd, q]);

  const pageTitle = `${meta.name} | مصدري`;
  const pageDesc = `${meta.name} — تغطية مستمرة وموثقة من مصدري. اطلع على أحدث ما يخص ${meta.name} مرتبة زمنيًا.`;
  const canonical = `${SITE_URL}${meta.path}`;
  const crumbs: Crumb[] = [{ label: meta.name }];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${SITE_URL}/images/logo.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: pageTitle,
          url: canonical,
          inLanguage: "ar",
          isPartOf: { "@type": "WebSite", name: "مصدري", url: `${SITE_URL}/` },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: rows.length,
            itemListElement: rows.slice(0, 20).map((a, i) => ({
              "@type": "ListItem", position: i + 1,
              url: `${SITE_URL}/${a.short_id || `article/${a.id}`}`,
              name: a.title,
            })),
          },
        })}</script>
      </Helmet>
      <SiteHeader />
      <Breadcrumbs items={crumbs} />
      <main className="container py-6">
        <header className="border-b-2 border-foreground pb-3 mb-6 flex items-end justify-between gap-3 flex-wrap">
          <h1 className="newspaper-heading text-3xl">{meta.name}</h1>
          <div className="text-xs text-muted-foreground font-bold">{rows.length} نتيجة</div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-muted h-64 rounded-2xl animate-pulse" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-border rounded-2xl p-12 text-center text-muted-foreground">
            {mode === "search" && !q ? "اكتب كلمة في خانة البحث" : "لا توجد نتائج"}
            <div className="mt-4">
              <Link to="/" className="text-[hsl(var(--gold))] font-black hover:underline">العودة للرئيسية</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map((a) => (
              <ArticleCard
                key={a.id}
                id={a.id}
                short_id={a.short_id}
                title={a.title}
                summary={a.summary}
                image_url={a.image_url}
                category_name={a.categories?.name}
                created_at={a.created_at}
                is_breaking={a.is_breaking}
              />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default CollectionPage;
