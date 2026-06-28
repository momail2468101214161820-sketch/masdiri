/* ================================================================
 Sout Al-Balad — Pro Features Pack (Batch 5: "خرافية" features)
 Lightweight, frontend-only, zero new deps.
 ================================================================ */
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Zap, Eye, Command, Mic, MicOff, Maximize2 } from "lucide-react";

/* 61. Gold cursor spotlight follower (subtle radial glow) */
export const CursorSpotlight = => {
 useEffect( => {
 const el = document.createElement("div");
 el.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:5;transition:background .15s;mix-blend-mode:soft-light;`;
 document.body.appendChild(el);
 const h = (e: MouseEvent) => {
 el.style.background = `radial-gradient(280px circle at ${e.clientX}px ${e.clientY}px, hsl(var(--gold)/0.18), transparent 60%)`;
 };
 window.addEventListener("pointermove", h);
 return => { window.removeEventListener("pointermove", h); el.remove; };
 }, );
 return null;
};

/* 62. Magnetic gold ripple on every click */
export const ClickRipple = => {
 useEffect( => {
 const h = (e: MouseEvent) => {
 const r = document.createElement("span");
 r.style.cssText = `position:fixed;left:${e.clientX - 12}px;top:${e.clientY - 12}px;width:24px;height:24px;border-radius:9999px;pointer-events:none;z-index:99;background:radial-gradient(circle,hsl(var(--gold)/0.55),transparent 70%);animation:sb-ripple .55s ease-out forwards;`;
 document.body.appendChild(r);
 setTimeout( => r.remove, 600);
 };
 const st = document.createElement("style");
 st.innerHTML = `@keyframes sb-ripple{to{transform:scale(6);opacity:0}}`;
 document.head.appendChild(st);
 window.addEventListener("click", h);
 return => { window.removeEventListener("click", h); st.remove; };
 }, );
 return null;
};

/* 63. Konami code → confetti + admin tip */
export const KonamiSurprise = => {
 useEffect( => {
 const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
 let i = 0;
 const h = (e: KeyboardEvent) => {
 if (e.key === seq[i]) { i++; if (i === seq.length) { i = 0; fire; } } else { i = 0; }
 };
 const fire = => {
 toast.success("🎉 وضع المحرر الخفي مُفعَّل");
 for (let n = 0; n < 60; n++) {
 const p = document.createElement("span");
 const x = Math.random * window.innerWidth, hue = Math.random * 360;
 p.style.cssText = `position:fixed;left:${x}px;top:-10px;width:8px;height:14px;background:hsl(${hue},80%,60%);z-index:9999;pointer-events:none;animation:sb-fall ${1 + Math.random}s ease-in forwards;`;
 document.body.appendChild(p);
 setTimeout( => p.remove, 2200);
 }
 };
 const st = document.createElement("style");
 st.innerHTML = `@keyframes sb-fall{to{transform:translateY(110vh) rotate(720deg);opacity:0}}`;
 document.head.appendChild(st);
 window.addEventListener("keydown", h);
 return => { window.removeEventListener("keydown", h); st.remove; };
 }, );
 return null;
};

/* 64. Voice search — speak to search (ar-EG) */
export const VoiceSearchButton = => {
 const [listening, setListening] = useState(false);
 const recRef = useRef<any>(null);
 const start = => {
 const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
 if (!SR) { toast.error("البحث الصوتي غير مدعوم"); return; }
 const rec = new SR; rec.lang = "ar-EG"; rec.interimResults = false;
 rec.onresult = (e: any) => {
 const q = e.results[0][0].transcript;
 window.location.href = `/search?q=${encodeURIComponent(q)}`;
 };
 rec.onend = => setListening(false);
 rec.onerror = => { setListening(false); toast.error("تعذّر التعرف على الصوت"); };
 recRef.current = rec; rec.start; setListening(true);
 };
 const stop = => { try { recRef.current?.stop; } catch {} setListening(false); };
 return (
 <button onClick={listening ? stop : start} aria-label="بحث صوتي"
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition hover:bg-[hsl(var(--gold)/0.12)]"
 style={{ borderColor: "hsl(var(--gold)/0.5)", color: "hsl(var(--primary))" }}>
 {listening ? <MicOff size={12} /> : <Mic size={12} />} {listening ? "أنصت..." : "بحث صوتي"}
 </button>
 );
};

/* 65. Animated number counter (e.g., views, subscribers) */
export const AnimatedCounter = ({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) => {
 const [n, setN] = useState(0);
 useEffect( => {
 const start = performance.now, dur = 1200;
 let raf = 0;
 const step = (t: number) => {
 const p = Math.min(1, (t - start) / dur);
 setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
 if (p < 1) raf = requestAnimationFrame(step);
 };
 raf = requestAnimationFrame(step);
 return => cancelAnimationFrame(raf);
 }, [value]);
 return (
 <div className="rounded-2xl p-4 border text-center" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--gold)/0.4)" }}>
 <div className="text-2xl font-extrabold tabular" style={{ color: "hsl(var(--gold))" }}>
 {n.toLocaleString("ar-EG")}{suffix}
 </div>
 <div className="text-[11px] font-bold mt-1 text-muted-foreground" style={{ fontFamily: "'Cairo',sans-serif" }}>{label}</div>
 </div>
 );
};

/* 66. Particles canvas — subtle gold dust drifting */
export const GoldDustCanvas = => {
 useEffect( => {
 const c = document.createElement("canvas");
 c.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:4;opacity:.35`;
 document.body.appendChild(c);
 const ctx = c.getContext("2d")!;
 const resize = => { c.width = innerWidth; c.height = innerHeight; };
 resize; window.addEventListener("resize", resize);
 const N = 40;
 const ps = Array.from({ length: N }, => ({
 x: Math.random * c.width, y: Math.random * c.height,
 r: 0.5 + Math.random * 1.6, vy: 0.1 + Math.random * 0.3, vx: (Math.random - 0.5) * 0.15,
 }));
 let raf = 0;
 const draw = => {
 ctx.clearRect(0, 0, c.width, c.height);
 for (const p of ps) {
 p.x += p.vx; p.y += p.vy;
 if (p.y > c.height) { p.y = -2; p.x = Math.random * c.width; }
 ctx.beginPath; ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
 ctx.fillStyle = "rgba(212,175,55,.8)"; ctx.fill;
 }
 raf = requestAnimationFrame(draw);
 };
 draw;
 return => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); c.remove; };
 }, );
 return null;
};

/* 67. Tilt 3D effect — applies to any element with [data-tilt] */
export const TiltEffect = => {
 useEffect( => {
 const els = document.querySelectorAll<HTMLElement>("[data-tilt]");
 els.forEach((el) => {
 el.style.transformStyle = "preserve-3d";
 el.style.transition = "transform .15s ease-out";
 const onMove = (e: MouseEvent) => {
 const r = el.getBoundingClientRect;
 const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
 const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
 el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
 };
 const reset = => { el.style.transform = "perspective(800px) rotateX(0) rotateY(0)"; };
 el.addEventListener("mousemove", onMove);
 el.addEventListener("mouseleave", reset);
 });
 }, );
 return null;
};

/* 68. Sound on breaking news (gentle ding via WebAudio, no asset) */
export const BreakingSoundFX = => {
 useEffect( => {
 const h = (e: any) => {
 if (!e?.detail?.is_breaking) return;
 try {
 const ac = new (window.AudioContext || (window as any).webkitAudioContext);
 const o = ac.createOscillator, g = ac.createGain;
 o.type = "sine"; o.frequency.setValueAtTime(880, ac.currentTime);
 o.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.4);
 g.gain.setValueAtTime(0.0001, ac.currentTime);
 g.gain.exponentialRampToValueAtTime(0.15, ac.currentTime + 0.05);
 g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5);
 o.connect(g).connect(ac.destination); o.start; o.stop(ac.currentTime + 0.55);
 } catch {}
 };
 window.addEventListener("sb-news-refreshed", h);
 return => window.removeEventListener("sb-news-refreshed", h);
 }, );
 return null;
};

/* 69. Picture-in-Picture trigger for any [data-pip] video */
export const PIPVideoButton = => {
 const enter = async => {
 const v = document.querySelector<HTMLVideoElement>("video[data-pip], video");
 if (!v) { toast.error("لا يوجد فيديو لعرضه"); return; }
 try { await (v as any).requestPictureInPicture?.; }
 catch { toast.error("الميزة غير مدعومة هنا"); }
 };
 return (
 <button onClick={enter} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold"
 style={{ borderColor: "hsl(var(--gold)/0.5)" }} aria-label="نافذة مصغرة">
 <Maximize2 size={12} /> نافذة عائمة
 </button>
 );
};

/* 70. Reading-mood ambient bar — color shifts by time of day */
export const AmbientMoodBar = => {
 useEffect( => {
 const apply = => {
 const h = new Date.getHours;
 const hue = h < 6 ? 230 : h < 12 ? 45 : h < 18 ? 30 : 260;
 document.documentElement.style.setProperty("--ambient-hue", String(hue));
 };
 apply;
 const t = setInterval(apply, 60_000);
 return => clearInterval(t);
 }, );
 return (
 <div aria-hidden className="fixed bottom-0 inset-x-0 h-[3px] z-[55] pointer-events-none"
 style={{ background: "linear-gradient(90deg, hsl(var(--ambient-hue,45),80%,55%), hsl(var(--gold)), hsl(var(--ambient-hue,45),80%,55%))" }} />
 );
};
