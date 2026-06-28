import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

const NotificationPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    await Notification.requestPermission();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-foreground text-background p-4 rounded shadow-lg z-50 flex items-start gap-3">
      <Bell size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-bold text-sm">تفعيل الإشعارات</p>
        <p className="text-background/70 text-xs mt-1">احصل على تنبيهات فورية بالأخبار العاجلة</p>
        <div className="flex gap-2 mt-3">
          <button onClick={handleAllow} className="bg-accent text-accent-foreground px-3 py-1.5 rounded text-xs font-bold">
            تفعيل
          </button>
          <button onClick={() => setShow(false)} className="bg-background/20 px-3 py-1.5 rounded text-xs">
            لاحقاً
          </button>
        </div>
      </div>
      <button onClick={() => setShow(false)} className="text-background/50 hover:text-background">
        <X size={16} />
      </button>
    </div>
  );
};

export default NotificationPrompt;
