import { useEffect, useState } from "react";
import { getArticleImageFallbacks, normalizeArticleImageUrl } from "@/lib/articleImages";

interface WatermarkedImageProps {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  height?: string;
  eager?: boolean;
  rounded?: boolean;
}

/**
 * Wraps an article image with the official Sout Al-Balad watermark:
 * - Logo pinned to the top of the image
 * - Credit ribbon at the bottom
 */
const WatermarkedImage = ({
  src,
  alt = "",
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

      {/* Top dark gradient for logo legibility */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />

      {/* Logo — top center */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/35 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[hsl(var(--gold)/0.45)] shadow-md pointer-events-none">
        <img src="/images/logo.png" alt="صوت البلد" className="h-5 w-5 object-contain" />
        <span
          className="text-[10px] font-black text-white tracking-wide"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          صوت البلد
        </span>
      </div>

      {/* Credit ribbon — bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/55 to-transparent pt-4 pb-1 px-2 pointer-events-none">
        <p
          className="text-center text-[9px] sm:text-[10px] leading-tight font-bold text-[hsl(var(--gold))] drop-shadow"
          style={{ fontFamily: "'Cairo', sans-serif" }}
          dir="rtl"
        >
          برئاسة د/ محمد الحاجري
          <span className="mx-1 opacity-70">•</span>
          تطوير وتصميم التقني/ خالد عاطف عبدالحكيم عويس
        </p>
      </div>
    </div>
  );
};

export default WatermarkedImage;
