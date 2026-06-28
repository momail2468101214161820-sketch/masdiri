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
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />

      {/* Logo pill — top center */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[hsl(var(--gold)/0.55)] shadow-lg pointer-events-none">
        <img src="/images/logo.png" alt="مصدري" className="h-5 w-5 object-contain" />
        <span
          className="text-[10px] font-black text-white tracking-wide"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          مصدري
        </span>
      </div>

      {/* Bottom block: headline + founder credit */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/65 to-transparent pt-10 pb-1.5 px-3 pointer-events-none">
        {showHeadline && (
          <h3
            dir="rtl"
            className="text-white text-[13px] sm:text-[15px] md:text-[17px] leading-snug font-black mb-1.5 line-clamp-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "'Amiri','Cairo',serif" }}
          >
            <span className="inline border-b-2 border-[hsl(var(--gold))] pb-0.5">{headline}</span>
          </h3>
        )}
        <p
          className="text-center text-[9px] sm:text-[10px] leading-tight font-bold text-[hsl(var(--gold-light))] drop-shadow"
          style={{ fontFamily: "'Cairo', sans-serif" }}
          dir="rtl"
        >
          البشمبرمج | خالد عاطف عبدالحكيم
        </p>
      </div>
    </div>
  );
};

export default WatermarkedImage;
