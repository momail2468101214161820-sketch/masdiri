// Single source of truth for the public site URL for Masdiri Plus.
// Override with VITE_SITE_URL in .env if migrating to a custom domain.

export const SITE_URL: string =
  ((import.meta as any).env?.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://masdiri.vercel.app";

export const SITE_HOST: string = (() => {
  try { return new URL(SITE_URL).host; } catch { return "masdiri.vercel.app"; }
})();

export const SITE_NAME = "Masdiri Plus";
export const SITE_NAME_AR = "مصدري بلس";
export const SITE_SLOGAN = "مصدري بلس | الخبر من مصدره";
export const OFFICIAL_FACEBOOK = "https://www.facebook.com/masdiriplus";
