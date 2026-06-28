import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BreakingTicker = () => {
  const [breakingNews, setBreakingNews] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const fetchBreaking = async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title")
        .eq("is_breaking", true)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (data) setBreakingNews(data);
    };
    fetchBreaking();
    const ch = supabase
      .channel("breaking-ticker")
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, fetchBreaking)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  if (breakingNews.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden border-y"
      style={{
        background: "hsl(var(--primary))",
        borderColor: "hsl(var(--gold) / 0.3)",
      }}
      role="region"
      aria-label="عاجل"
    >
      <div className="flex items-stretch">
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 font-extrabold text-xs tracking-widest uppercase z-10"
          style={{
            background: "hsl(var(--accent))",
            color: "hsl(var(--accent-foreground))",
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            clipPath: "polygon(0 0, 100% 0, 92% 100%, 0% 100%)",
            paddingInlineEnd: "1.5rem",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          عاجل
        </div>
        <div className="overflow-hidden flex-1 flex items-center">
          <div className="animate-ticker whitespace-nowrap flex gap-12 px-6">
            {[...breakingNews, ...breakingNews].map((item, i) => (
              <a
                key={`${item.id}-${i}`}
                href={`/article/${item.id}`}
                className="text-sm font-semibold transition-colors"
                style={{
                  color: "hsl(var(--primary-foreground))",
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                <span style={{ color: "hsl(var(--gold))" }} className="mx-2">◆</span>
                {item.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingTicker;
