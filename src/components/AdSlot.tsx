import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";


interface AdSlotProps {
  slot: string;
  className?: string;
}

interface AdData {
  image_url: string | null;
  target_url: string | null;
  ad_type: string;
  video_url: string | null;
}

const AdSlot = ({ slot, className = "" }: AdSlotProps) => {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        const now = new Date().toISOString();
        
        // استخدام as any لتخطي مشاكل الـ Types تماماً أثناء جلب البيانات
        const { data, error } = await (supabase.from("ads") as any)
          .select("image_url, target_url, ad_type, video_url")
          .eq("slot", slot)
          .eq("is_active", true)
          .or(`start_date.is.null,start_date.lte.${now}`)
          .or(`end_date.is.null,end_date.gte.${now}`)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("خطأ في جلب بيانات الإعلان:", error);
        }

        if (data) {
          setAd(data as AdData);
        } else {
          setAd(null);
        }
      } catch (err) {
        console.error("حدث خطأ غير متوقع:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [slot]);

  if (loading) {
    return (
      <div className={`w-full bg-muted/20 animate-pulse border-2 border-dashed border-border flex items-center justify-center rounded-xl ${
        slot === "header" ? "h-20 md:h-24" : slot === "sidebar" ? "h-72 md:h-96" : "h-40 md:h-56"
      } ${className}`}>
        <span className="text-xs text-muted-foreground font-bold font-sans">مصدري — جارٍ التحميل...</span>
      </div>
    );
  }

  let content;

  // Slot-specific container heights — generous so large ads display fully
  const slotHeight =
    slot === "header"
      ? "min-h-[120px] md:min-h-[180px] max-h-[280px]"
      : slot === "sidebar"
      ? "min-h-[280px] md:min-h-[360px] max-h-[500px]"
      : "min-h-[180px] md:min-h-[260px] max-h-[420px]";

  // الحالات الذكية لمعالجة الإضافة الفورية:
  if (ad?.ad_type === "video" && ad.video_url) {
    content = (
      <a href={ad.target_url || "#"} target="_blank" rel="noopener noreferrer" className="block w-full h-full group relative overflow-hidden rounded-xl bg-black">
        <video 
          src={ad.video_url} 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
          onError={(e) => {
            console.error("خطأ في تشغيل فيديو الإعلان:", ad.video_url);
            (e.target as any).style.display = "none";
          }}
        />
        <span className="absolute bottom-2 right-2 bg-black/60 text-[9px] text-white font-sans px-1.5 py-0.5 rounded backdrop-blur-sm">
          إعلان مرئي
        </span>
      </a>
    );
  } else if (ad?.image_url) {
    content = (
      <a
        href={ad.target_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full group overflow-hidden rounded-xl relative"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--royal-blue-dark, var(--primary))) 0%, hsl(var(--primary) / 0.85) 100%)",
          border: "1px solid hsl(var(--gold) / 0.4)",
          boxShadow: "0 12px 40px -10px hsl(var(--primary) / 0.5), inset 0 0 0 1px hsl(var(--gold) / 0.2)",
        }}
      >
        <img
          src={ad.image_url}
          alt="إعلان — مصدري"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          onError={(e) => {
            console.error("خطأ في تحميل صورة الإعلان:", ad.image_url);
            (e.target as any).src = "https://placehold.co/1200x400/0a1733/d4af37?text=صوت+البلد";
          }}
        />
        <span className="absolute top-2 left-2 z-10 text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest"
          style={{
            background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light, var(--gold))))",
            color: "hsl(var(--primary))",
            boxShadow: "0 4px 14px hsl(var(--gold)/0.45)",
          }}>
          إعلان
        </span>
      </a>
    );
  } else {
    content = (
      <a
        href=""
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex flex-col items-center justify-center h-full w-full overflow-hidden rounded-xl"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, hsl(var(--royal-blue, var(--primary))) 0%, hsl(var(--royal-blue-dark, var(--primary))) 45%, #050814 100%)",
          border: "1.5px solid hsl(var(--gold)/0.55)",
          boxShadow:
            "inset 0 1px 0 hsl(var(--gold)/0.5), inset 0 -40px 80px hsl(var(--royal-blue-dark, var(--primary))/0.9), 0 22px 60px -20px hsl(var(--gold)/0.55), 0 0 0 1px hsl(var(--gold)/0.25)",
          transform: "perspective(1100px) rotateX(2deg)",
        }}
      >
        <span aria-hidden className="pointer-events-none absolute -inset-1 opacity-60"
          style={{
            background:
              "conic-gradient(from 140deg at 50% 50%, transparent 0deg, hsl(var(--gold)/0.35) 60deg, transparent 140deg, hsl(var(--gold)/0.25) 240deg, transparent 360deg)",
            filter: "blur(28px)",
          }} />
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }} />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 -inset-x-1/2 opacity-80 mix-blend-screen ad-shimmer"
          style={{
            background:
              "linear-gradient(115deg, transparent 35%, hsl(var(--gold)/0.55) 50%, transparent 65%)",
          }} />
        <span className="absolute top-2 right-2 z-10 text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest"
          style={{
            background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light, var(--gold))))",
            color: "hsl(var(--royal-blue-dark, var(--primary)))",
            boxShadow: "0 4px 14px hsl(var(--gold)/0.55)",
          }}>
          إعلان مميز
        </span>
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-3 transition-transform duration-500 group-hover:scale-[1.03]">
          <span className="text-3xl md:text-5xl font-black tracking-tight leading-none"
            style={{
              background: "linear-gradient(135deg, hsl(var(--gold-light, var(--gold))), hsl(var(--gold)) 50%, hsl(var(--gold-light, var(--gold))))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 4px 14px hsl(var(--gold)/0.45))",
            }}>
            مصدري
          </span>
          <p className="mt-2 text-[11px] md:text-sm font-bold tracking-wide" style={{ color: "hsl(var(--gold-light, var(--gold)))" }}>
            برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم
          </p>
          <p className="text-[9px] md:text-[11px] mt-1 font-bold tracking-wide text-white/75">
            تطوير وتصميم التقني/ خالد عاطف عبدالحكيم عويس
          </p>
          
        </div>
      </a>
    );
  }

  return (
    <div className={`ad-placeholder w-full overflow-hidden transition-all duration-300 ${slotHeight} ${className}`}>
      {content}
    </div>
  );
};

export default AdSlot;
