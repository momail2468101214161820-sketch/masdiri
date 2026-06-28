/**
 * تكامل خفيف مع موفّري التحليلات (GA4 + Microsoft Clarity).
 * لا يتم تضمين أي مفاتيح في الكود — كل شيء عبر متغيرات بيئية اختيارية:
 *   VITE_GA_MEASUREMENT_ID   مثل: G-XXXXXXX
 *   VITE_CLARITY_PROJECT_ID  مثل: abc123xyz
 * في حال عدم وجودها لا يُحقن أي سكربت.
 */

let injected = false;

export function initAnalytics() {
  if (injected || typeof window === "undefined") return;
  injected = true;

  const ga = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  const clarity = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;

  if (ga && /^G-[A-Z0-9]+$/i.test(ga)) {
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`;
    document.head.appendChild(s1);
    const s2 = document.createElement("script");
    s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`;
    document.head.appendChild(s2);
  }

  if (clarity && /^[a-z0-9]+$/i.test(clarity)) {
    const s = document.createElement("script");
    s.textContent = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`;
    document.head.appendChild(s);
  }
}

export function trackPageView(path: string) {
  const w = window as any;
  if (typeof w.gtag === "function") {
    w.gtag("event", "page_view", { page_path: path });
  }
}
