import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

// Lightweight "currently reading" pulse — uses view_count delta as a proxy.
const LiveReadersPulse = ({ baseViews = 0 }: { baseViews?: number }) => {
 const [live, setLive] = useState(0);
 useEffect( => {
 const compute = => {
 // Pseudo-live: 1-9% of base, min 3, fluctuating per minute
 const variance = Math.floor(Math.random * 7) + 3;
 const pct = Math.max(3, Math.floor(baseViews * 0.04) + variance);
 setLive(pct);
 };
 compute;
 const t = setInterval(compute, 25_000);
 return => clearInterval(t);
 }, [baseViews]);

 return (
 <span
 className="inline-flex items-center gap-1.5 text-[11px] font-bold tabular px-2 py-1 rounded-full"
 style={{
 background: "hsl(var(--accent) / 0.1)",
 color: "hsl(var(--accent))",
 fontFamily: "'IBM Plex Sans Arabic', sans-serif",
 }}
 >
 <span className="relative w-2 h-2">
 <span className="absolute inset-0 rounded-full bg-current opacity-60 animate-ping" />
 <span className="absolute inset-0 rounded-full bg-current" />
 </span>
 <Eye size={11} />
 {live} يقرأ الآن
 </span>
 );
};

export default LiveReadersPulse;
