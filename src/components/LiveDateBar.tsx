import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

const toHijri = (d: Date) => {
 try {
 return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
 day: "numeric", month: "long", year: "numeric",
 }).format(d);
 } catch { return ""; }
};

const toGregorian = (d: Date) =>
 new Intl.DateTimeFormat("ar-EG", {
 weekday: "long", day: "numeric", month: "long", year: "numeric",
 }).format(d);

const LiveDateBar = => {
 const [now, setNow] = useState(new Date);
 useEffect( => {
 const t = setInterval( => setNow(new Date), 30_000);
 return => clearInterval(t);
 }, );
 const time = new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(now);
 return (
 <div className="inline-flex items-center gap-2 text-[11px] tabular" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
 <CalendarDays size={12} style={{ color: "hsl(var(--gold))" }} />
 <span>{toGregorian(now)}</span>
 <span className="opacity-50">·</span>
 <span style={{ color: "hsl(var(--gold-light))" }}>{toHijri(now)}</span>
 <span className="opacity-50">·</span>
 <span style={{ color: "hsl(var(--gold))" }}>{time}</span>
 </div>
 );
};

export default LiveDateBar;
