export type ArticleImageLike = string | { url?: string | null; position?: string | null };

export const normalizeArticleImageUrl = (url?: string | null) => {
 if (!url) return null;
 const cleaned = url.trim;
 if (!cleaned) return null;
 if (cleaned.startsWith("//")) return `${window.location.protocol}${cleaned}`;
 if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
 return `${window.location.origin}${cleaned.startsWith("/") ? cleaned : `/${cleaned}`}`;
};

export const extractFirstImageFromHtml = (html?: string | null) => {
 if (!html) return null;
 const match = html.match(/<img[^>]+(?:src|data-src|data-original)=["']([^"']+)["']/i);
 return normalizeArticleImageUrl(match?.[1]);
};

export const getArticlePrimaryImage = (article: {
 image_url?: string | null;
 images?: ArticleImageLike | null;
 content?: string | null;
}) => {
 const galleryImage = article.images?.find((img) => (typeof img === "string" ? img : img?.url));
 return (
 normalizeArticleImageUrl(article.image_url) ||
 normalizeArticleImageUrl(typeof galleryImage === "string" ? galleryImage : galleryImage?.url) ||
 extractFirstImageFromHtml(article.content) ||
 null
 );
};

export const getArticleImageFallbacks = (src?: string | null) => {
 const normalized = normalizeArticleImageUrl(src);
 if (!normalized || !/^https?:\/\//i.test(normalized)) return ;

 try {
 const url = new URL(normalized);
 const withoutProtocol = `${url.host}${url.pathname}${url.search}`;
 return [
 `https://wsrv.nl/?url=${encodeURIComponent(withoutProtocol)}&output=webp&n=-1`,
 `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}&output=webp&n=-1`,
 ];
 } catch {
 return ;
 }
};