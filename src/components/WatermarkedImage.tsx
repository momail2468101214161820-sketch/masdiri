import { useEffect, useState } from "react";
import { getArticleImageFallbacks, normalizeArticleImageUrl } from "@/lib/articleImages";

interface WatermarkedImageProps {
  src: string;
  alt?: string;
  /** Optional headline overlaid on the image. Falls back to `alt` when omitted. */
  title?: string;
  /** Hide the headline overlay (e.g. when the card already prints a large title beside the image). */
  hideTitle?: boolean;
  className?: string;
  imgClassName?: string;
  height?: string;
  eager?: boolean;
  rounded?: boolean;
}

/**
 * Official "مصدري" image frame:
 *  - Logo + brand pill top-center
 *  - Headline overlay bottom (RTL, gold underline)
 *  - Founder credit ribbon at the very bottom
 */
const WatermarkedImage = ({
  src,
  alt = "",
  title,
  hideTitle = false,
  className = "",
  imgClassName,
  height,
  eager = false,
}: WatermarkedImageProps) => {
  const sources = [normalizeArticleImageUrl(src), ...getArticleImageFallbacks(src), "/images/logo.png"].filter(Boolean) as string[];
  const [sourceIndex, setSourceIndex] = useState(0);
  const activeSrc = sources[sourceIndex] || normalizeArticleImageUrl(src) || src;
  const wrapperCls = height ? `relative w-full ${height} overflow-hidden ${className}` : `relative w-full h-full overflow-hidden ${className}`;
  const finalImgCls = imgClassName || "absolute inset-0 w-full h-full object-cover";
  const headline = (title ?? alt ?? "").trim();
  const showHeadline = !hideTitle && headline.length > 0;

  useEffect(() => {
    setSourceIndex(0);
  }, [src]);

  const handleImageError = () => {
    setSourceIndex((current) => (current < sources.length - 1 ? current + 1 : current));
  };

  return (
    <div className={wrapperCls}>
      <img
        src={activeSrc}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleImageError}
        className={finalImgCls}
      />

      {/* Top darken for logo legibility */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/65 via-black/25 to-transparent pointer-events-none" />

      {/* Logo pill — top center, premium gold ring */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full pointer-events-none"
        style={{
          background: "linear-gradient(135deg, hsl(222 60% 8% / 0.92), hsl(218 55% 14% / 0.92))",
          border: "1.5px solid hsl(var(--gold) / 0.7)",
          boxShadow: "0 4px 14px hsl(0 0% 0% / 0.45), inset 0 0 0 1px hsl(var(--gold) / 0.2), 0 0 18px -4px hsl(var(--gold) / 0.55)",
          backdropFilter: "blur(8px)",
        }}
      >
        <img src="/images/logo.png" alt="مصدري" className="h-5 w-5 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
        <span
          className="text-[11px] font-black tracking-wider"
          style={{ fontFamily: "'Amiri','Cairo',serif", color: "hsl(var(--gold-light))", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
        >
          مصدري
        </span>
      </div>

      {/* Bottom block: headline + founder credit */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-12 pb-2 px-4 pointer-events-none">
        {showHeadline && (
          <h3
            dir="rtl"
            className="text-white text-[14px] sm:text-[16px] md:text-[18px] leading-snug font-black mb-2 line-clamp-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
            style={{ fontFamily: "'Amiri','Cairo',serif" }}
          >
            <span className="inline border-b-[3px] border-[hsl(var(--gold))] pb-1">{headline}</span>
          </h3>
        )}
        <div className="flex items-center justify-center gap-2" dir="rtl">
          <span className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-[hsl(var(--gold)/0.7)] to-transparent" />
          <p
            className="text-center text-[10px] sm:text-[11px] leading-tight font-bold tracking-wide"
            style={{ fontFamily: "'Cairo', sans-serif", color: "hsl(var(--gold-light))", textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
          >
            البشمبرمج | خالد عاطف عبدالحكيم
          </p>
          <span className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-[hsl(var(--gold)/0.7)] to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default WatermarkedImage;
