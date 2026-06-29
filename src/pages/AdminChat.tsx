import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Send, Bot, User, FileText, ArrowRight, Shield } from "lucide-react";
import ReactMarkdown from "react-markdown";
import NumericKeypad from "@/components/NumericKeypad";
import { supabase } from "@/integrations/supabase/client";
import { adminInsert, getAdminPin } from "@/lib/adminApi";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const TOOLTIPS = [
  "جاهز للنشر",
  "اكتب أمرك بدقة",
  "نشر فوري بضغطة زر",
  "مساعدك الرسمي",
];

const AdminChat = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tooltip, setTooltip] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTooltip(TOOLTIPS[Math.floor(Math.random() * TOOLTIPS.length)]);
    }, 8000);
    setTooltip(TOOLTIPS[0]);
    return () => clearInterval(interval);
  }, []);

  const streamChat = async (allMessages: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "X-Admin-Pin": getAdminPin() || "",
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok || !resp.body) {
      const errData = await resp.json().catch(() => ({}));
      if (resp.status === 429) throw new Error("تم تجاوز الحد المسموح، حاول لاحقاً");
      if (resp.status === 402) throw new Error("يرجى إضافة رصيد من الإعدادات");
      throw new Error(errData.error || "فشل الاتصال");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    let done = false;
    while (!done) {
      const { done: readerDone, value } = await reader.read();
      if (readerDone) break;
      textBuffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, idx);
        textBuffer = textBuffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { done = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) upsert(content);
        } catch { /* partial */ }
      }
    }
    return assistantSoFar;
  };

  const extractArticleJson = (text: string) => {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    if (!match) return null;
    try { return JSON.parse(match[1]); } catch { return null; }
  };

  const handlePublish = async (articleData: any) => {
    const catMap: Record<string, string> = {};
    const { data: cats } = await supabase.from("categories").select("id, name");
    cats?.forEach((c) => { catMap[c.name] = c.id; });

    const payload = {
      title: articleData.title,
      content: articleData.content || "",
      summary: articleData.summary || null,
      category_id: catMap[articleData.category] || null,
      is_published: true,
      is_breaking: articleData.is_breaking || false,
      is_pinned: articleData.is_pinned || false,
    };

    try {
      await adminInsert("articles", payload);
      toast.success("تم النشر بنجاح ✅");
    } catch (e: any) {
      toast.error("خطأ في النشر: " + e.message);
    }
  };

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    try {
      await streamChat(newMessages);
    } catch (e: any) {
      toast.error(e.message || "خطأ في الاتصال");
    }
    setIsLoading(false);
  };

  if (!authenticated && !embedded) {
    return <NumericKeypad onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <>
      {!embedded && (
        <Helmet>
          <title>المساعد الذكي — مصدري</title>
          <meta name="description" content="غرفة الأخبار الذكية لمصدري — صياغة ونشر فوري للأخبار بأسلوب رسمي." />
          <meta name="robots" content="noindex, nofollow" />
          <link rel="canonical" href={`${SITE_URL}/admin/chat`} />
        </Helmet>
      )}
    <div className={`${embedded ? "min-h-[70vh] rounded-2xl border-2 border-border overflow-hidden" : "min-h-screen"} bg-background flex flex-col`}>


      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={24} />
          <div>
            <h1 className="font-bold text-lg leading-tight">العقل التنفيذي للمصدر</h1>
            <p className="text-xs opacity-70">{tooltip}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-primary-foreground/20 px-2 py-1 flex items-center gap-1">
            <Shield size={12} /> محمي بالكود
          </span>
          <a href="/admin" className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            لوحة التحكم <ArrowRight size={14} />
          </a>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bot size={48} className="mx-auto mb-4 opacity-30" />
            <h2 className="font-bold text-xl mb-2">المساعد الرسمي</h2>
            <p className="text-sm max-w-md mx-auto mb-6">
              أصدر تعليماتك بالعربية الفصحى لإدارة الأخبار والإعلانات والأقسام والبحث على الويب عبر جوجل.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {[
                "ابحث على الويب عن آخر تطورات الاقتصاد المصري واذكر المصادر",
                "اعرض آخر خمسة أخبار منشورة",
                "أنشئ خبراً رسمياً عن ارتفاع أسعار الذهب اليوم",
                "ولّد صورة رسمية عن حالة الطقس",
                "أضف فيديواً جديداً إلى المكتبة المرئية",
                "حلّل الصورة المرفقة واستخرج النصوص منها",
              ].map((s) => (
                <button key={s} onClick={() => setInput(s)} className="text-xs bg-muted px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                  {s}
                </button>
              ))}
            </div>

          </div>
        )}

        {messages.map((msg, i) => {
          const articleData = msg.role === "assistant" ? extractArticleJson(msg.content) : null;
          return (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={16} />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground px-4 py-3" : "bg-card border border-border px-4 py-3"}`}>
                <div className="prose prose-sm max-w-none dark:prose-invert text-inherit">
                  <ReactMarkdown>{msg.content.replace(/```json[\s\S]*?```/g, "")}</ReactMarkdown>
                </div>
                {articleData && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="bg-muted p-3 mb-2">
                      <p className="font-bold text-sm mb-1">📰 معاينة الخبر:</p>
                      <p className="font-bold">{articleData.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{articleData.summary}</p>
                    </div>
                    <button
                      onClick={() => handlePublish(articleData)}
                      className="bg-accent text-accent-foreground px-4 py-2 font-bold text-sm flex items-center gap-2 hover:opacity-90 w-full justify-center"
                    >
                      <FileText size={14} /> نشر الخبر الآن 🚀
                    </button>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-card border border-border px-4 py-3">
              <span className="animate-pulse">جارٍ المعالجة...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t-2 border-foreground p-4 bg-background">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="أصدر أمرك... (انشر خبر، عدّل، احذف، فعّل إعلان...)"
            className="flex-1 border-2 border-border px-4 py-3 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={send}
            disabled={isLoading || !input.trim()}
            className="bg-primary text-primary-foreground px-5 py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminChat;
