import { Facebook, Mail } from "lucide-react";
import { OFFICIAL_FACEBOOK } from "@/lib/siteUrl";

export const OFFICIAL_LINKS = {
  facebook: OFFICIAL_FACEBOOK,
};

interface Props { variant?: "full" | "compact"; className?: string; }

const OfficialContactButtons = ({ variant = "full", className = "" }: Props) => {
  const items = [
    {
      href: OFFICIAL_LINKS.facebook,
      label: "فيسبوك",
      sub: "الصفحة الرسمية",
      icon: <Facebook size={18} fill="white" />,
      bg: "linear-gradient(135deg, #1877F2, #0d5ec9)",
    },
    {
      href: "/contact",
      label: "تواصل معنا",
      sub: "نموذج التواصل الرسمي",
      icon: <Mail size={18} />,
      bg: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
    },
  ];

  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`} dir="rtl">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target={it.href.startsWith("http") ? "_blank" : undefined}
          rel={it.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: it.bg }}
          aria-label={it.label}
        >
          <span className="shrink-0">{it.icon}</span>
          <span className="flex flex-col leading-tight text-right">
            <span className="font-black">{it.label}</span>
            {variant === "full" && <span className="text-[10px] opacity-90 font-bold">{it.sub}</span>}
          </span>
        </a>
      ))}
    </div>
  );
};

export default OfficialContactButtons;
