import { SITE_URL } from "@/lib/siteUrl";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import ArticleTTS from "@/components/ArticleTTS";
import ArticleJsonLd from "@/components/ArticleJsonLd";
import ShareButtons from "@/components/ShareButtons";
import WatermarkedImage from "@/components/WatermarkedImage";
import BookmarkButton from "@/components/BookmarkButton";
import { Clock, Eye, Sparkles, Moon, Sun, Maximize2, Minimize2, Users, TrendingUp, Tag, MapPin } from "lucide-react";
import { getArticlePrimaryImage } from "@/lib/articleImages";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";
import { governorateName } from "@/lib/governorates";
import { ArticleBody } from "@/components/ArticleBody";

// 🚀 Lazy-load heavy below-the-fold widgets for instant first paint
const RelatedArticles = lazy(() => import("@/components/RelatedArticles"));
const ArticleComments = lazy(() => import("@/components/ArticleComments"));
const FloatingShareBar = lazy(() => import("@/components/FloatingShareBar"));
const ShareImageCard = lazy(() => import("@/components/ShareImageCard"));
const ReadingProgress = lazy(() => import("@/components/ReadingProgress"));
const ArticleReactions = lazy(() => import("@/components/ArticleReactions"));


type ArticleImage = string | { url: string; position: "start" | "middle" | "end" };

interface ArticleData {
  id: string;
  short_id?: number | null;
  title: string;
  content: string;
  summary: string | null;
  image_url: string | null;
  is_breaking: boolean;
  created_at: string;
  images: ArticleImage[] | null;
  category_id?: string | null;
  tags?: string[] | null;
  governorate?: string | null;
  view_count?: number | null;
  categories: { name: string; slug: string } | null;
}


const ArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [viewCount, setViewCount] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(18);
  const [readerNight, setReaderNight] = useState<boolean>(false);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [liveReaders, setLiveReaders] = useState<number>(1);
  const [trending, setTrending] = useState<Array<{ id: string; short_id?: number | null; title: string; image_url: string | null; created_at: string; categories: { name: string } | null }>>([]);
  const [cardOpen, setCardOpen] = useState(false);

  // 🚀 تحسين محرك جلب البيانات وضبط الكروت الذكية للشبكات
  useEffect(() => {
    if (!id) return;

    const fetchArticleData = async () => {
      const isNumeric = /^\d+$/.test(id);
      const query = supabase
        .from("articles")
        .select("*, categories(name, slug)");
      const { data, error } = await (isNumeric
        ? query.eq("short_id", Number(id))
        : query.eq("id", id)
      ).maybeSingle();
      
      if (data && !error) {
        const articleData = data as unknown as ArticleData;
        const normalizedArticle = { ...articleData, image_url: getArticlePrimaryImage(articleData) };
        setArticle(normalizedArticle);

        // 🔎 SEO override priority: admin-set fields win, then auto-derived.
        const seoTitle = ((articleData as any).seo_title || articleData.title || "").trim();
        const seoDesc = (
          (articleData as any).seo_description ||
          articleData.summary ||
          "تغطية شاملة وموثقة من منصة مصدري الإخباري"
        ).trim();

        document.title = `${seoTitle} | مصدري`;

        // Canonical URL — prefer the short permanent URL `/{short_id}` when available
        const canonicalPath = articleData.short_id ? `/${articleData.short_id}` : `/article/${articleData.id}`;
        const canonicalUrl = `${SITE_URL}${canonicalPath}`;
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonical) {
          canonical = document.createElement("link");
          canonical.setAttribute("rel", "canonical");
          document.head.appendChild(canonical);
        }
        canonical.setAttribute("href", canonicalUrl);

        // 🎨 Dynamic Open Graph image — server-rendered 1200×630 PNG per article.
        const ogShareId = articleData.short_id ?? articleData.id;
        const cacheBuster = encodeURIComponent(articleData.created_at || "1");
        const ogImage =
          `https://tgvxtsdlojaxyominpsf.supabase.co/functions/v1/og-image` +
          `?id=${ogShareId}&v=${cacheBuster}`;

        // 🧠 Inject Open Graph & Twitter Cards meta for JS-aware crawlers.
        const metaTags = [
          { property: "og:title", content: seoTitle },
          { property: "og:description", content: seoDesc },
          { property: "og:image", content: ogImage },
          { property: "og:image:secure_url", content: ogImage },
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
          { property: "og:image:type", content: "image/png" },
          { property: "og:image:alt", content: articleData.title },
          { property: "og:url", content: canonicalUrl },
          { property: "og:type", content: "article" },
          { property: "og:site_name", content: "منصة مصدري الإخباري" },
          { property: "og:locale", content: "ar_EG" },
          { property: "article:published_time", content: articleData.created_at },
          { property: "twitter:card", content: "summary_large_image" },
          { property: "twitter:title", content: seoTitle },
          { property: "twitter:description", content: seoDesc },
          { property: "twitter:image", content: ogImage },
          { property: "twitter:image:alt", content: articleData.title },
        ];

        metaTags.forEach(({ property, content }) => {
          if (!content) return;
          const isTwitter = property.startsWith("twitter:");
          const selector = isTwitter
            ? `meta[name="${property}"]`
            : `meta[property="${property}"]`;
          let element = document.querySelector(selector);
          if (!element) {
            element = document.createElement("meta");
            element.setAttribute(isTwitter ? "name" : "property", property);
            document.head.appendChild(element);
          }
          element.setAttribute("content", content);
        });

        // Meta description + focus keyword
        let desc = document.querySelector('meta[name="description"]');
        if (!desc) {
          desc = document.createElement("meta");
          desc.setAttribute("name", "description");
          document.head.appendChild(desc);
        }
        desc.setAttribute("content", seoDesc.slice(0, 160));

        // Merge focus keyword + auto keywords/tags for the keywords meta.
        const allKeywords = Array.from(new Set([
          (articleData as any).focus_keyword,
          ...((articleData as any).keywords || []),
          ...((articleData as any).tags || []),
        ].filter(Boolean))).slice(0, 12).join(", ");
        if (allKeywords) {
          let kw = document.querySelector('meta[name="keywords"]');
          if (!kw) {
            kw = document.createElement("meta");
            kw.setAttribute("name", "keywords");
            document.head.appendChild(kw);
          }
          kw.setAttribute("content", allKeywords);
        }
      }
    };

    fetchArticleData();
    // Live view counter (server-side, persistent)
    (async () => {
      const isNumeric = /^\d+$/.test(id);
      const { data: art } = await supabase
        .from("articles")
        .select("id, view_count")
        .eq(isNumeric ? "short_id" : "id", isNumeric ? Number(id) : id)
        .maybeSingle();
      if (art?.id) {
        setViewCount(((art as any).view_count || 0) + 1);
        // Log a view event — a SECURITY DEFINER trigger bumps articles.view_count.
        await supabase.from("article_view_events").insert({ article_id: (art as any).id });
      }
    })();

    // 💾 Resume-reading: save scroll % every 1.5s, restore on next visit
    const storageKey = `read-pos:${id}`;
    let saveTimer: number | null = null;
    const handleScrollProgress = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(pct);
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        if (pct > 5 && pct < 95) localStorage.setItem(storageKey, String(window.scrollY));
        else if (pct >= 95) localStorage.removeItem(storageKey);
      }, 1500);
    };

    // Restore reading position after content paints
    const restoreTimer = window.setTimeout(() => {
      const saved = Number(localStorage.getItem(storageKey) || "0");
      if (saved > 400) {
        toast("📖 استكمل من حيث توقفت", {
          action: { label: "اذهب", onClick: () => window.scrollTo({ top: saved, behavior: "smooth" }) },
          duration: 6000,
        });
      }
    }, 1200);

    window.addEventListener("scroll", handleScrollProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollProgress);
      if (saveTimer) window.clearTimeout(saveTimer);
      window.clearTimeout(restoreTimer);
    };
  }, [id]);

  // 👥 Live readers — Supabase Realtime Presence per article
  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`reading:${id}`, { config: { presence: { key: crypto.randomUUID() } } });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setLiveReaders(Math.max(1, Object.keys(state).length));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ at: Date.now() });
      });
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // 🔥 Trending — latest 5 published, excluding current
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, short_id, title, image_url, created_at, categories(name)")
        .eq("is_published", true)
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setTrending(data as any);
    })();
  }, [id]);

  // 📸 تشغيل زر الكاميرا الجانبي لإنشاء الكارت التفاعلي فوراً
  // 📸 فتح نافذة كارت المشاركة (لوجو مصدري + برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم + التصميم)
  const handleGenerateCard = () => setCardOpen(true);

  // 📝 تقسيم المتن بذكاء برمي دون التأثير على معمارية الصفحة
  const formattedContent = useMemo(() => {
    if (!article?.content) return { first: "", second: "" };
    // تنظيف أي CTA قديم محقون داخل المتن (واتساب/تليفون/قناة رسمية)
    const cleaned = article.content
      .replace(/\n*-{2,}\n*[\s\S]*?(whatsapp\.com\/channel|wa\.me|للتواصل|قناة مصدري)[\s\S]*$/i, "")
      .replace(/(📲|📱|☎|📞)[^\n]*?(whatsapp\.com\/channel|wa\.me|\+?20[\s\d]+|01[\s\d]+)[^\n]*/gi, "")
      .trim();
    const paragraphs = cleaned.split("\n\n");
    const halfIndex = Math.ceil(paragraphs.length / 2);
    return {
      first: paragraphs.slice(0, halfIndex).join("\n\n"),
      second: paragraphs.slice(halfIndex).join("\n\n"),
    };
  }, [article?.content]);

  if (!article) {
    return (
      <div className="w-full min-h-screen bg-background flex flex-col justify-between">
        <SiteHeader />
        <div className="container mx-auto px-4 py-32 text-center font-black text-muted-foreground/70 animate-pulse tracking-wide">
          جاري جلب تفاصيل التغطية الحية...
        </div>
        <SiteFooter />
      </div>
    );
  }

  const formattedDate = new Date(article.created_at).toLocaleString("ar-EG", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  });

  const primaryShareImage = getArticlePrimaryImage(article);

  return (
    <div className="w-full min-h-screen bg-background text-right antialiased font-sans" dir="rtl">
      
      {/* 🛑 بار القراءة العلوي السحري الانسيابي */}
      <div 
        className="fixed top-0 right-0 h-1 bg-gradient-to-l from-red-600 via-orange-500 to-amber-500 z-[9999] transition-all duration-300 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <SiteHeader />

      <Helmet>
        {primaryShareImage && <link rel="preload" as="image" href={primaryShareImage} fetchPriority="high" />}
      </Helmet>

      <ArticleJsonLd
        title={article.title}
        summary={article.summary}
        image_url={primaryShareImage}
        created_at={article.created_at}
        category={article.categories?.name}
        categorySlug={article.categories?.slug}
        articleId={article.id}
      />
      
      {!focusMode && (
        <div className="max-w-3xl mx-auto px-4 mt-6">
          <AdSlot slot="top-banner" className="w-full h-20 md:h-24 bg-muted/30 rounded-xl border border-border/60 flex items-center justify-center overflow-hidden" />
        </div>
      )}


      <Breadcrumbs items={[
        ...(article.categories?.slug ? [{ label: article.categories.name, href: `/category/${article.categories.slug}` }] : []),
        { label: article.title.length > 60 ? article.title.slice(0, 60) + "…" : article.title }
      ]} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className={`grid grid-cols-1 ${focusMode ? "" : "lg:grid-cols-4"} gap-8 items-start`}>

          <div className={focusMode ? "max-w-3xl mx-auto w-full space-y-6" : "lg:col-span-3 space-y-6"}>
            <article
              className={`relative mx-auto w-full max-w-3xl px-4 sm:px-6 md:px-10 py-8 md:py-12 rounded-2xl border shadow-sm transition-colors ${
                readerNight ? "bg-[#1a1410] border-[hsl(var(--gold)/0.3)] text-[#f3e8d6]" : "bg-card border-border/70"
              }`}
            >
              {/* Category kicker */}
              {article.categories?.name && (
                <div className="flex items-center gap-3 mb-5">
                  <Link
                    to={article.categories.slug ? `/category/${article.categories.slug}` : "/"}
                    className="text-[11px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-sm"
                    style={{ color: "hsl(var(--gold-dark))", background: "hsl(var(--gold)/0.1)", fontFamily: "'Cairo',sans-serif" }}
                  >
                    {article.categories.name}
                  </Link>
                  <span className="h-px w-10" style={{ background: "hsl(var(--gold)/0.3)" }} />
                  {article.is_breaking && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-sm bg-red-600 text-white">
                      <Sparkles size={11} /> عاجل
                    </span>
                  )}
                </div>
              )}

              {/* Headline */}
              <h1
                className="font-bold leading-tight mb-5"
                style={{
                  color: "hsl(var(--primary))",
                  fontFamily: "'Amiri', serif",
                  fontSize: "clamp(1.75rem, 3.6vw, 3rem)",
                }}
              >
                {article.title}
              </h1>

              {/* Subheadline with gold rail */}
              {article.summary && (
                <p
                  className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-7 pr-5"
                  style={{ borderRight: "4px solid hsl(var(--gold))", fontFamily: "'Cairo',sans-serif" }}
                >
                  {article.summary}
                </p>
              )}

              {/* Meta + organized actions toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-y border-border/60 mb-8">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ring-2"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--gold))", ringColor: "hsl(var(--gold)/0.25)" } as any}>
                    <span className="text-base font-bold" style={{ fontFamily: "'Amiri',serif" }}>ص</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold truncate" style={{ color: "hsl(var(--primary))", fontFamily: "'Cairo',sans-serif" }}>
                      فريق مصدري
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap" style={{ fontFamily: "'Cairo',sans-serif" }}>
                      <Clock size={11} /> {formattedDate}
                      <span className="opacity-60">•</span>
                      <Eye size={11} /> {viewCount}
                      <span className="opacity-60">•</span>
                      <Users size={11} className="text-emerald-600 animate-pulse" /> {liveReaders} الآن
                    </span>
                  </div>
                </div>

                {/* Action rail */}
                <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                  <ArticleTTS text={article.content} />
                  <BookmarkButton id={article.id} title={article.title} image_url={article.image_url} variant="icon" />
                  <button
                    onClick={() => setFontSize((s) => (s >= 26 ? 18 : s + 2))}
                    title={`حجم الخط (${fontSize})`}
                    aria-label="حجم الخط"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--gold))] hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-sm font-bold leading-none" style={{ fontFamily: "'Cairo',sans-serif" }}>ع<span className="text-[10px]">A</span></span>
                  </button>
                  <button
                    onClick={() => setReaderNight((v) => !v)}
                    title={readerNight ? "وضع نهاري" : "وضع ليلي"}
                    aria-label="وضع القراءة"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--gold))] hover:bg-muted/60 transition-colors"
                  >
                    {readerNight ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <button
                    onClick={() => setFocusMode((v) => !v)}
                    title="وضع التركيز"
                    aria-label="وضع التركيز"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      focusMode ? "text-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)]" : "text-muted-foreground hover:text-[hsl(var(--gold))] hover:bg-muted/60"
                    }`}
                  >
                    {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <span className="w-px h-6 mx-1" style={{ background: "hsl(var(--border))" }} />
                  <ShareButtons
                    title={article.title}
                    url={`${window.location.origin}${article.short_id ? `/${article.short_id}` : `/article/${article.id}`}`}
                    compact
                  />
                </div>
              </div>

              {/* Featured image — clean editorial */}
              {primaryShareImage && (
                <figure className="-mx-4 sm:-mx-6 md:-mx-10 mb-8">
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
                    <WatermarkedImage
                      src={primaryShareImage}
                      alt={article.title}
                      eager
                      imgClassName="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  {article.summary && (
                    <figcaption className="px-4 sm:px-6 md:px-10 pt-3 text-xs text-muted-foreground italic flex items-start gap-2"
                      style={{ fontFamily: "'Cairo',sans-serif" }}>
                      <span className="w-1 h-4 mt-0.5 flex-shrink-0" style={{ background: "hsl(var(--gold))" }} />
                      <span className="line-clamp-1">{article.title}</span>
                    </figcaption>
                  )}
                </figure>
              )}



              {/* Prep results CTA */}
              {/الشهادة الإعدادية|نتيجة الإعدادي/.test(article.title) && (
                <a
                  href="/results/prep"
                  className="group block mb-8 overflow-hidden rounded-xl border-gold-glow bg-royal-gradient p-5 text-primary-foreground shadow-royal hover:scale-[1.005] transition-smooth"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="text-center md:text-right">
                      <p className="text-xs font-black opacity-90 mb-1">خدمة فورية مجانية</p>
                      <p className="text-lg font-black text-gold-shine">استعلم عن نتيجة الشهادة الإعدادية الآن</p>
                    </div>
                    <span className="bg-gold-gradient text-primary font-black px-5 py-2.5 rounded-lg shadow-gold-glow">ابدأ الاستعلام ←</span>
                  </div>
                </a>
              )}

              {/* Article body */}
              <ArticleBody
                content={article.content}
                fontSize={fontSize}
                className="drop-caps"
                splitAt={3}
                between={
                  <>
                    <div className="my-10 flex items-center justify-center gap-3" aria-hidden>
                      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[hsl(var(--gold)/0.6)] to-transparent" />
                      <span className="text-[hsl(var(--gold))] text-xl">❖</span>
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.6)] to-transparent" />
                    </div>
                    <div className="my-8">
                      <AdSlot
                        slot="mid-article"
                        className="w-full h-28 bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 rounded-2xl border border-dashed border-border flex items-center justify-center overflow-hidden shadow-inner"
                      />
                    </div>
                  </>
                }
              />

              {/* Tags + governorate */}
              {((article.tags && article.tags.length) || article.governorate) && (
                <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs">
                  {article.governorate && (
                    <Link to={`/governorate/${article.governorate}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm font-bold border hover:bg-[hsl(var(--primary))] hover:text-primary-foreground transition-colors"
                      style={{ borderColor: "hsl(var(--gold)/0.4)", color: "hsl(var(--primary))" }}>
                      <MapPin size={12} /> {governorateName(article.governorate)}
                    </Link>
                  )}
                  {article.tags?.map((t) => (
                    <Link key={t} to={`/tag/${encodeURIComponent(t)}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm font-bold border border-border text-foreground/75 hover:bg-[hsl(var(--primary))] hover:text-primary-foreground hover:border-[hsl(var(--primary))] transition-colors">
                      <Tag size={12} /> {t.replace(/-/g, " ")}
                    </Link>
                  ))}
                </div>
              )}

              {/* Institutional footer */}
              <div className="mt-10 pt-6 border-t border-border/60 text-[11px] text-muted-foreground/80 text-center font-bold tracking-wide" style={{ fontFamily: "'Cairo',sans-serif" }}>
                مصدري — برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم
                <span className="mx-2 opacity-50">|</span>
                
              </div>
            </article>


            <Suspense fallback={null}>
              <ArticleReactions articleId={article.id} />
              <RelatedArticles
                currentId={article.id}
                categoryId={article.category_id || null}
                tags={article.tags || []}
              />
              <ArticleComments articleId={article.id} />
            </Suspense>
          </div>


          {/* السايد بار */}
          {!focusMode && (
            <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
              {/* 🔥 Trending Now */}
              {trending.length > 0 && (
                <div className="bg-gradient-to-br from-[hsl(var(--gold)/0.06)] via-card to-card p-5 rounded-3xl border-2 border-[hsl(var(--gold)/0.35)] shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.4)]">
                  <h3 className="flex items-center gap-2 text-sm font-black text-foreground mb-5 pb-3 border-b-2 border-[hsl(var(--gold)/0.4)]">
                    <span className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-glow">
                      <TrendingUp size={16} className="text-[hsl(var(--primary))]" />
                    </span>
                    <span style={{ fontFamily: "'Amiri', serif" }}>الأكثر تداولاً الآن</span>
                  </h3>
                  <ol className="space-y-4">
                    {trending.map((t, i) => {
                      const img = getArticlePrimaryImage(t as any) || "/images/logo.png";
                      return (
                        <li key={t.id}>
                          <Link to={(t as any).short_id ? `/${(t as any).short_id}` : `/article/${t.id}`} className="group flex items-start gap-3 hover:bg-[hsl(var(--gold)/0.05)] -m-2 p-2 rounded-xl transition-colors">
                            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--gold))] font-black flex items-center justify-center text-sm shadow-md" style={{ fontFamily: "'Amiri', serif" }}>
                              {i + 1}
                            </span>
                            <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted ring-1 ring-border">
                              <img src={img} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/logo.png"; }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs md:text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-[hsl(var(--gold))] transition-colors" style={{ fontFamily: "'Amiri', serif" }}>
                                {t.title}
                              </h4>
                              {t.categories?.name && (
                                <span className="text-[10px] font-black text-[hsl(var(--gold))] mt-1 inline-block">{t.categories.name}</span>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {/* Ad */}
              <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-md text-center space-y-4 backdrop-blur-sm">
                <p className="text-[11px] font-black text-muted-foreground/80 tracking-wider uppercase">مادة إعلانية معتمدة</p>
                <AdSlot slot="sidebar-prime" className="w-full h-[360px] bg-muted/30 rounded-2xl border border-border/60 flex items-center justify-center overflow-hidden shadow-inner" />
              </div>
            </aside>
          )}

        </div>
      </main>
      
      <Suspense fallback={null}>
        <ReadingProgress />
        <FloatingShareBar title={article.title} url={`${window.location.origin}${article.short_id ? `/${article.short_id}` : `/article/${article.id}`}`} onShareImage={handleGenerateCard} />
        {cardOpen && (
          <ShareImageCard
            open={cardOpen}
            onClose={() => setCardOpen(false)}
            title={article.title}
            summary={article.summary}
            image_url={primaryShareImage}
            url={`${window.location.origin}${article.short_id ? `/${article.short_id}` : `/article/${article.id}`}`}
          />
        )}
      </Suspense>


      <SiteFooter />
    </div>
  );
};

export default ArticlePage;
