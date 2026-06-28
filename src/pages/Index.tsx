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
 images?: (string | { url: string; position?: string }) | null;
 is_breaking: boolean;
 is_pinned: boolean;
 created_at: string;
 categories: { name: string } | null;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const Index = => {
 const [articles, setArticles] = useState<Article>();
 const [categories, setCategories] = useState<{ id: string; name: string; slug: string }>();
 const [loading, setLoading] = useState(true);

 useEffect( => {
 document.title = "مصدري للأخبار المصرية والعالمية | أخبار مصر العاجلة";
 }, );

 const refetchTimer = useRef<number | null>(null);
 useEffect( => {
 const fetchArticles = async => {
 const { data } = await supabase
 .from("articles")
 .select("id, short_id, title, summary, image_url, content, images, is_breaking, is_pinned, created_at, categories(name)")
 .eq("is_published", true)
 .order("is_pinned", { ascending: false })
 .order("created_at", { ascending: false })
 .limit(30);
 if (data) {
 const normalized = (data as any).map((a) => ({
 ...a,
 image_url: getArticlePrimaryImage(a),
 }));
 setArticles(normalized as unknown as Article);
 }
 setLoading(false);
 };
 const fetchCategories = async => {
 const { data } = await supabase.from("categories").select("id, name, slug").limit(20);
 if (data) setCategories(data);
 };
 fetchArticles;
 fetchCategories;
 // Debounced realtime refresh to avoid render storms
 const scheduleRefetch = => {
 if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
 refetchTimer.current = window.setTimeout(fetchArticles, 1500);
 };
 const channel = supabase.channel("public-realtime")
 .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles" }, (payload: any) => {
 const row = payload?.new;
 if (row && row.is_published) {
 window.dispatchEvent(new CustomEvent("sb-news-refreshed", { detail: row }));
 if ("Notification" in window && Notification.permission === "granted") {
 try { new Notification("خبر جديد على صوت البلد", { body: row.title?.slice(0, 120) || "اضغط للقراءة", icon: "/images/logo.png" }); } catch {}
 }
 }
 scheduleRefetch;
 })
 .on("postgres_changes", { event: "UPDATE", schema: "public", table: "articles" }, scheduleRefetch)
 .on("postgres_changes", { event: "DELETE", schema: "public", table: "articles" }, scheduleRefetch)
 .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, fetchCategories)
 .subscribe;
 return => {
 if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
 supabase.removeChannel(channel);
 };
 }, );

 const featured = articles.find((a) => a.is_pinned) || articles[0];
 const sidebarLatest = articles.filter((a) => a.id !== featured?.id).slice(0, 4);
 const gridArticles = articles.filter((a) => a.id !== featured?.id).slice(4);

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
 <meta property="og:site_name" content="صوت البلد" />
 <meta property="og:image" content={`${SITE_URL}/images/logo.png`} />
 <meta property="og:image:secure_url" content={`${SITE_URL}/images/logo.png`} />
 <meta property="og:image:width" content="1024" />
 <meta property="og:image:height" content="1024" />
 <meta property="og:image:type" content="image/png" />
 <meta property="og:image:alt" content="شعار صوت البلد الأصلي" />
 <meta name="twitter:card" content="summary_large_image" />
 <meta name="twitter:title" content="مصدري للأخبار المصرية والعالمية" />
 <meta name="twitter:description" content={homeDesc} />
 <meta name="twitter:image" content={`${SITE_URL}/images/logo.png`} />
 <script type="application/ld+json">{JSON.stringify({
 "@context": "https://schema.org",
 "@type": "WebSite",
 name: "صوت البلد",
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
 name: "صوت البلد",
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
 {/* Featured + Sidebar Latest */}
 {!loading && featured && (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-12">
 {/* Featured story */}
 <motion.a
 href={`/article/${featured.id}`}
 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
 className="lg:col-span-8 group cursor-pointer block"
 >
 <div className="relative overflow-hidden mb-6 rounded-2xl shadow-2xl aspect-[4/3] sm:aspect-[16/9] bg-[hsl(var(--primary))] ring-1 ring-[hsl(var(--gold)/0.3)]">
 <WatermarkedImage
 src={featured.image_url || "/images/logo.png"}
 alt={featured.title}
 eager
 imgClassName={`absolute inset-0 w-full h-full object-center transition-transform duration-[1200ms] group-hover:scale-110 ${featured.image_url ? "object-cover" : "object-contain p-12"}`}
 />
 {/* Premium dual-gradient overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
 <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary)/0.4)] via-transparent to-transparent" />
 <div className="absolute bottom-0 right-0 left-0 p-5 md:p-8">
 <span className="kicker" style={{ color: "hsl(var(--gold-light))" }}>
 {featured.is_breaking ? "عاجل" : featured.categories?.name || "تغطية خاصة"}
 </span>
 <h2 className="headline-xl mt-3" style={{ color: "hsl(var(--primary-foreground))" }}>
 {featured.title}
 </h2>
 </div>
 </div>
 {featured.summary && (
 <p className="text-muted-foreground leading-relaxed text-base md:text-lg text-justify line-clamp-3 font-editorial">
 {featured.summary}
 </p>
 )}
 <div className="mt-5 meta-line">
 {featured.categories?.name && (
 <>
 <span style={{ color: "hsl(var(--gold-dark))", fontWeight: 700 }}>{featured.categories.name}</span>
 <span className="meta-dot" />
 </>
 )}
 <span className="tabular">{formatTime(featured.created_at)}</span>
 </div>

 </motion.a>

 {/* Sidebar Latest */}
 <aside className="lg:col-span-4">
 <div className="border-r-4 border-[hsl(var(--gold))] pr-6 bg-gradient-to-l from-[hsl(var(--gold)/0.04)] to-transparent rounded-lg py-4">
 <h3 className="text-xl font-bold text-[hsl(var(--primary))] dark:text-[hsl(var(--gold))] mb-8 flex items-center gap-2"
 style={{ fontFamily: "'Cairo', sans-serif" }}>
 أحدث المستجدات
 <span className="flex-1 h-px bg-border" />
 </h3>
 <div className="space-y-6">
 {sidebarLatest.map((a, i) => (
 <div key={a.id}>
 <a href={`/article/${a.id}`} className="group cursor-pointer block">
 <h4 className="text-lg font-bold text-foreground group-hover:text-[hsl(var(--gold))] transition-colors leading-snug mb-2"
 style={{ fontFamily: "'Amiri', serif" }}>
 {a.title}
 </h4>
 <div className="flex justify-between items-center text-xs text-muted-foreground font-medium"
 style={{ fontFamily: "'Cairo', sans-serif" }}>
 <span className="px-2 py-0.5 rounded bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--primary))] dark:text-[hsl(var(--gold))] font-bold">{a.categories?.name || "أخبار"}</span>
 <span>{formatTime(a.created_at)}</span>
 </div>
 </a>
 {i < sidebarLatest.length - 1 && <div className="h-px bg-border/70 mt-6" />}
 </div>
 ))}
 </div>

 {/* Currency widget */}
 <div className="mt-10">
 <CurrencyWidget />
 </div>
 </div>
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
 <li>
 <a href="/admin" className="hover:text-[hsl(var(--gold))] flex items-center gap-2 transition-colors group">
 <span className="w-1.5 h-1.5 bg-[hsl(var(--gold))] rounded-full group-hover:scale-150 transition-transform" />
 لوحة التحرير
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
