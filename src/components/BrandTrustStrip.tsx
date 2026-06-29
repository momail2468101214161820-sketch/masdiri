import { Crown, ShieldCheck, Radio, Users, Sparkles } from "lucide-react";
import OfficialContactButtons from "./OfficialContactButtons";

/**
 * BrandTrustStrip
 * شريط ثقة احترافي يظهر بين الـ Hero وبقية الأخبار
 * يبرز مكانة "مصدري" + قنوات التواصل الرسمية + دعوة للمتابعة
 */
const BrandTrustStrip = () => {
  const stats = [
    { icon: <Users size={18} />, value: "+250K", label: "متابع شهرياً" },
    { icon: <Radio size={18} />, value: "24/7", label: "تغطية مباشرة" },
    { icon: <ShieldCheck size={18} />, value: "100%", label: "مصادر موثقة" },
    { icon: <Sparkles size={18} />, value: "AI", label: "ذكاء رسمي" },
  ];

  return (
    <section
      dir="rtl"
      className="relative my-10 overflow-hidden rounded-3xl border-2 border-[hsl(var(--gold)/0.45)] shadow-[0_20px_60px_-25px_hsl(var(--royal-blue-dark)/0.6)]"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--royal-blue-dark)) 0%, hsl(var(--royal-blue)) 55%, hsl(var(--royal-blue-dark)) 100%)",
      }}
      aria-label="مصدري الرسمي"
    >
      {/* Gold halo */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[hsl(var(--gold)/0.18)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[hsl(var(--gold)/0.12)] blur-3xl" />
      {/* Gold top hairline */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[hsl(var(--gold))] to-transparent" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-10">
        {/* Identity */}
        <div className="lg:col-span-5 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--gold)/0.15)] border border-[hsl(var(--gold)/0.5)] mb-4">
            <Crown size={14} className="text-[hsl(var(--gold))]" />
            <span className="text-[11px] font-black tracking-[0.18em] text-[hsl(var(--gold))]" style={{ fontFamily: "'Cairo', sans-serif" }}>
              المؤسسة الإعلامية الرسمية
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ fontFamily: "'Amiri', serif" }}>
            <span className="text-white">مصدري</span>
            <span className="text-[hsl(var(--gold))] mx-2">—</span>
            <span className="text-white/95">صوت البلد بثقة وموضوعية</span>
          </h2>
          <p className="mt-3 text-white/85 text-sm md:text-[15px] leading-relaxed max-w-xl" style={{ fontFamily: "'Cairo', sans-serif" }}>
            مصدري تنقل الحدث المصري والعالمي لحظة بلحظة، بأسلوب صحفي مهني وإعداد دقيق.
            تابعنا على قنواتنا الرسمية لتصلك آخر المستجدات قبل الجميع.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/15 px-3 py-3 text-center hover:border-[hsl(var(--gold)/0.6)] hover:bg-white/10 transition-all"
              >
                <div className="text-[hsl(var(--gold))] flex justify-center mb-1">{s.icon}</div>
                <div className="text-lg font-black text-white tabular-nums" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  {s.value}
                </div>
                <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider mt-0.5" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official channels */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-white/95 dark:bg-card border-2 border-[hsl(var(--gold)/0.5)] p-5 md:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-dashed border-[hsl(var(--gold)/0.4)]">
              <h3 className="text-lg md:text-xl font-black text-[hsl(var(--royal-blue-dark))] dark:text-[hsl(var(--gold))]" style={{ fontFamily: "'Amiri', serif" }}>
                قنواتنا الرسمية
              </h3>
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-[hsl(var(--gold-dark))] dark:text-[hsl(var(--gold))]" style={{ fontFamily: "'Cairo', sans-serif" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                مُفعّل ومُوثّق
              </span>
            </div>
            <OfficialContactButtons variant="full" />
            <p className="mt-4 text-[11px] text-muted-foreground text-center font-bold" style={{ fontFamily: "'Cairo', sans-serif" }}>
              للإعلان أو الإبلاغ عن خبر · تواصل مباشر مع غرفة الأخبار
            </p>
          </div>
        </div>
      </div>

      {/* Gold bottom hairline */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-[hsl(var(--gold))] to-transparent" />
    </section>
  );
};

export default BrandTrustStrip;
