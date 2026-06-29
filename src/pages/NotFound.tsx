import { SITE_URL } from "@/lib/siteUrl";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Home, Newspaper, Search, Flame } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const suggestions = [
    { to: "/", label: "الرئيسية", Icon: Home },
    { to: "/latest", label: "آخر الأخبار", Icon: Newspaper },
    { to: "/breaking", label: "العاجل", Icon: Flame },
    { to: "/search", label: "البحث", Icon: Search },
  ];

  return (
    <>
      <Helmet>
        <title>الصفحة غير موجودة (404) — مصدري</title>
        <meta name="description" content="عذراً، الصفحة التي تبحث عنها غير موجودة على مصدري. عُد للرئيسية لتصفح آخر الأخبار." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`${SITE_URL}${location.pathname}`} />
        <meta property="og:title" content="الصفحة غير موجودة — مصدري" />
        <meta property="og:description" content="الصفحة المطلوبة غير متاحة." />
        <meta property="og:url" content={`${SITE_URL}${location.pathname}`} />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-[hsl(var(--primary)/0.08)]">
        <div className="max-w-lg w-full text-center">
          <div className="text-[110px] sm:text-[140px] leading-none font-black text-gold-shine" style={{ fontFamily: "'Amiri', serif" }}>
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-3" style={{ fontFamily: "'Amiri', serif" }}>
            الصفحة غير موجودة
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            الرابط الذي طلبته غير متاح أو تم نقله. يمكنك المتابعة من إحدى الوجهات التالية:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {suggestions.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-center gap-2 bg-card border-2 border-[hsl(var(--gold)/0.35)] hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.08)] rounded-xl px-4 py-3.5 font-bold transition-all"
              >
                <Icon size={18} className="text-[hsl(var(--gold-dark))]" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
