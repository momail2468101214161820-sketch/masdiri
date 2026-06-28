import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hash } from "lucide-react";

const TrendingTags = () => {
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("articles")
        .select("title, categories(name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(80);
      if (!data) return;
      const map = new Map<string, number>();
      data.forEach((a: any) => {
        const n = a.categories?.name;
        if (n) map.set(n, (map.get(n) || 0) + 1);
      });
      setTags(
        Array.from(map.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12)
      );
    };
    load();
  }, []);

  if (tags.length === 0) return null;
  const max = tags[0].count;

  return (
    <div className="card-editorial p-5">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: "hsl(var(--gold) / 0.4)" }}>
        <Hash size={14} style={{ color: "hsl(var(--gold-dark))" }} />
        <h3 className="font-bold text-sm" style={{ fontFamily: "'Amiri', serif", color: "hsl(var(--primary))" }}>
          الأكثر تداولاً
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => {
          const weight = 0.7 + (t.count / max) * 0.6;
          return (
            <a
              key={t.name}
              href={`/category/${encodeURIComponent(t.name)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.08)]"
              style={{
                borderColor: "hsl(var(--border))",
                fontSize: `${0.7 + weight * 0.25}rem`,
                fontFamily: "'Tajawal', sans-serif",
                color: "hsl(var(--foreground))",
                fontWeight: weight > 1 ? 700 : 500,
              }}
            >
              #{t.name}
              <span className="tabular text-[10px]" style={{ color: "hsl(var(--gold-dark))" }}>{t.count}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingTags;
