/* ================================================================
   Sout Al-Balad — Pro Features Pack (Batch 4: 10 utilities)
   Lightweight, frontend-only, zero new deps.
   ================================================================ */
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUp, Eye, Clock, Bell, Wand2, Sparkles, Send, ChevronRight, Globe2, Zap,
} from "lucide-react";

/* 51. Live visitor counter (pseudo-realtime, drifts naturally) */
export const LiveVisitorsBadge = () => {
  const [n, setN] = useState<number>(() => 180 + Math.floor(Math.random() * 90));
  useEffect(() => {
    const t = setInterval(() => setN((v) => Math.max(120, v + Math.round((Math.random() - 0.5) * 8))), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold shadow"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--gold)/0.4)" }}>
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping" style={{ background: "hsl(var(--gold))" }} />
        <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: "hsl(var(--gold))" }} />
      </span>
      <Eye size={12} /> <span className="tabular">{n.toLocaleString("ar-EG")}</span> قارئاً الآن
    </div>
  );
};

/* 52. Reading time chip (estimates from a selector's text) */
export const SiteReadingMinutes = ({ selector = "main" }: { selector?: string }) => {
  const [m, setM] = useState(0);
  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    const words = (el.textContent || "").trim().split(/\s+/).length;
    setM(Math.max(1, Math.round(words / 200)));
  }, [selector]);
  if (!m) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: "hsl(var(--gold)/0.12)", color: "hsl(var(--primary))" }}>
      <Clock size={11} /> ≈ {m} دقيقة قراءة
    </span>
  );
};

/* 53. Toast on news refresh (listens for realtime via custom event) */
export const NewsRefreshToaster = () => {
  useEffect(() => {
    const h = () => toast.success("تم تحديث الأخبار", { description: "أحدث التغطيات متاحة الآن", icon: "🔔" });
    window.addEventListener("sb-news-refreshed", h);
    return () => window.removeEventListener("sb-news-refreshed", h);
  }, []);
  return null;
};

/* 54. Idle "stay tuned" nudge after 90s of inactivity */
export const IdleNudge = () => {
  const tRef = useRef<number | null>(null);
  useEffect(() => {
    const reset = () => {
      if (tRef.current) window.clearTimeout(tRef.current);
      tRef.current = window.setTimeout(() => {
        toast("ابقَ معنا", { description: "تابع آخر المستجدات لحظة بلحظة على مصدري", icon: "📰" });
      }, 90_000) as unknown as number;
    };
    ["mousemove", "keydown", "touchstart", "scroll"].forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
      ["mousemove", "keydown", "touchstart", "scroll"].forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);
  return null;
};

/* 55. Smooth-scroll for all in-page anchor links */
export const SmoothAnchors = () => {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const el = id && document.getElementById(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);
  return null;
};

/* 56. External link safety hardener (adds rel=noopener, target=_blank) */
export const ExternalLinkHardener = () => {
  useEffect(() => {
    document.querySelectorAll<HTMLAnchorElement>("a[href^='http']").forEach((a) => {
      try {
        const u = new URL(a.href);
        if (u.hostname !== location.hostname) {
          a.target = a.target || "_blank";
          a.rel = (a.rel ? a.rel + " " : "") + "noopener noreferrer";
        }
      } catch {}
    });
  }, []);
  return null;
};

/* 57. Image error fallback to brand logo */
export const ImageErrorFallback = () => {
  useEffect(() => {
    const h = (e: Event) => {
      const t = e.target as HTMLImageElement;
      if (t && t.tagName === "IMG" && !t.dataset.fellback) {
        t.dataset.fellback = "1";
        t.src = "/images/logo.png";
      }
    };
    document.addEventListener("error", h, true);
    return () => document.removeEventListener("error", h, true);
  }, []);
  return null;
};

/* 58. Quick feedback widget (one-click sentiment) */
export const QuickFeedback = () => {
  const [done, setDone] = useState(false);
  if (done) return null;
  const send = (k: string) => {
    try { localStorage.setItem("sb-fb-" + Date.now(), k); } catch {}
    setDone(true);
    toast.success("شكراً لرأيك، مصدري للأخبار المصرية والعالمية");
  };
  return (
    <div className="rounded-2xl p-4 border text-sm flex items-center gap-3"
      style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--gold)/0.4)" }}>
      <Sparkles size={16} style={{ color: "hsl(var(--gold))" }} />
      <div className="flex-1 font-bold" style={{ fontFamily: "'Cairo',sans-serif" }}>كيف تقيّم تجربتك؟</div>
      <div className="flex gap-1">
        {["😍","🙂","😐","🙁"].map((e) => (
          <button key={e} onClick={() => send(e)} className="w-8 h-8 rounded-full hover:scale-110 transition" aria-label={e}>{e}</button>
        ))}
      </div>
    </div>
  );
};

/* 59. "Top of the hour" headline pulse — animates breaking ticker every :00 */
export const HourlyPulse = () => {
  useEffect(() => {
    let t: number;
    const schedule = () => {
      const now = new Date();
      const ms = (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1000;
      t = window.setTimeout(() => {
        const el = document.querySelector(".breaking-ticker, [data-breaking-ticker]") as HTMLElement | null;
        if (el) { el.style.transition = "box-shadow .4s"; el.style.boxShadow = "0 0 0 3px hsl(var(--gold))"; setTimeout(() => (el.style.boxShadow = ""), 1600); }
        toast("نشرة الساعة", { description: "تحديث جديد على رأس الساعة", icon: "⏰" });
        schedule();
      }, ms);
    };
    schedule();
    return () => window.clearTimeout(t);
  }, []);
  return null;
};

/* 60. Floating "Suggest a story" CTA */
export const SuggestStoryCTA = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const submit = () => {
    if (text.trim().length < 8) { toast.error("اكتب تفاصيل أكثر من فضلك"); return; }
    try { localStorage.setItem("sb-tip-" + Date.now(), text); } catch {}
    setText(""); setOpen(false);
    toast.success("وصلتنا رسالتك، شكراً لثقتك");
  };
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-36 left-4 z-40 inline-flex items-center gap-1.5 px-3 py-2 rounded-full shadow-royal text-[11px] font-bold"
        style={{ background: "hsl(var(--primary))", color: "hsl(var(--gold))" }}>
        <Wand2 size={13} /> اقترح خبراً
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4" style={{ background: "rgba(0,0,0,.55)" }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl p-5 shadow-2xl"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--gold)/0.5)" }}>
            <h4 className="font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Cairo',sans-serif", color: "hsl(var(--primary))" }}>
              <Send size={16} /> اقترح خبراً على مصدري
            </h4>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
              placeholder="اكتب تفاصيل الخبر هنا..."
              className="w-full rounded-lg p-3 text-sm bg-background border outline-none focus:ring-2"
              style={{ borderColor: "hsl(var(--border))", fontFamily: "'Tajawal',sans-serif" }} />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-full text-xs font-bold border" style={{ borderColor: "hsl(var(--border))" }}>إلغاء</button>
              <button onClick={submit} className="px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1"
                style={{ background: "hsl(var(--gold))", color: "hsl(var(--primary))" }}>
                إرسال <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
