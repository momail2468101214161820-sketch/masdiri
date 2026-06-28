import { useEffect, useState } from "react";
import { Type, Minus, Plus } from "lucide-react";

const KEY = "sb-font-scale";
const MIN = 0.85, MAX = 1.4, STEP = 0.05;

const FontSizeAdjuster = ({ targetSelector = ".article-prose" }: { targetSelector?: string }) => {
  const [scale, setScale] = useState<number>(() => {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    return v ? parseFloat(v) : 1;
  });

  useEffect(() => {
    const el = document.querySelector(targetSelector) as HTMLElement | null;
    if (el) el.style.fontSize = `${scale}em`;
    try { localStorage.setItem(KEY, String(scale)); } catch {}
  }, [scale, targetSelector]);

  return (
    <div className="inline-flex items-center gap-1 rounded-full border p-1" style={{ borderColor: "hsl(var(--gold) / 0.5)", background: "hsl(var(--card))" }}>
      <button
        aria-label="تصغير الخط"
        onClick={() => setScale((s) => Math.max(MIN, +(s - STEP).toFixed(2)))}
        className="w-7 h-7 grid place-items-center rounded-full hover:bg-[hsl(var(--gold)/0.15)] transition"
      >
        <Minus size={13} />
      </button>
      <Type size={13} style={{ color: "hsl(var(--gold-dark))" }} />
      <span className="text-[10px] font-bold tabular w-8 text-center" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
        {Math.round(scale * 100)}%
      </span>
      <button
        aria-label="تكبير الخط"
        onClick={() => setScale((s) => Math.min(MAX, +(s + STEP).toFixed(2)))}
        className="w-7 h-7 grid place-items-center rounded-full hover:bg-[hsl(var(--gold)/0.15)] transition"
      >
        <Plus size={13} />
      </button>
    </div>
  );
};

export default FontSizeAdjuster;
