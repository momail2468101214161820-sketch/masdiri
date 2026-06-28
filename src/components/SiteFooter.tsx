import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SiteFooter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("subscribers").insert({ email });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.info("أنت مشترك بالفعل!");
      else toast.error("حدث خطأ، حاول مرة أخرى");
    } else {
      toast.success("تم الاشتراك بنجاح!");
      setEmail("");
    }
  };

  return (
    <footer className="mt-12 relative">
      <div
        className="backdrop-blur-xl border-t-2"
        style={{
          background: "linear-gradient(180deg, hsl(var(--royal-blue-dark)/0.92), hsl(var(--royal-blue)/0.96))",
          borderTopColor: "hsl(var(--gold)/0.55)",
          boxShadow: "0 -8px 40px -12px hsl(var(--gold)/0.25)",
        }}
      >
        <div className="container py-10 text-[hsl(var(--primary-foreground))]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div>
              <h3 className="newspaper-heading text-2xl mb-2" style={{ color: "hsl(var(--gold))" }}>
                مصدري للأخبار المصرية والعالمية
              </h3>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3" style={{ color: "hsl(var(--gold))" }}>النشرة الرسمية</h3>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm placeholder:text-white/50 focus:outline-none focus:border-[hsl(var(--gold))]"
                  dir="ltr"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded text-sm font-bold disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))",
                    color: "hsl(var(--royal-blue-dark))",
                  }}
                >
                  اشترك
                </button>
              </form>
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-2 rounded font-bold text-sm border-2"
                style={{
                  borderColor: "hsl(var(--gold))",
                  background: "hsl(var(--gold)/0.1)",
                  color: "hsl(var(--gold-light))",
                }}
                dir="ltr"
              >
              </a>
            </div>

            <div className="md:text-left">
              <h3 className="font-bold text-lg mb-3" style={{ color: "hsl(var(--gold))" }}>القيادة الرسمية</h3>
              <div
                className="rounded-xl p-4 border-2"
                style={{
                  borderColor: "hsl(var(--gold)/0.55)",
                  background: "linear-gradient(135deg, hsl(var(--royal-blue-dark)/0.55), hsl(var(--royal-blue)/0.35))",
                  boxShadow: "0 6px 24px -10px hsl(var(--gold)/0.45)",
                }}
              >
                <p className="newspaper-heading text-xl leading-tight text-gold-shine" style={{ fontFamily: "'Amiri', serif" }}>
                  برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم
                </p>
                <div className="my-3 h-px bg-[hsl(var(--gold)/0.4)]" />
                <p className="font-black text-base leading-tight" style={{ color: "hsl(var(--gold-light))", fontFamily: "'Amiri', serif" }}>
                  تطوير التقنيات والمسؤول عن الأنظمة
                </p>
                <p className="font-bold text-sm leading-tight mt-1" style={{ color: "hsl(var(--gold-light))", fontFamily: "'Amiri', serif" }}>
                  البشمبرمج والمطور التقني خالد عاطف عبدالحكيم عويس
                </p>
                <p className="text-[11px] opacity-90 mt-3 font-bold tracking-widest" dir="ltr" style={{ color: "hsl(var(--gold-light))" }}>
                  01503504548 · 01205025742
                </p>
              </div>
            </div>

          </div>

          <nav aria-label="روابط رسمية" className="border-t border-white/15 mt-8 pt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <a href="/latest" className="hover:text-[hsl(var(--gold))] opacity-90">آخر الأخبار</a>
            <span className="opacity-30">·</span>
            <a href="/breaking" className="hover:text-[hsl(var(--gold))] opacity-90">العاجل</a>
            <span className="opacity-30">·</span>
            <a href="/most-read" className="hover:text-[hsl(var(--gold))] opacity-90">الأكثر قراءة</a>
            <span className="opacity-30">·</span>
            <a href="/about" className="hover:text-[hsl(var(--gold))] opacity-90">من نحن</a>
            <span className="opacity-30">·</span>
            <a href="/contact" className="hover:text-[hsl(var(--gold))] opacity-90">اتصل بنا</a>
            <span className="opacity-30">·</span>
            <a href="/editorial-policy" className="hover:text-[hsl(var(--gold))] opacity-90 font-bold">السياسة التحريرية</a>
            <span className="opacity-30">·</span>
            <a href="/corrections" className="hover:text-[hsl(var(--gold))] opacity-90 font-bold">سياسة التصحيحات</a>
            <span className="opacity-30">·</span>
            <a href="/ownership" className="hover:text-[hsl(var(--gold))] opacity-90 font-bold">الملكية والتمويل</a>
            <span className="opacity-30">·</span>
            <a href="/privacy" className="hover:text-[hsl(var(--gold))] opacity-90">سياسة الخصوصية</a>
            <span className="opacity-30">·</span>
            <a href="/terms" className="hover:text-[hsl(var(--gold))] opacity-90">شروط الاستخدام</a>
            <span className="opacity-30">·</span>
            <a href="/cookies" className="hover:text-[hsl(var(--gold))] opacity-90">سياسة ملفات تعريف الارتباط</a>
            <span className="opacity-30">·</span>
            <a href="/sitemap" className="hover:text-[hsl(var(--gold))] opacity-90">خريطة الموقع</a>
          </nav>

          <div className="mt-5 pt-3 text-center space-y-2">
            <p className="text-sm font-bold text-[hsl(var(--gold))]">
              للتواصل والاستفسارات: <span className="opacity-90 font-normal">متاح قريبًا</span>
            </p>
            <p className="text-xs opacity-60">
              © {new Date().getFullYear()} مصدري للأخبار المصرية والعالمية — جميع الحقوق محفوظة
            </p>
          </div>

        </div>
      </div>
    </footer>

  );
};

export default SiteFooter;
