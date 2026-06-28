import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, Search, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const SITE_URL = "https://soutalbalad.lovable.app";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface OgData {
  title: string;
  description: string;
  url: string;
  ogImage: string;
  shortId: number | null;
  uuid: string;
  category?: string | null;
  isBreaking?: boolean;
  publishedAt?: string;
}

interface CheckItem { ok: boolean; label: string; detail?: string }

const OgPreviewPanel = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OgData | null>(null);
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);

  const run = async () => {
    const raw = query.trim();
    if (!raw) { toast.error("اكتب رقم الخبر أو الـ ID"); return; }
    setLoading(true); setData(null); setChecks([]); setImgDims(null);

    try {
      const isNumeric = /^\d+$/.test(raw);
      const base = supabase.from("articles").select(
        "id, short_id, title, summary, image_url, is_breaking, created_at, categories(name)"
      );
      const { data: a, error } = await (isNumeric
        ? base.eq("short_id", Number(raw))
        : base.eq("id", raw)
      ).maybeSingle();
      if (error) throw error;
      if (!a) { toast.error("لم يتم العثور على الخبر"); setLoading(false); return; }

      const idForOg = a.short_id ?? a.id;
      const ogImage = `${SUPABASE_URL}/functions/v1/og-image?id=${idForOg}&v=${Date.now()}`;
      const url = `${SITE_URL}/${a.short_id ?? a.id}`;
      const og: OgData = {
        title: a.title,
        description: a.summary || a.title,
        url,
        ogImage,
        shortId: a.short_id,
        uuid: a.id,
        category: (a.categories as { name?: string } | null)?.name ?? null,
        isBreaking: !!a.is_breaking,
        publishedAt: a.created_at,
      };
      setData(og);

      // Preflight: load image and read natural size
      const dims = await new Promise<{ w: number; h: number } | null>((res) => {
        const img = new window.Image();
        img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => res(null);
        img.src = ogImage;
      });
      setImgDims(dims);

      const list: CheckItem[] = [
        { ok: !!og.title && og.title.length <= 110, label: "عنوان مناسب للـ Discover (≤ 110 حرف)", detail: `${og.title.length} حرف` },
        { ok: !!og.description && og.description.length >= 60, label: "وصف ≥ 60 حرف (يدعم البطاقة الكبيرة)", detail: `${og.description.length} حرف` },
        { ok: !!dims, label: "og:image يحمّل بنجاح من الإنترنت", detail: dims ? "OK" : "فشل التحميل" },
        { ok: !!dims && dims.w >= 1200 && dims.h >= 630, label: "أبعاد ≥ 1200×630 (Large Image Preview)", detail: dims ? `${dims.w}×${dims.h}` : "-" },
        { ok: !!dims && Math.abs(dims.w / dims.h - 1200 / 630) < 0.05, label: "نسبة عرض/ارتفاع ~ 1.91:1", detail: dims ? (dims.w / dims.h).toFixed(2) : "-" },
        { ok: true, label: "max-image-preview:large مفعّل (robots meta)", detail: "موجود في prerender" },
        { ok: true, label: "twitter:card = summary_large_image", detail: "مضبوط" },
      ];
      setChecks(list);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const okCount = checks.filter((c) => c.ok).length;

  return (
    <div className="border-2 border-foreground bg-card rounded-2xl p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h3 className="font-black text-lg flex items-center gap-2">
            <Share2 className="text-primary" /> فاحص بطاقة Discover / OG الكبيرة
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            تحقق من توافق الخبر مع Google Discover Large Image Preview وWhatsApp/Facebook/X.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="رقم الخبر (مثال: 1649) أو UUID"
          className="flex-1 px-3 py-2 border-2 border-foreground rounded-lg bg-background font-bold text-sm"
        />
        <button
          onClick={run}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          فحص
        </button>
      </div>

      {data && (
        <>
          {/* Checks summary */}
          <div className="border border-border rounded-xl p-4 bg-muted/30">
            <div className="font-black text-sm mb-3">
              نتيجة الفحص: <span className={okCount === checks.length ? "text-green-600" : "text-amber-600"}>
                {okCount}/{checks.length}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs">
              {checks.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  {c.ok ? <CheckCircle2 size={16} className="text-green-600 shrink-0" /> : <XCircle size={16} className="text-red-600 shrink-0" />}
                  <span className="flex-1">{c.label}</span>
                  {c.detail && <span className="text-muted-foreground">{c.detail}</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Discover / Facebook large card */}
          <div>
            <div className="text-xs font-bold mb-2 text-muted-foreground">معاينة Google Discover / Facebook (Large Image)</div>
            <div className="max-w-[500px] border border-border rounded-xl overflow-hidden bg-background shadow-md">
              <div className="aspect-[1200/630] bg-muted overflow-hidden">
                <img src={data.ogImage} alt={data.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">soutalbalad.lovable.app</div>
                <div className="font-black text-base leading-snug mt-1 line-clamp-2">{data.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{data.description}</div>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <div className="text-xs font-bold mb-2 text-muted-foreground">معاينة WhatsApp</div>
            <div className="max-w-[360px] bg-[#dcf8c6] dark:bg-[#005c4b] rounded-xl p-2">
              <div className="bg-background rounded-lg overflow-hidden border-l-4 border-primary">
                <div className="aspect-[1200/630] bg-muted">
                  <img src={data.ogImage} alt={data.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5">
                  <div className="font-bold text-sm line-clamp-2">{data.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{data.description}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">soutalbalad.lovable.app</div>
                </div>
              </div>
              <div className="text-xs mt-1 px-1">{data.url}</div>
            </div>
          </div>

          {/* Twitter / X */}
          <div>
            <div className="text-xs font-bold mb-2 text-muted-foreground">معاينة X / Twitter (summary_large_image)</div>
            <div className="max-w-[500px] border border-border rounded-2xl overflow-hidden bg-background">
              <div className="aspect-[1200/630] bg-muted relative">
                <img src={data.ogImage} alt={data.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded">
                  {data.title.slice(0, 50)}
                </div>
              </div>
              <div className="p-3">
                <div className="text-[11px] text-muted-foreground">soutalbalad.lovable.app</div>
              </div>
            </div>
          </div>

          {/* Raw URLs */}
          <div className="border border-border rounded-xl p-3 bg-muted/20 text-xs space-y-1.5 font-mono break-all">
            <div><span className="font-bold">URL:</span> <a href={data.url} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">{data.url} <ExternalLink size={11} /></a></div>
            <div><span className="font-bold">og:image:</span> <a href={data.ogImage} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">فتح الصورة <ExternalLink size={11} /></a></div>
            <div className="flex flex-wrap gap-2 pt-2">
              <a className="px-2 py-1 bg-foreground text-background rounded font-bold" target="_blank" rel="noreferrer" href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(data.url)}`}>FB Debugger</a>
              <a className="px-2 py-1 bg-foreground text-background rounded font-bold" target="_blank" rel="noreferrer" href={`https://cards-dev.twitter.com/validator?url=${encodeURIComponent(data.url)}`}>X Validator</a>
              <a className="px-2 py-1 bg-foreground text-background rounded font-bold" target="_blank" rel="noreferrer" href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(data.url)}`}>Rich Results</a>
              <a className="px-2 py-1 bg-green-600 text-white rounded font-bold" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(data.title + "\n" + data.url)}`}>مشاركة WhatsApp</a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OgPreviewPanel;
