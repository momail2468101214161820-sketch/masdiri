import { useRef, useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { toast } from "sonner";

interface Props {
 open: boolean;
 onClose: => void;
 title: string;
 summary?: string | null;
 image_url?: string | null;
 url?: string;
}

async function toDataUrl(url: string): Promise<string | null> {
 if (!url) return null;
 if (url.startsWith("data:image/")) return url;

 const candidates: string = ;
 const absoluteUrl = url.startsWith("//") ? `${window.location.protocol}${url}` : url;
 const isLocal = absoluteUrl.startsWith("/") || absoluteUrl.startsWith(window.location.origin);
 if (isLocal) {
 candidates.push(absoluteUrl);
 } else {
 const stripped = absoluteUrl.replace(/^https?:\/\//, "");
 // Try CORS-friendly proxies first; direct as last resort.
 candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(stripped)}&w=1200&h=1260&fit=cover&output=jpg&q=92`);
 candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(stripped)}&output=jpg`);
 candidates.push(`https://corsproxy.io/?${encodeURIComponent(absoluteUrl)}`);
 candidates.push(absoluteUrl);
 }

 for (const c of candidates) {
 try {
 const res = await fetch(c, { mode: "cors" });
 if (!res.ok) continue;
 const blob = await res.blob;
 const data = await new Promise<string>((resolve, reject) => {
 const fr = new FileReader;
 fr.onload = => resolve(fr.result as string);
 fr.onerror = reject;
 fr.readAsDataURL(blob);
 });
 return data;
 } catch { /* try next */ }
 }
 return null;
}

const waitForImage = (src: string): Promise<HTMLImageElement> =>
 new Promise((resolve, reject) => {
 const img = new Image;
 img.crossOrigin = "anonymous";
 img.onload = => resolve(img);
 img.onerror = reject;
 img.src = src;
 });

const fitText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) => {
 const words = text.trim.split(/\s+/).filter(Boolean);
 const lines: string = ;
 let line = "";

 words.forEach((word) => {
 const next = line ? `${line} ${word}` : word;
 if (ctx.measureText(next).width <= maxWidth) {
 line = next;
 return;
 }
 if (line) lines.push(line);
 line = word;
 });

 if (line) lines.push(line);
 if (lines.length > maxLines) {
 const kept = lines.slice(0, maxLines);
 kept[maxLines - 1] = `${kept[maxLines - 1].replace(/…$/, "")}…`;
 return kept;
 }
 return lines;
};

const drawCoverImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height: number) => {
 const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
 const sw = width / scale;
 const sh = height / scale;
 const sx = (img.naturalWidth - sw) / 2;
 const sy = (img.naturalHeight - sh) / 2;
 ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
};

const drawContainImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height: number) => {
 const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
 const dw = img.naturalWidth * scale;
 const dh = img.naturalHeight * scale;
 const dx = x + (width - dw) / 2;
 const dy = y + (height - dh) / 2;
 ctx.drawImage(img, dx, dy, dw, dh);
};

const drawRoundImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number) => {
 ctx.save;
 ctx.beginPath;
 ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
 ctx.clip;
 drawCoverImage(ctx, img, x, y, size, size);
 ctx.restore;
};

const makeShareCard = async ({ title, summary, image, logo, url }: { title: string; summary?: string | null; image?: string | null; logo?: string | null; url?: string }) => {
 const W = 1200;
 const H = 630;
 const canvas = document.createElement("canvas");
 canvas.width = W;
 canvas.height = H;
 const ctx = canvas.getContext("2d");
 if (!ctx) throw new Error("canvas_unavailable");

 ctx.direction = "rtl";
 ctx.textBaseline = "top";

 const bg = ctx.createLinearGradient(W, 0, 0, H);
 bg.addColorStop(0, "#07152f");
 bg.addColorStop(0.58, "#14295a");
 bg.addColorStop(1, "#62470b");
 ctx.fillStyle = bg;
 ctx.fillRect(0, 0, W, H);

 const imageX = 0;
 const imageW = Math.round(W * 0.52);
 const logoImg = logo ? await waitForImage(logo).catch( => null) : null;
 const articleImg = image ? await waitForImage(image).catch( => null) : null;

 if (articleImg) {
 // Blurred cover backdrop so wide/tall images never get cropped
 ctx.save;
 ctx.filter = "blur(28px) brightness(0.55)";
 drawCoverImage(ctx, articleImg, imageX - 30, -30, imageW + 60, H + 60);
 ctx.restore;
 // Full image contained on top — preserves aspect ratio (no crop)
 drawContainImage(ctx, articleImg, imageX + 14, 14, imageW - 28, H - 28);
 } else {
 const imageBg = ctx.createLinearGradient(0, 0, imageW, H);
 imageBg.addColorStop(0, "#16336a");
 imageBg.addColorStop(1, "#704e0b");
 ctx.fillStyle = imageBg;
 ctx.fillRect(imageX, 0, imageW, H);
 if (logoImg) drawRoundImage(ctx, logoImg, 210, 205, 220);
 }

 const fade = ctx.createLinearGradient(0, 0, imageW, 0);
 fade.addColorStop(0, "rgba(7,21,47,0.55)");
 fade.addColorStop(0.18, "rgba(7,21,47,0)");
 fade.addColorStop(0.75, "rgba(7,21,47,0)");
 fade.addColorStop(1, "rgba(7,21,47,0.98)");
 ctx.fillStyle = fade;
 ctx.fillRect(imageX, 0, imageW, H);
 ctx.fillStyle = "#f5c84b";
 ctx.fillRect(imageW - 5, 0, 5, H);

 const topFade = ctx.createLinearGradient(0, 0, 0, 96);
 topFade.addColorStop(0, "rgba(0,0,0,0.55)");
 topFade.addColorStop(1, "rgba(0,0,0,0)");
 ctx.fillStyle = topFade;
 ctx.fillRect(0, 0, W, 104);

 if (logoImg) {
 drawRoundImage(ctx, logoImg, W - 92, 28, 56);
 ctx.strokeStyle = "#f5c84b";
 ctx.lineWidth = 4;
 ctx.beginPath;
 ctx.arc(W - 64, 56, 28, 0, Math.PI * 2);
 ctx.stroke;
 }
 ctx.textAlign = "right";
 ctx.fillStyle = "#f7d36b";
 ctx.font = "900 26px Cairo, Arial, sans-serif";
 ctx.fillText("صوت البلد", W - 108, 32);
 ctx.fillStyle = "rgba(255,255,255,0.84)";
 ctx.font = "700 16px Cairo, Arial, sans-serif";
 ctx.fillText("مصدري للأخبار المصرية والعالمية", W - 108, 63);

 ctx.fillStyle = "#f5c84b";
 ctx.beginPath;
 ctx.roundRect(30, 28, 82, 38, 7);
 ctx.fill;
 ctx.fillStyle = "#07152f";
 ctx.font = "900 17px Cairo, Arial, sans-serif";
 ctx.textAlign = "center";
 ctx.fillText("عاجل", 71, 35);

 ctx.textAlign = "right";
 const textX = W - 42;
 const textW = Math.round(W * 0.45);
 ctx.fillStyle = "#f5c84b";
 const lineGradient = ctx.createLinearGradient(textX, 142, textX - 140, 142);
 lineGradient.addColorStop(0, "#f5c84b");
 lineGradient.addColorStop(1, "rgba(245,200,75,0)");
 ctx.fillStyle = lineGradient;
 ctx.fillRect(textX - 140, 142, 140, 6);

 ctx.fillStyle = "#ffffff";
 ctx.shadowColor = "rgba(0,0,0,.7)";
 ctx.shadowBlur = 10;
 ctx.font = "900 47px Cairo, Arial, sans-serif";
 fitText(ctx, title, textW, 3).forEach((line, index) => {
 ctx.fillText(line, textX, 170 + index * 66);
 });
 ctx.shadowBlur = 0;

 if (summary) {
 ctx.fillStyle = "rgba(255,255,255,0.84)";
 ctx.font = "700 24px Cairo, Arial, sans-serif";
 fitText(ctx, summary.slice(0, 220), textW, 3).forEach((line, index) => {
 ctx.fillText(line, textX, 390 + index * 40);
 });
 }

 ctx.strokeStyle = "rgba(255,255,255,0.16)";
 ctx.lineWidth = 2;
 ctx.beginPath;
 ctx.moveTo(W - 42, H - 88);
 ctx.lineTo(W - textW, H - 88);
 ctx.stroke;

 ctx.fillStyle = "rgba(255,255,255,0.7)";
 ctx.font = "700 18px Cairo, Arial, sans-serif";
 ctx.fillText("صوت البلد", W - 42, H - 66);
 ctx.fillStyle = "#f7d36b";
 ctx.font = "900 24px Cairo, Arial, sans-serif";
 ctx.fillText("خالد عاطف عبدالحكيم", W - 42, H - 39);
 ctx.textAlign = "left";
 ctx.fillStyle = "#f7d36b";
 ctx.font = "900 22px Cairo, Arial, sans-serif";
 ctx.fillText("soutalbalad.com", 42, H - 78);
 // Real article URL (truncated to fit)
 if (url) {
 ctx.fillStyle = "rgba(255,255,255,0.85)";
 ctx.font = "700 15px monospace, Cairo, Arial, sans-serif";
 let shown = url.replace(/^https?:\/\//, "");
 while (shown.length > 4 && ctx.measureText(shown).width > imageW - 84) {
 shown = shown.slice(0, -1);
 }
 if (shown !== url.replace(/^https?:\/\//, "")) shown = shown.slice(0, -1) + "…";
 ctx.fillText(shown, 42, H - 50);
 }
 ctx.fillStyle = "rgba(255,255,255,0.6)";
 ctx.font = "700 13px Cairo, Arial, sans-serif";
 ctx.fillText("تطوير وتصميم: التقني/ خالد عاطف", 42, H - 28);

 return canvas.toDataURL("image/png", 0.98);
};

const ShareImageCard = ({ open, onClose, title, summary, image_url, url }: Props) => {
 const ref = useRef<HTMLDivElement>(null);
 const wrapRef = useRef<HTMLDivElement>(null);
 const [busy, setBusy] = useState(false);
 const [imgData, setImgData] = useState<string | null>(null);
 const [logoData, setLogoData] = useState<string | null>(null);
 const [loadingImg, setLoadingImg] = useState(false);
 const [imgFailed, setImgFailed] = useState(false);
 const [scale, setScale] = useState(1);

 useEffect( => {
 if (!open) return;
 setImgData(null);
 setImgFailed(false);
 if (image_url) {
 setLoadingImg(true);
 toDataUrl(image_url).then((d) => {
 setImgData(d);
 setImgFailed(!d);
 setLoadingImg(false);
 }).catch( => {
 setImgFailed(true);
 setLoadingImg(false);
 });
 }
 toDataUrl("/images/logo.png").then(setLogoData);
 }, [open, image_url]);

 // Facebook feed/link format: 1200 x 630 (1.91:1) — scaled for preview
 const W = 720;
 const H = 378;

 // Responsive scale so the fixed-size card fits the modal width on mobile
 useEffect( => {
 if (!open) return;
 const update = => {
 const w = wrapRef.current?.clientWidth ?? W;
 setScale(Math.min(1, w / W));
 };
 update;
 const t = setTimeout(update, 50);
 window.addEventListener("resize", update);
 return => {
 clearTimeout(t);
 window.removeEventListener("resize", update);
 };
 }, [open]);

 if (!open) return null;

 const download = async => {
 if (image_url && !imgData) {
 toast.error("انتظر تحميل الصورة أولاً");
 return;
 }
 setBusy(true);
 try {
 const dataUrl = await makeShareCard({ title, summary, image: imgData, logo: logoData || "/images/logo.png", url });
 const a = document.createElement("a");
 a.href = dataUrl;
 a.download = `sout-elbalad-${Date.now}.png`;
 a.click;
 toast.success("تم تحميل البطاقة — جاهزة للنشر");
 } catch {
 toast.error("تعذّر إنشاء الصورة");
 }
 setBusy(false);
 };


 return (
 <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
 <div className="bg-background w-full max-w-[780px] rounded-lg overflow-hidden my-4 sm:my-8" onClick={(e) => e.stopPropagation}>
 <div className="flex items-center justify-between p-3 border-b border-border">
 <h3 className="font-bold text-sm">بطاقة المشاركة الاحترافية</h3>
 <button onClick={onClose}><X size={18} /></button>
 </div>
 <div className="p-3 flex flex-col items-center">
 <div ref={wrapRef} className="w-full relative overflow-hidden" style={{ height: H * scale }}>
 <div
 style={{
 width: W,
 height: H,
 transform: `scale(${scale})`,
 transformOrigin: "top right",
 position: "absolute",
 top: 0,
 right: 0,
 }}
 >
 <div
 ref={ref}
 style={{
 width: W,
 height: H,
 position: "relative",
 background: "linear-gradient(135deg, hsl(220 75% 9%) 0%, hsl(222 62% 16%) 58%, hsl(45 78% 17%) 100%)",
 color: "white",
 fontFamily: "Cairo, sans-serif",
 direction: "rtl",
 overflow: "hidden",
 boxShadow: "0 20px 60px rgba(0,0,0,.5)",
 margin: "0 auto",
 }}
 >
 {/* Image side — contain (no crop) over a blurred backdrop */}
 <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "52%", zIndex: 1, overflow: "hidden" }}>
 {image_url && imgData ? (
 <>
 <img
 src={imgData}
 alt=""
 aria-hidden
 style={{ position: "absolute", inset: -20, width: "calc(100% + 40px)", height: "calc(100% + 40px)", objectFit: "cover", filter: "blur(22px) brightness(0.55)" }}
 />
 <img
 src={imgData}
 alt=""
 crossOrigin="anonymous"
 style={{ position: "absolute", inset: 8, width: "calc(100% - 16px)", height: "calc(100% - 16px)", objectFit: "contain", display: "block" }}
 />
 </>
 ) : (
 <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, hsl(220 65% 18%), hsl(45 72% 20%))", display: "flex", alignItems: "center", justifyContent: "center" }}>
 {loadingImg ? (
 <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "hsl(45 92% 68%)" }}>جارٍ تحميل صورة الخبر...</p>
 ) : (
 <img src={logoData || "/images/logo.png"} alt="" style={{ width: 138, height: 138, borderRadius: "50%", objectFit: "cover", opacity: 0.9, filter: "drop-shadow(0 14px 28px rgba(0,0,0,.45))" }} />
 )}
 </div>
 )}
 <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, transparent 70%, hsl(220 75% 9%) 100%)" }} />
 <div style={{ position: "absolute", inset: 0, borderLeft: "4px solid hsl(45 92% 60%)" }} />
 </div>

 {/* Top bar */}
 <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 58, background: "linear-gradient(180deg, rgba(0,0,0,.5), transparent)", zIndex: 4, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <img src={logoData || "/images/logo.png"} alt="" style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid hsl(45 90% 60%)" }} />
 <div>
 <p style={{ fontWeight: 900, color: "hsl(45 92% 68%)", fontSize: 15, margin: 0, lineHeight: 1 }}>صوت البلد</p>
 <p style={{ fontSize: 9, opacity: 0.85, margin: 0, marginTop: 2 }}>مصدري للأخبار المصرية والعالمية</p>
 </div>
 </div>
 <span style={{ background: "hsl(45 92% 60%)", color: "hsl(220 75% 10%)", fontWeight: 900, fontSize: 9, padding: "4px 8px", borderRadius: 4, letterSpacing: 0.3 }}>
 عاجل
 </span>
 </div>

 {/* Body: title + summary */}
 <div style={{ position: "absolute", top: 64, right: 0, width: "52%", bottom: 0, padding: "18px 26px 20px 20px", zIndex: 3, display: "flex", flexDirection: "column" }}>
 <div style={{ width: 86, height: 3, background: "linear-gradient(90deg, hsl(45 92% 60%), transparent)", marginBottom: 14 }} />
 <h2 style={{
 fontWeight: 900,
 fontSize: 26,
 lineHeight: 1.4,
 margin: 0,
 color: "white",
 textShadow: "0 2px 8px rgba(0,0,0,.6)",
 display: "-webkit-box",
 WebkitLineClamp: 3,
 WebkitBoxOrient: "vertical",
 overflow: "hidden",
 }}>
 {title}
 </h2>
 {summary && (
 <p style={{
 fontSize: 13,
 opacity: 0.85,
 lineHeight: 1.7,
 marginTop: 8,
 marginBottom: 0,
 display: "-webkit-box",
 WebkitLineClamp: 3,
 WebkitBoxOrient: "vertical",
 overflow: "hidden",
 }}>
 {summary.slice(0, 220)}
 </p>
 )}

 {image_url && imgFailed && (
 <p style={{ fontSize: 10, margin: "8px 0 0", color: "hsl(45 92% 68%)", fontWeight: 800 }}>
 تعذّر تحميل الصورة من رابط الخبر، تم استخدام الهوية الرسمية كبديل.
 </p>
 )}

 <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
 <div>
 <p style={{ fontSize: 10, margin: 0, opacity: 0.7 }}>صوت البلد</p>
 <p style={{ fontSize: 12, margin: 0, fontWeight: 900, color: "hsl(45 92% 68%)" }}>خالد عاطف عبدالحكيم</p>
 </div>
 <div style={{ textAlign: "left", maxWidth: "62%", overflow: "hidden" }}>
 <p style={{ fontSize: 12, margin: 0, fontWeight: 900, color: "hsl(45 92% 68%)" }}>soutalbalad.com</p>
 {url && (
 <p style={{ fontSize: 10, margin: "2px 0 0", fontWeight: 700, color: "rgba(255,255,255,.88)", direction: "ltr", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "monospace, Cairo" }}>
 {url.replace(/^https?:\/\//, "")}
 </p>
 )}
 <p style={{ fontSize: 9, margin: "2px 0 0", opacity: 0.6 }}>تطوير وتصميم: التقني/ خالد عاطف</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <button
 onClick={download}
 disabled={busy || loadingImg}
 className="mt-4 w-full bg-accent text-accent-foreground py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 rounded"
 >
 <Download size={16} /> {busy ? "جارٍ التجهيز..." : loadingImg ? "تحميل الصورة..." : "تحميل البطاقة"}
 </button>
 </div>
 </div>
 </div>
 );
};

export default ShareImageCard;
