import { useState } from "react";
import { Newspaper, RefreshCw, Loader2, Image as ImageIcon, Sparkles, Clock, FolderTree, CheckCircle2, PlusCircle, Tag, Eraser } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAdminPin } from "@/lib/adminApi";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/news-fetcher`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const CAT_AR: Record<string, string> = {
 accidents: "حوادث", sports: "رياضة", prices: "أسعار",
 technology: "تكنولوجيا", economy: "اقتصاد", entertainment: "فن",
 health: "صحة", politics: "سياسة",
};

type RunResult = {
 results?: Array<{
 source: string;
 items_inserted?: number;
 items_scanned?: number;
 items_duplicate?: number;
 categories_used?: Record<string, number>;
 categories_created?: string;
 }>;
 [k: string]: any;
};

const NewsFetcherPanel = => {
 const [loading, setLoading] = useState(false);
 const [secondary, setSecondary] = useState<"backfill" | "replace" | "recat" | "clean" | null>(null);
 const [lastResult, setLastResult] = useState<RunResult | null>(null);

 const recategorize = async => {
 setSecondary("recat");
 try {
 const { data, error } = await supabase.rpc("recategorize_all_articles" as any);
 if (error) throw error;
 toast.success(`✅ أُعيد تصنيف ${data ?? 0} خبر حسب الأقسام`);
 setLastResult({ recategorized: data });
 } catch (e: any) {
 toast.error(e.message || "تعذر إعادة التصنيف");
 } finally {
 setSecondary(null);
 }
 };

 const cleanSources = async => {
 setSecondary("clean");
 try {
 const { data, error } = await supabase.rpc("clean_all_article_sources" as any);
 if (error) throw error;
 toast.success(`🧹 تم تنظيف ${data ?? 0} خبر من أسماء المصادر الخارجية`);
 setLastResult({ cleaned: data });
 } catch (e: any) {
 toast.error(e.message || "تعذر تنظيف المصادر");
 } finally {
 setSecondary(null);
 }
 };

 const call = async (mode?: "backfill" | "replace-ai-images") => {
 if (mode === "backfill") setSecondary("backfill");
 else if (mode === "replace-ai-images") setSecondary("replace");
 else setLoading(true);

 try {
 const url = mode ? `${FN_URL}?mode=${mode}&limit=50` : `${FN_URL}?full=1&ai=1`;
 const res = await fetch(url, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${ANON_KEY}`,
 apikey: ANON_KEY,
 "X-Admin-Pin": getAdminPin || "",
 },
 body: JSON.stringify({}),
 });
 const json = await res.json;
 if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
 setLastResult(json);
 if (mode === "backfill") {
 toast.success(`تم تحديث ${json.updated || 0} صورة للأخبار القديمة`);
 } else if (mode === "replace-ai-images") {
 toast.success(`✅ تم استبدال ${json.replaced || 0} صورة AI بصور حقيقية`);
 } else {
 const inserted = (json.results || ).reduce((s: number, r: any) => s + (r.items_inserted || 0), 0);
 const scanned = (json.results || ).reduce((s: number, r: any) => s + (r.items_scanned || 0), 0);
 const created = Array.from(new Set((json.results || ).flatMap((r: any) => r.categories_created || ))) as string;
 if (inserted > 0) {
 toast.success(`✅ تم جلب ${inserted} خبر${created.length ? ` • أُنشئت أقسام: ${created.map(c => CAT_AR[c] || c).join("، ")}` : ""}`);
 } else {
 toast.info(`لا توجد أخبار جديدة الآن — تم فحص ${scanned} خبر`);
 }
 }
 } catch (e: any) {
 toast.error(e.message || "تعذر تنفيذ العملية");
 } finally {
 setLoading(false);
 setSecondary(null);
 }
 };

 // Aggregate categories across all sources for the live preview chips
 const aggregated = ( => {
 if (!lastResult?.results) return null;
 const used: Record<string, number> = {};
 const created = new Set<string>;
 for (const r of lastResult.results) {
 Object.entries(r.categories_used || {}).forEach(([k, v]) => { used[k] = (used[k] || 0) + (v as number); });
 (r.categories_created || ).forEach(c => created.add(c));
 }
 return { used, created: Array.from(created), perSource: lastResult.results };
 });

 return (
 <div className="relative overflow-hidden border-2 border-[hsl(var(--gold)/0.35)] rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-card via-card to-[hsl(var(--gold)/0.05)] shadow-royal space-y-5">
 {/* Decorative gold corner */}
 <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-gold-gradient opacity-20 blur-2xl pointer-events-none" />

 {/* Header */}
 <div className="relative flex items-start justify-between gap-3 border-b border-[hsl(var(--gold)/0.3)] pb-4">
 <div className="flex items-start gap-3 min-w-0">
 <div className="p-2.5 rounded-xl bg-gold-gradient text-[hsl(var(--primary))] shadow-gold-glow flex-shrink-0">
 <Newspaper size={22} />
 </div>
 <div className="min-w-0">
 <h3 className="font-black text-base sm:text-lg flex items-center gap-2 flex-wrap" style={{ fontFamily: "'Amiri', serif" }}>
 <span className="text-gold-shine">صائد الأخبار الذكي</span>
 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 inline-flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 نشط
 </span>
 </h3>
 <p className="text-[11px] sm:text-xs text-muted-foreground font-bold mt-1 leading-snug">
 يجلب الأخبار، يصيغها بأسلوب "صوت البلد"، ويصنّفها تلقائياً — وينشئ القسم إن لم يكن موجوداً.
 </p>
 </div>
 </div>
 </div>

 {/* Status pills */}
 <div className="grid grid-cols-3 gap-2">
 {[
 { icon: <Clock size={14} />, label: "التشغيل", value: "كل دقيقة" },
 { icon: <Sparkles size={14} className="text-[hsl(var(--gold))]" />, label: "الصياغة", value: "AI صوت البلد" },
 { icon: <Tag size={14} />, label: "التصنيف", value: "تلقائي ذكي" },
 ].map((p, i) => (
 <div key={i} className="flex items-center gap-1.5 bg-muted/40 border border-border rounded-xl px-2 py-2">
 <span className="text-primary flex-shrink-0">{p.icon}</span>
 <div className="leading-tight min-w-0">
 <p className="text-[9px] text-muted-foreground font-bold truncate">{p.label}</p>
 <p className="text-[10px] sm:text-xs font-black truncate">{p.value}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Primary action */}
 <button
 onClick={ => call}
 disabled={loading}
 className="w-full flex items-center justify-center gap-2 bg-royal-gradient text-primary-foreground px-5 py-3.5 rounded-xl font-black text-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-royal transition-transform"
 >
 {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="text-[hsl(var(--gold-light))]" />}
 {loading ? "جارٍ الجلب والتصنيف..." : "تشغيل صائد الأخبار الآن"}
 </button>

 {/* Maintenance row */}
 <div className="grid grid-cols-2 gap-2">
 <button
 onClick={ => call("backfill")}
 disabled={secondary === "backfill"}
 className="flex items-center justify-center gap-1.5 border border-border bg-background hover:bg-muted/50 px-2 py-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
 >
 {secondary === "backfill" ? <Loader2 className="animate-spin" size={13} /> : <ImageIcon size={13} />}
 صور للناقصة
 </button>
 <button
 onClick={ => call("replace-ai-images")}
 disabled={secondary === "replace"}
 className="flex items-center justify-center gap-1.5 border border-primary/40 text-primary hover:bg-primary/5 px-2 py-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
 >
 {secondary === "replace" ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
 استبدال AI بحقيقية
 </button>
 </div>

 <button
 onClick={recategorize}
 disabled={secondary === "recat"}
 className="w-full flex items-center justify-center gap-2 border-2 border-[hsl(var(--gold)/0.6)] bg-[hsl(var(--gold)/0.08)] text-foreground hover:bg-[hsl(var(--gold)/0.18)] px-4 py-3 rounded-xl text-sm font-black disabled:opacity-50 transition-colors"
 >
 {secondary === "recat" ? <Loader2 className="animate-spin" size={16} /> : <FolderTree size={16} />}
 إعادة تصنيف كل الأخبار القديمة
 </button>

 <button
 onClick={cleanSources}
 disabled={secondary === "clean"}
 className="w-full flex items-center justify-center gap-2 border-2 border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 px-4 py-3 rounded-xl text-sm font-black disabled:opacity-50 transition-colors"
 >
 {secondary === "clean" ? <Loader2 className="animate-spin" size={16} /> : <Eraser size={16} />}
 تنظيف أسماء المصادر من كل الأخبار
 </button>

 {/* Live category preview */}
 {aggregated && Object.keys(aggregated.used).length > 0 && (
 <div className="rounded-xl border border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.05)] p-3 space-y-2">
 <div className="flex items-center gap-2 text-xs font-black text-[hsl(var(--primary))]">
 <CheckCircle2 size={14} className="text-emerald-600" />
 توزيع الأقسام في آخر تشغيل
 </div>
 <div className="flex flex-wrap gap-1.5">
 {Object.entries(aggregated.used)
 .sort((a, b) => b[1] - a[1])
 .map(([slug, n]) => (
 <span key={slug} className="inline-flex items-center gap-1 text-[10px] font-bold bg-background border border-border rounded-full px-2 py-1">
 <Tag size={10} className="text-[hsl(var(--gold-dark))]" />
 {CAT_AR[slug] || slug}
 <span className="text-primary font-black">{n}</span>
 </span>
 ))}
 </div>
 {aggregated.created.length > 0 && (
 <div className="flex items-start gap-1.5 text-[10px] font-bold text-emerald-700 pt-1 border-t border-[hsl(var(--gold)/0.25)]">
 <PlusCircle size={12} className="mt-0.5 flex-shrink-0" />
 <span>أقسام جديدة أُنشئت تلقائياً: {aggregated.created.map(c => CAT_AR[c] || c).join("، ")}</span>
 </div>
 )}
 </div>
 )}

 {lastResult && (
 <details className="text-[10px]">
 <summary className="cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground">
 تفاصيل JSON الكاملة
 </summary>
 <pre className="mt-2 bg-muted/40 border border-border p-3 rounded-lg overflow-auto max-h-60 leading-relaxed" dir="ltr">
{JSON.stringify(lastResult, null, 2)}
 </pre>
 </details>
 )}
 </div>
 );
};

export default NewsFetcherPanel;
