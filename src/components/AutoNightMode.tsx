import { useEffect } from "react";

/**
 * AutoNightMode — يفعّل الوضع الليلي تلقائياً بين 7 مساءً و6 صباحاً
 * لراحة العين، ما لم يضبط المستخدم تفضيلاً يدوياً (theme=manual).
 */
const AutoNightMode = () => {
  useEffect(() => {
    const apply = () => {
      const mode = localStorage.getItem("theme-mode"); // "manual" | null
      if (mode === "manual") return;
      const h = new Date().getHours();
      const shouldDark = h >= 19 || h < 6;
      document.documentElement.classList.toggle("dark", shouldDark);
    };
    apply();
    const id = window.setInterval(apply, 60_000); // recheck every minute
    return () => window.clearInterval(id);
  }, []);
  return null;
};

export default AutoNightMode;
