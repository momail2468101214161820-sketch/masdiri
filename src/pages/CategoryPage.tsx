import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getArticlePrimaryImage } from "@/lib/articleImages";

import { SITE_URL } from "@/lib/siteUrl";

const categoryNames: Record<string, string> = {
  politics: "سياسة",
  sports: "رياضة",
  accidents: "حوادث",
  economy: "اقتصاد",
  technology: "تكنولوجيا",
  prices: "أسعار",
  entertainment: "فن ومنوعات",
  health: "صحة وأسرة",
};

interface Article {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  content?: string | null;
  images?: (string | { url: string; position?: string })[] | null;
  is_breaking: boolean;
  created_at: string;
  categories: { name: string } | null;
}

const CategoryPage = () => {
  const { slug } = useParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryArticles = async () => {
      setLoading(true);
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slug!)
        .maybeSingle();

      if (category) {
        const { data } = await supabase
          .from("articles")
          .select("id, short_id, title, summary, image_url, content, images, is_breaking, created_at, categories(name)")
          .eq("category_id", category.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        if (data) {
          const normalized = (data as any[]).map((article) => ({
            ...article,
            image_url: getArticlePrimaryImage(article),
          }));
          setArticles(normalized as unknown as Article[]);
        }
      }
      setLoading(false);
    };
    fetchCategoryArticles();
  }, [slug]);

  const catName = categoryNames[slug!] || slug || "قسم";
  const catTitle = `${catName} | مصدري`;
  const catDesc = `أحدث أخبار ${catName} من مصدري — تغطية متجددة، تحليلات وتقارير حصرية حول ${catName} في مصر والعالم.`;
  const catUrl = `${SITE_URL}/category/${slug}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{catTitle}</title>
        <meta name="description" content={catDesc} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={catUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={catTitle} />
        <meta property="og:description" content={catDesc} />
        <meta property="og:url" content={catUrl} />
        <meta property="og:site_name" content="مصدري" />
        <meta property="og:image" content={`${SITE_URL}/images/logo.png`} />
        <meta property="og:image:secure_url" content={`${SITE_URL}/images/logo.png`} />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content={`شعار مصدري الأصلي - ${catName}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={catTitle} />
        <meta name="twitter:description" content={catDesc} />
        <meta name="twitter:image" content={`${SITE_URL}/images/logo.png`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: catTitle,
          description: catDesc,
          url: catUrl,
          inLanguage: "ar",
          isPartOf: { "@type": "WebSite", name: "مصدري", url: `${SITE_URL}/` },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: articles.length,
            itemListElement: articles.slice(0, 20).map((a, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}/article/${a.id}`,
              name: a.title,
            })),
          },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: catName, item: catUrl },
          ],
        })}</script>
      </Helmet>
      <SiteHeader />
      <Breadcrumbs items={[{ label: catName }]} />
      <main className="container py-6">
        <h1 className="newspaper-heading text-3xl border-b-2 border-foreground pb-2 mb-6">{catName}</h1>
        <AdSlot slot="header" className="mb-6" />
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-64 animate-pulse" />

            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="border border-border p-12 text-center">
            <p className="text-muted-foreground">لا توجد أخبار في هذا القسم حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                short_id={(article as any).short_id}
                title={article.title}
                summary={article.summary}
                image_url={article.image_url}
                category_name={article.categories?.name}
                created_at={article.created_at}
                is_breaking={article.is_breaking}
              />

            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default CategoryPage;
