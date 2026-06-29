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
    <header className="sticky top-0 z-50 shadow-2xl" style={{ borderTop: "4px solid hsl(var(--gold))" }}>
      {/* === Editorial utility bar === */}
      <div
        className="utility-bar hidden md:block"
        style={{
          background: "linear-gradient(180deg, hsl(var(--royal-blue-dark)) 0%, hsl(222 50% 6%) 100%)",
          color: "#ffffff",
          borderBottom: "1px solid hsl(var(--gold)/0.35)",
        }}
      >
        <div className="container flex items-center justify-between h-8 text-[11px]">
          <div className="flex items-center gap-3 text-white/95">
            <span className="tabular text-white">{today}</span>
            <span className="text-white/30">|</span>
            <span className="text-white">القاهرة 32°</span>
            <span className="text-white/30">|</span>
            <span className="tracking-[0.18em] uppercase text-[10px] font-bold" style={{ color: "hsl(var(--gold))" }}>
              ● آخر تحديث الآن
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/results/prep" className="text-white hover:text-[hsl(var(--gold))] transition-colors font-semibold">نتيجة الإعدادية</Link>
            <span className="text-white/30">|</span>
            <Link to="/about" className="text-white hover:text-[hsl(var(--gold))] transition-colors font-semibold">عن المنصة</Link>
            <span className="text-white/30">|</span>
            <Link to="/contact" className="text-white hover:text-[hsl(var(--gold))] transition-colors font-semibold">تواصل معنا</Link>
          </div>
        </div>
      </div>

      {/* === Main editorial masthead === */}
      <div
        style={{
          background:
            "radial-gradient(ellipse at top right, hsl(222 50% 18%) 0%, hsl(var(--royal-blue-dark)) 55%, hsl(222 55% 5%) 100%)",
          color: "#ffffff",
          borderBottom: "2px solid hsl(var(--gold)/0.5)",
        }}
      >
        <div className="container py-4 md:py-5">
          <div className="flex items-center justify-between gap-3 md:gap-6">
            {/* Mobile drawer trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden p-2 rounded-lg border text-white"
                  style={{ borderColor: "hsl(var(--gold)/0.6)", background: "hsl(var(--gold)/0.12)" }}
                  aria-label="فتح القائمة"
                >
                  <Menu size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[360px] bg-background border-l-2 border-[hsl(var(--gold)/0.5)] p-0">
                <SheetHeader className="bg-royal-gradient p-5 text-primary-foreground">
                  <SheetTitle className="flex items-center gap-3 text-white">
                    <img src="/images/logo.png" alt="" className="w-12 h-12 rounded-full border-2 border-[hsl(var(--gold))]" />
                    <div className="text-right">
                      <div className="text-lg font-black text-white" style={{ fontFamily: "'Amiri', serif" }}>مصدري</div>
                      <div className="text-[10px] text-white/85">مصدري للأخبار المصرية والعالمية</div>
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
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black bg-royal-gradient text-white"
                  >
                    <GraduationCap size={16} /> نتيجة الإعدادية
                  </Link>
                </nav>
                <div className="px-3 pb-3">
                  <InstallAppButton className="w-full justify-center" />
                </div>
              </SheetContent>
            </Sheet>

            {/* Wordmark */}
            <Link to="/" className="flex items-center gap-3 md:gap-4 min-w-0 group">
              <img
                src="/images/logo.png"
                alt="مصدري"
                className="h-12 w-12 md:h-16 md:w-16 rounded-full logo-3d object-cover flex-shrink-0 border-2"
                style={{ borderColor: "hsl(var(--gold))" }}
              />
              <div className="min-w-0">
                <div
                  className="font-bold leading-none tracking-tight text-3xl md:text-5xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  مصدري
                </div>
                <p className="hidden md:block text-[11px] mt-1.5 font-bold tracking-wide text-white/90">
                  للأخبار المصرية والعالمية
                  <span className="mx-1.5" style={{ color: "hsl(var(--gold))" }}>◆</span>
                  <span style={{ color: "hsl(var(--gold-light))" }}>مصدر الخبر اليقين</span>
                </p>
              </div>
            </Link>

            {/* Inline editorial nav (desktop) */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {categories.slice(0, 7).map((cat) => {
                const active = location.pathname === cat.slug;
                return (
                  <Link
                    key={cat.slug}
                    to={cat.slug}
                    className="relative px-3 py-2 text-sm font-bold tracking-wide transition-colors hover:text-[hsl(var(--gold))]"
                    style={{
                      fontFamily: "'Cairo', sans-serif",
                      color: active ? "hsl(var(--gold))" : "#ffffff",
                    }}
                  >
                    <span>{cat.name}</span>
                    {active && (
                      <span
                        className="absolute -bottom-0.5 right-1/2 translate-x-1/2 h-[2px] w-2/3 rounded-full"
                        style={{ background: "hsl(var(--gold))", boxShadow: "0 0 10px hsl(var(--gold)/0.8)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right cluster */}
            <div className="flex items-center gap-2 md:gap-3">
              <OracleSearch />
              <LanguageSwitcher />
              <div className="hidden md:block"><InstallAppButton /></div>
              <Link
                to="/results/prep"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 rounded-sm transition-all text-white hover:bg-[hsl(var(--gold))] hover:text-[hsl(var(--royal-blue-dark))]"
                style={{
                  borderColor: "hsl(var(--gold))",
                  background: "hsl(var(--gold)/0.12)",
                  fontFamily: "'Cairo', sans-serif",
                  boxShadow: "0 0 0 1px hsl(var(--gold)/0.25) inset, 0 4px 14px -4px hsl(var(--gold)/0.4)",
                }}
              >
                <Radio size={13} /> اشترك الآن
              </Link>
            </div>
          </div>

          {/* Ad slot (slim) */}
          <div className="hidden xl:block mt-3">
            <AdSlot slot="header" className="h-14" />
          </div>
        </div>
      </div>



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
