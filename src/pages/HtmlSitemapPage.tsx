import { useEffect, useState, FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { GOVERNORATES } from "@/lib/governorates";

const SITE_URL = "https://soutalbalad.lovable.app";

interface MiniArticle { id: string; short_id: number | null; title: string; created_at: string; categories: { name: string; slug: string } | null; }
interface Cat { slug: string; name: string; }

const HtmlSitemapPage = => {
 const [cats, setCats] = useState<Cat>();
 const [recent, setRecent] = useState<MiniArticle>();
 const [q, setQ] = useState("");

 useEffect( => {
 (async => {
 const [{ data: c }, { data: r }] = await Promise.all([
 supabase.from("categories").select("slug, name").order("name"),
 supabase.from("articles").select("id, short_id, title, created_at, categories(name, slug)").eq("is_published", true).order("created_at", { ascending: false }).limit(200),
 ]);
 setCats((c as Cat) || );
 setRecent((r as any) || );
 });
 }, );

 const onSearch = (e: FormEvent) => {
 e.preventDefault;
 if (q.trim) window.location.href = `/search?q=${encodeURIComponent(q.trim)}`;
 };

 return (
 <div className="min-h-screen bg-background">
 <Helmet>
 <title>خريطة الموقع | صوت البلد</title>
 <meta name="description" content="خريطة موقع صوت البلد: روابط للأقسام والمحافظات وأحدث الأخبار." />
 <link rel="canonical" href={`${SITE_URL}/sitemap`} />
 <meta name="robots" content="index, follow" />
 </Helmet>
 <SiteHeader />
 <Breadcrumbs items={[{ label: "خريطة الموقع" }]} />
 <main className="container py-6 space-y-10">
 <header>
 <h1 className="newspaper-heading text-3xl border-b-2 border-foreground pb-3 mb-4">خريطة موقع صوت البلد</h1>
 <form onSubmit={onSearch} className="flex gap-2 max-w-md">
 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في الموقع…" className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
 <button className="px-4 py-2 bg-[hsl(var(--gold))] text-[hsl(var(--primary))] rounded-lg text-sm font-black">بحث</button>
 </form>
 </header>

 <section>
 <h2 className="text-xl font-black mb-3" style={{ fontFamily: "'Amiri', serif" }}>صفحات رئيسية</h2>
 <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
 {[
 ["/", "الرئيسية"], ["/latest", "آخر الأخبار"], ["/breaking", "العاجل"], ["/most-read", "الأكثر قراءة"],
 ["/about", "من نحن"], ["/contact", "اتصل بنا"], ["/privacy", "الخصوصية"], ["/terms", "الشروط"], ["/cookies", "الكوكيز"],
 ["/results/prep", "نتيجة الشهادة الإعدادية"],
 ].map(([h, l]) => <li key={h}><Link to={h} className="hover:text-[hsl(var(--gold))] font-bold">• {l}</Link></li>)}
 </ul>
 </section>

 <section>
 <h2 className="text-xl font-black mb-3" style={{ fontFamily: "'Amiri', serif" }}>الأقسام ({cats.length})</h2>
 <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
 {cats.map((c) => <li key={c.slug}><Link to={`/category/${c.slug}`} className="hover:text-[hsl(var(--gold))] font-bold">• {c.name}</Link></li>)}
 </ul>
 </section>

 <section>
 <h2 className="text-xl font-black mb-3" style={{ fontFamily: "'Amiri', serif" }}>المحافظات</h2>
 <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
 {Object.entries(GOVERNORATES).map(([s, n]) => <li key={s}><Link to={`/governorate/${s}`} className="hover:text-[hsl(var(--gold))] font-bold">• {n}</Link></li>)}
 </ul>
 </section>

 <section>
 <h2 className="text-xl font-black mb-3" style={{ fontFamily: "'Amiri', serif" }}>أحدث الأخبار ({recent.length})</h2>
 <ul className="space-y-1 text-sm">
 {recent.map((a) => (
 <li key={a.id}>
 <Link to={a.short_id ? `/${a.short_id}` : `/article/${a.id}`} className="hover:text-[hsl(var(--gold))]">
 • {a.title}
 {a.categories?.name && <span className="text-muted-foreground mr-2">— {a.categories.name}</span>}
 </Link>
 </li>
 ))}
 </ul>
 </section>
 </main>
 <SiteFooter />
 </div>
 );
};

export default HtmlSitemapPage;
