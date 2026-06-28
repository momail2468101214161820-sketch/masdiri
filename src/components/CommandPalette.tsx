import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, ArrowLeft } from "lucide-react";

interface Hit { id: string; title: string; categories: { name: string } | null }

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [all, setAll] = useState<Hit[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || all.length) return;
    supabase
      .from("articles")
      .select("id, title, categories(name)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(120)
      .then(({ data }) => data && setAll(data as any));
  }, [open, all.length]);

  const hits = useMemo(() => {
    if (!q.trim()) return all.slice(0, 8);
    const n = q.trim().toLowerCase();
    return all.filter((a) => a.title.toLowerCase().includes(n)).slice(0, 12);
  }, [q, all]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-start pt-[12vh] px-4 backdrop-blur-md"
      style={{ background: "hsl(var(--royal-blue-dark) / 0.6)" }}
      onClick={() => setOpen(false)}
      role="dialog"
      aria-label="بحث سريع"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl overflow-hidden shadow-royal border"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--gold) / 0.5)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <Search size={18} style={{ color: "hsl(var(--gold-dark))" }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث في الأخبار…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ fontFamily: "'Tajawal', sans-serif" }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border tabular" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>ESC</kbd>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto">
          {hits.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد نتائج</li>
          ) : (
            hits.map((a) => (
              <li key={a.id}>
                <a
                  href={`/article/${a.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--gold)/0.08)] transition-colors group"
                >
                  <ArrowLeft size={14} style={{ color: "hsl(var(--gold))" }} className="opacity-0 group-hover:opacity-100" />
                  <span className="flex-1 text-sm font-semibold" style={{ fontFamily: "'Tajawal', sans-serif" }}>{a.title}</span>
                  {a.categories?.name && (
                    <span className="kicker text-[10px]">{a.categories.name}</span>
                  )}
                </a>
              </li>
            ))
          )}
        </ul>
        <div className="px-4 py-2 border-t text-[11px] flex justify-between" style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
          <span>افتح بأي وقت بـ <kbd className="px-1 rounded border" style={{ borderColor: "hsl(var(--border))" }}>Ctrl</kbd> + <kbd className="px-1 rounded border" style={{ borderColor: "hsl(var(--border))" }}>K</kbd></span>
          <span>{hits.length} نتيجة</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
