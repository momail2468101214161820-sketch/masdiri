import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getArticlePrimaryImage } from "@/lib/articleImages";
import { ArrowLeft } from "lucide-react";

interface Item {
  id: string;
  short_id: number | null;
  title: string;
  image_url: string | null;
  images?: any;
  categories?: { name: string } | null;
}

interface Props {
  currentId: string;
  categoryId?: string | null;
  tags?: string[] | null;
}

const Block = ({ title, items }: { title: string; items: Item[] }) => {
  if (!items.length) return null;
  return (
    <section className="mt-10">
      <h2
        className="text-xl md:text-2xl font-black mb-4 pb-2 border-b-2 border-[hsl(var(--gold)/0.5)] flex items-center gap-2"
        style={{ fontFamily: "'Amiri', serif" }}
      >
        <span className="w-1.5 h-6 bg-[hsl(var(--gold))] rounded-full" />
        {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {items.map((a) => {
          const img = getArticlePrimaryImage(a as any) || "/images/logo.png";
          const href = a.short_id ? `/${a.short_id}` : `/article/${a.id}`;
          return (
            <Link key={a.id} to={href} className="group block rounded-xl overflow-hidden border border-border/60 bg-card hover:border-[hsl(var(--gold)/0.7)] hover:shadow-lg transition">
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img src={img} alt={a.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/logo.png"; }} />
              </div>
              <div className="p-3">
                <h3 className="text-xs md:text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-[hsl(var(--gold))] transition-colors" style={{ fontFamily: "'Amiri', serif" }}>{a.title}</h3>
                {a.categories?.name && <span className="text-[10px] font-black text-[hsl(var(--gold))] mt-1 inline-block">{a.categories.name}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

const RelatedArticles = ({ currentId, categoryId, tags }: Props) => {
  const [related, setRelated] = useState<Item[]>([]);
  const [alsoRead, setAlsoRead] = useState<Item[]>([]);
  const [mostRead, setMostRead] = useState<Item[]>([]);
  const [youMight, setYouMight] = useState<Item[]>([]);

  useEffect(() => {
    if (!currentId) return;
    (async () => {
      // ذات صلة (نفس القسم)
      if (categoryId) {
        const { data } = await supabase
          .from("articles").select("id, short_id, title, image_url, images, categories(name)")
          .eq("is_published", true).eq("category_id", categoryId).neq("id", currentId)
          .order("created_at", { ascending: false }).limit(4);
        setRelated((data as any) || []);
      }
      // اقرأ أيضًا (أحدث)
      const { data: latest } = await supabase
        .from("articles").select("id, short_id, title, image_url, images, categories(name)")
        .eq("is_published", true).neq("id", currentId)
        .order("created_at", { ascending: false }).limit(4);
      setAlsoRead((latest as any) || []);

      // الأكثر قراءة
      const { data: mr } = await supabase
        .from("articles").select("id, short_id, title, image_url, images, categories(name)")
        .eq("is_published", true).neq("id", currentId)
        .order("view_count", { ascending: false }).limit(4);
      setMostRead((mr as any) || []);

      // قد يعجبك (وسوم مشتركة، وإلا عشوائي بـ created_at offset)
      if (tags && tags.length) {
        const { data } = await supabase
          .from("articles").select("id, short_id, title, image_url, images, categories(name)")
          .eq("is_published", true).neq("id", currentId)
          .overlaps("tags", tags).order("created_at", { ascending: false }).limit(4);
        setYouMight((data as any) || []);
      } else {
        const { data } = await supabase
          .from("articles").select("id, short_id, title, image_url, images, categories(name)")
          .eq("is_published", true).neq("id", currentId)
          .order("created_at", { ascending: false }).range(20, 23);
        setYouMight((data as any) || []);
      }
    })();
  }, [currentId, categoryId, tags?.join("|")]);

  return (
    <div className="mt-12">
      <Block title="ذات صلة" items={related} />
      <Block title="اقرأ أيضًا" items={alsoRead} />
      <Block title="الأكثر قراءة" items={mostRead} />
      <Block title="قد يعجبك أيضًا" items={youMight} />
      <div className="mt-6 text-center">
        <Link to="/latest" className="inline-flex items-center gap-2 text-[hsl(var(--gold))] font-black hover:underline">
          المزيد من الأخبار <ArrowLeft size={16} />
        </Link>
      </div>
    </div>
  );
};

export default RelatedArticles;
