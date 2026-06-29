import { SITE_URL } from "@/lib/siteUrl";
import { Share2, Link2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  url?: string;
  compact?: boolean;
}

const ShareButtons = ({ title, url, compact }: ShareButtonsProps) => {
  // يقرأ رابط الصفحة الحالية تلقائياً من المتصفح مهما تغير الدومين
  const currentUrl = url ?? (typeof window !== "undefined" ? `${SITE_URL}${window.location.pathname}` : "");

  // نص ورابط الواتساب الديناميكي
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `📰 ${title}\n\n${currentUrl}\n\n— مصدري · برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم`
  )}`;

  // وظيفة نسخ الرابط
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success("📋 تم نسخ رابط المقال بنجاح");
    } catch (err) {
      toast.error("فشل في نسخ الرابط");
    }
  };

  // وظيفة المشاركة الرسمية للنظام (للهواتف)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: currentUrl,
        });
      } catch (err) {
        // تجاهل الخطأ إذا ألغى المستخدم المشاركة
      }
    } else {
      handleCopy();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1" dir="rtl">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="مشاركة على واتساب" aria-label="واتساب"
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-[#25D366] hover:bg-muted/60 transition-colors">
          <MessageSquare size={16} />
        </a>
        <button onClick={handleCopy} title="نسخ الرابط" aria-label="نسخ الرابط"
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--gold))] hover:bg-muted/60 transition-colors">
          <Link2 size={16} />
        </button>
        <button onClick={handleNativeShare} title="مشاركة" aria-label="مشاركة"
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--primary))] hover:bg-muted/60 transition-colors">
          <Share2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 my-4 dir-rtl">
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
        <MessageSquare size={16} className="animate-pulse group-hover:scale-110 transition-transform" />
        <span>واتساب</span>
      </a>
      <button onClick={handleCopy}
        className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300 hover:-translate-y-0.5 group">
        <Link2 size={16} className="group-hover:rotate-45 transition-transform" />
        <span>نسخ الرابط</span>
      </button>
      <button onClick={handleNativeShare}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
        <Share2 size={16} />
        <span>مشاركة عبر...</span>
      </button>
    </div>
  );
};

export default ShareButtons;
