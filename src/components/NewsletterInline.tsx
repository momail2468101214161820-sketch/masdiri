import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const NewsletterInline = () => {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("subscribers").insert({ email });
    setLoading(false);
    if (error && error.code !== "23505") {
      toast.error("تعذّر الاشتراك، حاول لاحقًا");
      return;
    }
    setDone(true);
    setEmail("");
    toast.success("تم الاشتراك في نشرة مصدري");
  };

  return (
    <div
      className="card-editorial p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--royal-blue-dark)) 100%)", color: "hsl(var(--primary-foreground))" }}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 20%, hsl(var(--gold) / 0.6), transparent 60%)" }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Mail size={16} style={{ color: "hsl(var(--gold))" }} />
          <h3 className="font-bold text-base" style={{ fontFamily: "'Amiri', serif", color: "hsl(var(--gold))" }}>
            النشرة اليومية
          </h3>
        </div>
        <p className="text-xs leading-relaxed opacity-90 mb-4" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          ملخّص أبرز عناوين اليوم في بريدك صباحاً — بدون إزعاج.
        </p>
        {done ? (
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "hsl(var(--gold-light))" }}>
            <CheckCircle2 size={16} /> اشتراكك مفعّل
          </div>
        ) : (
          <form onSubmit={submit} className="flex gap-2">
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 bg-white/10 border rounded px-2 py-1.5 text-xs placeholder:text-white/50 focus:outline-none"
              style={{ borderColor: "hsl(var(--gold) / 0.4)" }}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 rounded text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1"
              style={{ background: "hsl(var(--gold))", color: "hsl(var(--primary))" }}
            >
              <Send size={12} /> اشترك
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewsletterInline;
