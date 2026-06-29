import { SITE_URL } from "@/lib/siteUrl";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import NumericKeypad from "@/components/NumericKeypad";
import { toast } from "sonner";
import {
  Trash2, Edit, Plus, Sparkles, Newspaper, Image, MessageSquare,
  Pin, Video, Shield, Globe, DollarSign, BarChart3, Eye, Clock,
  AlertCircle, CheckCircle, FileText, RefreshCw, Bot, Smartphone
} from "lucide-react";
import { DEFAULT_RATES } from "@/components/CurrencyWidget";
import AdminChat from "@/pages/AdminChat";
import NewsFetcherPanel from "@/components/NewsFetcherPanel";
import Phase2Dashboard from "@/components/Phase2Dashboard";
import BrandShareTool from "@/components/BrandShareTool";
import SeoIndexingPanel from "@/components/SeoIndexingPanel";
import OgPreviewPanel from "@/components/OgPreviewPanel";
import MessagesInbox from "@/components/MessagesInbox";
import SeoKeywordsPanel from "@/components/SeoKeywordsPanel";
import ApkReleasesPanel from "@/components/ApkReleasesPanel";
import {
  adminInsert, adminUpdate, adminDelete, adminUpsert,
  changeAdminPin, getAdminPin, adminUploadImage,
} from "@/lib/adminApi";
import { extractFirstImageFromHtml } from "@/lib/articleImages";


interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  image_url: string | null;
  category_id: string | null;
  is_breaking: boolean;
  is_published: boolean;
  created_at: string;
  images?: any[];
  seo_title?: string | null;
  seo_description?: string | null;
  focus_keyword?: string | null;
}

interface Ad {
  id: string;
  slot: string;
  image_url: string | null;
  target_url: string | null;
  is_active: boolean;
  ad_type: string;
  video_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

const AdminPanel = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "gemini" | "articles" | "ads" | "categories" | "currencies" | "security" | "apk">("dashboard");
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [videos, setVideos] = useState<any[]>([]);

  const [stats, setStats] = useState({ articlesCount: 0, adsCount: 0, videosCount: 0, breakingCount: 0 });

  const [vTitle, setVTitle] = useState("");
  const [vDesc, setVDesc] = useState("");
  const [vUrl, setVUrl] = useState("");
  const [vThumb, setVThumb] = useState("");

  const [secOld, setSecOld] = useState("");
  const [secNew, setSecNew] = useState("");
  const [secCurrent, setSecCurrent] = useState("");
  const [domainTarget, setDomainTarget] = useState("");

  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [imagesStart, setImagesStart] = useState("");
  const [imagesMiddle, setImagesMiddle] = useState("");
  const [imagesEnd, setImagesEnd] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [aiKwLoading, setAiKwLoading] = useState(false);
  const [aiKwSuggestions, setAiKwSuggestions] = useState<string[]>([]);

  const [currencyRates, setCurrencyRates] = useState(DEFAULT_RATES);
  const [aiLoading, setAiLoading] = useState(false);

  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [adSlot, setAdSlot] = useState("header");
  const [adType, setAdType] = useState("image");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [adVideoUrl, setAdVideoUrl] = useState("");
  const [adTargetUrl, setAdTargetUrl] = useState("");
  const [adStartDate, setAdStartDate] = useState("");
  const [adEndDate, setAdEndDate] = useState("");

  useEffect(() => {
    if (!authenticated) return;
    fetchAll();
  }, [authenticated]);

  const fetchAll = async () => {
    try {
      const [catRes, artRes, adRes, vidRes, setRes] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("articles").select("*").order("created_at", { ascending: false }),
        supabase.from("ads").select("*"),
        (supabase as any).from("videos").select("*").order("created_at", { ascending: false }),
        (supabase as any).from("admin_settings").select("*"),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (artRes.data) setArticles(artRes.data as any);
      if (adRes.data) setAds(adRes.data);
      if (vidRes.data) setVideos(vidRes.data);

      setStats({
        articlesCount: artRes.data?.length || 0,
        adsCount: adRes.data?.length || 0,
        videosCount: vidRes.data?.length || 0,
        breakingCount: artRes.data?.filter(a => a.is_breaking).length || 0
      });

      if (setRes.data) {
        const map: Record<string, string> = {};
        (setRes.data as any[]).forEach((r) => { map[r.key] = r.value; });
        setSecCurrent(getAdminPin() || "");
        setDomainTarget(map.domain_target || "185.158.133.1");
        if (map.currency_rates) {
          try {
            const parsed = JSON.parse(map.currency_rates);
            if (Array.isArray(parsed) && parsed.length) setCurrencyRates(parsed);
          } catch {}
        }
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء جلب البيانات من السيرفر");
    }
  };

  const saveCurrencies = async () => {
    try {
      await adminUpsert(
        "admin_settings",
        { key: "currency_rates", value: JSON.stringify(currencyRates), updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
      toast.success("تم تحديث أسعار العملات فورياً");
    } catch (e: any) { toast.error("فشل حفظ العملات: " + e.message); }
  };

  const updateRate = (idx: number, field: "buy" | "sell" | "trend", value: string) => {
    setCurrencyRates((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } as any : r));
  };

  const handleSaveVideo = async () => {
    if (!vTitle || !vUrl) { toast.error("العنوان ورابط الفيديو مطلوبان"); return; }
    try {
      await adminInsert("videos", {
        title: vTitle, description: vDesc || null, video_url: vUrl,
        thumbnail_url: vThumb || null, is_published: true,
      });
      toast.success("تم رفع الفيديو بنجاح");
      setVTitle(""); setVDesc(""); setVUrl(""); setVThumb(""); fetchAll();
    } catch (e: any) { toast.error("خطأ: " + e.message); }
  };

  const handleDeleteVideo = async (id: string) => {
    try { await adminDelete("videos", { id }); toast.success("تم حذف الفيديو"); fetchAll(); }
    catch (e: any) { toast.error("خطأ: " + e.message); }
  };

  const handleChangeCode = async () => {
    if (secOld !== secCurrent) { toast.error("الرمز الحالي غير صحيح"); return; }
    if (!/^\d{4}$/.test(secNew)) { toast.error("الرمز الجديد يجب أن يكون 4 أرقام"); return; }
    try {
      await changeAdminPin(secNew);
      setSecCurrent(secNew); setSecOld(""); setSecNew("");
      toast.success("تم تحديث رمز الدخول وتأمين اللوحة");
    } catch (e: any) { toast.error("فشل الحفظ: " + e.message); }
  };

  const resetArticleForm = () => {
    setEditingArticle(null);
    setTitle("");
    setContent("");
    setSummary("");
    setImageUrl("");
    setCategoryId("");
    setIsBreaking(false);
    setImagesStart("");
    setImagesMiddle("");
    setImagesEnd("");
    setSeoTitle("");
    setSeoDescription("");
    setFocusKeyword("");
  };

  const slugify = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, "").slice(0, 60) || `cat-${Date.now()}`;

  const OFFICIAL_CATEGORIES = [
    "الرئيسية","أهم الأخبار","رياضة","عربي ودولي","تقارير ومتابعات","اقتصاد","حوادث","فن","ثقافة","المحافظات","مقالات","منوعات","صحافة","صحافة المواطن","تكنولوجيا وإنترنت","سياسة","استشارات","صحة ومرأة","سوشيال المشاهير","توك شو","رئيس مصدري","صحافة محلية","صحافة عالمية","صحافة إسرائيلية","العدد الورقي","طاقة","أفريقيات","سيارات","عقارات","سياحة وآثار","من نحن","اعلن معنا"
  ];

  const [newCatName, setNewCatName] = useState("");

  const handleSeedCategories = async () => {
    const existing = new Set(categories.map((c) => c.name));
    const toInsert = OFFICIAL_CATEGORIES.filter((n) => !existing.has(n)).map((name) => ({ name, slug: slugify(name) }));
    if (!toInsert.length) { toast.info("جميع الأقسام الـ32 موجودة بالفعل"); return; }
    try { await adminInsert("categories", toInsert); toast.success(`تم تثبيت ${toInsert.length} قسم رسمي`); fetchAll(); }
    catch (e: any) { toast.error("فشل التهيئة: " + e.message); }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) { toast.error("اكتب اسم القسم"); return; }
    try { await adminInsert("categories", { name: newCatName.trim(), slug: slugify(newCatName) }); toast.success("تم إضافة القسم"); setNewCatName(""); fetchAll(); }
    catch (e: any) { toast.error("فشل الإضافة: " + e.message); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("حذف القسم نهائياً؟")) return;
    try { await adminDelete("categories", { id }); toast.success("تم الحذف"); fetchAll(); }
    catch (e: any) { toast.error("فشل الحذف: " + e.message); }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const handleFilesToField = async (
    files: FileList | null,
    setter: (updater: (prev: string) => string) => void
  ) => {
    if (!files?.length) return;
    const urls: string[] = [];
    const t = toast.loading(`جارٍ رفع ${files.length} صورة إلى المخزن السحابي…`);
    for (const f of Array.from(files)) {
      try {
        const url = await adminUploadImage(f);
        urls.push(url);
      } catch (e: any) {
        toast.error(`فشل رفع ${f.name}: ${e.message}`);
      }
    }
    toast.dismiss(t);
    if (urls.length) {
      setter((prev) => (prev ? prev + "\n" : "") + urls.join("\n"));
      toast.success(`تم رفع ${urls.length} صورة بنجاح`);
    }
  };

  const handleCoverFile = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const t = toast.loading("جارٍ رفع صورة الغلاف…");
    try {
      const url = await adminUploadImage(f);
      setImageUrl(url);
      toast.success("تم رفع صورة الغلاف بنجاح");
    } catch (e: any) {
      toast.error("فشل الرفع: " + e.message);
    } finally {
      toast.dismiss(t);
    }
  };


  const parseUrls = (s: string) => s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);

  const handleEditArticle = (a: any) => {
    setEditingArticle(a);
    setTitle(a.title);
    setContent(a.content);
    setSummary(a.summary || "");
    setImageUrl(a.image_url || "");
    setCategoryId(a.category_id || "");
    setIsBreaking(a.is_breaking);
    setSeoTitle(a.seo_title || "");
    setSeoDescription(a.seo_description || "");
    setFocusKeyword(a.focus_keyword || "");

    const imgs: any[] = Array.isArray(a.images) ? a.images : [];
    setImagesStart(imgs.filter((i) => i.position === "start").map((i) => i.url).join("\n"));
    setImagesMiddle(imgs.filter((i) => i.position === "middle").map((i) => i.url).join("\n"));
    setImagesEnd(imgs.filter((i) => i.position === "end").map((i) => i.url).join("\n"));
    setTab("articles");
  };

  const handleSaveArticle = async () => {
    if (!title || !content) {
      toast.error("العنوان والمحتوى مطلوبان");
      return;
    }
    
    const imagesPayload = [
      ...parseUrls(imagesStart).map((url) => ({ url, position: "start" })),
      ...parseUrls(imagesMiddle).map((url) => ({ url, position: "middle" })),
      ...parseUrls(imagesEnd).map((url) => ({ url, position: "end" })),
    ];

    // ✅ Auto-promote the best available article image to cover for all new/old cards
    const autoCover = imageUrl || imagesPayload[0]?.url || extractFirstImageFromHtml(content) || null;

    const payload: any = {
      title,
      content,
      summary: summary || null,
      image_url: autoCover,
      category_id: categoryId || null,
      is_breaking: isBreaking,
      is_published: true,
      images: imagesPayload,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      focus_keyword: focusKeyword.trim() || null,
    };

    if (editingArticle) {
      try {
        await adminUpdate("articles", { id: editingArticle.id }, payload);
        toast.success("تم تحديث الخبر بكامل خيوطه وصوره");
        resetArticleForm(); fetchAll();
      } catch (e: any) {
        console.error("Error updating article:", e);
        toast.error("خطأ في تحديث المقال: " + e.message);
      }
    } else {
      try {
        await adminInsert("articles", payload);
        toast.success("تم النشر بنجاح وإدراج الصور الملحقة");
        // 🔔 Auto-notify Google: resubmit sitemap so the new article is discovered.
        supabase.functions.invoke("gsc-indexing", {
          body: { action: "submit_sitemap" },
          headers: { "X-Admin-Pin": getAdminPin() || "" },
        })
          .then(({ data }) => { if (data?.ok) toast.success("📡 تم إخطار جوجل بالخبر الجديد"); })
          .catch(() => {});
        // 📣 Auto push notification to all subscribers with the news title + Sout Al-Balad logo
        supabase.functions.invoke("send-push", {
          body: {
            title: isBreaking ? `🔴 عاجل · ${title}` : `📰 مصدري — ${title}`,
            body: summary || (content ? content.replace(/<[^>]+>/g, "").slice(0, 140) : "خبر جديد من مصدري"),
            url: "/",
            image: autoCover || "/images/logo.png",
            icon: "/images/logo.png",
            badge: "/images/logo.png",
            breaking: isBreaking,
            tag: "sout-news",
          },
          headers: { "X-Admin-Pin": getAdminPin() || "" },
        })
          .then(({ data }) => { if (data?.sent) toast.success(`📲 تم إرسال الإشعار لـ ${data.sent} مشترك`); })
          .catch(() => {});
        resetArticleForm(); fetchAll();

      } catch (e: any) {
        console.error("Error inserting article:", e);
        toast.error("خطأ في نشر المقال الجديد: " + e.message);
      }
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try { await adminDelete("articles", { id }); toast.success("تم حذف المقال نهائياً"); fetchAll(); }
    catch (e: any) { toast.error("خطأ في الحذف: " + e.message); }
  };

  const handleAI = async () => {
    if (!content) { toast.error("أدخل النص أولاً لتقوم الـ AI بصياغته"); return; }
    setAiLoading(true);
    try {
      const resp = await supabase.functions.invoke("ai-journalist", {
        body: { text: content },
        headers: { "X-Admin-Pin": getAdminPin() || "" },
      });
      if (resp.error) throw resp.error;
      const result = resp.data;
      if (result?.refined) setContent(result.refined);
      if (result?.title) setTitle(result.title);
      if (result?.summary) setSummary(result.summary);
      toast.success("تمت الصياغة الاحترافية وعناوين المقال بالذكاء الاصطناعي");
    } catch {
      toast.error("خطأ في الاتصال بمساعد الذكاء الاصطناعي");
    }
    setAiLoading(false);
  };

  const handleSaveAd = async () => {
    if (adType === "image" && !adImageUrl) { toast.error("رابط صورة الإعلان مطلوب"); return; }
    if (adType === "video" && !adVideoUrl) { toast.error("رابط فيديو الإعلان مطلوب"); return; }

    const payload: any = {
      slot: adSlot,
      image_url: adImageUrl || null,
      target_url: adTargetUrl || null,
      is_active: true,
      ad_type: adType,
      video_url: adType === "video" ? adVideoUrl || null : null,
      start_date: adStartDate || null,
      end_date: adEndDate || null,
    };

    if (editingAd) {
      try {
        await adminUpdate("ads", { id: editingAd.id }, payload);
        toast.success("تم تحديث بيانات الإعلان وجدولته");
        setEditingAd(null); fetchAll(); clearAdForm();
      } catch (e: any) {
        console.error("Error updating ad:", e);
        toast.error("فشل تعديل الإعلان: " + e.message);
      }
    } else {
      try {
        await adminInsert("ads", payload);
        toast.success("تم إدراج وتفعيل الإعلان الجديد في القالب المخصص");
        fetchAll(); clearAdForm();
      } catch (e: any) {
        console.error("Error inserting ad:", e);
        toast.error("فشل إضافة الإعلان الجديد: " + e.message);
      }
    }
  };

  const clearAdForm = () => {
    setAdImageUrl("");
    setAdTargetUrl("");
    setAdVideoUrl("");
    setAdSlot("header");
    setAdType("image");
    setAdStartDate("");
    setAdEndDate("");
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setAdSlot(ad.slot);
    setAdType(ad.ad_type || "image");
    setAdImageUrl(ad.image_url || "");
    setAdVideoUrl(ad.video_url || "");
    setAdTargetUrl(ad.target_url || "");
    setAdStartDate(ad.start_date ? ad.start_date.substring(0, 16) : "");
    setAdEndDate(ad.end_date ? ad.end_date.substring(0, 16) : "");
  };

  const handleDeleteAd = async (id: string) => {
    try { await adminDelete("ads", { id }); toast.success("تم إزالة الإعلان"); fetchAll(); }
    catch (e: any) { toast.error("فشل الحذف: " + e.message); }
  };

  const getReadingTimeAndLength = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const time = Math.ceil(words / 200); 
    return { words, time, chars: text.length };
  };

  const contentMeta = getReadingTimeAndLength(content);

  if (!authenticated) return <NumericKeypad onSuccess={() => setAuthenticated(true)} />;

  return (
    <>
      <Helmet>
        <title>لوحة التحكم الإدارية — مصدري</title>
        <meta name="description" content="لوحة الإدارة الرسمية لمصدري لإدارة المحتوى والإعلانات والتصنيفات." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${SITE_URL}/admin`} />
      </Helmet>
    <div dir="rtl" className="min-h-screen p-4 md:p-8 font-cairo relative overflow-hidden"
      style={{ fontFamily: "'Cairo','Tajawal','Amiri',sans-serif", background: "radial-gradient(1200px 600px at 80% -10%, hsl(var(--gold) / 0.12), transparent 60%), radial-gradient(900px 500px at 0% 110%, hsl(var(--primary) / 0.18), transparent 60%), hsl(var(--background))" }}>
      {/* خلفية مزخرفة */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M30 0l8 22h22L42 36l8 22-20-14-20 14 8-22L-2 22h22z' fill='%23d4af37'/></svg>\")" }} />

      <div className="max-w-6xl mx-auto relative">
        {/* رأس فخم */}
        <div className="relative mb-8 rounded-2xl overflow-hidden border-2"
          style={{ borderColor: "hsl(var(--gold) / 0.5)", background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%)", boxShadow: "0 20px 60px -20px hsl(var(--primary) / 0.6), inset 0 0 0 1px hsl(var(--gold) / 0.3)" }}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&q=60')] bg-cover bg-center mix-blend-overlay" />
          <div className="relative px-6 py-7 md:px-10 md:py-9 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-1 rounded-full text-[11px] font-black tracking-widest mb-3"
              style={{ background: "linear-gradient(90deg, hsl(var(--gold)), hsl(var(--gold-light, var(--gold))))", color: "hsl(var(--primary))" }}>
              <Sparkles size={14} /> لوحة التحكم الرسمية · LIVE
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-primary-foreground drop-shadow-lg"
              style={{ fontFamily: "'Amiri','Cairo',serif", textShadow: "0 2px 18px hsl(var(--gold) / 0.4)" }}>
              <span style={{ background: "linear-gradient(90deg, hsl(var(--gold)), #fff7c2, hsl(var(--gold)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>مصدري</span>
            </h1>
            <p className="mt-2 text-sm md:text-base font-bold text-primary-foreground/90">
              برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم · تطوير وتصميم التقني/ خالد عاطف عبدالحكيم عويس
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] font-black">
              {[
                { l: "📰 مقالات", v: stats.articlesCount },
                { l: "🚨 عاجل", v: stats.breakingCount },
                { l: "💼 إعلانات", v: stats.adsCount },
                { l: "🗂️ أقسام", v: categories.length },
              ].map((b) => (
                <span key={b.l} className="px-3 py-1 rounded-full border" style={{ background: "hsl(var(--gold) / 0.15)", borderColor: "hsl(var(--gold) / 0.4)", color: "hsl(var(--gold-light, var(--gold)))" }}>
                  {b.l}: {b.v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* تبويبات فخمة */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center p-2 rounded-2xl border backdrop-blur-sm"
          style={{ background: "hsl(var(--card) / 0.6)", borderColor: "hsl(var(--gold) / 0.25)" }}>
          {[
            { id: "dashboard", icon: <BarChart3 size={16} />, label: "نظرة عامة" },
            { id: "gemini", icon: <Bot size={16} />, label: "المساعد Gemini" },
            { id: "articles", icon: <Newspaper size={16} />, label: "الأخبار" },
            { id: "categories", icon: <Globe size={16} />, label: "الأقسام" },
            { id: "ads", icon: <Image size={16} />, label: "الإعلانات" },
            { id: "currencies", icon: <DollarSign size={16} />, label: "العملات والذهب" },
            { id: "security", icon: <Shield size={16} />, label: "الأمان" },
            { id: "apk", icon: <Smartphone size={16} />, label: "تطبيق APK" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all duration-300 ${
                tab === t.id
                  ? "text-primary-foreground shadow-lg scale-105"
                  : "text-foreground hover:bg-muted/60"
              }`}
              style={tab === t.id ? {
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
                boxShadow: "0 10px 25px -10px hsl(var(--primary) / 0.6), inset 0 0 0 1px hsl(var(--gold) / 0.5)",
              } : {}}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>


        {tab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-border p-4 bg-card text-center">
                <FileText className="mx-auto mb-2 text-primary" size={24} />
                <span className="block text-2xl font-black">{stats.articlesCount}</span>
                <span className="text-xs text-muted-foreground font-bold">إجمالي المقالات</span>
              </div>
              <div className="border-2 border-border p-4 bg-card text-center">
                <AlertCircle className="mx-auto mb-2 text-red-500" size={24} />
                <span className="block text-2xl font-black text-red-500">{stats.breakingCount}</span>
                <span className="text-xs text-muted-foreground font-bold">أخبار عاجلة نشطة</span>
              </div>
              <div className="border-2 border-border p-4 bg-card text-center">
                <Sparkles className="mx-auto mb-2 text-yellow-500" size={24} />
                <span className="block text-2xl font-black">{stats.adsCount}</span>
                <span className="text-xs text-muted-foreground font-bold">الحملات الإعلانية</span>
              </div>
              <div className="border-2 border-border p-4 bg-card text-center">
                <Globe className="mx-auto mb-2 text-blue-500" size={24} />
                <span className="block text-2xl font-black">{categories.length}</span>
                <span className="text-xs text-muted-foreground font-bold">الأقسام المُفعَّلة</span>
              </div>
            </div>

            <div className="border-2 border-foreground p-6 bg-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-lg mb-1">المساعد الفوري والمطور الذكي</h3>
                <p className="text-xs text-muted-foreground">تواصل مع الذكاء الاصطناعي لإدارة وبرمجة وتوليد المحتوى الإخباري بلمحة زر.</p>
              </div>
              <a href="/admin/chat" className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 font-bold text-sm hover:opacity-90 shadow-lg shrink-0">
                <MessageSquare size={18} /> فتح AI Chat المساعد
              </a>
            </div>

            <NewsFetcherPanel />
            <Phase2Dashboard />

            <BrandShareTool />
            <OgPreviewPanel />
            <MessagesInbox />
            <SeoIndexingPanel />
            <SeoKeywordsPanel />
          </div>
        )}



        {tab === "gemini" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="border-2 border-foreground bg-gradient-to-l from-primary/10 via-card to-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-black text-xl flex items-center gap-2">
                  <Bot className="text-primary" /> مساعد مصدري الذكي
                </h2>
                <p className="text-xs text-muted-foreground mt-1 font-bold">
                  ينشر، يعدّل، يحذف، يفعّل الإعلانات، يولّد الصور، ويبحث على الإنترنت — أوامر مباشرة بالعربي.
                </p>
              </div>
              <a href="/admin/chat" target="_blank" rel="noreferrer" className="text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 shrink-0">
                فتح في نافذة كاملة ↗
              </a>
            </div>
            <AdminChat embedded />
          </div>
        )}



        {tab === "articles" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-2 border-foreground p-6 bg-card">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b-2 border-border pb-2">
                <Plus size={18} /> {editingArticle ? "تعديل محتويات هذا الخبر" : "إنشاء صياغة خبر صحفي جديد"}
              </h2>
              <div className="space-y-4">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الخبر الرئيسي العريض"
                  className="w-full border-2 border-border px-4 py-3 text-foreground bg-background font-bold focus:border-primary focus:outline-none" />
                
                <div>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="اكتب تفاصيل المحتوى هنا..." rows={7}
                    className="w-full border-2 border-border px-4 py-3 text-foreground bg-background focus:border-primary focus:outline-none resize-y" />
                  
                  {content.length > 0 && (
                    <div className="flex gap-4 text-xs font-bold text-muted-foreground mt-1 px-1">
                      <span className="flex items-center gap-1"><Clock size={12}/> وقت القراءة المتوقع: {contentMeta.time} دقيقة</span>
                      <span>• عدد الكلمات: {contentMeta.words}</span>
                      <span>• الحروف: {contentMeta.chars}</span>
                    </div>
                  )}
                </div>

                <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="موجز أو ليد (Lead) صحفي أسفل العنوان (اختياري)"
                  className="w-full border-2 border-border px-4 py-3 text-foreground bg-background text-sm focus:border-primary focus:outline-none" />

                {/* 🔎 SEO Assistant — admin overrides for Google Search & social previews */}
                <div className="rounded-xl border-2 p-4 space-y-3 bg-gradient-to-l from-[hsl(var(--gold)/0.07)] to-transparent" style={{ borderColor: "hsl(var(--gold)/0.5)" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[hsl(var(--gold))] text-lg">🔎</span>
                    <h4 className="font-black text-sm m-0 flex-1">مساعد SEO — تخصيص ظهور الخبر في جوجل</h4>
                    <button
                      type="button"
                      disabled={aiKwLoading}
                      onClick={async () => {
                        if (!title.trim() && !content.trim()) {
                          toast.error("اكتب العنوان والمحتوى أولاً");
                          return;
                        }
                        setAiKwLoading(true);
                        try {
                          const { data, error } = await supabase.functions.invoke("ai-keywords", {
                            body: { title, summary, content: content.replace(/<[^>]+>/g, " ").slice(0, 6000) },
                          });
                          if (error) throw error;
                          if (data?.error) throw new Error(data.error);
                          setAiKwSuggestions(Array.isArray(data?.keywords) ? data.keywords : []);
                          if (data?.focus_keyword && !focusKeyword.trim()) {
                            setFocusKeyword(data.focus_keyword);
                          }
                          toast.success("تم اقتراح الكلمات المفتاحية");
                        } catch (e: any) {
                          toast.error(e?.message || "تعذر الاتصال بالذكاء الاصطناعي");
                        } finally {
                          setAiKwLoading(false);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-black border-2 border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.25)] disabled:opacity-50"
                    >
                      <Sparkles size={12} />
                      {aiKwLoading ? "جارٍ التحليل..." : "اقتراحات AI"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground m-0">
                    اتركها فارغة لاستخدام العنوان والملخص تلقائياً، أو خصصها لتحسين الترتيب في نتائج البحث.
                  </p>
                  {aiKwSuggestions.length > 0 && (
                    <div className="rounded-md border border-[hsl(var(--gold)/0.4)] bg-background/60 p-2">
                      <p className="text-[10px] text-muted-foreground mb-1 font-bold">💡 اضغط على الكلمة لتعيينها كـ Focus Keyword أو لإضافتها للوصف:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {aiKwSuggestions.map((kw, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFocusKeyword(kw)}
                            className="px-2 py-0.5 rounded-full bg-[hsl(var(--gold)/0.15)] hover:bg-[hsl(var(--gold)/0.3)] text-[11px] font-bold border border-[hsl(var(--gold)/0.4)]"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold mb-1 block text-muted-foreground flex justify-between">
                      <span>عنوان SEO (Meta Title) — يظهر في نتائج جوجل</span>
                      <span className={seoTitle.length > 60 ? "text-destructive" : "text-muted-foreground"}>
                        {seoTitle.length}/60
                      </span>
                    </label>
                    <input value={seoTitle} maxLength={70}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder={title || "مثال: تفاصيل قرار البنك المركزي المصري برفع الفائدة 2026"}
                      className="w-full border-2 border-border px-3 py-2 bg-background text-sm focus:border-[hsl(var(--gold))] focus:outline-none" />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold mb-1 block text-muted-foreground flex justify-between">
                      <span>وصف SEO (Meta Description) — مقتطف نتيجة البحث</span>
                      <span className={seoDescription.length > 160 ? "text-destructive" : "text-muted-foreground"}>
                        {seoDescription.length}/160
                      </span>
                    </label>
                    <textarea value={seoDescription} maxLength={180} rows={2}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder={summary || "وصف مختصر جذاب يلخص الخبر ويحتوي الكلمة المفتاحية (140–160 حرف)"}
                      className="w-full border-2 border-border px-3 py-2 bg-background text-sm focus:border-[hsl(var(--gold))] focus:outline-none resize-y" />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold mb-1 block text-muted-foreground">
                      الكلمة المفتاحية الرئيسية (Focus Keyword)
                    </label>
                    <input value={focusKeyword} maxLength={80}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="مثال: سعر الدولار اليوم"
                      className="w-full border-2 border-border px-3 py-2 bg-background text-sm focus:border-[hsl(var(--gold))] focus:outline-none" />
                    {focusKeyword && title && !title.toLowerCase().includes(focusKeyword.toLowerCase()) && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-bold">
                        ⚠️ الكلمة المفتاحية غير موجودة في العنوان — يُفضّل تضمينها لتحسين الترتيب.
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold mb-1 block text-primary">🔗 صورة غلاف المقال (الصق رابطاً أو ارفع من جهازك)</label>
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/main-image.jpg"
                    className="w-full border-2 border-border px-4 py-2 bg-background focus:border-primary focus:outline-none text-xs" dir="ltr" />
                  <input type="file" accept="image/*"
                    onChange={(e) => handleCoverFile(e.target.files)}
                    className="mt-2 text-[11px] w-full file:text-[11px] file:px-3 file:py-1.5 file:border file:border-primary file:bg-primary/10 file:text-primary file:font-bold file:cursor-pointer" />
                  {imageUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={imageUrl} alt="معاينة الغلاف" className="h-16 w-24 object-cover border border-border rounded" />
                      <p className="text-[10px] text-green-600 font-bold">✓ صورة الغلاف جاهزة</p>
                    </div>
                  )}
                </div>


                <div className="border-2 border-dashed border-border p-4 space-y-4 bg-muted/10 rounded">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1">🖼️ لوحة سحب خيوط الصور الإضافية المتداخلة (رابط لكل سطر)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: "شريط بداية المقال", val: imagesStart, set: setImagesStart },
                      { label: "شريط منتصف المقال", val: imagesMiddle, set: setImagesMiddle },
                      { label: "شريط نهاية المقال", val: imagesEnd, set: setImagesEnd },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="text-xs font-bold mb-1 block text-muted-foreground">{f.label}</label>
                        <textarea value={f.val} onChange={(e) => f.set(e.target.value)} rows={3}
                          placeholder="https://... أو ارفع من جهازك"
                          className="w-full border border-border p-2 text-xs bg-background focus:border-primary font-mono" dir="ltr" />
                        <input type="file" accept="image/*" multiple
                          onChange={(e) => handleFilesToField(e.target.files, f.set as any)}
                          className="mt-1 text-[10px] w-full file:text-[10px] file:px-2 file:py-1 file:border file:border-border file:bg-muted file:font-bold file:cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-between p-4 rounded-xl border-2 border-[hsl(var(--gold)/0.4)] bg-gradient-to-l from-[hsl(var(--gold)/0.05)] to-transparent">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-black text-muted-foreground flex items-center gap-1">
                        🗂️ القسم المناسب للخبر
                      </label>
                      <div className="flex gap-2 items-center">
                        <select
                          value={categoryId}
                          onChange={async (e) => {
                            const v = e.target.value;
                            if (v === "__new__") {
                              const name = window.prompt("اسم القسم الجديد:")?.trim();
                              if (!name) return;
                              try {
                                const res: any = await adminInsert("categories", { name, slug: slugify(name) });
                                const newId = Array.isArray(res?.data) ? res.data[0]?.id : res?.data?.id;
                                toast.success(`تم إضافة قسم "${name}"`);
                                await fetchAll();
                                if (newId) setCategoryId(newId);
                              } catch (err: any) {
                                toast.error("فشل الإضافة: " + err.message);
                              }
                            } else {
                              setCategoryId(v);
                            }
                          }}
                          className="min-w-[220px] border-2 border-[hsl(var(--gold)/0.5)] px-4 py-2.5 bg-background font-bold text-sm rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold)/0.3)] cursor-pointer"
                        >
                          <option value="">— اختر القسم —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                          <option value="__new__">➕ إضافة قسم جديد...</option>
                        </select>
                        {categoryId && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--gold)/0.4)]">
                            ✓ {categories.find((c) => c.id === categoryId)?.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-500 bg-red-500/5 cursor-pointer rounded-lg select-none hover:bg-red-500/10 transition-colors">
                      <input type="checkbox" className="accent-red-600 h-4 w-4" checked={isBreaking} onChange={(e) => setIsBreaking(e.target.checked)} />
                      <span className="text-sm font-black text-red-600">إعلان كـ خبر عاجل 🚨</span>
                    </label>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleSaveArticle}
                      className="bg-primary text-primary-foreground px-6 py-3 font-bold text-sm hover:bg-primary/90 shadow">
                      {editingArticle ? "تحديث الآن" : "نشر وإطلاق الخبر"}
                    </button>
                    <button onClick={handleAI} disabled={aiLoading}
                      className="bg-zinc-900 text-amber-400 border border-amber-400/30 px-5 py-3 font-bold text-sm hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50">
                      <Sparkles size={16} /> {aiLoading ? "تجري الصياغة..." : "تحسين الأسلوب بالذكاء الاصطناعي"}
                    </button>
                    {editingArticle && (
                      <button onClick={resetArticleForm} className="bg-muted text-foreground px-5 py-3 font-bold text-sm border border-border">إلغاء الأمر</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 border border-border p-2 bg-muted/5">
              <p className="text-xs font-bold text-muted-foreground px-1 mb-2">قائمة الأرشيف النشط لحذف أو سحب التعديلات:</p>
              {articles.map((a) => (
                <div key={a.id} className="border-2 border-border bg-card p-3 flex items-center justify-between gap-4 hover:border-foreground transition-colors">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{a.title}</h3>
                    <p className="text-muted-foreground text-xs mt-1 flex items-center gap-2">
                      <span>📅 {new Date(a.created_at).toLocaleDateString("ar-EG")}</span>
                      {a.is_breaking && <span className="text-red-500 font-bold bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded text-[10px]">● عاجل جداً</span>}
                      {a.images && (a.images as any).length > 0 && <span className="text-blue-500 font-bold text-[10px]">🖼️ يتضمن صور إضافية ({(a.images as any).length})</span>}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditArticle(a)} className="p-2 border border-border text-primary hover:bg-muted" title="تعديل"><Edit size={14} /></button>
                    <button onClick={() => handleDeleteArticle(a.id)} className="p-2 border border-border text-red-500 hover:bg-red-50" title="حذف المقال"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "categories" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-2 border-foreground p-6 bg-card">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4 border-b pb-2">
                <h2 className="font-bold text-lg flex items-center gap-2"><Globe size={18}/> أقسام مصدري الرسمية</h2>
                <button onClick={handleSeedCategories} className="bg-primary text-primary-foreground px-4 py-2 font-bold text-xs hover:opacity-90 shadow flex items-center gap-2">
                  <RefreshCw size={14}/> تثبيت كل الأقسام الـ 32
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input value={newCatName} onChange={(e)=>setNewCatName(e.target.value)} placeholder="اسم قسم جديد"
                  className="flex-1 border-2 border-border px-3 py-2 bg-background text-sm focus:border-primary focus:outline-none" />
                <button onClick={handleAddCategory} className="bg-foreground text-background px-4 py-2 font-bold text-xs flex items-center gap-1">
                  <Plus size={14}/> إضافة
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto">
                {categories.map((c) => (
                  <div key={c.id} className="border border-border p-2 flex items-center justify-between bg-muted/10 rounded text-xs">
                    <span className="font-bold truncate">{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:bg-red-50 p-1" title="حذف"><Trash2 size={12}/></button>
                  </div>
                ))}
                {!categories.length && <p className="col-span-full text-xs text-muted-foreground text-center py-6">لا توجد أقسام — اضغط "تثبيت كل الأقسام الـ32" للبدء.</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "ads" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-2 border-foreground p-6 bg-card">
              <h2 className="font-bold text-lg mb-4 border-b pb-2 flex items-center gap-2">
                <Image size={18} /> {editingAd ? "تعديل بيانات الحملة الإعلانية" : "حجز مساحة إعلانية للمصدري"}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold mb-1 block">تحديد الموضع بمصدري (Slot)</label>
                    <select value={adSlot} onChange={(e) => setAdSlot(e.target.value)}
                      className="w-full border-2 border-border px-4 py-2.5 bg-background font-bold text-sm focus:outline-none focus:border-primary">
                      <option value="header">إعلان الهيدر العلوي الرئيسي</option>
                      <option value="sidebar">إعلان الشريط الجانبي الذكي</option>
                      <option value="in-article">إعلان عائم داخل نص المقالات</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-1 block">نوع المادة الإعلانية</label>
                    <select value={adType} onChange={(e) => setAdType(e.target.value)}
                      className="w-full border-2 border-border px-4 py-2.5 bg-background font-bold text-sm focus:outline-none focus:border-primary">
                      <option value="image">صورة ثابتة (JPG/PNG)</option>
                      <option value="video">مقطع فيديو تفاعلي (MP4/WebM)</option>
                      <option value="gif">بانر متحرك صيغة (GIF)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold mb-1 block">🔗 رابط صورة الإعلان / البانر المتحرك</label>
                  <input value={adImageUrl} onChange={(e) => setAdImageUrl(e.target.value)} placeholder="https://example.com/banner.gif"
                    className="w-full border-2 border-border px-4 py-2.5 bg-background text-xs" dir="ltr" />
                </div>

                {adType === "video" && (
                  <div>
                    <label className="text-xs font-bold mb-1 block text-blue-500">🔗 رابط ملف الفيديو المباشر للإعلان</label>
                    <input value={adVideoUrl} onChange={(e) => setAdVideoUrl(e.target.value)} placeholder="https://example.com/ad-video.mp4"
                      className="w-full border-2 border-border px-4 py-2.5 bg-background text-xs border-blue-300" dir="ltr" />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold mb-1 block">🔗 رابط توجيه الزائر عند النقر (Target Redirection URL)</label>
                  <input value={adTargetUrl} onChange={(e) => setAdTargetUrl(e.target.value)} placeholder="https://advertiser-website.com"
                    className="w-full border-2 border-border px-4 py-2.5 bg-background text-xs" dir="ltr" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border p-3 bg-muted/30 rounded">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">توقيت بدء الحملة الإعلانية (اختياري)</label>
                    <input type="datetime-local" value={adStartDate} onChange={(e) => setAdStartDate(e.target.value)}
                      className="w-full border border-border px-3 py-2 bg-background text-sm font-sans" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">توقيت انتهاء العقد وسحب الإعلان (اختياري)</label>
                    <input type="datetime-local" value={adEndDate} onChange={(e) => setAdEndDate(e.target.value)}
                      className="w-full border border-border px-3 py-2 bg-background text-sm font-sans" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleSaveAd}
                    className="bg-primary text-primary-foreground px-6 py-3 font-bold text-sm hover:opacity-90 shadow">
                    {editingAd ? "تحديث بيانات الإعلان" : "تثبيت وحفظ الإعلان"}
                  </button>
                  {editingAd && (
                    <button onClick={() => { setEditingAd(null); clearAdForm(); }} className="bg-muted px-4 py-2 text-sm font-bold">إلغاء التعديل</button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground">مساحات العرض الإعلانية المجدولة بمصدري حالياً:</p>
              {ads.map((ad) => (
                <div key={ad.id} className={`border-2 border-border p-3 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 ${!ad.is_active ? "opacity-40" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-primary font-black text-xs uppercase bg-primary/10 px-2 py-0.5 rounded">
                        {ad.slot === "header" ? "الهيدر الرئيسي" : ad.slot === "sidebar" ? "الشريط الجانبي" : "داخل نصوص المقالات"}
                      </span>
                      <span className="text-[11px] bg-zinc-100 text-zinc-800 font-bold px-1.5 rounded">
                        نوعه: {ad.ad_type || "image"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ad.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {ad.is_active ? "مشغل ومكتمل البث" : "موارد معطلة مسبقاً"}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] truncate font-mono" dir="ltr">{ad.image_url || "لم يتم توفير رابط صورة ثابتة"}</p>
                    {ad.target_url && <p className="text-emerald-600 text-[10px] truncate font-mono" dir="ltr">🎯 يوجه إلى: {ad.target_url}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          await adminUpdate("ads", { id: ad.id }, { is_active: !ad.is_active });
                          toast.success("تم تحديث حالة العرض بنجاح");
                          fetchAll();
                        } catch (e: any) { toast.error("فشل التحديث: " + e.message); }
                      }}
                      className="text-xs font-bold px-3 py-1.5 border border-foreground hover:bg-muted"
                    >
                      {ad.is_active ? "تعطيل مؤقت" : "إعادة تفعيل"}
                    </button>
                    <button onClick={() => handleEditAd(ad)} className="p-1.5 text-primary border border-border hover:bg-muted"><Edit size={14} /></button>
                    <button onClick={() => handleDeleteAd(ad.id)} className="p-1.5 text-red-500 border border-border hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "currencies" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-2 border-foreground p-6 bg-card rounded-2xl">
              <div className="flex items-center justify-between mb-4 border-b-2 border-border pb-3">
                <h2 className="font-black text-xl flex items-center gap-2">
                  <DollarSign className="text-yellow-500"/> أسعار العملات والذهب المباشرة
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rates-fetcher`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                          },
                        });
                        const j = await r.json();
                        if (!r.ok || !j.ok) throw new Error(j.error || `HTTP ${r.status}`);
                        setCurrencyRates(j.rates);
                        toast.success(`✅ تم تحديث ${j.count} سعر تلقائياً من المصادر العالمية`);
                      } catch (e: any) {
                        toast.error(e.message || "تعذر الجلب التلقائي");
                      }
                    }}
                    className="bg-primary text-primary-foreground px-5 py-2.5 font-black text-sm hover:opacity-90 shadow-lg rounded-lg flex items-center gap-2">
                    <RefreshCw size={16}/> جلب تلقائي من المصادر
                  </button>
                  <button onClick={saveCurrencies}
                    className="bg-yellow-500 text-yellow-950 px-5 py-2.5 font-black text-sm hover:bg-yellow-400 shadow-lg rounded-lg flex items-center gap-2">
                    <RefreshCw size={16}/> حفظ التحديثات
                  </button>
                </div>

              </div>

              <p className="text-xs text-muted-foreground mb-4 font-bold">
                💡 التعديلات تُبَث مباشرة على شريط العملات في الواجهة الرئيسية بعد الحفظ.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currencyRates.map((rate, idx) => (
                  <div key={idx} className="border-2 border-border bg-muted/10 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-base flex items-center gap-2">
                        <span className="text-2xl">{(rate as any).icon || "💱"}</span>
                        {(rate as any).name || (rate as any).code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">{(rate as any).code}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-green-600 block mb-1">شراء</label>
                        <input type="text" inputMode="decimal" value={(rate as any).buy ?? ""}
                          onChange={(e) => updateRate(idx, "buy", e.target.value)}
                          className="w-full border-2 border-border px-2 py-1.5 text-sm font-bold bg-background focus:border-green-500 focus:outline-none rounded" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-red-600 block mb-1">بيع</label>
                        <input type="text" inputMode="decimal" value={(rate as any).sell ?? ""}
                          onChange={(e) => updateRate(idx, "sell", e.target.value)}
                          className="w-full border-2 border-border px-2 py-1.5 text-sm font-bold bg-background focus:border-red-500 focus:outline-none rounded" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">الاتجاه</label>
                        <select value={(rate as any).trend ?? "stable"}
                          onChange={(e) => updateRate(idx, "trend", e.target.value)}
                          className="w-full border-2 border-border px-1 py-1.5 text-xs font-bold bg-background rounded">
                          <option value="up">▲ صاعد</option>
                          <option value="down">▼ هابط</option>
                          <option value="stable">● ثابت</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-2 border-foreground p-6 bg-card rounded-2xl">
              <h2 className="font-black text-xl flex items-center gap-2 border-b-2 border-border pb-3 mb-4">
                <Shield className="text-red-500"/> مركز الأمان والتحكم
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* تغيير PIN */}
                <div className="border-2 border-red-500/30 bg-red-500/5 p-5 rounded-xl space-y-3">
                  <h3 className="font-black text-base flex items-center gap-2 text-red-600">
                    🔐 تغيير رمز الدخول السري
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-bold">رمز 4 أرقام يحمي لوحة التحكم بالكامل.</p>
                  <div>
                    <label className="text-xs font-bold block mb-1">الرمز الحالي</label>
                    <input type="password" inputMode="numeric" maxLength={4} value={secOld}
                      onChange={(e) => setSecOld(e.target.value.replace(/\D/g, ""))}
                      className="w-full border-2 border-border px-3 py-2 bg-background font-black text-center tracking-[0.5em] focus:border-red-500 focus:outline-none rounded" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">الرمز الجديد (4 أرقام)</label>
                    <input type="password" inputMode="numeric" maxLength={4} value={secNew}
                      onChange={(e) => setSecNew(e.target.value.replace(/\D/g, ""))}
                      className="w-full border-2 border-border px-3 py-2 bg-background font-black text-center tracking-[0.5em] focus:border-green-500 focus:outline-none rounded" dir="ltr" />
                  </div>
                  <button onClick={handleChangeCode}
                    className="w-full bg-red-600 text-white px-4 py-2.5 font-black text-sm hover:bg-red-700 rounded shadow-lg">
                    تطبيق الرمز الجديد فوراً
                  </button>
                </div>

                {/* جلسات + معلومات */}
                <div className="border-2 border-blue-500/30 bg-blue-500/5 p-5 rounded-xl space-y-3">
                  <h3 className="font-black text-base flex items-center gap-2 text-blue-600">
                    🛡️ حالة الجلسة والحماية
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-card rounded border border-border">
                      <span className="font-bold">حالة المصادقة:</span>
                      <span className="font-black text-green-600">✓ موثَّق ومُصادَق</span>
                    </div>
                    <div className="flex justify-between p-2 bg-card rounded border border-border">
                      <span className="font-bold">طبقة الحماية:</span>
                      <span className="font-black text-green-600">Edge Function Gateway</span>
                    </div>
                    <div className="flex justify-between p-2 bg-card rounded border border-border">
                      <span className="font-bold">RLS Policy:</span>
                      <span className="font-black text-green-600">مُفعَّل</span>
                    </div>
                    <div className="flex justify-between p-2 bg-card rounded border border-border">
                      <span className="font-bold">طول الرمز:</span>
                      <span className="font-black">{secCurrent ? `${secCurrent.length} أرقام` : "غير محدد"}</span>
                    </div>
                  </div>
                  <button onClick={() => {
                    sessionStorage.removeItem("sb_admin_pin");
                    toast.success("تم إنهاء الجلسة، إعادة توجيه...");
                    setTimeout(() => window.location.reload(), 800);
                  }}
                    className="w-full bg-zinc-900 text-white px-4 py-2.5 font-black text-sm hover:bg-zinc-800 rounded shadow-lg flex items-center justify-center gap-2">
                    <Shield size={14}/> إنهاء الجلسة الحالية
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl">
                <h4 className="font-black text-sm text-amber-700 dark:text-amber-400 mb-2">⚠️ نصائح أمنية</h4>
                <ul className="text-xs space-y-1 list-disc list-inside font-bold text-foreground/80">
                  <li>غيّر رمز الدخول كل 30 يوماً على الأقل.</li>
                  <li>لا تشارك رمز الدخول مع أي شخص خارج فريق مصدري.</li>
                  <li>أنهِ الجلسة قبل مغادرة الجهاز.</li>
                  <li>كل التعديلات تمر عبر Edge Function آمن مع تحقق من الـ PIN.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === "apk" && <ApkReleasesPanel />}
      </div>
    </div>
    </>
  );
};

export default AdminPanel;
