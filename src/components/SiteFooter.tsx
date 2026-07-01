import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Facebook, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { OFFICIAL_FACEBOOK, SITE_NAME_AR } from "@/lib/siteUrl";

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
    <footer className="mt-16 bg-white border-t border-border">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/images/logo.png" alt="" className="w-11 h-11 rounded-full ring-2 ring-primary/20" />
              <div>
                <div className="text-lg font-black gradient-text">{SITE_NAME_AR}</div>
                <div className="text-[11px] text-muted-foreground font-bold">الخبر من مصدره</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              منصة إخبارية محلية موثوقة تركز على أخبار بني سويف، قصص النجاح، الشخصيات الملهمة، والمبادرات المجتمعية على مدار الساعة.
            </p>
            <div className="flex gap-2 mt-4">
              <a
                href={OFFICIAL_FACEBOOK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition"
                style={{ background: "#1877F2" }}
              >
                <Facebook size={16} fill="white" /> فيسبوك الرسمي
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-base font-black text-foreground mb-2">النشرة الإخبارية</h3>
            <p className="text-xs text-muted-foreground mb-3">اشترك لتصلك أهم الأخبار من مصدري بلس أولاً بأول.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
                dir="ltr"
                required
              />
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                اشترك
              </button>
            </form>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center text-center p-2 rounded-lg bg-primary/5">
                <Clock size={16} className="text-primary mb-1" />
                <span className="text-[10px] font-bold text-muted-foreground">24/7</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-lg bg-secondary/5">
                <ShieldCheck size={16} className="text-secondary mb-1" />
                <span className="text-[10px] font-bold text-muted-foreground">مصداقية</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-lg bg-primary/5">
                <Sparkles size={16} className="text-primary mb-1" />
                <span className="text-[10px] font-bold text-muted-foreground">إلهام</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-base font-black text-foreground mb-3">روابط سريعة</h3>
            <ul className="grid grid-cols-2 gap-y-2 text-sm">
              <li><a href="/latest" className="text-muted-foreground hover:text-primary">آخر الأخبار</a></li>
              <li><a href="/breaking" className="text-muted-foreground hover:text-primary">العاجل</a></li>
              <li><a href="/most-read" className="text-muted-foreground hover:text-primary">الأكثر قراءة</a></li>
              <li><a href="/category/beni-suef" className="text-muted-foreground hover:text-primary">بني سويف</a></li>
              <li><a href="/about" className="text-muted-foreground hover:text-primary">من نحن</a></li>
              <li><a href="/contact" className="text-muted-foreground hover:text-primary">اتصل بنا</a></li>
              <li><a href="/editorial-policy" className="text-muted-foreground hover:text-primary">سياستنا التحريرية</a></li>
              <li><a href="/privacy" className="text-muted-foreground hover:text-primary">الخصوصية</a></li>
              <li><a href="/terms" className="text-muted-foreground hover:text-primary">الاستخدام</a></li>
              <li><a href="/cookies" className="text-muted-foreground hover:text-primary">الكوكيز</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-border text-center space-y-2">
          <p className="text-sm font-black text-foreground">
            👨‍💻 برئاسة وتطوير البشمبرمج: خالد عاطف عبدالحكيم
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Masdiri Plus — {SITE_NAME_AR}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
