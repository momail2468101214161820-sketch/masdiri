import { Facebook, MessageCircle, Send, Link2, Camera } from "lucide-react";
import { toast } from "sonner";

interface Props {
 title: string;
 url: string;
 onShareImage?: => void;
}

const FloatingShareBar = ({ title, url, onShareImage }: Props) => {
 const enc = encodeURIComponent;
 const wa = `https://api.whatsapp.com/send?text=${enc(`📰 ${title}\n${url}\n— صوت البلد`)}`;
 const fb = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
 const sc = `https://www.snapchat.com/scan?attachmentUrl=${enc(url)}`;
 const tg = `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`;

 const copy = => { navigator.clipboard.writeText(url); toast.success("تم نسخ الرابط"); };

 const Btn = ({ href, onClick, label, children, bg }: any) => (
 <a
 href={href}
 onClick={onClick}
 target={href ? "_blank" : undefined}
 rel="noopener noreferrer"
 title={label}
 aria-label={label}
 className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
 style={{ background: bg }}
 >
 {children}
 </a>
 );

 return (
 <div className="fixed bottom-24 left-4 z-40 flex flex-col gap-2 md:bottom-1/3">
 <Btn href={wa} label="واتساب" bg="#25D366"><MessageCircle size={20} fill="white" /></Btn>
 <Btn href={fb} label="فيسبوك" bg="#1877F2"><Facebook size={20} fill="white" /></Btn>
 <Btn href={sc} label="سناب شات" bg="#FFFC00"><Send size={20} color="#000" /></Btn>
 <Btn href={tg} label="تليجرام" bg="#0088cc"><Send size={20} fill="white" /></Btn>
 {onShareImage && (
 <Btn onClick={(e: any) => { e.preventDefault; onShareImage; }} href="#" label="حوّل لصورة" bg="hsl(var(--accent))">
 <Camera size={20} />
 </Btn>
 )}
 <Btn onClick={(e: any) => { e.preventDefault; copy; }} href="#" label="نسخ الرابط" bg="hsl(var(--primary))">
 <Link2 size={18} />
 </Btn>
 </div>
 );
};

export default FloatingShareBar;
