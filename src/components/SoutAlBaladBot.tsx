import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Msg {
 role: "user" | "assistant";
 content: string;
}

const SUGGESTIONS = [
 "ما هي أهم أخبار اليوم؟",
 "كيف أستعلم عن نتيجة الإعدادية؟",
 "ما سعر الدولار والذهب الآن؟",
 "أريد حجز إعلان والتواصل",
];

const SoutAlBaladBot = => {
 const [open, setOpen] = useState(false);
 const [input, setInput] = useState("");
 const [loading, setLoading] = useState(false);
 const [messages, setMessages] = useState<Msg>([
 {
 role: "assistant",
 content:
 "السلام عليكم، أنا **بوت صوت البلد** — مساعدكم الرسمي. كيف يمكنني خدمتكم اليوم؟",
 },
 ]);
 const scrollRef = useRef<HTMLDivElement>(null);

 useEffect( => {
 scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
 }, [messages, open]);

 const send = async (text: string) => {
 const content = text.trim;
 if (!content || loading) return;
 const next: Msg = [...messages, { role: "user", content }];
 setMessages(next);
 setInput("");
 setLoading(true);
 try {
 const { data, error } = await supabase.functions.invoke("public-chat", {
 body: { messages: next },
 });
 const payload: any = data ?? {};
 const reply: string =
 payload.reply ||
 payload.error ||
 (error?.message
 ? "نعتذر، الخدمة الذكية مشغولة حالياً. يرجى المحاولة بعد لحظات، أو التواصل المباشر مع إدارة صوت البلد عبر **+20 100 618 8795**."
 : "تعذّر توليد الرد في الوقت الحالي.");
 setMessages((m) => [...m, { role: "assistant", content: reply }]);
 } catch {
 setMessages((m) => [
 ...m,
 {
 role: "assistant",
 content:
 "نعتذر عن التأخير المؤقت في خدمة المساعد الذكي. يمكنكم تصفح أقسام الموقع مباشرة، أو التواصل مع إدارة **صوت البلد** عبر **+20 100 618 8795**.",
 },
 ]);
 } finally {
 setLoading(false);
 }
 };

 return (
 <>
 {/* Animated Floating Bot Launcher — navy/gold, breathing, orbits, halo */}
 <motion.button
 onClick={ => setOpen((v) => !v)}
 aria-label="بوت صوت البلد"
 className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[80] group select-none"
 whileHover={{ scale: 1.08 }}
 whileTap={{ scale: 0.92 }}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 >
 <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] flex items-center justify-center">
 {/* Outer halo glow */}
 <motion.div
 className="absolute inset-0 rounded-full blur-2xl"
 style={{ background: "hsl(var(--gold) / 0.55)" }}
 animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.95, 1.15, 0.95] }}
 transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
 />
 {/* Orbit ring 1 */}
 <motion.div
 className="absolute -inset-1.5 rounded-full border border-dashed"
 style={{ borderColor: "hsl(var(--gold) / 0.55)" }}
 animate={{ rotate: 360 }}
 transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
 />
 {/* Orbit ring 2 (reverse) */}
 <motion.div
 className="absolute -inset-3 rounded-full border"
 style={{ borderColor: "hsl(var(--gold) / 0.2)" }}
 animate={{ rotate: -360 }}
 transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
 />
 {/* Core sphere — breathing */}
 <motion.div
 className="relative w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center overflow-hidden"
 style={{
 background:
 "radial-gradient(circle at 30% 25%, hsl(var(--royal-blue)) 0%, hsl(var(--royal-blue-dark)) 60%, #000 100%)",
 border: "2px solid hsl(var(--gold))",
 boxShadow:
 "0 8px 30px hsl(var(--gold) / 0.45), inset 0 0 20px hsl(var(--gold) / 0.25)",
 }}
 animate={{ y: [0, -4, 0] }}
 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
 >
 {open ? (
 <X className="w-5 h-5" style={{ color: "hsl(var(--gold-light))" }} />
 ) : (
 <>
 {/* Eyes that blink */}
 <div className="flex gap-1.5 sm:gap-2 relative z-10">
 <motion.span
 className="block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
 style={{
 background: "hsl(var(--gold-light))",
 boxShadow: "0 0 8px hsl(var(--gold))",
 }}
 animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
 transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
 />
 <motion.span
 className="block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
 style={{
 background: "hsl(var(--gold-light))",
 boxShadow: "0 0 8px hsl(var(--gold))",
 }}
 animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
 transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
 />
 </div>
 {/* Inner shimmer */}
 <Sparkles
 className="absolute -top-0.5 -right-0.5 w-3 h-3 animate-pulse"
 style={{ color: "hsl(var(--gold-light))" }}
 />
 </>
 )}
 </motion.div>
 {/* Online dot */}
 <span
 className="absolute top-0 right-0 w-3 h-3 rounded-full border-2"
 style={{
 background: "#22c55e",
 borderColor: "hsl(var(--royal-blue-dark))",
 boxShadow: "0 0 8px #22c55e",
 }}
 />
 </div>
 {/* Hover tooltip */}
 {!open && (
 <div
 className="hidden sm:block absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
 style={{
 background: "hsl(var(--royal-blue-dark))",
 color: "hsl(var(--gold-light))",
 border: "1px solid hsl(var(--gold) / 0.6)",
 boxShadow: "0 6px 20px hsl(var(--gold) / 0.3)",
 }}
 >
 مساعد صوت البلد · اضغط للدردشة
 </div>
 )}
 </motion.button>


 <AnimatePresence>
 {open && (
 <motion.div
 initial={{ opacity: 0, y: 40, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 40, scale: 0.95 }}
 transition={{ duration: 0.25 }}
 className="fixed left-2 right-2 bottom-24 sm:right-6 sm:left-auto sm:bottom-28 z-[80] w-auto sm:w-[400px] max-w-[440px] h-[70vh] sm:h-[600px] mx-auto sm:mx-0 flex flex-col rounded-2xl overflow-hidden"
 style={{
 background:
 "linear-gradient(180deg, hsl(var(--card)), hsl(var(--background)))",
 border: "2px solid hsl(var(--gold))",
 boxShadow:
 "0 25px 60px -15px hsl(var(--royal-blue-dark)/0.8), 0 0 0 1px hsl(var(--gold)/0.4)",
 }}
 dir="rtl"
 >
 {/* Header */}
 <div
 className="px-4 py-3 flex items-center gap-3"
 style={{
 background:
 "linear-gradient(135deg, hsl(var(--royal-blue-dark)), hsl(var(--royal-blue)))",
 borderBottom: "2px solid hsl(var(--gold))",
 }}
 >
 <div
 className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black"
 style={{
 background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)))",
 color: "hsl(var(--royal-blue-dark))",
 boxShadow: "0 4px 12px hsl(var(--gold)/0.5)",
 }}
 >
 ص
 </div>
 <div className="flex-1">
 <div className="font-black text-base" style={{ color: "hsl(var(--gold-light))" }}>
 بوت صوت البلد
 </div>
 <div className="text-[10px] flex items-center gap-1.5 text-white/80">
 <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
 متصل · مدعوم بالذكاء الاصطناعي
 </div>
 </div>
 </div>

 {/* Messages */}
 <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
 {messages.map((m, i) => (
 <div
 key={i}
 className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
 >
 <div
 className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-1 ${
 m.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
 }`}
 style={
 m.role === "user"
 ? {
 background:
 "linear-gradient(135deg, hsl(var(--royal-blue)), hsl(var(--royal-blue-dark)))",
 color: "hsl(var(--gold-light))",
 border: "1px solid hsl(var(--gold)/0.4)",
 }
 : {
 background: "hsl(var(--muted))",
 color: "hsl(var(--foreground))",
 border: "1px solid hsl(var(--gold)/0.25)",
 }
 }
 >
 <ReactMarkdown>{m.content}</ReactMarkdown>
 </div>
 </div>
 ))}
 {loading && (
 <div className="flex justify-end">
 <div className="rounded-2xl px-3 py-2 bg-muted flex items-center gap-2 text-xs">
 <Loader2 className="w-3 h-3 animate-spin" />
 يكتب الرد...
 </div>
 </div>
 )}

 {messages.length <= 1 && !loading && (
 <div className="flex flex-wrap gap-2 pt-2">
 {SUGGESTIONS.map((s) => (
 <button
 key={s}
 onClick={ => send(s)}
 className="text-[11px] px-2.5 py-1.5 rounded-full font-bold transition-transform hover:scale-105"
 style={{
 border: "1px solid hsl(var(--gold)/0.5)",
 color: "hsl(var(--gold))",
 background: "hsl(var(--card))",
 }}
 >
 {s}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Composer */}
 <form
 onSubmit={(e) => {
 e.preventDefault;
 send(input);
 }}
 className="p-3 border-t flex gap-2"
 style={{ borderColor: "hsl(var(--gold)/0.3)", background: "hsl(var(--card))" }}
 >
 <input
 value={input}
 onChange={(e) => setInput(e.target.value)}
 disabled={loading}
 placeholder="اكتب سؤالك بالعربية الفصحى..."
 className="flex-1 px-3 py-2 text-sm rounded-lg bg-background border focus:outline-none focus:ring-2 font-cairo"
 style={{
 borderColor: "hsl(var(--gold)/0.4)",
 }}
 />
 <button
 type="submit"
 disabled={loading || !input.trim}
 className="px-3 rounded-lg font-black text-sm disabled:opacity-50"
 style={{
 background:
 "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)))",
 color: "hsl(var(--royal-blue-dark))",
 }}
 aria-label="إرسال"
 >
 <Send className="w-4 h-4" />
 </button>
 </form>
 </motion.div>
 )}
 </AnimatePresence>
 </>
 );
};

export default SoutAlBaladBot;
