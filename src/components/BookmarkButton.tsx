import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";

interface Props {
  id: string;
  title: string;
  image_url?: string | null;
  className?: string;
  variant?: "icon" | "full";
}

const BookmarkButton = ({ id, title, image_url, className = "", variant = "icon" }: Props) => {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isBookmarked(id));
    const h = () => setSaved(isBookmarked(id));
    window.addEventListener("sab:bookmarks-changed", h);
    return () => window.removeEventListener("sab:bookmarks-changed", h);
  }, [id]);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleBookmark({ id, title, image_url });
    toast.success(added ? "📌 تم حفظ المقال" : "تم إزالة المقال من المحفوظات");
  };

  if (variant === "full") {
    return (
      <button
        onClick={handle}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
          saved
            ? "bg-[hsl(var(--gold)/0.15)] border-[hsl(var(--gold))] text-[hsl(var(--gold-dark))]"
            : "bg-card border-border hover:border-[hsl(var(--gold))]"
        } ${className}`}
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        <span>{saved ? "محفوظ" : "حفظ للقراءة"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      aria-label={saved ? "إزالة من المحفوظات" : "حفظ المقال"}
      className={`flex items-center justify-center w-9 h-9 rounded-full backdrop-blur bg-white/80 dark:bg-black/40 border border-[hsl(var(--gold)/0.4)] shadow-sm hover:scale-110 transition ${className}`}
    >
      {saved ? (
        <BookmarkCheck size={16} className="text-[hsl(var(--gold-dark))]" />
      ) : (
        <Bookmark size={16} className="text-[hsl(var(--primary))]" />
      )}
    </button>
  );
};

export default BookmarkButton;
