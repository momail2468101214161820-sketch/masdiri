import { useMemo, useState } from "react";
import { TrendingUp, Loader2, BarChart3, Sparkles, Search, Trophy, Eye, MousePointerClick, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAdminPin } from "@/lib/adminApi";

type Row = { query: string; clicks: number; impressions: number; ctr: number; position: number };
type SortKey = "impressions" | "clicks" | "ctr" | "position";

const SeoKeywordsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("impressions");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gsc-indexing", {
        body: { action: "top_queries" },
        headers: { "X-Admin-Pin": getAdminPin() || "" },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.message || "فشل جلب الكلمات");
      setRows(data.rows || []);
      setRange(data.range || null);
      if (!(data.rows || []).length) toast.info("لا توجد بيانات بعد — جوجل يحتاج وقت ليفهرس الموقع");
      else toast.success(`تم جلب ${data.rows.length} كلمة من جوجل ✓`);
    } catch (e: any) {
      toast.error(e?.message || "تعذّر الاتصال بجوجل");
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const term = q.trim();
    const base = term ? rows.filter((r) => r.query.includes(term)) : rows;
    const sorted = [...base].sort((a, b) => {
      if (sortKey === "position") return a.position - b.position;
      return (b as any)[sortKey] - (a as any)[sortKey];
    });
    return sorted;
  }, [rows, q, sortKey]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (acc, r) => ({ c: acc.c + r.clicks, i: acc.i + r.impressions, p: acc.p + r.position }),
      { c: 0, i: 0, p: 0 }
    );
    return { clicks: t.c, impressions: t.i, avgPos: rows.length ? t.p / rows.length : 0 };
  }, [rows]);

  const posBadge = (pos: number) => {
    if (pos <= 3) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    if (pos <= 10) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    return "bg-rose-500/15 text-rose-700 dark:text-rose-400";
  };

  return (
    <div className="bg-card border-2 border-[hsl(var(--gold)/0.4)] rounded-2xl p-5 space-y-4 shadow-lg" dir="rtl">
      <div className="flex items-start gap-3 border-b border-border pb-3">
        <div className="p-2 rounded-xl bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))]"><TrendingUp size={22} /></div>
        <div className="flex-1">
          <h3 className="font-black text-lg flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
            أفضل كلمات البحث في جوجل <Sparkles size={14} className="text-[hsl(var(--gold))]" />
          </h3>
          <p className="text-xs text-muted-foreground font-bold mt-1" style={{ fontFamily: "'Cairo', sans-serif" }}>
            الكلمات التي يبحث بها الناس ويظهر فيها موقعك — مباشر من Google Search Console (آخر 28 يوم، حتى 500 كلمة)
          </p>
        </div>
      </div>

      <button
        onClick={load}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-royal-gradient text-primary-foreground px-4 py-3 rounded-xl font-black text-sm hover:opacity-90 disabled:opacity-50 shadow-md transition-all"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <BarChart3 size={18} />}
        {loading ? "جاري جلب البيانات من جوجل..." : `اعرض أفضل كلمات البحث${rows.length ? ` (تم تحميل ${rows.length})` : ""}`}
      </button>

      {range && (
        <p className="text-[11px] text-muted-foreground text-center font-bold" dir="ltr">{range.start} → {range.end}</p>
      )}

      {rows.length > 0 && (
        <>
          {/* Totals */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <MousePointerClick size={16} className="mx-auto text-emerald-600 mb-1" />
              <div className="text-lg font-black text-emerald-600">{totals.clicks.toLocaleString("ar-EG")}</div>
              <div className="text-[10px] font-bold text-muted-foreground">نقرات</div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <Eye size={16} className="mx-auto text-blue-600 mb-1" />
              <div className="text-lg font-black text-blue-600">{totals.impressions.toLocaleString("ar-EG")}</div>
              <div className="text-[10px] font-bold text-muted-foreground">مرات الظهور</div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <Target size={16} className="mx-auto text-[hsl(var(--gold-dark))] mb-1" />
              <div className="text-lg font-black text-[hsl(var(--primary))]">{totals.avgPos.toFixed(1)}</div>
              <div className="text-[10px] font-bold text-muted-foreground">متوسط الترتيب</div>
            </div>
          </div>

          {/* Top 3 podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {rows.slice(0, 3).map((r, i) => (
              <div key={i} className="rounded-xl border-2 border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.05)] p-3 flex items-start gap-2">
                <Trophy size={18} className={["text-yellow-500", "text-gray-400", "text-amber-700"][i]} />
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm truncate" title={r.query}>{r.query}</div>
                  <div className="text-[11px] text-muted-foreground font-bold mt-0.5">
                    ظهور {r.impressions.toLocaleString("ar-EG")} • ترتيب {r.position.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث داخل الكلمات…"
                className="w-full bg-background border border-border rounded-xl pr-9 pl-3 py-2 text-sm font-bold"
              />
            </div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-sm font-bold"
            >
              <option value="impressions">ترتيب: الأكثر ظهورًا</option>
              <option value="clicks">ترتيب: الأكثر نقرًا</option>
              <option value="ctr">ترتيب: أعلى CTR</option>
              <option value="position">ترتيب: أفضل موقع في جوجل</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-border max-h-[480px]">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-muted-foreground sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-center font-black w-10">#</th>
                  <th className="px-3 py-2 text-right font-black">الكلمة</th>
                  <th className="px-2 py-2 text-center font-black">نقرات</th>
                  <th className="px-2 py-2 text-center font-black">ظهور</th>
                  <th className="px-2 py-2 text-center font-black">CTR</th>
                  <th className="px-2 py-2 text-center font-black">الترتيب</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className="border-t border-border hover:bg-[hsl(var(--gold)/0.05)]">
                    <td className="px-2 py-2 text-center text-muted-foreground font-bold">{i + 1}</td>
                    <td className="px-3 py-2 font-bold">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(r.query)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="hover:text-[hsl(var(--gold-dark))] hover:underline"
                      >{r.query}</a>
                    </td>
                    <td className="px-2 py-2 text-center text-emerald-600 font-black">{r.clicks.toLocaleString("ar-EG")}</td>
                    <td className="px-2 py-2 text-center font-bold">{r.impressions.toLocaleString("ar-EG")}</td>
                    <td className="px-2 py-2 text-center font-bold">{(r.ctr * 100).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-block min-w-[36px] px-2 py-0.5 rounded-md font-black ${posBadge(r.position)}`}>
                        {r.position.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground font-bold">لا توجد كلمات مطابقة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!rows.length && !loading && (
        <p className="text-[11px] text-muted-foreground text-center bg-muted/30 rounded-lg p-3" style={{ fontFamily: "'Cairo', sans-serif" }}>
          اضغط الزر لجلب الكلمات. الترتيب الأخضر (1–3) ممتاز، الأصفر (4–10) جيد، الأحمر (+10) يحتاج تحسين.
        </p>
      )}
    </div>
  );
};

export default SeoKeywordsPanel;
