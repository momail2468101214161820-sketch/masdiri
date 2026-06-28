import { useEffect, useMemo, useState } from "react";
import { adminListMessages, adminUpdate, adminDelete } from "@/lib/adminApi";
import { Mail, MailOpen, MailCheck, Trash2, RefreshCw, Search, Inbox } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Status = "Unread" | "Read" | "Replied";
interface Message {
 id: string;
 name: string;
 email: string;
 subject: string | null;
 message: string;
 status: Status;
 source: string;
 created_at: string;
}

const STATUS_META: Record<Status, { label: string; icon: any; color: string }> = {
 Unread: { label: "جديدة", icon: Mail, color: "hsl(0 70% 55%)" },
 Read: { label: "مقروءة", icon: MailOpen, color: "hsl(40 90% 50%)" },
 Replied: { label: "تم الرد", icon: MailCheck, color: "hsl(140 55% 45%)" },
};

const fmt = (d: string) => {
 try {
 return new Date(d).toLocaleString("ar-EG", {
 year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
 });
 } catch { return d; }
};

const MessagesInbox = => {
 const [items, setItems] = useState<Message>();
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState<"all" | Status>("all");
 const [q, setQ] = useState("");
 const [unread, setUnread] = useState(0);
 const [open, setOpen] = useState<Message | null>(null);

 const load = async => {
 setLoading(true);
 try {
 const res = await adminListMessages(filter === "all" ? undefined : filter, 200);
 setItems(res.data || );
 setUnread(res.unread || 0);
 } catch (e: any) {
 toast({ title: "تعذر تحميل الرسائل", description: e.message, variant: "destructive" });
 } finally {
 setLoading(false);
 }
 };
 useEffect( => { load; /* eslint-disable-next-line */ }, [filter]);

 const filtered = useMemo( => {
 const s = q.trim.toLowerCase;
 if (!s) return items;
 return items.filter((m) =>
 [m.name, m.email, m.subject ?? "", m.message].join("").toLowerCase.includes(s)
 );
 }, [items, q]);

 const setStatus = async (m: Message, status: Status) => {
 try {
 await adminUpdate("messages", { id: m.id }, { status });
 setItems((prev) => prev.map((it) => (it.id === m.id ? { ...it, status } : it)));
 if (open?.id === m.id) setOpen({ ...m, status });
 if (m.status === "Unread" && status !== "Unread") setUnread((u) => Math.max(0, u - 1));
 if (m.status !== "Unread" && status === "Unread") setUnread((u) => u + 1);
 } catch (e: any) {
 toast({ title: "فشل التحديث", description: e.message, variant: "destructive" });
 }
 };

 const remove = async (m: Message) => {
 if (!confirm(`حذف رسالة ${m.name}؟`)) return;
 try {
 await adminDelete("messages", { id: m.id });
 setItems((prev) => prev.filter((it) => it.id !== m.id));
 if (open?.id === m.id) setOpen(null);
 if (m.status === "Unread") setUnread((u) => Math.max(0, u - 1));
 } catch (e: any) {
 toast({ title: "فشل الحذف", description: e.message, variant: "destructive" });
 }
 };

 return (
 <div className="rounded-2xl border-2 bg-card p-4 md:p-6" style={{ borderColor: "hsl(var(--gold)/0.4)" }} dir="rtl">
 <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
 <div className="flex items-center gap-2">
 <Inbox className="w-5 h-5 text-[hsl(var(--gold))]" />
 <h2 className="font-bold text-lg m-0">صندوق رسائل التواصل</h2>
 {unread > 0 && (
 <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: STATUS_META.Unread.color }}>
 {unread} غير مقروءة
 </span>
 )}
 </div>
 <button onClick={load} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border-2 hover:bg-[hsl(var(--gold)/0.1)]"
 style={{ borderColor: "hsl(var(--gold)/0.4)" }}>
 <RefreshCw className="w-3.5 h-3.5" /> تحديث
 </button>
 </div>

 <div className="flex flex-wrap items-center gap-2 mb-3">
 {(["all", "Unread", "Read", "Replied"] as const).map((f) => (
 <button key={f} onClick={ => setFilter(f)}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${filter === f ? "bg-[hsl(var(--gold))] text-[hsl(var(--royal-navy))]" : "hover:bg-muted"}`}
 style={{ borderColor: "hsl(var(--gold)/0.4)" }}>
 {f === "all" ? "الكل" : STATUS_META[f].label}
 </button>
 ))}
 <div className="relative flex-1 min-w-[200px]">
 <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم / البريد / المحتوى"
 className="w-full rounded-lg border-2 pr-9 pl-3 py-2 text-sm bg-background focus:outline-none focus:border-[hsl(var(--gold))]"
 style={{ borderColor: "hsl(var(--gold)/0.3)" }} />
 </div>
 </div>

 {loading ? (
 <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل…</p>
 ) : filtered.length === 0 ? (
 <p className="text-sm text-muted-foreground py-8 text-center">لا توجد رسائل</p>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="text-xs text-muted-foreground border-b-2" style={{ borderColor: "hsl(var(--gold)/0.3)" }}>
 <tr>
 <th className="text-right py-2 px-2">الحالة</th>
 <th className="text-right py-2 px-2">المرسل</th>
 <th className="text-right py-2 px-2">الموضوع</th>
 <th className="text-right py-2 px-2 hidden md:table-cell">التاريخ</th>
 <th className="text-right py-2 px-2">إجراءات</th>
 </tr>
 </thead>
 <tbody>
 {filtered.map((m) => {
 const meta = STATUS_META[m.status];
 const Icon = meta.icon;
 return (
 <tr key={m.id} className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
 onClick={ => { setOpen(m); if (m.status === "Unread") setStatus(m, "Read"); }}>
 <td className="py-2 px-2">
 <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full text-white"
 style={{ background: meta.color }}>
 <Icon className="w-3 h-3" /> {meta.label}
 </span>
 </td>
 <td className="py-2 px-2">
 <div className={`font-bold ${m.status === "Unread" ? "text-foreground" : "text-muted-foreground"}`}>{m.name}</div>
 <div className="text-xs text-muted-foreground" dir="ltr">{m.email}</div>
 </td>
 <td className="py-2 px-2 max-w-[280px] truncate">{m.subject || <span className="text-muted-foreground">—</span>}</td>
 <td className="py-2 px-2 hidden md:table-cell text-xs text-muted-foreground">{fmt(m.created_at)}</td>
 <td className="py-2 px-2" onClick={(e) => e.stopPropagation}>
 <button onClick={ => remove(m)} className="p-1.5 rounded hover:bg-destructive/15 text-destructive" title="حذف">
 <Trash2 className="w-4 h-4" />
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {open && (
 <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={ => setOpen(null)}>
 <div className="bg-background rounded-2xl border-2 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 md:p-6"
 style={{ borderColor: "hsl(var(--gold)/0.6)" }} onClick={(e) => e.stopPropagation} dir="rtl">
 <div className="flex items-start justify-between gap-3 mb-3">
 <div>
 <h3 className="font-bold text-lg m-0">{open.subject || "(بدون موضوع)"}</h3>
 <p className="text-xs text-muted-foreground m-0 mt-1">{fmt(open.created_at)} • {open.source}</p>
 </div>
 <button onClick={ => setOpen(null)} className="text-xl px-2 leading-none">×</button>
 </div>
 <div className="text-sm mb-4">
 <div className="font-bold">{open.name}</div>
 <a href={`mailto:${open.email}`} className="text-[hsl(var(--gold))]" dir="ltr">{open.email}</a>
 </div>
 <div className="whitespace-pre-wrap rounded-lg border p-4 bg-muted/30 text-sm leading-relaxed" style={{ borderColor: "hsl(var(--gold)/0.3)" }}>
 {open.message}
 </div>
 <div className="flex flex-wrap gap-2 mt-4">
 {(["Unread", "Read", "Replied"] as Status).map((s) => (
 <button key={s} onClick={ => setStatus(open, s)}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${open.status === s ? "text-white" : "hover:bg-muted"}`}
 style={{ borderColor: STATUS_META[s].color, background: open.status === s ? STATUS_META[s].color : "transparent" }}>
 {STATUS_META[s].label}
 </button>
 ))}
 <a href={`mailto:${open.email}?subject=${encodeURIComponent("رد: " + (open.subject || "رسالتك إلى صوت البلد"))}`}
 className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 hover:bg-[hsl(var(--gold)/0.1)]"
 style={{ borderColor: "hsl(var(--gold)/0.5)" }}>
 الرد عبر البريد
 </a>
 <button onClick={ => remove(open)}
 className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-destructive text-destructive hover:bg-destructive/10 mr-auto">
 <Trash2 className="w-3.5 h-3.5 inline -mt-0.5" /> حذف
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default MessagesInbox;
