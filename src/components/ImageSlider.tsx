import { useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WatermarkedImage from "./WatermarkedImage";

interface ImageSliderProps {
  images: string[];
  alt?: string;
}

const ImageSlider = ({ images, alt = "صورة" }: ImageSliderProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ direction: "rtl" });
  const [current, setCurrent] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  emblaApi?.on("select", () => setCurrent(emblaApi.selectedScrollSnap()));

  if (images.length === 0) return null;
  if (images.length === 1) {
    return <WatermarkedImage src={images[0]} alt={alt} height="h-80" />;
  }

  return (
    <div className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0">
              <WatermarkedImage src={src} alt={`${alt} ${i + 1}`} height="h-80" />
            </div>
          ))}
        </div>
      </div>

      <button onClick={scrollPrev} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} />
      </button>
      <button onClick={scrollNext} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft size={20} />
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-accent" : "bg-background/60"}`} />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
