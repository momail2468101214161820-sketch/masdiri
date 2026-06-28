import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bookmark, Trash2 } from "lucide-react";
import { BookmarkItem, getBookmarks, removeBookmark } from "@/lib/bookmarks";

interface Props { trigger: React.ReactNode }

const BookmarksDrawer = ({ trigger }: Props) => {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setItems(getBookmarks());
    refresh();
    window.addEventListener("sab:bookmarks-changed", refresh);
    return () => window.removeEventListener("sab:bookmarks-changed", refresh);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-[88vw] sm:w-[420px] bg-background border-l border-[hsl(var(--gold)/0.4)]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[hsl(var(--primary))]">
            <Bookmark size={20} className="text-[hsl(var(--gold))]" />
            المقالات المحفوظة
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
          {items.length === 0 && (
            <div className="text-center text-muted-foreground py-12 text-sm font-bold">
              لا توجد مقالات محفوظة بعد.
              <br />
              اضغط 🔖 على أي خبر لحفظه للقراءة لاحقاً.
            </div>
          )}
          {items.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-2 rounded-xl border border-border hover:border-[hsl(var(--gold)/0.6)] transition group">
              <Link to={`/article/${b.id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={b.image_url || "/images/logo.png"}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover border border-border"
                  loading="lazy"
                />
                <span className="text-sm font-bold line-clamp-2 flex-1" style={{ fontFamily: "'Amiri', serif" }}>
                  {b.title}
                </span>
              </Link>
              <button
                onClick={() => removeBookmark(b.id)}
                aria-label="حذف"
                className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookmarksDrawer;
