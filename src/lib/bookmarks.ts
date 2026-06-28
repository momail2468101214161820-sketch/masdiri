const KEY = "sab_bookmarks_v1";

export interface BookmarkItem {
 id: string;
 title: string;
 image_url?: string | null;
 saved_at: number;
}

export const getBookmarks = : BookmarkItem => {
 try {
 const raw = localStorage.getItem(KEY);
 return raw ? (JSON.parse(raw) as BookmarkItem) : ;
 } catch {
 return ;
 }
};

export const isBookmarked = (id: string) => getBookmarks.some((b) => b.id === id);

export const toggleBookmark = (item: Omit<BookmarkItem, "saved_at">): boolean => {
 const list = getBookmarks;
 const exists = list.find((b) => b.id === item.id);
 let next: BookmarkItem;
 if (exists) {
 next = list.filter((b) => b.id !== item.id);
 } else {
 next = [{ ...item, saved_at: Date.now }, ...list].slice(0, 100);
 }
 localStorage.setItem(KEY, JSON.stringify(next));
 window.dispatchEvent(new Event("sab:bookmarks-changed"));
 return !exists;
};

export const removeBookmark = (id: string) => {
 const next = getBookmarks.filter((b) => b.id !== id);
 localStorage.setItem(KEY, JSON.stringify(next));
 window.dispatchEvent(new Event("sab:bookmarks-changed"));
};
