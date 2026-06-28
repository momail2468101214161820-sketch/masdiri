import { Facebook, MessageCircle, Megaphone, Phone } from "lucide-react";

export const OFFICIAL_LINKS = {
  facebook: "https://www.facebook.com/share/195j4sUxpx/",
  whatsappChannel: "https://whatsapp.com/channel/0029VbCut7d4Crfn2UGNUC2z",
  whatsappAds: "https://wa.me/201503504548",
  whatsappAdsNumber: "01503504548",
  phone: "tel:+201205025742",
  phoneNumber: "01205025742",
};

interface Props {
  variant?: "full" | "compact";
  className?: string;
}

const baseBtn =
  "group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg border";

const OfficialContactButtons = ({ variant = "full", className = "" }: Props) => {
  const items = [
    {
      href: OFFICIAL_LINKS.facebook,
      label: "فيسبوك مصدري",
      sub: "الصفحة الرسمية",
      icon: <Facebook size={18} fill="white" />,
      bg: "linear-gradient(135deg, #1877F2, #0d5ec9)",
      border: "#1877F2",
    },
    {
      href: OFFICIAL_LINKS.whatsappChannel,
      label: "قناة واتساب",
      sub: "القناة الرسمية",
      icon: <MessageCircle size={18} fill="white" />,
      bg: "linear-gradient(135deg, #25D366, #128C7E)",
      border: "#25D366",
    },
    {
      href: OFFICIAL_LINKS.whatsappAds,
      label: `إعلانك / خبرك`,
      sub: OFFICIAL_LINKS.whatsappAdsNumber,
      icon: <Megaphone size={18} />,
      bg: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))",
      border: "hsl(var(--gold))",
      goldText: true,
    },
    {
      href: OFFICIAL_LINKS.phone,
      label: "اتصل بنا",
      sub: OFFICIAL_LINKS.phoneNumber,
      icon: <Phone size={18} fill="white" />,
      bg: "linear-gradient(135deg, hsl(var(--royal-blue)), hsl(var(--royal-blue-dark)))",
      border: "hsl(var(--gold))",
    },
  ];

  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`} dir="rtl">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target={it.href.startsWith("tel:") ? undefined : "_blank"}
          rel="noopener noreferrer"
          className={baseBtn}
          style={{
            background: it.bg,
            borderColor: it.border,
            color: it.goldText ? "hsl(var(--royal-blue-dark))" : "white",
            boxShadow: "0 6px 20px -8px rgba(0,0,0,0.45)",
          }}
          aria-label={it.label}
          title={it.label}
        >
          <span className="shrink-0">{it.icon}</span>
          <span className="flex flex-col leading-tight text-right">
            <span className="font-black">{it.label}</span>
            {variant === "full" && (
              <span className="text-[10px] opacity-90 font-bold" dir="ltr">
                {it.sub}
              </span>
            )}
          </span>
        </a>
      ))}
    </div>
  );
};

export default OfficialContactButtons;
