/* ================================================================
 Sout Al-Balad — Pro Features Pack (Batch 3: items 31-50)
 ================================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
 Search, ChevronUp, Globe, Languages, Wifi, Battery, Gauge, Calendar,
 TrendingUp, Star, Filter, Award, Coffee, Quote, Sparkles, Mail, Megaphone,
 Compass, Layers, Target,
} from "lucide-react";

/* 31. Inline search bar with recent history broadcast */
export const InlineSearchBar = => {
 const [q, setQ] = useState("");
 const submit = (e: React.FormEvent) => {
 e.preventDefault;
 if (!q.trim) return;
 window.dispatchEvent(new CustomEvent("sb-search", { detail: q.trim }));
 window.location.href = `/?q=${encodeURIComponent(q.trim)}`;
 };
 return (
 <form onSubmit={submit} className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
 style={{ borderColor: "hsl(var(--gold)/0.5)", background: "hsl(var(--card))" }}>
 <Search size={13} style={{ color: "hsl(var(--gold-dark))" }} />
 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث…"
 className="bg-transparent outline-none text-xs flex-1 min-w-0"
 style={{ fontFamily: "'Tajawal',sans-serif" }} />
 </form>
 );
};

/* 32. Scroll-to-section pill nav */
export const SectionPills = ({ items }: { items: { id: string; label: string } }) => (
 <div className="flex gap-2 overflow-x-auto py-2">
 {items.map((it) => (
 <a key={it.id} href={`#${it.id}`} className="shrink-0 px-3 py-1 rounded-full border text-[11px] font-bold hover:bg-[hsl(var(--gold)/0.1)]"
 style={{ borderColor: "hsl(var(--border))", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>{it.label}</a>
 ))}
 </div>
);

/* 33. Live "publishing" pulse (shows when realtime channel active) */
export const LivePulse = ({ label = "غرفة الأخبار حية" }: { label?: string }) => (
 <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest"
 style={{ color: "hsl(var(--accent))", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
 <span className="relative w-2 h-2">
 <span className="absolute inset-0 rounded-full bg-current opacity-60 animate-ping" />
 <span className="absolute inset-0 rounded-full bg-current" />
 </span>
 {label}
 </span>
);

/* 34. Battery saver mode (reduces motion + images quality hint) */
export const BatterySaverChip = => {
 const [low, setLow] = useState(false);
 useEffect( => {
 (navigator as any).getBattery?..then((b: any) => {
 const update = => setLow(b.level < 0.2 && !b.charging);
 b.addEventListener?.("levelchange", update);
 b.addEventListener?.("chargingchange", update);
 update;
 });
 }, );
 useEffect( => {
 document.documentElement.style.setProperty("--motion-scale", low ? "0" : "1");
 }, [low]);
 if (!low) return null;
 return (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
 style={{ background: "hsl(var(--accent)/0.15)", color: "hsl(var(--accent))" }}>
 <Battery size={11} /> وضع توفير الطاقة
 </span>
 );
};

/* 35. Network status chip (4g/3g/slow) */
export const NetworkChip = => {
 const [type, setType] = useState<string | null>(null);
 useEffect( => {
 const c = (navigator as any).connection;
 if (!c) return;
 const u = => setType(c.effectiveType);
 c.addEventListener?.("change", u); u;
 return => c.removeEventListener?.("change", u);
 }, );
 if (!type) return null;
 return (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground tabular">
 <Wifi size={11} /> {type.toUpperCase}
 </span>
 );
};

/* 36. Performance/page-speed badge (uses Navigation Timing) */
export const PerfBadge = => {
 const [ms, setMs] = useState<number | null>(null);
 useEffect( => {
 const t = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
 if (t) setMs(Math.round(t.domContentLoadedEventEnd));
 }, );
 if (!ms) return null;
 const grade = ms < 1500 ? { c: "hsl(120,60%,40%)", l: "A+" } : ms < 3000 ? { c: "hsl(var(--gold-dark))", l: "B" } : { c: "hsl(var(--accent))", l: "C" };
 return (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold tabular" style={{ color: grade.c }}>
 <Gauge size={11} /> {grade.l} · {ms}ms
 </span>
 );
};

/* 37. Country-aware welcome chip (uses Intl) */
export const CountryWelcome = => {
 const region = useMemo( => {
 try { return new Intl.Locale(navigator.language).maximize.region || "EG"; } catch { return "EG"; }
 }, );
 const flag = String.fromCodePoint(...[...region].map((c) => 127397 + c.charCodeAt(0)));
 return (
 <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ fontFamily: "'Tajawal',sans-serif" }}>
 <Globe size={11} /> أهلاً بزيارتك من {flag}
 </span>
 );
};

/* 38. Language switcher chip (ar / en placeholder) */
export const LangSwitcherChip = => {
 const [lang, setLang] = useState<"ar" | "en">("ar");
 return (
 <button onClick={ => { const n = lang === "ar" ? "en" : "ar"; setLang(n); document.documentElement.dir = n === "ar" ? "rtl" : "ltr"; toast.info(n === "ar" ? "العربية" : "English"); }}
 className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border"
 style={{ borderColor: "hsl(var(--gold)/0.5)" }}>
 <Languages size={11} /> {lang === "ar" ? "EN" : "ع"}
 </button>
 );
};

/* 39. Quote of the day (rotating) */
const QUOTES = [
 "الكلمة الصادقة أقوى من ألف صورة. — صوت البلد",
 "الخبر اليقين أمانة، لا سبق رخيص.",
 "مصدري للأخبار المصرية والعالمية، خبرك مكتمل.",
 "نكتب للناس، لا عن الناس.",
];
export const QuoteOfDay = => {
 const q = QUOTES[new Date.getDate % QUOTES.length];
 return (
 <div className="card-editorial p-4 flex gap-3 items-start"
 style={{ background: "linear-gradient(135deg,hsl(var(--gold)/0.08),transparent)" }}>
 <Quote size={18} style={{ color: "hsl(var(--gold-dark))" }} className="shrink-0" />
 <p className="text-sm leading-relaxed" style={{ fontFamily: "'Amiri',serif", color: "hsl(var(--primary))" }}>{q}</p>
 </div>
 );
};

/* 40. Star rating (anonymous) */
export const StarRating = ({ id, max = 5 }: { id: string; max?: number }) => {
 const key = `sb-rate-${id}`;
 const [v, setV] = useState<number>( => parseInt(localStorage.getItem(key) || "0", 10));
 return (
 <div className="inline-flex gap-0.5">
 {Array.from({ length: max }).map((_, i) => (
 <button key={i} aria-label={`${i + 1} نجوم`}
 onClick={ => { setV(i + 1); localStorage.setItem(key, String(i + 1)); toast.success("شكراً لتقييمك"); }}>
 <Star size={16} fill={i < v ? "hsl(var(--gold))" : "none"} stroke="hsl(var(--gold-dark))" />
 </button>
 ))}
 </div>
 );
};

/* 41. Filter chips */
export const FilterChips = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string } }) => (
 <div className="flex gap-2 flex-wrap">
 {options.map((o) => (
 <button key={o.v} onClick={ => onChange(o.v)}
 className="px-3 py-1 rounded-full text-[11px] font-bold border transition"
 style={{
 borderColor: value === o.v ? "hsl(var(--gold))" : "hsl(var(--border))",
 background: value === o.v ? "hsl(var(--gold)/0.15)" : "transparent",
 color: value === o.v ? "hsl(var(--gold-dark))" : "hsl(var(--foreground))",
 fontFamily: "'IBM Plex Sans Arabic',sans-serif",
 }}>{o.l}</button>
 ))}
 </div>
);

/* 42. Achievement banner (reading streaks, etc.) */
export const AchievementBanner = ({ title, subtitle }: { title: string; subtitle?: string }) => (
 <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl shadow-royal"
 style={{ background: "linear-gradient(135deg,hsl(var(--gold)),hsl(var(--gold-dark)))", color: "hsl(var(--primary))" }}>
 <Award size={18} />
 <div>
 <div className="font-extrabold text-sm" style={{ fontFamily: "'Amiri',serif" }}>{title}</div>
 {subtitle && <div className="text-[10px] opacity-80" style={{ fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>{subtitle}</div>}
 </div>
 </div>
);

/* 43. Coffee-break suggestion (after long session) */
export const CoffeeBreakNudge = => {
 const [show, setShow] = useState(false);
 useEffect( => {
 const start = Date.now;
 const t = setInterval( => { if (Date.now - start > 25 * 60_000) { setShow(true); clearInterval(t); } }, 60_000);
 return => clearInterval(t);
 }, );
 if (!show) return null;
 return (
 <div className="fixed bottom-20 left-4 z-50 max-w-xs p-3 rounded-xl shadow-royal border flex items-center gap-2 text-xs"
 style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--gold)/0.5)", fontFamily: "'Tajawal',sans-serif" }}>
 <Coffee size={16} style={{ color: "hsl(var(--gold-dark))" }} />
 <span className="flex-1">قرأت كتير النهاردة — خد قهوة وارجع ☕</span>
 <button onClick={ => setShow(false)} className="text-[10px] font-bold opacity-70">إغلاق</button>
 </div>
 );
};

/* 44. Inline newsletter strip (compact) */
export const NewsletterStripCompact = => (
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px]"
 style={{ borderColor: "hsl(var(--gold)/0.5)", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
 <Mail size={12} style={{ color: "hsl(var(--gold-dark))" }} />
 <span className="font-bold">نشرة صباحية مجانية</span>
 <a href="#newsletter" className="font-extrabold" style={{ color: "hsl(var(--gold-dark))" }}>اشترك ←</a>
 </div>
);

/* 45. Announcement marquee bar */
export const AnnouncementBar = ({ text }: { text: string }) => (
 <div className="overflow-hidden border-y py-1.5 flex items-center gap-3"
 style={{ background: "hsl(var(--gold)/0.08)", borderColor: "hsl(var(--gold)/0.4)" }}>
 <Megaphone size={13} className="mx-3 shrink-0" style={{ color: "hsl(var(--gold-dark))" }} />
 <div className="whitespace-nowrap animate-ticker text-xs font-bold" style={{ color: "hsl(var(--primary))", fontFamily: "'Tajawal',sans-serif" }}>
 {text}
 </div>
 </div>
);

/* 46. Geo chip — uses Intl + locale for editorial badge */
export const GeoChip = ({ governorate }: { governorate?: string | null }) => {
 if (!governorate) return null;
 return (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
 style={{ background: "hsl(var(--primary)/0.08)", color: "hsl(var(--primary))" }}>
 <Compass size={10} /> {governorate}
 </span>
 );
};

/* 47. Sticky CTA bar (mobile bottom) */
export const StickyCTA = ({ children }: { children: React.ReactNode }) => (
 <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 border-t backdrop-blur-md"
 style={{ background: "hsl(var(--card)/0.95)", borderColor: "hsl(var(--gold)/0.4)" }}>
 {children}
 </div>
);

/* 48. Layer/density toggle (compact vs comfortable card view) */
export const DensityToggle = => {
 const [dense, setDense] = useState( => localStorage.getItem("sb-density") === "dense");
 useEffect( => {
 document.documentElement.dataset.density = dense ? "dense" : "comfy";
 localStorage.setItem("sb-density", dense ? "dense" : "comfy");
 }, [dense]);
 return (
 <button onClick={ => setDense((v) => !v)} aria-label="كثافة العرض"
 className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border"
 style={{ borderColor: "hsl(var(--gold)/0.5)" }}>
 <Layers size={11} /> {dense ? "مريح" : "مكثّف"}
 </button>
 );
};

/* 49. Focus mode (dim everything except center column) */
export const FocusModeButton = => {
 const [on, setOn] = useState(false);
 useEffect( => {
 document.documentElement.classList.toggle("focus-mode", on);
 if (!document.getElementById("sb-focus-style")) {
 const s = document.createElement("style"); s.id = "sb-focus-style";
 s.textContent = `.focus-mode aside, .focus-mode header, .focus-mode footer, .focus-mode nav { filter: blur(2px) opacity(.4) !important; transition: .3s; }`;
 document.head.appendChild(s);
 }
 }, [on]);
 return (
 <button onClick={ => setOn((v) => !v)} aria-label="وضع التركيز"
 className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border"
 style={{ borderColor: on ? "hsl(var(--gold))" : "hsl(var(--border))" }}>
 <Target size={11} /> {on ? "إنهاء التركيز" : "وضع تركيز"}
 </button>
 );
};

/* 50. Confetti micro-burst (success celebrations) */
export const fireConfetti = => {
 const root = document.createElement("div");
 Object.assign(root.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "9999" });
 document.body.appendChild(root);
 const colors = ["hsl(45,90%,55%)", "hsl(220,65%,30%)", "hsl(0,75%,50%)", "hsl(38,70%,42%)"];
 for (let i = 0; i < 40; i++) {
 const p = document.createElement("span");
 Object.assign(p.style, {
 position: "absolute", left: "50%", top: "30%", width: "8px", height: "8px",
 background: colors[i % colors.length], borderRadius: "2px",
 transform: `translate(-50%,-50%) rotate(${Math.random * 360}deg)`,
 transition: "transform 1.2s ease-out, opacity 1.2s ease-out", opacity: "1",
 });
 root.appendChild(p);
 requestAnimationFrame( => {
 const x = (Math.random - 0.5) * 600, y = Math.random * 500 + 100;
 p.style.transform = `translate(${x}px,${y}px) rotate(${Math.random * 720}deg)`;
 p.style.opacity = "0";
 });
 }
 setTimeout( => root.remove, 1400);
};
