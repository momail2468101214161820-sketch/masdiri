// Single source of truth for the public site URL.
// To switch to a new domain (e.g. custom domain), set VITE_SITE_URL in .env
// (e.g. VITE_SITE_URL=https://example.com) — every page, canonical link,
// og:url, share link, JSON-LD, breadcrumb, and SEO panel will follow.
//
// Edge functions read the same value from the SITE_URL env var (see
// supabase/functions/*). Static files that crawlers fetch directly
// (index.html, public/robots.txt, public/llms.txt, public/sitemap*.xml)
// must be updated by hand — they are listed in .lovable/DOMAIN.md.

export const SITE_URL: string =
  ((import.meta as any).env?.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://masdiri.vercel.app";

export const SITE_HOST: string = (() => {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "masdiri.vercel.app";
  }
})();
