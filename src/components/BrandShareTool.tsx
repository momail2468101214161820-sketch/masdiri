import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, MessageCircle, Facebook, Send, Link2, Sparkles, Wand2 } from "lucide-react";

// أداة مشاركة بعلامة "صوت البلد" + اختصار رابط مجاني (TinyURL)
// بنولّد رابط قصير شغّال فعلاً يحوّل للرابط الأصلي على lovable.app

const REAL_BASE = "https://soutalbalad.lovable.app";

async function shortenUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text.startsWith("http") ? text : null;
  } catch {
    return null;
  }
}

const BrandShareTool = () => {
  const [articles, setArticles] = useState<{ id: string; title: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [shortening, setShortening] = useState(false);

  useEffect(() => {
    supabase
      .from("articles")
      .select("id,title")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setArticles(data || []));
  }, []);

  const selected = articles.find((a) => a.id === selectedId);
  const realUrl = customUrl.trim() ||
    (selected ? `${REAL_BASE}/article/${selected.id}` : REAL_BASE);
  const title = customTitle.trim() || selected?.title || "مصدري للأخبار المصرية والعالمية";
  const displayUrl = shortUrl || realUrl;

  // إعادة تصفير الرابط القصير لما الرابط الأصلي يتغير
  useEffect(() => { setShortUrl(""); }, [realUrl]);

  const generateShort = async () => {
    setShortening(true);
    const s = await shortenUrl(realUrl);
    if (s) { setShortUrl(s); toast.success("تم إنشاء رابط قصير شغّال ✓"); }
    else toast.error("تعذّر إنشاء الرابط القصير");
    setShortening(false);
  };

  const shareText =
    `📰 ${title}\n` +
    `\n👉 ${displayUrl}\n` +
    `\n— مصدري للأخبار المصرية والعالمية`;

  const copy = async (text: string, label = "تم النسخ") => {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const enc = encodeURIComponent;
  const wa = `https://api.whatsapp.com/send?text=${enc(shareText)}`;
  const tg = `https://t.me/share/url?url=${enc(displayUrl)}&text=${enc(`📰 ${title}\n— صوت البلد`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${enc(displayUrl)}&quote=${enc(`📰 ${title}`)}`;

  return (
    <div
      className="rounded-2xl border p-6 space-y-5"
      style={{ background: "hsl(var(--card) / 0.6)", borderColor: "hsl(var(--gold) / 0.3)" }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="text-yellow-500" size={20} />
        <h3 className="text-xl font-bold">مشاركة بعلامة soutalbalad.com</h3>
      </div>

      <p className="text-sm text-muted-foreground leading-7">
        طالما مفيش دومين متشترى، الرابط الفعلي بيفضل <code className="px-1 rounded bg-muted">lovable.app</code>.
        الأداة دي بتجهزلك نص مشاركة رسمي يبان فيه <b>soutalbalad.com</b> بجانب الرابط
        الحقيقي اللي شغّال — مثالي لواتساب وفيسبوك وتليجرام.
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold mb-1">اختر خبر منشور</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full p-2 rounded-lg border bg-background"
          >
            <option value="">— رابط الصفحة الرئيسية —</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>{a.title.slice(0, 60)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">أو رابط مخصص</label>
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder={REAL_BASE}
            className="w-full p-2 rounded-lg border bg-background"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold mb-1">عنوان مخصص (اختياري)</label>
        <input
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder={title}
          className="w-full p-2 rounded-lg border bg-background"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border bg-background/40">
          <div className="text-[11px] text-muted-foreground mb-1">الرابط القصير (للمشاركة)</div>
          <div className="font-mono text-sm break-all min-h-[20px]" dir="ltr">{shortUrl || "— اضغط «ولّد رابط قصير»"}</div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={generateShort}
              disabled={shortening}
              className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Wand2 size={12} /> {shortening ? "..." : "ولّد رابط قصير"}
            </button>
            {shortUrl && (
              <button
                onClick={() => copy(shortUrl, "تم نسخ الرابط القصير")}
                className="text-xs px-3 py-1 rounded bg-muted inline-flex items-center gap-1"
              >
                <Copy size={12} /> نسخ
              </button>
            )}
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-background/40">
          <div className="text-[11px] text-muted-foreground mb-1">الرابط الفعلي</div>
          <div className="font-mono text-sm break-all" dir="ltr">{realUrl}</div>
          <button
            onClick={() => copy(realUrl, "تم نسخ الرابط الفعلي")}
            className="mt-2 text-xs px-3 py-1 rounded bg-muted inline-flex items-center gap-1"
          >
            <Copy size={12} /> نسخ
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold mb-1">نص المشاركة الجاهز</label>
        <textarea
          readOnly
          value={shareText}
          rows={6}
          className="w-full p-3 rounded-lg border bg-background font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => copy(shareText, "تم نسخ نص المشاركة")}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold inline-flex items-center gap-2"
        >
          <Copy size={16} /> نسخ النص كامل
        </button>
        <a href={wa} target="_blank" rel="noreferrer"
          className="px-4 py-2 rounded-lg text-white font-bold inline-flex items-center gap-2"
          style={{ background: "#25D366" }}>
          <MessageCircle size={16} /> واتساب
        </a>
        <a href={tg} target="_blank" rel="noreferrer"
          className="px-4 py-2 rounded-lg text-white font-bold inline-flex items-center gap-2"
          style={{ background: "#0088cc" }}>
          <Send size={16} /> تليجرام
        </a>
        <a href={fb} target="_blank" rel="noreferrer"
          className="px-4 py-2 rounded-lg text-white font-bold inline-flex items-center gap-2"
          style={{ background: "#1877F2" }}>
          <Facebook size={16} /> فيسبوك
        </a>
        <a href={realUrl} target="_blank" rel="noreferrer"
          className="px-4 py-2 rounded-lg border font-bold inline-flex items-center gap-2">
          <Link2 size={16} /> فتح الرابط
        </a>
      </div>

      <p className="text-[11px] text-muted-foreground leading-6">
        💡 الرابط القصير من TinyURL مجاني ودائم وبيحوّل تلقائي للموقع الأصلي. لو اشتريت دومين خاص بيك من إعدادات لوفبل، الأداة هتشتغل بالدومين الجديد تلقائياً.
      </p>
    </div>
  );
};

export default BrandShareTool;
