/* ================================================================
   Sout Al-Balad — Pro Features Pack (Batch 2: items 16-30)
   ================================================================ */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Moon, Sun, Sunrise, Sunset, CloudMoon, Clock, Bell, BellOff, X, ZoomIn,
  History, Bookmark, MessageSquare, Heart, MapPin, Send,
} from "lucide-react";

/* 16. Prayer times — Aladhan (no key), Cairo by default, next-prayer countdown */
type Timings = Record<string, string>;
const PRAYERS: { key: string; label: string; icon: any }[] = [
  { key: "Fajr", label: "الفجر", icon: Moon },
  { key: "Sunrise", label: "الشروق", icon: Sunrise },
  { key: "Dhuhr", label: "الظهر", icon: Sun },
  { key: "Asr", label: "العصر", icon: Sun },
  { key: "Maghrib", label: "المغرب", icon: Sunset },
  { key: "Isha", label: "العشاء", icon: CloudMoon },
];

const parseTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0); return d;
};

export const PrayerTimesWidget = ({ city = "Cairo", country = "Egypt" }: { city?: string; country?: string }) => {
  const [t, setT] = useState<Timings | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const cacheKey = `sb-prayer-${city}-${new Date().toDateString()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { try { setT(JSON.parse(cached)); return; } catch {} }
    fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`)
      .then((r) => r.json())
      .then((j) => {
        const tm = j?.data?.timings as Timings;
        if (tm) { setT(tm); localStorage.setItem(cacheKey, JSON.stringify(tm)); }
      })
      .catch(() => {});
  }, [city, country]);

  useEffect(() => { const i = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(i); }, []);

  const next = useMemo(() => {
    if (!t) return null;
    for (const p of PRAYERS) {
      const time = parseTime(t[p.key]);
      if (time.getTime() > now.getTime()) {
        const diff = time.getTime() - now.getTime();
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        return { ...p, time: t[p.key], in: h > 0 ? `${h}س ${m}د` : `${m}د` };
      }
    }
    return { ...PRAYERS[0], time: t.Fajr, in: "غداً" };
  }, [t, now]);

  if (!t) return null;

  return (
    <div className="card-editorial p-5">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b" style={{ borderColor: "hsl(var(--gold)/0.4)" }}>
        <CloudMoon size={16} style={{ color: "hsl(var(--gold-dark))" }} />
        <h3 className="font-bold text-base" style={{ fontFamily: "'Amiri',serif", color: "hsl(var(--primary))" }}>مواقيت الصلاة</h3>
        <span className="mr-auto text-[10px] text-muted-foreground tabular">{city}</span>
      </div>
      {next && (
        <div className="mb-4 p-3 rounded-lg flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--royal-blue-dark)))", color: "hsl(var(--gold))" }}>
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-80" style={{ fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>الصلاة القادمة</div>
            <div className="text-lg font-bold" style={{ fontFamily: "'Amiri',serif" }}>{next.label}</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black tabular">{next.time}</div>
            <div className="text-[11px] opacity-90 tabular">بعد {next.in}</div>
          </div>
        </div>
      )}
      <ul className="grid grid-cols-2 gap-2 text-xs">
        {PRAYERS.map((p) => (
          <li key={p.key} className={`flex items-center justify-between px-2 py-1.5 rounded ${next?.key === p.key ? "ring-1" : ""}`}
            style={{ background: "hsl(var(--muted)/0.5)", ...(next?.key === p.key ? { boxShadow: "inset 0 0 0 1px hsl(var(--gold))" } : {}) }}>
            <span className="flex items-center gap-1.5" style={{ fontFamily: "'Tajawal',sans-serif", fontWeight: 600 }}>
              <p.icon size={11} style={{ color: "hsl(var(--gold-dark))" }} /> {p.label}
            </span>
            <span className="tabular font-bold" style={{ fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>{t[p.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* 17. Currency mini-strip */
export const CurrencyMiniStrip = () => {
  const rates = [
    { code: "USD", label: "دولار", v: 48.6 },
    { code: "EUR", label: "يورو", v: 52.1 },
    { code: "SAR", label: "ريال", v: 12.95 },
    { code: "GBP", label: "إسترليني", v: 61.4 },
    { code: "GOLD", label: "ذهب 21", v: 4250 },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {rates.map((r) => (
        <span key={r.code} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px]"
          style={{ borderColor: "hsl(var(--gold)/0.4)", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
          <span className="font-bold" style={{ color: "hsl(var(--gold-dark))" }}>{r.label}</span>
          <span className="tabular font-bold">{r.v}</span>
        </span>
      ))}
    </div>
  );
};

/* 18. Recently viewed (localStorage) */
const RV_KEY = "sb-recent-viewed";
export const trackRecentlyViewed = (id: string, title: string) => {
  try {
    const list: { id: string; title: string; at: number }[] = JSON.parse(localStorage.getItem(RV_KEY) || "[]");
    const next = [{ id, title, at: Date.now() }, ...list.filter((x) => x.id !== id)].slice(0, 10);
    localStorage.setItem(RV_KEY, JSON.stringify(next));
  } catch {}
};
export const RecentlyViewedRail = () => {
  const [list, setList] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => { try { setList(JSON.parse(localStorage.getItem(RV_KEY) || "[]")); } catch {} }, []);
  if (list.length === 0) return null;
  return (
    <div className="card-editorial p-4">
      <h4 className="kicker mb-2"><History size={11} className="inline" /> شاهدتها مؤخراً</h4>
      <ul className="space-y-1.5">
        {list.slice(0, 5).map((a) => (
          <li key={a.id}>
            <a href={`/article/${a.id}`} className="text-sm line-clamp-1 hover:text-[hsl(var(--gold-dark))]"
              style={{ fontFamily: "'Tajawal',sans-serif" }}>• {a.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* 19. Image lightbox (click any [data-lightbox] img) */
export const ImageLightbox = () => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const img = t.closest("[data-lightbox] img, .article-prose img") as HTMLImageElement | null;
      if (img?.src) { e.preventDefault(); setSrc(img.src); }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[110] grid place-items-center p-4 backdrop-blur-md cursor-zoom-out"
      style={{ background: "hsl(var(--royal-blue-dark)/0.92)" }} onClick={() => setSrc(null)}>
      <img src={src} className="max-w-[95vw] max-h-[92vh] rounded-md shadow-royal" alt="" />
      <button aria-label="إغلاق" className="absolute top-4 left-4 w-10 h-10 grid place-items-center rounded-full"
        style={{ background: "hsl(var(--card))", color: "hsl(var(--primary))" }}><X size={18} /></button>
    </div>
  );
};

/* 20. Zoom-on-hover wrapper */
export const ZoomOnHover: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`overflow-hidden ${className}`}>
    <div className="transition-transform duration-700 ease-out group-hover:scale-110 hover:scale-110">{children}</div>
  </div>
);

/* 21. WhatsApp / Telegram quick-share */
export const QuickShareWA = ({ text, url }: { text: string; url?: string }) => (
  <a target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url || window.location.href}`)}`}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white"
    style={{ background: "#25D366" }}><Send size={12} /> واتساب</a>
);
export const QuickShareTG = ({ text, url }: { text: string; url?: string }) => (
  <a target="_blank" rel="noopener" href={`https://t.me/share/url?url=${encodeURIComponent(url || window.location.href)}&text=${encodeURIComponent(text)}`}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white"
    style={{ background: "#229ED9" }}><Send size={12} /> تيليجرام</a>
);

/* 22. Avatar stack */
export const AvatarStack = ({ count, label = "قارئ" }: { count: number; label?: string }) => {
  const n = Math.min(4, count);
  const palette = ["hsl(var(--accent))", "hsl(var(--gold))", "hsl(var(--primary))", "hsl(var(--royal-blue-light))"];
  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex -space-x-2 rtl:space-x-reverse">
        {Array.from({ length: n }).map((_, i) => (
          <span key={i} className="w-6 h-6 rounded-full border-2 border-background grid place-items-center text-[10px] font-bold text-white"
            style={{ background: palette[i % palette.length] }}>{String.fromCharCode(0x644 + i)}</span>
        ))}
      </div>
      <span className="text-[11px] font-semibold tabular text-muted-foreground">{count.toLocaleString("ar-EG")} {label}</span>
    </div>
  );
};

/* 23. Like counter (anonymous, localStorage) */
export const LikeCounter = ({ articleId, base = 0 }: { articleId: string; base?: number }) => {
  const key = `sb-like-${articleId}`;
  const [liked, setLiked] = useState(() => !!localStorage.getItem(key));
  const [count, setCount] = useState(base + (liked ? 1 : 0));
  return (
    <button onClick={() => {
      const n = !liked;
      setLiked(n); setCount((c) => c + (n ? 1 : -1));
      if (n) localStorage.setItem(key, "1"); else localStorage.removeItem(key);
    }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition"
      style={{ borderColor: liked ? "hsl(var(--accent))" : "hsl(var(--border))", color: liked ? "hsl(var(--accent))" : "hsl(var(--foreground))" }}>
      <Heart size={12} fill={liked ? "currentColor" : "none"} /> <span className="tabular">{count}</span>
    </button>
  );
};

/* 24. Comment count badge (display only) */
export const CommentBadge = ({ count }: { count: number }) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground tabular">
    <MessageSquare size={11} /> {count}
  </span>
);

/* 25. Notification bell — toggles push permission */
export const NotificationBell = () => {
  const [state, setState] = useState<NotificationPermission>(typeof Notification !== "undefined" ? Notification.permission : "default");
  const ask = async () => {
    if (typeof Notification === "undefined") return toast.error("غير مدعوم");
    const r = await Notification.requestPermission();
    setState(r);
    if (r === "granted") toast.success("تم تفعيل التنبيهات");
  };
  const Icon = state === "granted" ? Bell : BellOff;
  return (
    <button onClick={ask} aria-label="تنبيهات" className="w-9 h-9 grid place-items-center rounded-full border transition hover:bg-[hsl(var(--gold)/0.12)]"
      style={{ borderColor: "hsl(var(--gold)/0.5)", color: state === "granted" ? "hsl(var(--gold-dark))" : "hsl(var(--muted-foreground))" }}>
      <Icon size={14} />
    </button>
  );
};

/* 26. Mini-map navigator (jumps to top sections) */
export const MiniMapNav = ({ sections = [] as { id: string; label: string }[] }) => {
  if (sections.length === 0) return null;
  return (
    <nav className="hidden lg:flex flex-col gap-2 fixed top-1/3 right-3 z-40">
      {sections.map((s) => (
        <a key={s.id} href={`#${s.id}`} title={s.label} aria-label={s.label}
          className="w-2.5 h-2.5 rounded-full transition hover:scale-150"
          style={{ background: "hsl(var(--gold))", boxShadow: "0 0 0 2px hsl(var(--background))" }} />
      ))}
    </nav>
  );
};

/* 27. Reading streak (days in a row visited) */
export const ReadingStreak = () => {
  const [days, setDays] = useState(0);
  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("sb-streak-last");
    const cur = parseInt(localStorage.getItem("sb-streak-days") || "0", 10);
    if (last === today) { setDays(cur); return; }
    const yest = new Date(Date.now() - 86_400_000).toDateString();
    const next = last === yest ? cur + 1 : 1;
    localStorage.setItem("sb-streak-last", today);
    localStorage.setItem("sb-streak-days", String(next));
    setDays(next);
  }, []);
  if (days < 2) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold"
      style={{ background: "hsl(var(--gold)/0.15)", color: "hsl(var(--gold-dark))", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
      🔥 سلسلة قراءة {days} يوم
    </span>
  );
};

/* 28. Bookmark folder count (uses existing bookmarks lib key if present) */
export const BookmarkChip = () => {
  const [n, setN] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bookmarks") || localStorage.getItem("sb-bookmarks") || "[]";
      const arr = JSON.parse(raw);
      setN(Array.isArray(arr) ? arr.length : 0);
    } catch {}
  }, []);
  return (
    <a href="/?bookmarks=1" aria-label="المحفوظات"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-bold"
      style={{ borderColor: "hsl(var(--gold)/0.5)" }}>
      <Bookmark size={12} /> <span className="tabular">{n}</span>
    </a>
  );
};

/* 29. Search history dropdown (writes via window event "sb-search") */
export const SearchHistory = () => {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem("sb-search-history") || "[]")); } catch {}
    const h = (e: Event) => {
      const q = (e as CustomEvent<string>).detail?.trim();
      if (!q) return;
      const cur: string[] = JSON.parse(localStorage.getItem("sb-search-history") || "[]");
      const next = [q, ...cur.filter((x) => x !== q)].slice(0, 8);
      localStorage.setItem("sb-search-history", JSON.stringify(next));
      setItems(next);
    };
    window.addEventListener("sb-search", h as any);
    return () => window.removeEventListener("sb-search", h as any);
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="card-editorial p-4">
      <h4 className="kicker mb-2"><Clock size={11} className="inline" /> آخر عمليات البحث</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((q) => (
          <a key={q} href={`/?q=${encodeURIComponent(q)}`} className="px-2.5 py-1 rounded-full border text-xs hover:bg-[hsl(var(--gold)/0.1)]"
            style={{ borderColor: "hsl(var(--border))", fontFamily: "'Tajawal',sans-serif" }}>{q}</a>
        ))}
      </div>
    </div>
  );
};

/* 30. Tooltip primitive (CSS-only via title-style overlay) */
export const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <span className="relative group inline-flex">
    {children}
    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition"
      style={{ background: "hsl(var(--primary))", color: "hsl(var(--gold))", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>{label}</span>
  </span>
);
