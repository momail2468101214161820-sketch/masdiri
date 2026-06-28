import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import AdSlot from "@/components/AdSlot";
import ArticleCard from "@/components/ArticleCard";
import CurrencyWidget from "@/components/CurrencyWidget";
import NotificationPrompt from "@/components/NotificationPrompt";
import WatermarkedImage from "@/components/WatermarkedImage";
import SoutAlBaladBot from "@/components/SoutAlBaladBot";
import MostReadWidget from "@/components/MostReadWidget";
import HeroBento from "@/components/HeroBento";
import BackToTop from "@/components/BackToTop";
import CommandPalette from "@/components/CommandPalette";
import NewsletterInline from "@/components/NewsletterInline";
import TrendingTags from "@/components/TrendingTags";
import LiveDateBar from "@/components/LiveDateBar";
import { ScrollProgress, ConnectivityBanner, PWAInstallHint, CookieConsent, SelectionShare, KeyboardNav } from "@/components/ProFeatures";
import { PrayerTimesWidget, RecentlyViewedRail, ImageLightbox } from "@/components/ProFeatures2";
import { QuoteOfDay, CoffeeBreakNudge, GeoChip } from "@/components/ProFeatures3";
import { NewsRefreshToaster, IdleNudge, SmoothAnchors, ExternalLinkHardener, ImageErrorFallback, QuickFeedback, HourlyPulse, SuggestStoryCTA } from "@/components/ProFeatures4";
import { AmbientMoodBar } from "@/components/ProFeatures5";
import UtilityBar from "@/components/UtilityBar";
import { motion } from "framer-motion";
import { getArticlePrimaryImage } from "@/lib/articleImages";

const SITE_URL = "https://soutalbalad.lovable.app";

interface Article {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  content?: string | null;
  images?: (string | { url: string; position?: string })[] | null;
  is_breaking: boolean;
  is_pinned: boolean;
  created_at: string;
  categories: { name: string } | null;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const Index = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "مصدري للأخبار المصرية والعالمية | أخبار مصر العاجلة";
  }, []);

  const refetchTimer = useRef<number | null>(null);
  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, short_id, title, summary, image_url, content, images, is_breaking, is_pinned, created_at, categories(name)")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) {
        const normalized = (data as any[]).map((a) => ({
          ...a,
          image_url: getArticlePrimaryImage(a),
        }));
        setArticles(normalized as unknown as Article[]);
      }
      setLoading(false);
    };
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("id, name, slug").limit(20);
      if (data) setCategories(data);
    };
    fetchArticles();
    fetchCategories();
    // Debounced realtime refresh to avoid render storms
    const scheduleRefetch = () => {
      if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
      refetchTimer.current = window.setTimeout(fetchArticles, 1500);
    };
    const channel = supabase.channel("public-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles" }, (payload: any) => {
        const row = payload?.new;
        if (row && row.is_published) {
          window.dispatchEvent(new CustomEvent("sb-news-refreshed", { detail: row }));
          if ("Notification" in window && Notification.permission === "granted") {
            try { new Notification("خبر جديد على مصدري", { body: row.title?.slice(0, 120) || "اضغط للقراءة", icon: "/images/logo.png" }); } catch {}
          }
        }
        scheduleRefetch();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "articles" }, scheduleRefetch)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "articles" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, fetchCategories)
      .subscribe();
    return () => {
      if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const featured = articles.find((a) => a.is_pinned) || articles[0];
  const rest = articles.filter((a) => a.id !== featured?.id);
  const heroSecondary = rest[0];
  const heroTertiary = rest[1];
  const sidebarLatest = rest.slice(2, 6);
  const gridArticles = rest.slice(6);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("ar-EG-u-nu-arab", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });

  const homeDesc = "مصدري للأخبار المصرية والعالمية. أخبار مصر العاجلة، تقارير سياسية ورياضية واقتصادية، نتائج الإعدادية وأسعار العملات والذهب لحظة بلحظة.";

  return (
    <div className="min-h-screen bg-background text-right antialiased relative" dir="rtl">
      <Helmet>
        <title>مصدري للأخبار المصرية والعالمية | أخبار مصر العاجلة</title>
        <meta name="description" content={homeDesc} />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="مصدري للأخبار المصرية والعالمية | أخبار مصر العاجلة" />
        <meta property="og:description" content={homeDesc} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:site_name" content="مصدري" />
        <meta property="og:image" content={`${SITE_URL}/images/logo.png`} />
        <meta property="og:image:secure_url" content={`${SITE_URL}/images/logo.png`} />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="شعار مصدري الأصلي" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="مصدري للأخبار المصرية والعالمية" />
        <meta name="twitter:description" content={homeDesc} />
        <meta name="twitter:image" content={`${SITE_URL}/images/logo.png`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "مصدري",
          alternateName: "Sout Al Balad",
          url: `${SITE_URL}/`,
          inLanguage: "ar-EG",
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          name: "مصدري",
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/images/logo.png`,
          description: homeDesc,
          inLanguage: "ar-EG",
        })}</script>
      </Helmet>
      <SiteHeader />
      <BreakingTicker />
      <UtilityBar />
      <NotificationPrompt />





      <main className="max-w-7xl mx-auto bg-card shadow-2xl border-t-4 border-[hsl(var(--gold))] relative">
        {/* Decorative top gradient halo */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[hsl(var(--gold)/0.08)] to-transparent" />

        {/* Quick category nav */}
        {categories.length > 0 && (
          <nav className="relative flex gap-1 overflow-x-auto px-6 py-3 border-b border-border/60 bg-muted/30 backdrop-blur-sm" aria-label="الأقسام">
            {categories.map((c) => (
              <a key={c.id} href={`/category/${c.slug}`}
                className="shrink-0 px-4 py-1.5 text-xs font-bold text-[hsl(var(--primary))] dark:text-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] hover:bg-card rounded-md transition-colors"
                style={{ fontFamily: "'Cairo', sans-serif" }}>
                {c.name}
              </a>
            ))}
          </nav>
        )}

        <div className="p-6 md:p-10 lg:p-12">
          {/* Hero Bento - Royal Presidential */}
          {!loading && featured && (
            <HeroBento featured={featured as any} secondary={heroSecondary as any} tertiary={heroTertiary as any} />
          )}

          {/* Latest rail + Currency */}
          {!loading && sidebarLatest.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
              <div className="lg:col-span-8">
                <div className="section-heading mb-4">
                  <h2>أحدث المستجدات</h2>
                </div>
                <div className="rule-gold mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {sidebarLatest.map((a) => (
                    <a key={a.id} href={`/article/${a.id}`}
                      className="group flex gap-4 p-4 rounded-2xl bg-card border border-border hover:border-[hsl(var(--gold))] hover:shadow-[0_10px_30px_-12px_hsl(var(--gold)/0.35)] transition-all">
                      <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[hsl(var(--primary))] ring-1 ring-[hsl(var(--gold)/0.25)]">
                        <img src={a.image_url || "/images/logo.png"} alt={a.title}
                          className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${a.image_url ? "object-cover" : "object-contain p-2 opacity-70"}`}
                          loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black tracking-widest text-[hsl(var(--gold-dark))] dark:text-[hsl(var(--gold))]"
                          style={{ fontFamily: "'Cairo', sans-serif" }}>
                          {a.categories?.name || "أخبار"}
                        </span>
                        <h4 className="text-base font-bold text-foreground group-hover:text-[hsl(var(--gold))] transition-colors leading-snug mt-1 line-clamp-3"
                          style={{ fontFamily: "'Cairo', sans-serif" }}>
                          {a.title}
                        </h4>
                        <div className="mt-2 text-[10px] tabular text-muted-foreground">{formatTime(a.created_at)}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              <aside className="lg:col-span-4">
                <CurrencyWidget />
              </aside>
            </div>
          )}

          {/* Top ad */}
          <div className="mb-10">
            <AdSlot slot="header" className="w-full" />
          </div>

          {/* News Grid */}
          <section>
            <div className="section-heading">
              <h2>آخر التغطيات الإخبارية</h2>
              <span className="more flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                تحديث مباشر
              </span>
            </div>
            <div className="rule-gold mb-8" />


            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              <div className="lg:col-span-3">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-muted h-72 animate-pulse rounded-2xl" />
                    ))}
                  </div>
                ) : gridArticles.length === 0 ? (
                  <div className="border border-border border-dashed p-12 text-center rounded-2xl bg-muted/30">
                    <h3 className="font-bold text-lg mb-2 text-foreground" style={{ fontFamily: "'Amiri', serif" }}>
                      جارٍ تحديث غرفة التحرير
                    </h3>
                    <p className="text-muted-foreground text-sm">سيتم نشر الأخبار فور توفرها.</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="hidden" animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gridArticles.map((article) => (
                      <motion.div key={article.id} variants={fadeUp}>
                        <ArticleCard
                          id={article.id}
                          short_id={(article as any).short_id}
                          title={article.title}
                          summary={article.summary}
                          image_url={article.image_url}
                          category_name={article.categories?.name}
                          created_at={article.created_at}
                          is_breaking={article.is_breaking}
                        />

                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Side ad column */}
              <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
                <MostReadWidget />
                <PrayerTimesWidget />
                <NewsletterInline />
                <RecentlyViewedRail />
                <QuoteOfDay />

                <TrendingTags />
                <QuickFeedback />



                <div className="bg-gradient-to-br from-[hsl(var(--gold)/0.06)] to-card border border-[hsl(var(--gold)/0.3)] p-6 rounded-2xl shadow-md">
                  <h5 className="text-[hsl(var(--primary))] dark:text-[hsl(var(--gold))] font-bold mb-4 border-b-2 border-[hsl(var(--gold))] pb-2 inline-block"
                    style={{ fontFamily: "'Cairo', sans-serif" }}>
                    خدماتنا الرقمية
                  </h5>
                  <ul className="space-y-3 text-sm font-semibold text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>
                    <li>
                      <a href="/results/prep" className="hover:text-[hsl(var(--gold))] flex items-center gap-2 transition-colors group">
                        <span className="w-1.5 h-1.5 bg-[hsl(var(--gold))] rounded-full group-hover:scale-150 transition-transform" />
                        نتائج الإعدادية
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="bg-card p-3 rounded-2xl border border-border text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2"
                    style={{ fontFamily: "'Cairo', sans-serif" }}>مساحة إعلانية</p>
                  <AdSlot slot="sidebar" className="w-full" />
                </div>
              </aside>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
      <SoutAlBaladBot />
      <BackToTop />
      <CommandPalette />
      <ScrollProgress />
      <ConnectivityBanner />
      <PWAInstallHint />
      <CookieConsent />
      <SelectionShare />
      <KeyboardNav />
      <ImageLightbox />
      <CoffeeBreakNudge />
      <NewsRefreshToaster />
      <IdleNudge />
      <SmoothAnchors />
      <ExternalLinkHardener />
      <ImageErrorFallback />
      <HourlyPulse />
      <SuggestStoryCTA />
      <GeoChip />

      <AmbientMoodBar />

    </div>




  );
};

export default Index;
