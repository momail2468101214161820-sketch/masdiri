import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Home, MapPin, Award, Users, Sparkles, Newspaper, Facebook, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { OFFICIAL_FACEBOOK, SITE_NAME_AR, SITE_SLOGAN } from "@/lib/siteUrl";

const categories = [
  { name: "الرئيسية", slug: "/", icon: Home },
  { name: "بني سويف", slug: "/category/beni-suef", icon: MapPin },
  { name: "قصص نجاح", slug: "/category/success-stories", icon: Award },
  { name: "شخصيات ملهمة", slug: "/category/inspiring-people", icon: Sparkles },
  { name: "مبادرات مجتمعية", slug: "/category/community-initiatives", icon: Users },
  { name: "إنجازات محلية", slug: "/category/local-achievements", icon: Award },
  { name: "أخبار عامة", slug: "/category/general", icon: Newspaper },
];

const SiteHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-3 py-3">
          {/* Mobile */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-lg border border-border hover:bg-muted transition" aria-label="فتح القائمة">
                <Menu size={20} className="text-primary" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[340px] p-0">
              <SheetHeader className="p-5 border-b border-border" style={{ background: "var(--gradient-primary)" }}>
                <SheetTitle className="flex items-center gap-3 text-white">
                  <img src="/images/logo.png" alt="" className="w-11 h-11 rounded-full ring-2 ring-white/50" />
                  <div className="text-right">
                    <div className="text-lg font-black">{SITE_NAME_AR}</div>
                    <div className="text-[11px] opacity-90">الخبر من مصدره</div>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-3 gap-1">
                {categories.map((cat) => {
                  const active = location.pathname === cat.slug;
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.slug}
                      to={cat.slug}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon size={18} />
                      <span>{cat.name}</span>
                    </Link>
                  );
                })}
                <div className="my-2 h-px bg-border" />
                <a
                  href={OFFICIAL_FACEBOOK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: "#1877F2" }}
                >
                  <Facebook size={16} /> صفحتنا على فيسبوك
                </a>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Wordmark */}
          <Link to="/" className="flex items-center gap-3 min-w-0 group">
            <img
              src="/images/logo.png"
              alt="Masdiri Plus"
              className="h-11 w-11 md:h-12 md:w-12 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition"
            />
            <div className="min-w-0">
              <div className="text-xl md:text-2xl font-black leading-tight gradient-text">
                {SITE_NAME_AR}
              </div>
              <p className="hidden md:block text-[11px] font-bold text-muted-foreground">
                الخبر من مصدره
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {categories.slice(0, 6).map((cat) => {
              const active = location.pathname === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  to={cat.slug}
                  className={`relative px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
                    active ? "text-primary bg-primary/10" : "text-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <Link
              to="/search"
              className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border hover:bg-muted transition"
              aria-label="بحث"
            >
              <Search size={18} className="text-foreground" />
            </Link>
            <a
              href={OFFICIAL_FACEBOOK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white transition-transform hover:-translate-y-0.5"
              style={{ background: "#1877F2" }}
              aria-label="صفحتنا على فيسبوك"
            >
              <Facebook size={18} fill="white" />
            </a>
          </div>
        </div>
      </div>

      {/* Slogan bar (mobile only) */}
      <div className="lg:hidden border-t border-border bg-primary/5">
        <div className="container mx-auto px-4 py-1.5 text-center">
          <p className="text-[11px] font-bold text-primary">📰 {SITE_SLOGAN}</p>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
