import { useEffect, useRef, useState } from "react";
import { Bell, Download, Smartphone, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const LS_KEY = "sb_onboarding_v1";
const DISMISS_KEY = "sb_onboarding_dismissed_at";
const VAPID_PUBLIC_KEY = "BJINe6e06KHQgJm2aVGQcqWOqIVM6Pg5gkKq5YNYwacv4N9KBdtd8ndcULHMxrdqOOhtaY1TJWUOm6bJKrevypg";


function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
function bufToB64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function registerPushSubscription(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
    }
    const json: any = sub.toJSON();
    const endpoint = json.endpoint || sub.endpoint;
    const p256dh = json.keys?.p256dh || bufToB64Url(sub.getKey("p256dh"));
    const auth = json.keys?.auth || bufToB64Url(sub.getKey("auth"));
    if (!endpoint || !p256dh || !auth) return false;
    await supabase.from("push_subscriptions").upsert(
      { endpoint, p256dh, auth, user_agent: navigator.userAgent },
      { onConflict: "endpoint" }
    );
    return true;
  } catch (e) {
    console.warn("[push] subscribe failed", e);
    return false;
  }
}


const MandatoryOnboarding = () => {
  const [open, setOpen] = useState(false);
  const [notifGranted, setNotifGranted] = useState<boolean>(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [requesting, setRequesting] = useState(false);
  const lastArticleId = useRef<string | null>(null);

  // Decide whether to show the gate (non-blocking, dismissible, cool-down 3 days)
  useEffect(() => {
    const done = localStorage.getItem(LS_KEY) === "1";
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || "0");
    const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
    const supports = typeof Notification !== "undefined";
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-ignore - iOS Safari
      window.navigator.standalone === true;
    setInstalled(standalone);

    if (!supports) return;
    if (Notification.permission === "granted") {
      registerPushSubscription();
      return;
    }
    if (done || standalone) return;
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return;
    // Show only once after user has had time to see the site
    const t = setTimeout(() => setOpen(true), 6000);
    return () => clearTimeout(t);
  }, []);


  // Capture install prompt
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Subscribe to new published articles and fire native notifications
  useEffect(() => {
    if (!notifGranted) return;
    const channel = supabase
      .channel("articles-notify")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "articles" },
        (payload: any) => {
          const a = payload.new;
          if (!a?.is_published) return;
          if (lastArticleId.current === a.id) return;
          lastArticleId.current = a.id;
          try {
            const n = new Notification(a.is_breaking ? "🚨 عاجل — مصدري" : "مصدري", {
              body: a.title || "خبر جديد",
              icon: "/images/logo.png",
              badge: "/images/logo.png",
              tag: a.id,
            });
            n.onclick = () => {
              window.focus();
              window.location.href = `/article/${a.id}`;
            };
          } catch {
            /* ignore */
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [notifGranted]);

  const requestNotif = async () => {
    if (typeof Notification === "undefined") return;
    setRequesting(true);
    try {
      const res = await Notification.requestPermission();
      if (res === "granted") {
        setNotifGranted(true);
        localStorage.setItem(LS_KEY, "1");
        // Register Service Worker + Push subscription (real background notifications)
        const ok = await registerPushSubscription();
        try {
          new Notification("تم تفعيل الإشعارات ✅", {
            body: ok
              ? "هتوصلك الأخبار العاجلة فور نشرها حتى لو مصدري مقفول."
              : "تم التفعيل — هتوصلك التنبيهات أثناء استخدام مصدري.",
            icon: "/images/logo.png",
          });
        } catch {}
        setTimeout(() => setOpen(false), 800);
      }
    } finally {
      setRequesting(false);
    }
  };

  const installApp = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setInstalled(true);
    }
  };

  if (!open) return null;

  // iOS does not expose beforeinstallprompt
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
    >
      <div
        className="bg-white max-w-md w-full rounded-2xl shadow-2xl border-t-4 border-[hsl(var(--gold))] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="إغلاق"
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>
        <div className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.85)] text-white p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
            <Bell className="text-[hsl(var(--primary))]" size={26} />
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Amiri', serif" }}>
            أهلاً بك في مصدري
          </h2>
          <p className="text-white/80 text-xs mt-2" style={{ fontFamily: "'Cairo', sans-serif" }}>
            فعّل الإشعارات لتصلك الأخبار العاجلة فور وقوعها
          </p>
        </div>

        <div className="p-6 space-y-4" style={{ fontFamily: "'Cairo', sans-serif" }}>

          {/* Step 1: Notifications (mandatory) */}
          <div
            className={`p-4 rounded-xl border-2 ${
              notifGranted
                ? "border-green-500 bg-green-50"
                : "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {notifGranted ? (
                  <CheckCircle2 className="text-green-600" size={22} />
                ) : (
                  <Bell className="text-[hsl(var(--primary))]" size={22} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[hsl(var(--primary))] text-sm">
                  1. تفعيل الإشعارات <span className="text-[hsl(var(--gold-dark))] text-[10px] font-bold">(مُستحسَن)</span>
                </p>

                <p className="text-xs text-gray-600 mt-1">
                  لاستقبال الأخبار العاجلة فور نشرها على مصدري.
                </p>
                {!notifGranted && (
                  <button
                    onClick={requestNotif}
                    disabled={requesting}
                    className="mt-3 w-full bg-[hsl(var(--primary))] text-white font-bold text-sm py-2.5 rounded-lg hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-60 transition-colors"
                  >
                    {requesting ? "جارٍ التفعيل..." : "تفعيل الإشعارات الآن"}
                  </button>
                )}
                {notifGranted && (
                  <p className="text-green-700 text-xs font-bold mt-2">✓ مُفعّل — جاهز لاستقبال الأخبار</p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Add to Home Screen */}
          {!installed && (
            <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
              <div className="flex items-start gap-3">
                <Smartphone className="text-[hsl(var(--primary))] mt-0.5" size={22} />
                <div className="flex-1">
                  <p className="font-bold text-[hsl(var(--primary))] text-sm">
                    2. أضف التطبيق للشاشة الرئيسية
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    استمتع بتجربة تطبيق كامل — أيقونة مستقلة وشاشة كاملة.
                  </p>
                  {deferred ? (
                    <button
                      onClick={installApp}
                      className="mt-3 w-full bg-[hsl(var(--gold))] text-[hsl(var(--primary))] font-bold text-sm py-2.5 rounded-lg hover:brightness-95 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      تثبيت التطبيق
                    </button>
                  ) : isIOS ? (
                    <p className="text-xs text-gray-700 mt-2 leading-relaxed">
                      اضغط زر المشاركة <b>⬆️</b> أسفل Safari ثم اختر{" "}
                      <b>«إضافة إلى الشاشة الرئيسية»</b>.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-700 mt-2 leading-relaxed">
                      افتح قائمة المتصفح (⋮) واختر <b>«إضافة إلى الشاشة الرئيسية»</b> أو{" "}
                      <b>«تثبيت التطبيق»</b>.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {notifGranted && (
            <button
              onClick={() => {
                localStorage.setItem(LS_KEY, "1");
                setOpen(false);
              }}
              className="w-full text-sm font-bold text-gray-500 hover:text-[hsl(var(--primary))] py-2"
            >
              متابعة التصفح
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MandatoryOnboarding;
