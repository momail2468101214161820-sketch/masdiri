import { Link } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import { Helmet } from "react-helmet-async";

export interface Crumb {
  label: string;
  href?: string;
}

const SITE_URL = "https://soutalbalad.lovable.app";

const Breadcrumbs = ({ items }: { items: Crumb[] }) => {
  const all: Crumb[] = [{ label: "الرئيسية", href: "/" }, ...items];
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: c.href ? `${SITE_URL}${c.href}` : undefined,
    })),
  };
  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
      </Helmet>
      <nav
        aria-label="فتات الخبز"
        className="container mx-auto px-4 pt-4 pb-2 text-xs md:text-sm text-muted-foreground font-bold flex items-center flex-wrap gap-1.5"
        dir="rtl"
      >
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <span key={i} className="inline-flex items-center gap-1.5">
              {i > 0 && <ChevronLeft size={14} className="opacity-60" />}
              {c.href && !last ? (
                <Link to={c.href} className="hover:text-[hsl(var(--gold))] inline-flex items-center gap-1">
                  {i === 0 && <Home size={13} />}
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-foreground inline-flex items-center gap-1">
                  {i === 0 && <Home size={13} />}
                  {c.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
};

export default Breadcrumbs;
