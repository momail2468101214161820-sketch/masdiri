import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Flame } from "lucide-react";

interface Item {
 id: string;
 title: string;
 view_count: number | null;
 categories: { name: string } | null;
}

const MostReadWidget = => {
 const [items, setItems] = useState<Item>();

 useEffect( => {
 const load = async => {
 const since = new Date(Date.now - 1000 * 60 * 60 * 72).toISOString;
 const { data } = await supabase
 .from("articles")
 .select("id, title, view_count, categories(name)")
 .eq("is_published", true)
 .gte("created_at", since)
 .order("view_count", { ascending: false })
 .limit(5);
 if (data) setItems(data as any);
 };
 load;
 const t = setInterval(load, 60_000);
 return => clearInterval(t);
 }, );

 if (items.length === 0) return null;

 return (
 <div
 className="card-editorial p-5"
 style={{ background: "hsl(var(--card))" }}
 >
 <div className="flex items-center gap-2 pb-3 mb-4 border-b" style={{ borderColor: "hsl(var(--gold) / 0.4)" }}>
 <Flame size={16} style={{ color: "hsl(var(--accent))" }} />
 <h3
 className="font-bold text-base"
 style={{ fontFamily: "'Amiri', serif", color: "hsl(var(--primary))" }}
 >
 الأكثر قراءة
 </h3>
 <TrendingUp size={14} className="mr-auto" style={{ color: "hsl(var(--gold-dark))" }} />
 </div>
 <ol className="space-y-4">
 {items.map((a, i) => (
 <li key={a.id} className="group">
 <a href={`/article/${a.id}`} className="flex gap-3 items-start">
 <span
 className="shrink-0 text-3xl font-black leading-none tabular"
 style={{
 fontFamily: "'Amiri', serif",
 color: i === 0 ? "hsl(var(--accent))" : "hsl(var(--gold-dark))",
 WebkitTextStroke: i === 0 ? "0" : "0",
 opacity: 0.85,
 }}
 >
 {String(i + 1).padStart(2, "0")}
 </span>
 <div className="flex-1 min-w-0">
 {a.categories?.name && (
 <span className="kicker text-[10px]" style={{ marginBottom: 4 }}>
 {a.categories.name}
 </span>
 )}
 <h4
 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-[hsl(var(--accent))] transition-colors"
 style={{ fontFamily: "'Tajawal', sans-serif", color: "hsl(var(--foreground))" }}
 >
 {a.title}
 </h4>
 </div>
 </a>
 </li>
 ))}
 </ol>
 </div>
 );
};

export default MostReadWidget;
