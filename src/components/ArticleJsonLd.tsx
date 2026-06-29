import { useEffect } from "react";

interface ArticleJsonLdProps {
  title: string;
  summary: string | null;
  image_url: string | null;
  created_at: string;
  category?: string | null;
  categorySlug?: string | null;
  articleId: string;
}

const ArticleJsonLd = ({ title, summary, image_url, created_at, category, categorySlug, articleId }: ArticleJsonLdProps) => {
  useEffect(() => {
    // Set OG meta tags dynamically
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setNameMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const SITE = "https://masdiri.lovable.app";
    const url = `${SITE}/article/${articleId}`;
    const desc = summary || title;
    // Cache-bust OG image whenever the article changes so Facebook/WhatsApp/Twitter
    // re-fetch the preview instead of serving a stale cached card.
    const v = Math.floor(new Date(created_at).getTime() / 1000);
    const rawImg = image_url || `${SITE}/images/logo.png`;
    const img = rawImg + (rawImg.includes("?") ? "&" : "?") + `v=${v}`;

    // Canonical link (per-article, self-referencing) — prevents duplicate indexing
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // Robots — index, follow, allow large image previews for News
    setNameMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    setNameMeta("googlebot", "index, follow, max-image-preview:large, max-snippet:-1");

    document.title = `${title} | مصدري`;

    // Open Graph
    setMeta("og:type", "article");
    setMeta("og:title", title);
    setMeta("og:description", desc);
    setMeta("og:image", img);
    setMeta("og:image:secure_url", img);
    setMeta("og:image:width", "1200");
    setMeta("og:image:height", "630");
    setMeta("og:image:alt", title);
    setMeta("og:url", url);
    setMeta("og:site_name", "مصدري");
    setMeta("og:locale", "ar_EG");
    setMeta("og:updated_time", new Date(created_at).toISOString());
    setMeta("article:published_time", new Date(created_at).toISOString());
    setMeta("article:modified_time", new Date(created_at).toISOString());
    if (category) setMeta("article:section", category);

    // Twitter Card
    setNameMeta("twitter:card", "summary_large_image");
    setNameMeta("twitter:title", title);
    setNameMeta("twitter:description", desc);
    setNameMeta("twitter:image", img);
    setNameMeta("twitter:image:alt", title);

    setNameMeta("description", desc);

    // Auto-generate keywords from title + summary (top frequent words >3 chars)
    const stop = new Set(["في","من","على","إلى","عن","هذا","هذه","التي","الذي","مع","قد","ما","لا","أن","إن","هو","هي","كان","كانت","لكن","لقد","كل","بين","بعد","قبل","حول","عند","حيث","ثم","أو","أم"]);
    const freq: Record<string, number> = {};
    `${title} ${summary || ""}`.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, " ").split(/\s+/)
      .forEach(w => { const t = w.trim(); if (t.length > 3 && !stop.has(t)) freq[t] = (freq[t] || 0) + 1; });
    const kws = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 12).map(([w]) => w);
    if (category) kws.unshift(category);
    kws.push("مصدري", "أخبار مصر");
    setNameMeta("keywords", Array.from(new Set(kws)).join(", "));

    // JSON-LD — NewsArticle + BreadcrumbList for rich results
    const newsArticle = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: title,
      description: desc,
      image: [img],
      datePublished: created_at,
      dateModified: created_at,
      inLanguage: "ar",
      author: { "@type": "Person", name: "تطوير وتصميم التقني/ خالد عاطف عبدالحكيم عويس" },
      publisher: {
        "@type": "Organization",
        name: "مصدري",
        logo: { "@type": "ImageObject", url: `${SITE}/images/logo.png`, width: 512, height: 512 },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      ...(category && { articleSection: category }),
      ...(categorySlug && { url: `${SITE}/category/${categorySlug}` }),
      keywords: kws.join(", "),
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE}/` },
        ...(categorySlug && category
          ? [{ "@type": "ListItem", position: 2, name: category, item: `${SITE}/category/${categorySlug}` }]
          : []),
        { "@type": "ListItem", position: categorySlug ? 3 : 2, name: title, item: url },
      ],
    };

    const setJsonLd = (id: string, payload: unknown) => {
      let el = document.getElementById(id) as HTMLScriptElement;
      if (!el) {
        el = document.createElement("script");
        el.id = id;
        el.type = "application/ld+json";
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(payload);
      return el;
    };
    const a = setJsonLd("article-jsonld", newsArticle);
    const b = setJsonLd("article-breadcrumb-jsonld", breadcrumb);

    return () => {
      a?.remove();
      b?.remove();
    };
  }, [title, summary, image_url, created_at, category, categorySlug, articleId]);

  return null;
};

export default ArticleJsonLd;
