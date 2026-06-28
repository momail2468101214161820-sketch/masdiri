import { Link } from "react-router-dom";
import BookmarkButton from "./BookmarkButton";
import WatermarkedImage from "./WatermarkedImage";
import { getArticleImageFallbacks, normalizeArticleImageUrl } from "@/lib/articleImages";

interface ArticleCardProps {
  id: string;
  short_id?: number | null;
  title: string;
  summary?: string | null;
  image_url?: string | null;
  category_name?: string;
  created_at: string;
  is_breaking?: boolean;
  variant?: "default" | "hero" | "compact";
}

const ArticleCard = ({
  id, short_id, title, summary, image_url, category_name, created_at, is_breaking,
  variant = "default",
}: ArticleCardProps) => {
  const src = normalizeArticleImageUrl(image_url) || "/images/logo.png";
  const isRealArticleImage = Boolean(normalizeArticleImageUrl(image_url));
  const objectMode = isRealArticleImage || getArticleImageFallbacks(src).length;

  const date = new Date(created_at);
  const dateStr = date.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
  const timeStr = date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  const href = short_id ? `/${short_id}` : `/article/${id}`;

  /* ---------- COMPACT — text-only list row ---------- */
  if (variant === "compact") {
    return (
      <Link to={href} className="group flex items-start gap-3 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors -mx-3 px-3">
        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))] flex-shrink-0" />
        <div className="min-w-0 flex-1">
          {category_name && (
            <span className="kicker mb-1">{category_name}</span>
          )}
          <h3 className="headline-md group-hover:text-[hsl(var(--primary))] dark:group-hover:text-[hsl(var(--gold))] transition-colors line-clamp-2">
            {title}
          </h3>
          <div className="mt-1.5">
            <span className="meta-line tabular">{dateStr}<span className="meta-dot" />{timeStr}</span>
          </div>
        </div>
      </Link>
    );
  }

  /* ---------- HERO — large lead story ---------- */
  if (variant === "hero") {
    return (
      <Link to={href} className="group block relative overflow-hidden rounded-sm">
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-[hsl(var(--primary))]">
          <WatermarkedImage
            src={src}
            alt={title}
            title={title}
            hideTitle
            imgClassName={`absolute inset-0 w-full h-full transition-transform duration-[1200ms] group-hover:scale-105 ${objectMode ? "object-cover object-center" : "object-contain p-12"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <div className="absolute top-3 left-3 z-10">
            <BookmarkButton id={id} title={title} image_url={image_url} />
          </div>
          {is_breaking && (
            <span className="absolute top-3 right-3 z-10 bg-[hsl(0_75%_42%)] text-white px-2.5 py-1 text-[10px] font-black tracking-wider uppercase">
              عاجل
            </span>
          )}
          <div className="absolute bottom-0 inset-x-0 p-5 md:p-7 z-10 text-white">
            {category_name && (
              <span className="kicker" style={{ color: "hsl(var(--gold-light))" }}>
                {category_name}
              </span>
            )}
            <h2 className="headline-xl text-white mt-2 line-clamp-3 group-hover:text-[hsl(var(--gold-light))] transition-colors">
              {title}
            </h2>
            {summary && (
              <p className="hidden md:block mt-3 text-white/85 text-sm line-clamp-2 leading-relaxed max-w-3xl">
                {summary}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 text-white/70">
              <span className="meta-line tabular text-white/70">
                <span className="text-[hsl(var(--gold-light))]">مصدري</span>
                <span className="meta-dot bg-white/40" />
                {dateStr}
                <span className="meta-dot bg-white/40" />
                {timeStr}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* ---------- DEFAULT — newspaper card ---------- */
  return (
    <Link to={href} className="card-editorial group block">
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-[hsl(var(--primary)/0.06)]">
        <WatermarkedImage
          src={src}
          alt={title}
          title={title}
          hideTitle
          imgClassName={`absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-[1.04] ${objectMode ? "object-cover object-center" : "object-contain p-8"}`}
        />
        <div className="absolute top-2 left-2 z-10">
          <BookmarkButton id={id} title={title} image_url={image_url} />
        </div>
        {is_breaking && (
          <span className="absolute top-2 right-2 z-10 bg-[hsl(0_75%_42%)] text-white px-2 py-0.5 text-[9px] font-black tracking-wider uppercase">
            عاجل
          </span>
        )}
      </div>

      <div className="p-4 md:p-5">
        {category_name && (
          <span className="kicker mb-2">{category_name}</span>
        )}
        <h3 className="headline-md group-hover:text-[hsl(var(--primary))] dark:group-hover:text-[hsl(var(--gold))] transition-colors duration-200 line-clamp-3">
          {title}
        </h3>
        {summary && (
          <p className="font-editorial text-muted-foreground text-[13px] mt-2 line-clamp-2 leading-relaxed">
            {summary}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="meta-line tabular">
            {dateStr}
            <span className="meta-dot" />
            {timeStr}
          </span>
          <span className="font-meta text-[10.5px] font-bold tracking-[0.12em] uppercase text-[hsl(var(--gold-dark))] dark:text-[hsl(var(--gold))] opacity-80 group-hover:opacity-100 transition-opacity">
            اقرأ ←
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
