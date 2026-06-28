import { MessageCircle, Megaphone, Phone, Facebook } from "lucide-react";
import { OFFICIAL_LINKS } from "./OfficialContactButtons";

const Item = ({ href, bg, label, children }: any) => (
  <a
    href={href}
    target={href.startsWith("tel:") ? undefined : "_blank"}
    rel="noopener noreferrer"
    title={label}
    aria-label={label}
    className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform border-2"
    style={{ background: bg, borderColor: "hsl(var(--gold)/0.55)" }}
  >
    {children}
  </a>
);

const FloatingWhatsApp = () => (
  <div className="fixed bottom-20 md:bottom-5 left-4 md:left-5 z-50 flex flex-col gap-2">
    <Item href={OFFICIAL_LINKS.whatsappChannel} bg="#25D366" label="قناة واتساب الرسمية">
      <MessageCircle size={22} fill="white" />
    </Item>
    <Item href={OFFICIAL_LINKS.whatsappAds} bg="linear-gradient(135deg,hsl(var(--gold)),hsl(var(--gold-dark)))" label={`إعلانك أو خبرك — ${OFFICIAL_LINKS.whatsappAdsNumber}`}>
      <Megaphone size={20} color="hsl(var(--royal-blue-dark))" />
    </Item>
    <Item href={OFFICIAL_LINKS.facebook} bg="#1877F2" label="فيسبوك مصدري">
      <Facebook size={22} fill="white" />
    </Item>
    <Item href={OFFICIAL_LINKS.phone} bg="hsl(var(--royal-blue))" label={`اتصل بنا — ${OFFICIAL_LINKS.phoneNumber}`}>
      <Phone size={20} fill="white" />
    </Item>
  </div>
);

export default FloatingWhatsApp;
