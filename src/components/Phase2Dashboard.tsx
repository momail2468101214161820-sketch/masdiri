import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
 Activity, AlertTriangle, GitMerge, Sparkles, Tag,
 CheckCircle2, XCircle, Clock, FolderTree, Image as ImageIcon, RefreshCw, Loader2
} from "lucide-react";

type Stats = {
 articles_today: number;
 articles_week: number;
 articles_month: number;
 articles_total: number;
 ai_rewritten: number;
 merges_total: number;
 merges_today: number;
 duplicates_blocked: number;
 by_category: Record<string, number>;
 sources_health: Array<{ source: string; status: string; consecutive_failures: number; last_run_at: string | null; last_error: string | null; total_inserted: number }>;
 recent_errors: Array<{ source: string; error: string; created_at: string }>;
 recent_merges: Array<{ source_name: string; similarity: number; reason: string; created_at: string }>;
 pending_categories: number;
 images_processed: number;
};

const STATUS_COLORS: Record<string, string> = {
 ok: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
 degraded: "text-amber-600 bg-amber-500/10 border-amber-500/30",
 down: "text-rose-600 bg-rose-500/10 border-rose-500/30",
 unknown: "text-muted-foreground bg-muted/40 border-border",
};

const STATUS_LABEL: Record<string, string> = {
 ok: "يعمل", degraded: "تحذير", down: "متوقف", unknown: "غير معروف",
};

const Phase2Dashboard = => {
 const [stats, setStats] = useState<Stats | null>(null);
 const [loading, setLoading] = useState(true);
 const [pendingCats, setPendingCats] = useState<Array<{ id: string; slug: string; name: string; reason: string | null; occurrences: number }>>();

 const load = async => {
 setLoading(true);
 const { data, error } = await supabase.rpc("phase2_dashboard_stats" as any);
 if (!error && data) setStats(data as unknown as Stats);
 const { data: cats } = await supabase
 .from("suggested_categories" as any)
 .select("id, slug, name, reason, occurrences")
 .eq("status", "pending")
 .order("created_at", { ascending: false });
 setPendingCats((cats as any) || );
 setLoading(false);
 };

 useEffect( => {
 load;
 const t = setInterval(load, 30_000);
 return => clearInterval(t);
 }, );

 const approveCategory = async (id: string, slug: string, name: string) => {
 await supabase.from("categories" as any).insert({ slug, name }).then( => {});
 await supabase.from("suggested_categories" as any).update({ status: "approved" }).eq("id", id);
 load;
 };
 const rejectCategory = async (id: string) => {
 await supabase.from("suggested_categories" as any).update({ status: "rejected" }).eq("id", id);
 load;
 };

 if (loading && !stats) {
 return (
 <div className="flex items-center justify-center py-12 text-muted-foreground">
 <Loader2 className="animate-spin mr-2" size={18} /> جاري تحميل الإحصائيات...
 </div>
 );
 }
 if (!stats) return null;

 const cards = [
 { label: "أخبار اليوم", value: stats.articles_today, icon: <Clock size={18} />, color: "text-primary" },
 { label: "هذا الأسبوع", value: stats.articles_week, icon: <Activity size={18} />, color: "text-emerald-600" },
 { label: "هذا الشهر", value: stats.articles_month, icon: <Activity size={18} />, color: "text-blue-600" },
 { label: "إجمالي الأخبار", value: stats.articles_total, icon: <FolderTree size={18} />, color: "text-violet-600" },
 { label: "أعادها الذكاء الاصطناعي", value: stats.ai_rewritten, icon: <Sparkles size={18} className="text-[hsl(var(--gold))]" />, color: "text-[hsl(var(--gold-dark))]" },
 { label: "عمليات دمج (إجمالي)", value: stats.merges_total, icon: <GitMerge size={18} />, color: "text-cyan-600" },
 { label: "دمج اليوم", value: stats.merges_today, icon: <GitMerge size={18} />, color: "text-cyan-600" },
 { label: "تكرارات مُنعت اليوم", value: stats.duplicates_blocked, icon: <CheckCircle2 size={18} />, color: "text-emerald-600" },
 { label: "صور مُعالَجة", value: stats.images_processed, icon: <ImageIcon size={18} />, color: "text-pink-600" },
 ];

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h3 className="font-black text-lg flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
 <Activity className="text-primary" size={20} />
 <span className="text-gold-shine">لوحة المرحلة الثانية — مراقبة حية</span>
 </h3>
 <button onClick={load} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/40">
 <RefreshCw size={12} /> تحديث
 </button>
 </div>

 {/* Stat cards */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
 {cards.map((c, i) => (
 <div key={i} className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1">
 <div className={`flex items-center gap-1.5 text-[11px] font-bold ${c.color}`}>
 {c.icon}<span className="truncate">{c.label}</span>
 </div>
 <div className="text-2xl font-black tabular-nums">{c.value?.toLocaleString("ar-EG") || 0}</div>
 </div>
 ))}
 </div>

 {/* Sources health */}
 <div className="rounded-xl border-2 border-[hsl(var(--gold)/0.3)] bg-card p-4">
 <h4 className="font-black text-sm mb-3 flex items-center gap-2">
 <Activity size={16} className="text-primary" /> حالة مصادر الأخبار
 </h4>
 {stats.sources_health.length === 0 ? (
 <p className="text-xs text-muted-foreground">لم يتم تسجيل أي تشغيل بعد.</p>
 ) : (
 <div className="grid sm:grid-cols-2 gap-2">
 {stats.sources_health.map((s, i) => (
 <div key={i} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${STATUS_COLORS[s.status] || STATUS_COLORS.unknown}`}>
 <div className="min-w-0 flex-1">
 <div className="font-black text-xs truncate">{s.source}</div>
 <div className="text-[10px] opacity-80">
 آخر تشغيل: {s.last_run_at ? new Date(s.last_run_at).toLocaleString("ar-EG") : "—"} •
 منشور: {s.total_inserted}
 </div>
 {s.last_error && <div className="text-[10px] mt-0.5 truncate">⚠ {s.last_error}</div>}
 </div>
 <div className="text-[10px] font-black px-2 py-1 rounded bg-background/60 whitespace-nowrap">
 {STATUS_LABEL[s.status] || s.status}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="grid lg:grid-cols-2 gap-4">
 {/* By category */}
 <div className="rounded-xl border border-border bg-card p-4">
 <h4 className="font-black text-sm mb-3 flex items-center gap-2">
 <FolderTree size={16} className="text-primary" /> توزيع الأخبار حسب القسم (٣٠ يوم)
 </h4>
 <div className="space-y-1.5 max-h-64 overflow-auto">
 {Object.entries(stats.by_category || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([name, n]) => (
 <div key={name} className="flex items-center justify-between text-xs">
 <span className="font-bold truncate">{name}</span>
 <span className="tabular-nums font-black text-primary">{(n as number).toLocaleString("ar-EG")}</span>
 </div>
 ))}
 {Object.keys(stats.by_category || {}).length === 0 && (
 <p className="text-xs text-muted-foreground">لا بيانات</p>
 )}
 </div>
 </div>

 {/* Recent merges */}
 <div className="rounded-xl border border-border bg-card p-4">
 <h4 className="font-black text-sm mb-3 flex items-center gap-2">
 <GitMerge size={16} className="text-cyan-600" /> آخر عمليات الدمج
 </h4>
 <div className="space-y-2 max-h-64 overflow-auto">
 {stats.recent_merges.length === 0 ? (
 <p className="text-xs text-muted-foreground">لا توجد عمليات دمج بعد.</p>
 ) : stats.recent_merges.map((m, i) => (
 <div key={i} className="text-[11px] border-r-2 border-cyan-500/50 pr-2">
 <div className="font-bold truncate">{m.reason}</div>
 <div className="text-muted-foreground">
 من <span className="font-black">{m.source_name}</span> • تشابه {(m.similarity * 100).toFixed(0)}% • {new Date(m.created_at).toLocaleString("ar-EG")}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Pending categories */}
 {pendingCats.length > 0 && (
 <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4">
 <h4 className="font-black text-sm mb-3 flex items-center gap-2 text-amber-700">
 <Tag size={16} /> أقسام مقترحة من الذكاء الاصطناعي ({stats.pending_categories}) — بانتظار موافقتك
 </h4>
 <div className="space-y-2">
 {pendingCats.map((c) => (
 <div key={c.id} className="flex items-center justify-between gap-2 bg-card p-2.5 rounded-lg border border-border">
 <div className="min-w-0">
 <div className="font-black text-xs">{c.name} <span className="text-muted-foreground font-bold">/{c.slug}</span></div>
 {c.reason && <div className="text-[10px] text-muted-foreground truncate">{c.reason}</div>}
 </div>
 <div className="flex gap-1.5">
 <button onClick={ => approveCategory(c.id, c.slug, c.name)}
 className="text-[10px] font-black px-2 py-1.5 rounded-md bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border border-emerald-500/30">
 <CheckCircle2 size={12} className="inline ml-1" /> قبول
 </button>
 <button onClick={ => rejectCategory(c.id)}
 className="text-[10px] font-black px-2 py-1.5 rounded-md bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border border-rose-500/30">
 <XCircle size={12} className="inline ml-1" /> رفض
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Recent errors */}
 {stats.recent_errors.length > 0 && (
 <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-4">
 <h4 className="font-black text-sm mb-3 flex items-center gap-2 text-rose-700">
 <AlertTriangle size={16} /> آخر الأخطاء
 </h4>
 <div className="space-y-1.5 max-h-48 overflow-auto">
 {stats.recent_errors.map((e, i) => (
 <div key={i} className="text-[11px]">
 <span className="font-black">{e.source}</span> — {e.error}
 <span className="text-muted-foreground"> • {new Date(e.created_at).toLocaleString("ar-EG")}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
};

export default Phase2Dashboard;
