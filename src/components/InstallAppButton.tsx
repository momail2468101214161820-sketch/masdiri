import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";

type BIPEvent = Event & { prompt: => Promise<void>; userChoice: Promise<{ outcome: string }> };

const InstallAppButton = ({ className = "" }: { className?: string }) => {
 const [deferred, setDeferred] = useState<BIPEvent | null>(null);
 const [installed, setInstalled] = useState(false);
 const [open, setOpen] = useState(false);

 useEffect( => {
 const onPrompt = (e: Event) => {
 e.preventDefault;
 setDeferred(e as BIPEvent);
 };
 const onInstalled = => {
 setInstalled(true);
 toast.success("تم تثبيت التطبيق بنجاح ✅");
 };
 window.addEventListener("beforeinstallprompt", onPrompt);
 window.addEventListener("appinstalled", onInstalled);
 if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
 return => {
 window.removeEventListener("beforeinstallprompt", onPrompt);
 window.removeEventListener("appinstalled", onInstalled);
 };
 }, );

 const handleInstall = async => {
 if (deferred) {
 await deferred.prompt;
 await deferred.userChoice;
 setDeferred(null);
 } else {
 setOpen(true);
 }
 };

 if (installed) return null;

 return (
 <>
 <button
 onClick={handleInstall}
 className={`inline-flex items-center gap-2 bg-gold-gradient text-primary font-black px-4 py-2.5 rounded-xl shadow-gold-glow hover:scale-[1.03] transition-smooth text-sm ${className}`}
 >
 <Download size={16} />
 <span>تنزيل التطبيق</span>
 </button>

 <Dialog open={open} onOpenChange={setOpen}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-[hsl(var(--primary))]">
 <Smartphone size={20} className="text-[hsl(var(--gold))]" />
 تنزيل تطبيق صوت البلد
 </DialogTitle>
 </DialogHeader>
 <div className="space-y-4 text-sm leading-relaxed">
 <div className="p-4 rounded-xl bg-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.4)]">
 <p className="font-black mb-2 text-[hsl(var(--primary))]">📱 على أندرويد (Chrome):</p>
 <ol className="list-decimal pr-5 space-y-1 text-muted-foreground font-medium">
 <li>افتح قائمة المتصفح (⋮) أعلى يمين الشاشة.</li>
 <li>اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>.</li>
 <li>اضغط «تثبيت» — سيظهر أيقونة صوت البلد كتطبيق مستقل.</li>
 </ol>
 </div>

 <div className="p-4 rounded-xl bg-muted/40 border border-border">
 <p className="font-black mb-2 text-[hsl(var(--primary))]">🍎 على آيفون (Safari):</p>
 <ol className="list-decimal pr-5 space-y-1 text-muted-foreground font-medium">
 <li>اضغط زر المشاركة <b>(⬆️)</b> أسفل الشاشة.</li>
 <li>اختر <b>«إضافة إلى الشاشة الرئيسية»</b>.</li>
 <li>اضغط «إضافة» في الأعلى.</li>
 </ol>
 </div>

 <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
 يعمل التطبيق كأي تطبيق أصلي — أيقونة مستقلة، شاشة كاملة، إشعارات فورية.
 </p>
 </div>
 </DialogContent>
 </Dialog>
 </>
 );
};

export default InstallAppButton;
