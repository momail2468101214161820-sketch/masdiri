import { Printer } from "lucide-react";

const PrintArticleButton = () => (
  <button
    onClick={() => window.print()}
    aria-label="طباعة الخبر"
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold transition hover:bg-[hsl(var(--gold)/0.12)]"
    style={{ borderColor: "hsl(var(--gold) / 0.5)", color: "hsl(var(--primary))", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
  >
    <Printer size={13} />
    طباعة
  </button>
);

export default PrintArticleButton;
