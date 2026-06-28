import { useEffect, useState } from "react";

type ReactionKey = "like" | "fire" | "wow" | "sad";

const REACTIONS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: "like", emoji: "👍", label: "أعجبني" },
  { key: "fire", emoji: "🔥", label: "مؤثر" },
  { key: "wow", emoji: "😮", label: "مفاجئ" },
  { key: "sad", emoji: "😢", label: "محزن" },
];

/**
 * ArticleReactions — شريط تفاعلات سريع للقرّاء (localStorage)
 */
const ArticleReactions = ({ articleId }: { articleId: string }) => {
  const storeKey = `reactions:${articleId}`;
  const userKey = `reactions:${articleId}:mine`;
  const [counts, setCounts] = useState<Record<ReactionKey, number>>({ like: 0, fire: 0, wow: 0, sad: 0 });
  const [mine, setMine] = useState<ReactionKey | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setCounts(JSON.parse(raw));
      const m = localStorage.getItem(userKey) as ReactionKey | null;
      if (m) setMine(m);
    } catch {/* ignore */}
  }, [storeKey, userKey]);

  const toggle = (key: ReactionKey) => {
    setCounts((prev) => {
      const next = { ...prev };
      if (mine === key) {
        next[key] = Math.max(0, next[key] - 1);
        setMine(null);
        localStorage.removeItem(userKey);
      } else {
        if (mine) next[mine] = Math.max(0, next[mine] - 1);
        next[key] = (next[key] || 0) + 1;
        setMine(key);
        localStorage.setItem(userKey, key);
      }
      localStorage.setItem(storeKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="my-6 rounded-2xl border border-gold-glow bg-card p-4 shadow-elegant">
      <div className="mb-3 text-sm font-bold text-foreground/80">ما رأيك في هذا الخبر؟</div>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const active = mine === r.key;
          return (
            <button
              key={r.key}
              onClick={() => toggle(r.key)}
              aria-pressed={active}
              className={`group flex items-center gap-2 rounded-full border px-4 py-2 transition-smooth ${
                active
                  ? "border-accent bg-accent/10 shadow-gold-glow"
                  : "border-border bg-background hover:border-accent/60 hover:bg-accent/5"
              }`}
            >
              <span className="text-xl transition-transform group-hover:scale-125">{r.emoji}</span>
              <span className="text-xs font-bold text-foreground/80">{r.label}</span>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">{counts[r.key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ArticleReactions;
