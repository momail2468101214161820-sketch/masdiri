import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, GraduationCap, Home, Landmark, Trophy, Siren,
  TrendingUp, Cpu, Coins, Music, HeartPulse, Radio,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import OracleSearch from "./OracleSearch";
import AdSlot from "./AdSlot";
import InstallAppButton from "./InstallAppButton";
import LanguageSwitcher from "./LanguageSwitcher";

const categories = [
  { name: "الرئيسية", slug: "/", icon: Home },
  { name: "سياسة", slug: "/category/politics", icon: Landmark },
  { name: "رياضة", slug: "/category/sports", icon: Trophy },
  { name: "حوادث", slug: "/category/accidents", icon: Siren },
  { name: "اقتصاد", slug: "/category/economy", icon: TrendingUp },
  { name: "تكنولوجيا", slug: "/category/technology", icon: Cpu },
  { name: "أسعار", slug: "/category/prices", icon: Coins },
  { name: "فن ومنوعات", slug: "/category/entertainment", icon: Music },
  { name: "صحة وأسرة", slug: "/category/health", icon: HeartPulse },
];

const SiteHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="glass-header sticky top-0 z-50">
      {/* === Editorial utility bar === */}
      <div className="utility-bar hidden md:block">
        <div className="container flex items-center justify-between h-8">
          <div className="flex items-center">
            <span className="tabular">{today}</span>
            <span className="sep" />
            <span>القاهرة 32°</span>
            <span className="sep" />
            <span className="tracking-[0.14em] uppercase text-[10px] text-[hsl(var(--gold-light))]">آخر تحديث الآن</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/results/prep" className="hover:text-[hsl(var(--gold-light))] transition-colors">نتيجة الإعدادية</Link>
            <span className="sep" />
            <Link to="/about" className="hover:text-[hsl(var(--gold-light))] transition-colors">عن المنصة</Link>
            <span className="sep" />
            <Link to="/contact" className="hover:text-[hsl(var(--gold-light))] transition-colors">تواصل معنا</Link>
          </div>
        </div>
      </div>

      <div className="container py-2 md:py-3">

        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Mobile drawer trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden p-2 rounded-lg border border-[hsl(var(--gold)/0.4)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--gold)/0.1)]"
                aria-label="فتح القائمة"
              >
                <Menu size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[360px] bg-background border-l-2 border-[hsl(var(--gold)/0.5)] p-0">
              <SheetHeader className="bg-royal-gradient p-5 text-primary-foreground">
                <SheetTitle className="flex items-center gap-3 text-primary-foreground">
                  <img src="/images/logo.png" alt="" className="w-12 h-12 rounded-full border-2 border-[hsl(var(--gold))]" />
                  <div className="text-right">
                    <div className="text-lg font-black text-gold-shine" style={{ fontFamily: "'Amiri', serif" }}>
                      مصدري
                    </div>
                    <div className="text-[10px] opacity-80">مصدري للأخبار المصرية والعالمية</div>
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all ${
                        active
                          ? "bg-gold-gradient text-primary shadow-gold-glow"
                          : "text-foreground hover:bg-[hsl(var(--gold)/0.1)] border border-transparent hover:border-[hsl(var(--gold)/0.4)]"
                      }`}
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      <Icon size={18} className={active ? "text-primary" : "text-[hsl(var(--gold))]"} />
                      <span>{cat.name}</span>
                    </Link>
                  );
                })}
                <div className="my-2 h-px bg-[hsl(var(--gold)/0.3)]" />
                <Link
                  to="/results/prep"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black bg-royal-gradient text-primary-foreground"
                >
                  <GraduationCap size={16} /> نتيجة الإعدادية
                </Link>
              </nav>
              <div className="px-3 pb-3">
                <InstallAppButton className="w-full justify-center" />
              </div>
              <div className="p-4 mt-2 border-t border-border text-[10px] text-muted-foreground text-center font-bold">
                برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم
                <div dir="ltr" className="opacity-70 mt-1"></div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 md:gap-3 min-w-0">
            <img
              src="/images/logo.png"
              alt="مصدري"
              className="h-10 w-10 md:h-16 md:w-16 rounded-full logo-3d object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              {location.pathname === "/" ? (
                <h1
                  className="newspaper-heading text-base md:text-xl leading-tight truncate"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  مصدري — أحدث أخبار مصر، الرياضة، الاقتصاد، والنتائج
                </h1>
              ) : (
                <div
                  className="newspaper-heading text-base md:text-xl leading-tight truncate"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  مصدري <span className="hidden sm:inline" style={{ color: "hsl(var(--accent))" }}>— مصدري للأخبار المصرية والعالمية</span>
                </div>
              )}
              <p className="hidden md:flex items-center gap-2 text-[12px] mt-1 font-black" style={{ color: "hsl(var(--gold))", fontFamily: "'Amiri', serif" }}>
                <span className="text-[hsl(var(--gold-light))]">✦</span>
                برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم
                <span className="text-[hsl(var(--gold-light))]">✦</span>
              </p>
              <p className="hidden md:block text-[10px] opacity-90 tracking-wide font-bold" style={{ color: "hsl(var(--gold-light))" }}>
                تطوير وتصميم التقني/ خالد عاطف عبدالحكيم عويس
              </p>

            </div>
          </Link>

          <div className="hidden lg:block flex-1 max-w-md mx-4">
            <AdSlot slot="header" className="h-16" />
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <OracleSearch />
            <LanguageSwitcher />
            
            <div className="hidden md:block"><InstallAppButton /></div>
            <div className="hidden md:block text-left">
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient primary nav */}
      <nav className="bg-royal-gradient border-y border-[hsl(var(--gold)/0.55)] shadow-elegant">
        <div className="container hidden md:flex items-center justify-between gap-1">
          <div className="flex items-center">
            {categories.map((cat) => {
              const active = location.pathname === cat.slug;
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  to={cat.slug}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-smooth ${
                    active ? "text-gold-shine" : "text-primary-foreground/90 hover:text-[hsl(var(--gold-light))]"
                  }`}
                >
                  <Icon size={16} className={active ? "text-[hsl(var(--gold))]" : "opacity-80"} />
                  <span>{cat.name}</span>
                  <span
                    className={`absolute bottom-0 right-1/2 translate-x-1/2 h-[2px] bg-gold-gradient rounded-full transition-all duration-300 ${
                      active ? "w-2/3 shadow-gold-glow" : "w-0"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
          <Link
            to="/results/prep"
            className="hidden lg:flex items-center gap-2 mr-2 px-4 py-1.5 rounded-full bg-gold-gradient text-primary text-xs font-black shadow-gold-glow hover:scale-105 transition-transform"
          >
            <Radio size={14} className="animate-pulse" />
            <span>نتيجة الإعدادية</span>
          </Link>
        </div>
      </nav>

      {/* Professional icon strip (desktop) */}
      <div className="hidden md:block bg-background/95 backdrop-blur-sm border-b border-[hsl(var(--gold)/0.25)]">
        <div className="container py-3 overflow-x-auto">
          <ul className="flex items-center justify-between min-w-max gap-3 lg:gap-4">
            {categories.map((cat) => {
              const active = location.pathname === cat.slug;
              const Icon = cat.icon;
              return (
                <li key={`icon-${cat.slug}`}>
                  <Link
                    to={cat.slug}
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                        active
                          ? "bg-gold-gradient text-primary border-[hsl(var(--gold))] shadow-gold-glow"
                          : "bg-card text-[hsl(var(--primary))] border-[hsl(var(--gold)/0.3)] group-hover:bg-royal-gradient group-hover:text-[hsl(var(--gold-light))] group-hover:border-[hsl(var(--gold))] group-hover:shadow-gold-glow"
                      }`}
                    >
                      <Icon size={20} strokeWidth={2.2} />
                    </span>
                    <span
                      className={`text-[11px] font-black tracking-tight ${
                        active ? "text-[hsl(var(--gold))]" : "text-[hsl(var(--primary))] group-hover:text-[hsl(var(--gold))]"
                      }`}
                      style={{ fontFamily: "'Cairo', sans-serif" }}
                    >
                      {cat.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
