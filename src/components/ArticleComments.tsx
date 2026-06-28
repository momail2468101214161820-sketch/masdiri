import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send, Heart, Reply as ReplyIcon, Loader2, Globe2, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Comment = {
  id: string;
  article_id: string;
  parent_id: string | null;
  author_name: string;
  author_country: string | null;
  body: string;
  likes: number;
  created_at: string;
};

const NAME_KEY = "sb_comment_name";
const COUNTRY_KEY = "sb_comment_country";
const LIKES_KEY = "sb_liked_comments";

const flagOf = (cc?: string | null) =>
  cc && cc.length === 2
    ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
    : "🌐";

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `منذ ${Math.floor(s / 60)} د`;
  if (s < 86400) return `منذ ${Math.floor(s / 3600)} س`;
  return `منذ ${Math.floor(s / 86400)} يوم`;
};

const getLiked = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || "[]")); } catch { return new Set(); }
};
const saveLiked = (s: Set<string>) => localStorage.setItem(LIKES_KEY, JSON.stringify([...s]));

const ArticleComments = ({ articleId }: { articleId: string }) => {
  const [list, setList] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [country, setCountry] = useState(() => localStorage.getItem(COUNTRY_KEY) || "");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(() => getLiked());

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("article_comments")
        .select("*")
        .eq("article_id", articleId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: true })
        .limit(500);
      if (alive) { setList((data as Comment[]) || []); setLoading(false); }
    })();

    // Auto-detect country once
    if (!localStorage.getItem(COUNTRY_KEY)) {
      fetch("https://ipapi.co/country/").then((r) => r.text()).then((cc) => {
        const code = (cc || "").trim().slice(0, 2).toUpperCase();
        if (code && /^[A-Z]{2}$/.test(code)) {
          localStorage.setItem(COUNTRY_KEY, code);
          setCountry(code);
        }
      }).catch(() => {});
    }

    const ch = supabase
      .channel(`comments:${articleId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "article_comments", filter: `article_id=eq.${articleId}` },
        (p) => setList((cur) => (cur.some((c) => c.id === (p.new as any).id) ? cur : [...cur, p.new as Comment]))
      )
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [articleId]);

  const tree = useMemo(() => {
    const roots: Comment[] = [];
    const children: Record<string, Comment[]> = {};
    for (const c of list) {
      if (c.parent_id) (children[c.parent_id] ||= []).push(c);
      else roots.push(c);
    }
    return { roots, children };
  }, [list]);

  const submit = async () => {
    const n = name.trim();
    const b = body.trim();
    if (n.length < 2) return toast.error("أدخل اسمك");
    if (b.length < 2) return toast.error("اكتب تعليقًا");
    setPosting(true);
    localStorage.setItem(NAME_KEY, n);
    if (country) localStorage.setItem(COUNTRY_KEY, country);
    const { error } = await supabase.from("article_comments").insert({
      article_id: articleId,
      parent_id: replyTo?.id ?? null,
      author_name: n.slice(0, 60),
      author_country: country || null,
      body: b.slice(0, 2000),
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setBody("");
    setReplyTo(null);
    toast.success("تم نشر تعليقك ✓");
  };

  const like = async (c: Comment) => {
    if (liked.has(c.id)) return;
    const next = new Set(liked); next.add(c.id); setLiked(next); saveLiked(next);
    setList((cur) => cur.map((x) => x.id === c.id ? { ...x, likes: x.likes + 1 } : x));
    const { data } = await supabase.rpc("like_comment", { _id: c.id });
    if (typeof data === "number") setList((cur) => cur.map((x) => x.id === c.id ? { ...x, likes: data } : x));
  };

  const renderOne = (c: Comment, depth = 0) => (
    <div key={c.id} className={`${depth > 0 ? "mr-6 border-r-2 border-[hsl(var(--gold)/0.3)] pr-3" : ""}`}>
      <div className="bg-card border border-border rounded-2xl p-3 hover:border-[hsl(var(--gold)/0.5)] transition-colors">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-full bg-royal-gradient text-primary-foreground flex items-center justify-center text-sm font-black">
            {c.author_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-sm">{c.author_name}</span>
              <span className="text-base leading-none" title={c.author_country || ""}>{flagOf(c.author_country)}</span>
              <span className="text-[10px] text-muted-foreground font-bold">• {timeAgo(c.created_at)}</span>
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ fontFamily: "'Cairo', sans-serif" }}>
          {c.body}
        </p>
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/60">
          <button
            onClick={() => like(c)}
            disabled={liked.has(c.id)}
            className={`flex items-center gap-1 text-xs font-black transition-colors ${
              liked.has(c.id) ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
            }`}
          >
            <Heart size={14} fill={liked.has(c.id) ? "currentColor" : "none"} />
            {c.likes}
          </button>
          {depth === 0 && (
            <button
              onClick={() => { setReplyTo(c); document.getElementById("comment-form")?.scrollIntoView({ behavior: "smooth" }); }}
              className="flex items-center gap-1 text-xs font-black text-muted-foreground hover:text-[hsl(var(--gold-dark))]"
            >
              <ReplyIcon size={14} /> رد
            </button>
          )}
          <button className="flex items-center gap-1 text-xs font-black text-muted-foreground hover:text-amber-600 mr-auto"
                  onClick={() => toast.info("تم تسجيل الإبلاغ — سيراجعه فريقنا")}>
            <Flag size={12} /> إبلاغ
          </button>
        </div>
      </div>
      {(tree.children[c.id] || []).slice(0, 30).map((r) => renderOne(r, depth + 1))}
    </div>
  );

  return (
    <section className="mt-10 bg-card/50 border-2 border-[hsl(var(--gold)/0.35)] rounded-3xl p-5 shadow-lg" dir="rtl">
      <div className="flex items-center gap-3 border-b-2 border-[hsl(var(--gold)/0.3)] pb-3 mb-4">
        <div className="p-2 rounded-xl bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))]">
          <MessageCircle size={22} />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-xl" style={{ fontFamily: "'Amiri', serif" }}>تعليقات القراء</h3>
          <p className="text-xs text-muted-foreground font-bold flex items-center gap-1">
            <Globe2 size={12} /> {list.length} تعليق من حول العالم — شارك رأيك
          </p>
        </div>
      </div>

      {/* Form */}
      <div id="comment-form" className="bg-background border border-border rounded-2xl p-3 mb-5 space-y-2">
        {replyTo && (
          <div className="flex items-center justify-between bg-[hsl(var(--gold)/0.1)] rounded-lg px-3 py-1.5 text-xs font-bold">
            <span>ردًّا على: <strong>{replyTo.author_name}</strong></span>
            <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input
            value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="اسمك"
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm font-bold"
          />
          <input
            value={country} onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))} maxLength={2}
            placeholder="رمز الدولة (EG)"
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm font-bold uppercase"
          />
        </div>
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000}
          placeholder={replyTo ? "اكتب ردك…" : "شارك رأيك في الخبر…"}
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm leading-relaxed resize-none"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-bold">{body.length}/2000</span>
          <button
            onClick={submit} disabled={posting}
            className="flex items-center gap-2 bg-royal-gradient text-primary-foreground px-5 py-2 rounded-xl font-black text-sm hover:opacity-90 disabled:opacity-50 shadow-md"
          >
            {posting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {replyTo ? "أرسل الرد" : "نشر التعليق"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : tree.roots.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6 font-bold">
          كن أول من يعلق على هذا الخبر 🌟
        </p>
      ) : (
        <div className="space-y-3">{tree.roots.map((c) => renderOne(c))}</div>
      )}
    </section>
  );
};

export default ArticleComments;
