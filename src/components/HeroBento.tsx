import { motion } from "framer-motion";
import WatermarkedImage from "@/components/WatermarkedImage";
import { Play, Crown, Radio } from "lucide-react";

interface Article {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  is_breaking: boolean;
  created_at: string;
  categories: { name: string } | null;
}

interface Props {
  featured: Article;
  secondary?: Article;
  tertiary?: Article;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("ar-EG-u-nu-arab", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });

const tileBase =
  "relative overflow-hidden rounded-3xl shadow-2xl group transition-all duration-500 will-change-transform";

const HeroBento = ({ featured, secondary, tertiary }: Props) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-5 md:h-[720px] mb-12"
      aria-label="أبرز الأخبار"
    >
      {/* Primary Featured */}
      <a
        href={`/article/${featured.id}`}
        className={`${tileBase} md:col-span-2 md:row-span-2 bg-[hsl(var(--primary))] border-b-[6px] border-[hsl(var(--gold))] hover:shadow-[0_30px_80px_-20px_hsl(var(--gold)/0.45)]`}
      >
        <WatermarkedImage
          src={featured.image_url || "/images/logo.png"}
          alt={featured.title}
          eager
          imgClassName={`absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-[1200ms] group-hover:scale-110 ${
            featured.image_url ? "" : "p-16 object-contain opacity-40"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--primary))] via-[hsl(var(--primary)/0.45)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[hsl(var(--primary)/0.5)]" />

        <div className="absolute top-6 right-6 z-10 flex items-center gap-2 bg-[hsl(var(--gold))] text-[hsl(var(--primary))] px-4 py-1.5 rounded-full text-xs font-black shadow-lg tracking-wider"
          style={{ fontFamily: "'Cairo', sans-serif" }}>
          <Crown className="w-3.5 h-3.5" />
          {featured.is_breaking ? "عاجل" : "تغطية حصرية"}
        </div>

        <div className="absolute bottom-0 right-0 left-0 p-7 md:p-10 z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-10 bg-[hsl(var(--gold))]" />
            <span
              style={{ fontFamily: "'Cairo', sans-serif" }}
              className="text-[hsl(var(--gold-light))] font-black uppercase tracking-[0.25em] text-xs"
            >
              {featured.categories?.name || "صوت البلد"}
            </span>
          </div>
          <h1
            style={{ fontFamily: "'Cairo', sans-serif" }}
            className="text-white text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-4 drop-shadow-lg"
          >
            {featured.title}
          </h1>
          {featured.summary && (
            <p
              style={{ fontFamily: "'Hind', 'Cairo', sans-serif" }}
              className="text-slate-200/90 text-base md:text-lg leading-relaxed max-w-2xl line-clamp-2"
            >
              {featured.summary}
            </p>
          )}
          <div className="mt-5 text-xs text-[hsl(var(--gold-light))] font-bold tabular tracking-wider">
            {formatTime(featured.created_at)}
          </div>
        </div>
      </a>

      {/* Secondary horizontal */}
      {secondary && (
        <a
          href={`/article/${secondary.id}`}
          className={`${tileBase} md:col-span-2 md:row-span-1 bg-card border border-[hsl(var(--gold)/0.25)] flex hover:border-[hsl(var(--gold))]`}
        >
          <div className="w-1/2 p-6 md:p-7 flex flex-col justify-center">
            <div
              className="inline-block w-fit px-3 py-1 bg-[hsl(var(--primary))] text-[hsl(var(--gold))] text-[10px] font-black rounded mb-3 tracking-widest"
              style={{ fontFamily: "'Archivo Black', 'Cairo', sans-serif" }}
            >
              {secondary.categories?.name?.toUpperCase() || "أخبار"}
            </div>
            <h2
              style={{ fontFamily: "'Cairo', sans-serif" }}
              className="text-lg md:text-2xl font-bold text-[hsl(var(--primary))] dark:text-[hsl(var(--gold))] leading-snug group-hover:text-[hsl(var(--gold))] transition-colors line-clamp-3"
            >
              {secondary.title}
            </h2>
            {secondary.summary && (
              <p
                style={{ fontFamily: "'Hind', 'Cairo', sans-serif" }}
                className="mt-2 text-muted-foreground text-sm line-clamp-2"
              >
                {secondary.summary}
              </p>
            )}
            <span className="mt-3 text-[10px] tabular text-muted-foreground">
              {formatTime(secondary.created_at)}
            </span>
          </div>
          <div className="w-1/2 relative overflow-hidden bg-[hsl(var(--primary))]">
            <WatermarkedImage
              src={secondary.image_url || "/images/logo.png"}
              alt={secondary.title}
              imgClassName={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                secondary.image_url ? "" : "p-8 object-contain opacity-60"
              }`}
            />
          </div>
        </a>
      )}

      {/* Tertiary square (gold accent) */}
      {tertiary && (
        <a
          href={`/article/${tertiary.id}`}
          className={`${tileBase} md:col-span-1 md:row-span-1 flex flex-col justify-end p-6`}
          style={{ background: "var(--gradient-gold)" }}
        >
          <div className="absolute top-4 left-4 opacity-20">
            <Crown className="w-20 h-20 text-[hsl(var(--primary))]" />
          </div>
          <div className="relative z-10">
            <span
              className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))]/80"
              style={{ fontFamily: "'Archivo Black', 'Cairo', sans-serif" }}
            >
              {tertiary.categories?.name || "ملف خاص"}
            </span>
            <h3
              style={{ fontFamily: "'Cairo', sans-serif" }}
              className="text-[hsl(var(--primary))] text-lg md:text-xl font-black mt-1 mb-1 leading-snug line-clamp-3"
            >
              {tertiary.title}
            </h3>
            <span className="text-[10px] tabular text-[hsl(var(--primary))]/70 font-bold">
              {formatTime(tertiary.created_at)}
            </span>
          </div>
        </a>
      )}

      {/* Live broadcast tile */}
      <a
        href="/category/فيديو"
        className={`${tileBase} md:col-span-1 md:row-span-1 bg-[hsl(var(--primary))] border border-[hsl(var(--gold)/0.3)] hover:border-[hsl(var(--gold))]`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--gold)/0.15),transparent_70%)]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-[hsl(var(--gold))] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform bg-[hsl(var(--primary))]/60 shadow-[0_0_30px_hsl(var(--gold)/0.4)]">
            <Play className="w-6 h-6 text-[hsl(var(--gold))] fill-[hsl(var(--gold))] mr-0.5" />
          </div>
          <span
            style={{ fontFamily: "'Cairo', sans-serif" }}
            className="text-white font-black text-lg"
          >
            البث المباشر
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <Radio className="w-3 h-3 text-[hsl(var(--gold-light))]" />
            <span
              className="text-[10px] text-white/80 font-bold tracking-wider"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              مباشر الآن
            </span>
          </div>
        </div>
      </a>
    </motion.section>
  );
};

export default HeroBento;
