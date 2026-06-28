import { useEffect, useState } from "react";
import { Search, X, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Result {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  created_at: string;
  is_breaking: boolean;
  categories: { name: string; slug: string } | null;
}

const CATS = [
  { slug: "", name: "كل الأقسام" },
  { slug: "politics", name: "سياسة" },
  { slug: "sports", name: "رياضة" },
  { slug: "economy", name: "اقتصاد" },
  { slug: "accidents", name: "حوادث" },
  { slug: "technology", name: "تكنولوجيا" },
];

const OracleSearch = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      let query = supabase
        .from("articles")
        .select("id, title, summary, image_url, created_at, is_breaking, categories(name, slug)")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30);
      if (q.trim()) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%,summary.ilike.%${q}%`);
      if (date) {
        const start = new Date(date).toISOString();
        const end = new Date(new Date(date).getTime() + 86400000).toISOString();
        query = query.gte("created_at", start).lt("created_at", end);
      }
      const { data } = await query;
      let list = (data ?? []) as unknown as Result[];
      if (cat) list = list.filter(r => r.categories?.slug === cat);
      setResults(list);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat, date, open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="البحث الشامل"
        className="relative w-10 h-10 grid place-items-center rounded-full border border-[hsl(var(--gold)/0.55)] bg-[hsl(var(--background)/0.5)] backdrop-blur shadow-[0_0_18px_-4px_hsl(var(--gold)/0.65)] hover:scale-110 transition-transform"
      >
        <Search size={18} style={{ color: "hsl(var(--gold))" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
            style={{ background: "hsl(var(--royal-blue-dark) / 0.78)", backdropFilter: "blur(14px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: -20, scale: 0.97 }} animate={{ y: 0, scale: 1 }}
              className="w-full max-w-3xl bg-background/95 border-2 rounded-xl shadow-2xl overflow-hidden"
              style={{ borderColor: "hsl(var(--gold) / 0.55)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Search size={20} style={{ color: "hsl(var(--gold))" }} />
                <input
                  autoFocus value={q} onChange={e => setQ(e.target.value)}
                  placeholder="ابحث في صوت البلد..."
                  className="flex-1 bg-transparent outline-none text-lg font-bold"
                />
                <button onClick={() => setOpen(false)} className="p-1"><X size={20} /></button>
              </div>
              <div className="p-3 flex flex-wrap gap-2 border-b border-border bg-muted/40">
                <select value={cat} onChange={e => setCat(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-sm font-bold">
                  {CATS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-sm" />
                {(q || cat || date) && (
                  <button onClick={() => { setQ(""); setCat(""); setDate(""); }}
                    className="text-xs text-accent font-bold px-2">مسح الفلاتر</button>
                )}
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <p className="p-6 text-center text-muted-foreground">العرّاف بيدوّر يا ريس...</p>
                ) : results.length === 0 ? (
                  <p className="p-6 text-center text-muted-foreground">مفيش نتائج. جرّب كلمة تانية.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {results.map(r => (
                      <li key={r.id}>
                        <Link to={`/article/${r.id}`} onClick={() => setOpen(false)}
                          className="flex gap-3 p-3 hover:bg-muted/60 transition-colors">
                          {r.image_url && (
                            <img src={r.image_url} alt={r.title} className="w-20 h-20 object-cover rounded" loading="lazy" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <ShieldCheck size={14} style={{ color: "hsl(var(--gold))" }} />
                              {r.categories?.name && (
                                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded">{r.categories.name}</span>
                              )}
                              {r.is_breaking && <span className="text-[10px] font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded">عاجل</span>}
                            </div>
                            <h4 className="font-bold text-sm line-clamp-2">{r.title}</h4>
                            {r.summary && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{r.summary}</p>}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OracleSearch;
