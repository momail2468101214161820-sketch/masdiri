import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Bookmark, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import BookmarksDrawer from "./BookmarksDrawer";
import { getBookmarks } from "@/lib/bookmarks";

const categories = [
  { name: "سياسة", slug: "/category/politics" },
  { name: "رياضة", slug: "/category/sports" },
  { name: "حوادث", slug: "/category/accidents" },
  { name: "اقتصاد", slug: "/category/economy" },
  { name: "تكنولوجيا", slug: "/category/technology" },
  { name: "أسعار", slug: "/category/prices" },
  { name: "فن ومنوعات", slug: "/category/entertainment" },
  { name: "صحة وأسرة", slug: "/category/health" },
];

const navItemBase =
  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-bold transition-colors";

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const [catsOpen, setCatsOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(getBookmarks().length);
    refresh();
    window.addEventListener("sab:bookmarks-changed", refresh);
    return () => window.removeEventListener("sab:bookmarks-changed", refresh);
  }, []);

  // Hide on admin routes
  if (pathname.startsWith("/admin")) return null;

  const isActive = (p: string) => pathname === p;

  return (
    <>
      {/* spacer so content isn't covered */}
      <div className="md:hidden h-16" aria-hidden />

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-[hsl(var(--gold)/0.5)] shadow-[0_-6px_24px_-6px_hsl(var(--primary)/0.25)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch h-16">
          <Link
            to="/"
            className={`${navItemBase} ${isActive("/") ? "text-[hsl(var(--gold-dark))]" : "text-muted-foreground"}`}
          >
            <Home size={20} />
            <span>الرئيسية</span>
          </Link>

          <Sheet open={catsOpen} onOpenChange={setCatsOpen}>
            <SheetTrigger asChild>
              <button className={`${navItemBase} text-muted-foreground`}>
                <LayoutGrid size={20} />
                <span>الأقسام</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl bg-background border-t-2 border-[hsl(var(--gold)/0.5)] max-h-[70vh]">
              <SheetHeader>
                <SheetTitle className="text-center text-[hsl(var(--primary))]" style={{ fontFamily: "'Amiri', serif" }}>
                  الأقسام
                </SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 mt-5 pb-6">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to={c.slug}
                    onClick={() => setCatsOpen(false)}
                    className="bg-card border border-border rounded-2xl py-4 text-center text-sm font-black hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.08)] transition-all"
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    {c.name}
                  </Link>
                ))}
                <Link
                  to="/results/prep"
                  onClick={() => setCatsOpen(false)}
                  className="col-span-3 bg-royal-gradient text-primary-foreground rounded-2xl py-3 text-center text-sm font-black flex items-center justify-center gap-2 border-gold-glow"
                >
                  <GraduationCap size={18} /> استعلم عن نتيجة الإعدادية
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            to="/"
            aria-label="الرئيسية"
            className="relative -mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-royal-gradient border-2 border-[hsl(var(--gold))] shadow-gold-glow self-center"
          >
            <img src="/images/logo.png" alt="" className="w-10 h-10 rounded-full object-cover" />
          </Link>

          <Link
            to="/results/prep"
            className={`${navItemBase} ${isActive("/results/prep") ? "text-[hsl(var(--gold-dark))]" : "text-muted-foreground"}`}
          >
            <GraduationCap size={20} />
            <span>النتائج</span>
          </Link>


          <BookmarksDrawer
            trigger={
              <button className={`${navItemBase} text-muted-foreground relative`}>
                <Bookmark size={20} />
                <span>المحفوظات</span>
                {count > 0 && (
                  <span className="absolute top-2 left-1/2 translate-x-3 bg-accent text-accent-foreground text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            }
          />
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
