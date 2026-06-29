import { useState } from "react";
import { Search, ExternalLink, Send, Zap, Globe2, Radio } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAdminPin } from "@/lib/adminApi";

import { SITE_URL } from "@/lib/siteUrl";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

const SeoIndexingPanel = () => {
  const [busy, setBusy] = useState<string | null>(null);
  const [inspectUrl, setInspectUrl] = useState(SITE_URL);
  const [result, setResult] = useState<string>("");

  const call = async (action: string, payload: Record<string, unknown> = {}) => {
    setBusy(action);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("gsc-indexing", {
        body: { action, ...payload },
        headers: { "X-Admin-Pin": getAdminPin() || "" },
      });
      if (error) throw error;
      if (data?.ok) {
        toast.success(data.message || "تم بنجاح ✓");
        setResult(data.message || "تم بنجاح");
      } else {
        toast.error(data?.message || "فشلت العملية");
        setResult(data?.message || "فشلت العملية");
      }
    } catch (e: any) {
      toast.error(e?.message || "خطأ في الاتصال");
      setResult(e?.message || "خطأ");
    }
    setBusy(null);
  };

  const pingBing = async () => {
    setBusy("bing");
    try {
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`, { mode: "no-cors" });
      toast.success("تم إخطار Bing ✓");
    } catch {
      toast.error("تعذّر الإرسال إلى Bing");
    }
    setBusy(null);
  };

  const indexNow = async (mode: "all" | "home") => {
    const key = `indexnow_${mode}`;
    setBusy(key);
    setResult("");
    try {
      const payload = mode === "all"
        ? { mode: "all" }
        : { mode: "urls", urls: [SITE_URL, `${SITE_URL}/news`, `${SITE_URL}/rates`, `${SITE_URL}/results`] };
      const { data, error } = await supabase.functions.invoke("indexnow-submit", { body: payload });
      if (error) throw error;
      if (data?.ok) {
        toast.success(data.message || "تم البث ✓");
        setResult(data.message || "");
      } else {
        toast.error(data?.message || "فشل البث");
        setResult(data?.message || "");
      }
    } catch (e: any) {
      toast.error(e?.message || "خطأ");
      setResult(e?.message || "خطأ");
    }
    setBusy(null);
  };

  const turboSpread = async () => {
    setBusy("turbo");
    setResult("");
    const tasks: Promise<string>[] = [
      // 1) IndexNow → 4 محركات + شبكة 10K+
      supabase.functions
        .invoke("indexnow-submit", { body: { mode: "all" } })
        .then((r: any) => `IndexNow: ${r.data?.urls || 0} رابط ✓`)
        .catch((e) => `IndexNow ✗ ${e?.message || ""}`),
      // 2) Google Search Console — إرسال السايت ماب
      supabase.functions
        .invoke("gsc-indexing", {
          body: { action: "submit_sitemap" },
          headers: { "X-Admin-Pin": getAdminPin() || "" },
        })
        .then((r: any) => (r.data?.ok ? "Google Sitemap ✓" : "Google Sitemap ✗"))
        .catch(() => "Google Sitemap ✗"),
      // 3) Bing ping مباشر
      fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`, { mode: "no-cors" })
        .then(() => "Bing Ping ✓")
        .catch(() => "Bing Ping ✗"),
      // 4) Yandex ping
      fetch(`https://blogs.yandex.ru/pings/?status=success&url=${encodeURIComponent(SITEMAP_URL)}`, { mode: "no-cors" })
        .then(() => "Yandex Ping ✓")
        .catch(() => "Yandex Ping ✗"),
      // 5) PubSubHubbub (WebSub) للأخبار → ينشر فورًا لكل المشتركين بالـ RSS
      fetch("https://pubsubhubbub.appspot.com/", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `hub.mode=publish&hub.url=${encodeURIComponent(SITE_URL + "/rss.xml")}`,
      })
        .then(() => "WebSub (Google PubSubHubbub) ✓")
        .catch(() => "WebSub ✗"),
      // 6) Superfeedr WebSub (شبكة أخرى)
      fetch("https://pubsubhubbub.superfeedr.com/", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `hub.mode=publish&hub.url=${encodeURIComponent(SITE_URL + "/rss.xml")}`,
      })
        .then(() => "Superfeedr WebSub ✓")
        .catch(() => "Superfeedr ✗"),
    ];
    const results = await Promise.all(tasks);
    const okCount = results.filter((r) => r.endsWith("✓")).length;
    toast.success(`بث تيربو: ${okCount}/${results.length} قناة ⚡`);
    setResult(results.join(" · "));
    setBusy(null);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Search className="text-[hsl(var(--gold))]" size={20} />
        <h3 className="text-lg font-black" style={{ fontFamily: "'Amiri', serif" }}>
          مركز الفهرسة في محركات البحث
        </h3>
      </div>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>
        إرسال مباشر لجوجل عبر Google Search Console API (متّصل ✓)
      </p>

      <button
        onClick={turboSpread}
        disabled={busy !== null}
        className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-[hsl(var(--gold))] text-white py-3 px-4 rounded-lg font-black text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg animate-pulse"
      >
        <Zap size={20} />
        {busy === "turbo" ? "جارٍ البث التيربو..." : "⚡ بث تيربو فائق السرعة — كل القنوات دفعة واحدة"}
      </button>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button
          onClick={() => call("submit_sitemap")}
          disabled={busy !== null}
          className="bg-[hsl(var(--gold))] text-[hsl(var(--primary))] py-2.5 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          <Zap size={16} />
          {busy === "submit_sitemap" ? "جارٍ..." : "إرسال خريطة مصدري لجوجل"}
        </button>
        <button
          onClick={pingBing}
          disabled={busy !== null}
          className="bg-[hsl(var(--primary))] text-white py-2.5 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          <Send size={16} />
          {busy === "bing" ? "جارٍ..." : "إخطار Bing"}
        </button>
      </div>

      <div className="pt-3 border-t border-border space-y-2">
        <div className="flex items-center gap-2">
          <Globe2 className="text-[hsl(var(--gold))]" size={16} />
          <h4 className="text-sm font-black" style={{ fontFamily: "'Cairo', sans-serif" }}>
            بث عالمي عبر IndexNow — +10,000 محرك بحث وزاحف
          </h4>
        </div>
        <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>
          إرسال واحد ينتشر تلقائيًا على Bing · Yandex · Seznam · Naver · Yep وكل شركاء شبكة IndexNow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={() => indexNow("home")}
            disabled={busy !== null}
            className="bg-[hsl(var(--primary))] text-white py-2.5 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            <Radio size={16} />
            {busy === "indexnow_home" ? "جارٍ..." : "بث الصفحات الرئيسية"}
          </button>
          <button
            onClick={() => indexNow("all")}
            disabled={busy !== null}
            className="bg-gradient-to-r from-[hsl(var(--gold))] to-amber-500 text-[hsl(var(--primary))] py-2.5 px-4 rounded-md font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            <Globe2 size={16} />
            {busy === "indexnow_all" ? "جارٍ البث العالمي..." : "بث كل الأخبار عالميًا 🌍"}
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <label className="text-xs font-bold" style={{ fontFamily: "'Cairo', sans-serif" }}>
          فحص حالة فهرسة رابط معيّن:
        </label>
        <div className="flex gap-2">
          <input
            value={inspectUrl}
            onChange={(e) => setInspectUrl(e.target.value)}
            placeholder="https://masdiri.lovable.app/article/..."
            className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
            dir="ltr"
          />
          <button
            onClick={() => call("inspect_url", { url: inspectUrl })}
            disabled={busy !== null}
            className="bg-[hsl(var(--primary))] text-white py-2 px-4 rounded-md font-bold text-sm hover:opacity-90 disabled:opacity-50"
          >
            {busy === "inspect_url" ? "جارٍ..." : "فحص"}
          </button>
        </div>
      </div>

      {result && (
        <div className="text-xs bg-muted/40 p-3 rounded-md" style={{ fontFamily: "'Cairo', sans-serif" }}>
          {result}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => window.open(`https://search.google.com/search-console?resource_id=${encodeURIComponent(SITE_URL)}`, "_blank")}
          className="flex-1 border border-border py-2 px-3 rounded-md text-xs flex items-center justify-center gap-1 hover:bg-muted"
        >
          <ExternalLink size={12} /> فتح Search Console
        </button>
      </div>

      <div className="text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-md" style={{ fontFamily: "'Cairo', sans-serif" }}>
        💡 شرط: لازم مصدري <span className="font-bold">{SITE_URL}</span> يكون متحقّق منه في Search Console بنفس الحساب اللي ربطته بـ Lovable.
      </div>
    </div>
  );
};

export default SeoIndexingPanel;
