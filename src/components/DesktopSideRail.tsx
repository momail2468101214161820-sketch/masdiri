import { Link, useLocation } from "react-router-dom";
import { Home, Newspaper, Flame, GraduationCap, Bookmark, Search, LayoutGrid } from "lucide-react";

const items = [
  { to: "/", label: "الرئيسية", Icon: Home },
  { to: "/latest", label: "الأحدث", Icon: Newspaper },
  { to: "/breaking", label: "عاجل", Icon: Flame },
  { to: "/most-read", label: "الأكثر قراءة", Icon: LayoutGrid },
  { to: "/results/prep", label: "النتائج", Icon: GraduationCap },
  { to: "/search", label: "بحث", Icon: Search },
];

const DesktopSideRail = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return (
    <aside
      aria-label="شريط التنقل الجانبي"
      className="hidden lg:flex fixed right-3 top-1/2 -translate-y-1/2 z-40 flex-col gap-3 p-2 rounded-full bg-card/85 backdrop-blur-md border border-[hsl(var(--gold)/0.4)] shadow-[var(--shadow-elegant)]"
    >
      {items.map(({ to, label, Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            title={label}
            data-active={active}
            className="icon-circle-gold group relative"
          >
            <Icon size={18} strokeWidth={2.2} />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-bold px-2.5 py-1 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md">
              {label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
};

export default DesktopSideRail;
