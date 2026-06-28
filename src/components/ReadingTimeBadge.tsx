// Word-based Arabic reading-time estimator (≈ 180 wpm)
export const estimateReadingTime = (text?: string | null): number => {
 if (!text) return 1;
 const words = text.trim.split(/\s+/).filter(Boolean).length;
 return Math.max(1, Math.round(words / 180));
};

export const ReadingTimeBadge = ({ text, className = "" }: { text?: string | null; className?: string }) => {
 const mins = estimateReadingTime(text);
 return (
 <span
 className={`inline-flex items-center gap-1 text-[11px] font-semibold tabular ${className}`}
 style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
 >
 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
 <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
 </svg>
 {mins} د قراءة
 </span>
 );
};

export default ReadingTimeBadge;
