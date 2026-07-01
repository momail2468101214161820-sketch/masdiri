import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Award, Sparkles, Users, Newspaper, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ArticleCard from "@/components/ArticleCard";
import { getArticlePrimaryImage } from "@/lib/articleImages";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_SLOGAN } from "@/lib/siteUrl";

interface Article {
  id: string;
  short_id?: number | null;
  title: string;
  summary: string | null;
  image_url: string | null;
  content?: string | null;
  images?: any;
  is_breaking: boolean;
  is_pinned: boolean;
  created_at: string;
  view_count?: number | null;
  categories: { name: string; slug: string } | null;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const SECTIONS: Array<{ slug: string; title: string; icon: any; accent: string }> = [
  { slug: "beni-suef",             title: "أخبار بني سويف",     icon: MapPin,    accent: "text-primary" },
  { slug: "success-stories",       title: "قصص نجاح",           icon: Award,     accent: "text-secondary" },
  { slug: "inspiring-people",      title: "شخصيات ملهمة",       icon: Sparkles,  accent: "text-primary" },
  { slug: "community-initiatives", title: "مبادرات مجتمعية",    icon: Users,     accent: "text-secondary" },
];

const Index = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, short_id, title, summary, image_url, content, images, is_breaking, is_pinned, created_at, view_count, categories(name, slug)")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      if (data) {
        const normalized = (data as any[]).map((a) => ({ ...a, image_url: getArticlePrimaryImage(a) }));
        setArticles(normalized as any);
      }
      setLoading(false);
    })();
  }, []);

  const featured = articles.find((a) => a.is_pinned) || articles[0];
  const latest = articles.filter((a) => a.id !== featured?.id).slice(0, 6);
  const mostRead = [...articles].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 4);
  const bySlug = (slug: string) => articles.filter((a) => a.categories?.slug === slug).slice(0, 3);

  const homeDesc = `${SITE_NAME_AR} — منصة إخبارية محلية موثوقة تركز على أخبار بني سويف، قصص النجاح، الشخصيات الملهمة، والمبادرات المجتمعية على مدار 24 ساعة.`;

  return (
    <div className="min-h-screen bg-background text-right" dir="rtl">
      <Helmet>
        <title>{`${SITE_NAME} | ${SITE_SLOGAN}`}</title>
        <meta name="description" content={homeDesc} />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${SITE_NAME} | ${SITE_NAME_AR}`} />
        <meta property="og:description" content={homeDesc} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:image" content={`${SITE_URL}/images/logo.png`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-soft)" }}>
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <span className="chip mb-3">📰 {SITE_SLOGAN}</span>
            <h1 className="text-3xl md:text-5xl font-black mb-3">
              <span className="gradient-text">{SITE_NAME_AR}</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              منصة إخبارية محلية موثوقة — بني سويف • قصص نجاح • مبادرات مجتمعية • تغطية على مدار 24 ساعة.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center text-xs">
              <span className="chip-teal chip">⚡ سرعة</span>
              <span className="chip-teal chip">✅ دقة</span>
              <span className="chip-teal chip">🛡️ مصداقية</span>
            </div>
          </div>

          {featured && (
            <Link
              to={featured.short_id ? `/${featured.short_id}` : `/article/${featured.id}`}
              className="block card-clean overflow-hidden group max-w-5xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-5">
                <div className="md:col-span-3 aspect-video md:aspect-auto bg-muted overflow-hidden">
                  <img
                    src={featured.image_url || "/images/logo.png"}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
                  {featured.is_breaking && <span className="chip-danger chip mb-3 w-fit">🔴 عاجل</span>}
                  {featured.categories?.name && <span className="chip mb-3 w-fit">{featured.categories.name}</span>}
                  <h2 className="text-xl md:text-2xl font-black leading-tight mb-2 group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  {featured.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{featured.summary}</p>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 space-y-14">
        {/* Latest */}
        <section>
          <div className="section-heading-bar">
            <div>
              <h2 className="section-title flex items-center gap-2"><Newspaper size={22} className="text-primary" /> آخر الأخبار</h2>
              <p className="section-subtitle">أحدث ما نشرته غرفة تحرير مصدري بلس.</p>
            </div>
            <Link to="/latest" className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">
              عرض الكل <ArrowLeft size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => <div key={i} className="bg-muted h-72 animate-pulse rounded-2xl" />)}
            </div>
          ) : latest.length === 0 ? (
            <div className="card-clean p-10 text-center text-muted-foreground">لا توجد أخبار منشورة بعد.</div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latest.map((a) => (
                <motion.div key={a.id} variants={fadeUp}>
                  <ArticleCard
                    id={a.id}
                    short_id={a.short_id}
                    title={a.title}
                    summary={a.summary}
                    image_url={a.image_url}
                    category_name={a.categories?.name}
                    created_at={a.created_at}
                    is_breaking={a.is_breaking}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Most read */}
        {mostRead.length > 0 && (
          <section>
            <div className="section-heading-bar">
              <div>
                <h2 className="section-title flex items-center gap-2">🔥 الأكثر قراءة</h2>
                <p className="section-subtitle">أبرز ما يهم القراء الآن.</p>
              </div>
              <Link to="/most-read" className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mostRead.map((a, i) => (
                <Link
                  key={a.id}
                  to={a.short_id ? `/${a.short_id}` : `/article/${a.id}`}
                  className="card-clean p-4 flex gap-3 items-start group"
                >
                  <span className="text-3xl font-black gradient-text w-8 shrink-0">{i + 1}</span>
                  <h4 className="text-sm font-bold leading-snug line-clamp-4 group-hover:text-primary transition-colors">
                    {a.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Category sections */}
        {SECTIONS.map(({ slug, title, icon: Icon, accent }) => {
          const items = bySlug(slug);
          if (!items.length) return null;
          return (
            <section key={slug}>
              <div className="section-heading-bar">
                <div>
                  <h2 className="section-title flex items-center gap-2"><Icon size={22} className={accent} /> {title}</h2>
                </div>
                <Link to={`/category/${slug}`} className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">
                  عرض المزيد <ArrowLeft size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {items.map((a) => (
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
            </section>
          );
        })}
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
