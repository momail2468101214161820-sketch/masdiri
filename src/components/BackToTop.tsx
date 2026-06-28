import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const BackToTop = => {
 const [show, setShow] = useState(false);
 useEffect( => {
 const onScroll = => setShow(window.scrollY > 600);
 window.addEventListener("scroll", onScroll, { passive: true });
 return => window.removeEventListener("scroll", onScroll);
 }, );
 if (!show) return null;
 return (
 <button
 onClick={ => window.scrollTo({ top: 0, behavior: "smooth" })}
 aria-label="العودة للأعلى"
 className="fixed bottom-24 left-4 z-50 w-11 h-11 rounded-full grid place-items-center shadow-royal transition-all hover:scale-110"
 style={{
 background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--royal-blue-dark)))",
 color: "hsl(var(--gold))",
 border: "1px solid hsl(var(--gold) / 0.6)",
 }}
 >
 <ArrowUp size={18} />
 </button>
 );
};

export default BackToTop;
