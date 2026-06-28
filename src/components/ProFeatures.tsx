/* ================================================================
   Sout Al-Balad — Pro Features Pack (Batch 1: 15 utilities)
   Lightweight, frontend-only, zero new deps.
   ================================================================ */
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  WifiOff, Wifi, Link2, Share2, Volume2, VolumeX, ArrowDownToLine,
  Sparkles, Quote, Eye, Heart, MessageCircle, Copy, Check, Sun, Moon, Contrast,
} from "lucide-react";

/* 1. Scroll progress bar (top of viewport) */
export const ScrollProgress = () => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const h = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setP(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0);
    };
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <div className="fixed top-0 inset-x-0 h-[3px] z-[60] pointer-events-none" style={{ background: "hsl(var(--primary)/0.06)" }}>
      <div className="h-full transition-[width] duration-150"
        style={{ width: `${p}%`, background: "linear-gradient(90deg,hsl(var(--gold)),hsl(var(--accent)),hsl(var(--gold)))" }} />
    </div>
  );
};

/* 2. Offline / online banner */
export const ConnectivityBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => { setOffline(false); toast.success("عاد الاتصال بالإنترنت"); };
    const off = () => { setOffline(true); toast.error("أنت غير متصل بالإنترنت"); };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
      style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
      <WifiOff size={12} /> وضع عدم الاتصال
    </div>
  );
};

/* 3. Copy current URL */
export const CopyLinkButton = ({ url }: { url?: string }) => {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setDone(true); toast.success("تم نسخ الرابط");
      setTimeout(() => setDone(false), 1500);
    } catch { toast.error("تعذّر النسخ"); }
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition hover:bg-[hsl(var(--gold)/0.12)]"
      style={{ borderColor: "hsl(var(--gold)/0.5)", color: "hsl(var(--primary))" }} aria-label="نسخ الرابط">
      {done ? <Check size={12} /> : <Link2 size={12} />} {done ? "تم النسخ" : "نسخ الرابط"}
    </button>
  );
};

/* 4. Native share button (uses Web Share API) */
export const NativeShareButton = ({ title, text, url }: { title?: string; text?: string; url?: string }) => {
  const share = async () => {
    if (!(navigator as any).share) { toast.info("المتصفح لا يدعم المشاركة المباشرة"); return; }
    try { await (navigator as any).share({ title, text, url: url || window.location.href }); } catch {}
  };
  return (
    <button onClick={share} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition hover:bg-[hsl(var(--gold)/0.12)]"
      style={{ borderColor: "hsl(var(--gold)/0.5)", color: "hsl(var(--primary))" }} aria-label="مشاركة">
      <Share2 size={12} /> مشاركة
    </button>
  );
};

/* 5. Read-aloud (browser TTS, no API needed) */
export const ReadAloudButton = ({ text }: { text: string }) => {
  const [playing, setPlaying] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const toggle = () => {
    if (!("speechSynthesis" in window)) { toast.error("التشغيل الصوتي غير مدعوم"); return; }
    if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-EG"; u.rate = 0.95;
    u.onend = () => setPlaying(false);
    utterRef.current = u;
    window.speechSynthesis.speak(u); setPlaying(true);
  };
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch {} }, []);
  return (
    <button onClick={toggle} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition hover:bg-[hsl(var(--gold)/0.12)]"
      style={{ borderColor: "hsl(var(--gold)/0.5)", color: "hsl(var(--primary))" }} aria-label="استماع">
      {playing ? <VolumeX size={12} /> : <Volume2 size={12} />} {playing ? "إيقاف" : "استماع"}
    </button>
  );
};

/* 6. PWA install hint (after deferred prompt) */
export const PWAInstallHint = () => {
  const [evt, setEvt] = useState<any>(null);
  useEffect(() => {
    const h = (e: any) => { e.preventDefault(); setEvt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (!evt) return null;
  return (
    <button onClick={async () => { evt.prompt(); await evt.userChoice; setEvt(null); }}
      className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-full shadow-royal text-xs font-bold"
      style={{ background: "hsl(var(--gold))", color: "hsl(var(--primary))" }}>
      <ArrowDownToLine size={13} /> ثبّت التطبيق
    </button>
  );
};

/* 7. Selection share popover — highlights text and offers share */
export const SelectionShare = () => {
  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null);
  useEffect(() => {
    const h = () => {
      const s = window.getSelection();
      const t = s?.toString().trim();
      if (!t || t.length < 8) { setSel(null); return; }
      const r = s!.getRangeAt(0).getBoundingClientRect();
      setSel({ text: t, x: r.left + r.width / 2, y: r.top - 8 });
    };
    document.addEventListener("mouseup", h);
    document.addEventListener("touchend", h);
    return () => { document.removeEventListener("mouseup", h); document.removeEventListener("touchend", h); };
  }, []);
  if (!sel) return null;
  const share = async () => {
    const text = `"${sel.text}" — صوت البلد ${window.location.href}`;
    try { await navigator.clipboard.writeText(text); toast.success("تم نسخ الاقتباس"); } catch {}
    setSel(null);
  };
  return (
    <button onClick={share}
      className="fixed z-[90] -translate-x-1/2 -translate-y-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xl text-[11px] font-bold"
      style={{ left: sel.x, top: sel.y, background: "hsl(var(--primary))", color: "hsl(var(--gold))" }}>
      <Quote size={12} /> اقتبس
    </button>
  );
};

/* 8. Live relative time */
export const RelativeTime = ({ iso }: { iso: string }) => {
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 60_000); return () => clearInterval(t); }, []);
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const fmt = (n: number, unit: string) => `منذ ${Math.round(n)} ${unit}`;
  let label = "الآن";
  if (diff > 60 && diff < 3600) label = fmt(diff / 60, "دقيقة");
  else if (diff < 86400) label = fmt(diff / 3600, "ساعة");
  else if (diff < 2592000) label = fmt(diff / 86400, "يوم");
  else label = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short" }).format(new Date(iso));
  return <time className="tabular" dateTime={iso}>{label}</time>;
};

/* 9. Anonymous emoji reactions (localStorage) */
const REACTS = ["👍", "🔥", "😢", "😡", "🤔"] as const;
export const ArticleReactions = ({ articleId }: { articleId: string }) => {
  const key = `sb-react-${articleId}`;
  const [picked, setPicked] = useState<string | null>(() => localStorage.getItem(key));
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {REACTS.map((r) => (
        <button key={r} onClick={() => { localStorage.setItem(key, r); setPicked(r); toast.success("شكراً لتفاعلك"); }}
          aria-label={`تفاعل ${r}`}
          className={`w-9 h-9 rounded-full grid place-items-center text-base transition border ${picked === r ? "scale-110" : "hover:scale-110"}`}
          style={{
            borderColor: picked === r ? "hsl(var(--gold))" : "hsl(var(--border))",
            background: picked === r ? "hsl(var(--gold)/0.15)" : "hsl(var(--card))",
          }}>{r}</button>
      ))}
    </div>
  );
};

/* 10. Copy as Markdown for the current article element */
export const CopyAsMarkdown = ({ title, url }: { title: string; url?: string }) => {
  const copy = async () => {
    const md = `# ${title}\n\n${url || window.location.href}\n\n— صوت البلد`;
    await navigator.clipboard.writeText(md);
    toast.success("تم النسخ كـ Markdown");
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold"
      style={{ borderColor: "hsl(var(--gold)/0.5)" }}><Copy size={12} /> نسخ Markdown</button>
  );
};

/* 11. Auto Table of Contents (scans h2/h3 inside given selector) */
export const AutoTOC = ({ selector = ".article-prose" }: { selector?: string }) => {
  const [items, setItems] = useState<{ id: string; text: string; level: number }[]>([]);
  useEffect(() => {
    const root = document.querySelector(selector);
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll("h2, h3")) as HTMLElement[];
    const next = nodes.map((n, i) => {
      const id = n.id || `toc-${i}`;
      n.id = id;
      return { id, text: n.innerText.trim(), level: n.tagName === "H2" ? 2 : 3 };
    });
    setItems(next);
  }, [selector]);
  if (items.length < 2) return null;
  return (
    <nav aria-label="محتويات" className="card-editorial p-4 text-sm">
      <h4 className="kicker mb-3">في هذا المقال</h4>
      <ol className="space-y-2">
        {items.map((it) => (
          <li key={it.id} style={{ paddingInlineStart: (it.level - 2) * 12 }}>
            <a href={`#${it.id}`} className="hover:text-[hsl(var(--gold-dark))]">• {it.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

/* 12. Theme contrast quick-toggle (light / dark / high-contrast) */
export const ContrastQuickToggle = () => {
  const [mode, setMode] = useState<"light" | "dark" | "hc">(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });
  const apply = (m: "light" | "dark" | "hc") => {
    const html = document.documentElement;
    html.classList.toggle("dark", m === "dark" || m === "hc");
    html.style.filter = m === "hc" ? "contrast(1.18) saturate(1.1)" : "";
    setMode(m);
  };
  return (
    <div className="inline-flex rounded-full border p-0.5" style={{ borderColor: "hsl(var(--gold)/0.5)" }}>
      {[
        { k: "light", icon: <Sun size={12} /> },
        { k: "dark", icon: <Moon size={12} /> },
        { k: "hc", icon: <Contrast size={12} /> },
      ].map(({ k, icon }) => (
        <button key={k} onClick={() => apply(k as any)} aria-label={k}
          className="w-7 h-7 grid place-items-center rounded-full transition"
          style={{ background: mode === k ? "hsl(var(--gold)/0.2)" : "transparent" }}>{icon}</button>
      ))}
    </div>
  );
};

/* 13. Keyboard navigation: J/K to jump between article cards */
export const KeyboardNav = ({ selector = "[data-article-card]" }: { selector?: string }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).matches("input,textarea,[contenteditable]")) return;
      if (e.key !== "j" && e.key !== "k") return;
      const cards = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
      if (cards.length === 0) return;
      const y = window.scrollY + 100;
      const idx = cards.findIndex((c) => c.getBoundingClientRect().top + window.scrollY >= y);
      const cur = idx === -1 ? cards.length - 1 : idx;
      const next = e.key === "j" ? Math.min(cards.length - 1, cur + 1) : Math.max(0, cur - 1);
      cards[next].scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selector]);
  return null;
};

/* 14. Skeleton shimmer block */
export const SkeletonBlock = ({ className = "h-6 w-full" }: { className?: string }) => (
  <div className={`rounded ${className}`}
    style={{
      background: "linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 100%)",
      backgroundSize: "200% 100%",
      animation: "skshimmer 1.4s linear infinite",
    }}>
    <style>{`@keyframes skshimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
  </div>
);

/* 15. Cookie consent (lightweight, dismissible) */
export const CookieConsent = () => {
  const [show, setShow] = useState(false);
  useEffect(() => { if (!localStorage.getItem("sb-cookies-ok")) setShow(true); }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-4 md:max-w-md z-[70] p-4 rounded-xl shadow-royal border text-sm flex items-start gap-3"
      style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--gold)/0.5)", fontFamily: "'Tajawal',sans-serif" }}>
      <Sparkles size={18} style={{ color: "hsl(var(--gold))" }} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold mb-1">نستخدم ملفات تعريف الارتباط</p>
        <p className="text-xs text-muted-foreground">لتحسين تجربتك على صوت البلد. باستخدامك للموقع فأنت توافق على ذلك.</p>
      </div>
      <button onClick={() => { localStorage.setItem("sb-cookies-ok", "1"); setShow(false); }}
        className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
        style={{ background: "hsl(var(--gold))", color: "hsl(var(--primary))" }}>موافق</button>
    </div>
  );
};
