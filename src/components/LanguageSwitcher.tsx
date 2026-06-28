import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

const LANGS = [
  { code: "ar", label: "العربية", flag: "🇪🇬" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ur", label: "اردو", flag: "🇵🇰" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

const setCookie = (val: string) => {
  const host = window.location.hostname;
  const parts = host.split(".");
  const root = parts.length > 1 ? "." + parts.slice(-2).join(".") : host;
  const v = `/${val.split("/")[2] || val}/${val.split("/")[3] || ""}`;
  const cookieVal = val.startsWith("/") ? val : `/auto/${val}`;
  document.cookie = `googtrans=${cookieVal};path=/`;
  document.cookie = `googtrans=${cookieVal};path=/;domain=${root}`;
};

const LanguageSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("ar");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = document.cookie.match(/googtrans=\/auto\/([^;]+)/);
    if (m) setCurrent(m[1]);

    if (!document.getElementById("google-translate-script")) {
      const div = document.createElement("div");
      div.id = "google_translate_element";
      div.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
      document.body.appendChild(div);

      window.googleTranslateElementInit = () => {
        try {
          new window.google.translate.TranslateElement(
            { pageLanguage: "ar", autoDisplay: false, layout: 0 },
            "google_translate_element"
          );
        } catch {}
      };
      const s = document.createElement("script");
      s.id = "google-translate-script";
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.body.appendChild(s);

      const style = document.createElement("style");
      style.textContent = `
        .goog-te-banner-frame, .skiptranslate { display:none !important; }
        body { top: 0 !important; }
        .goog-tooltip, .goog-tooltip:hover, .goog-text-highlight { background:transparent !important; box-shadow:none !important; }
      `;
      document.head.appendChild(style);
    }

    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (code: string) => {
    setCurrent(code);
    setOpen(false);
    if (code === "ar") {
      document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      const host = window.location.hostname.split(".").slice(-2).join(".");
      document.cookie = `googtrans=;path=/;domain=.${host};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } else {
      setCookie(`/ar/${code}`);
    }
    window.location.reload();
  };

  const active = LANGS.find((l) => l.code === current) || LANGS[0];

  return (
    <div className="relative notranslate" translate="no" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change language / تغيير اللغة"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--primary))] transition-colors"
      >
        <Globe size={16} />
        <span className="text-base leading-none">{active.flag}</span>
        <span className="hidden sm:inline text-xs font-black">{active.label}</span>
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 max-h-[70vh] overflow-y-auto bg-card border-2 border-[hsl(var(--gold)/0.4)] rounded-xl shadow-2xl z-[100]">
          <div className="px-3 py-2 border-b border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Select Language
          </div>
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => pick(l.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[hsl(var(--gold)/0.1)] text-right ${
                l.code === current ? "bg-[hsl(var(--gold)/0.15)] font-black" : ""
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="flex-1 text-left">{l.label}</span>
              {l.code === current && <Check size={14} className="text-[hsl(var(--gold-dark))]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
