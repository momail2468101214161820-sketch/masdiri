import { MessageCircle } from "lucide-react";

const FloatingWhatsApp = () => (
  <a
    href=""
    target="_blank"
    rel="noopener noreferrer"
    title="تواصل مباشر مع رئيس مصدري برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم"
    className="wa-float fixed bottom-20 md:bottom-5 left-4 md:left-5 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform"
    aria-label="WhatsApp"
  >
    <MessageCircle size={26} fill="white" />
  </a>
);

export default FloatingWhatsApp;
