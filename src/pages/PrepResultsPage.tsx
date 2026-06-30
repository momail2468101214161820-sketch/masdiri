import { SITE_URL } from "@/lib/siteUrl";
import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, GraduationCap, Loader2, AlertTriangle, CheckCircle2, XCircle, Download, MapPin, Sparkles } from "lucide-react";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

interface StudentResult {
  id: number;
  administration: string | null;
  school: string | null;
  seat_number: number;
  student_name: string;
  arabic: string | null;
  english: string | null;
  studies: string | null;
  math: string | null;
  science: string | null;
  total: number | null;
  computer: string | null;
  religion: string | null;
  art: string | null;
}

// المواد الأساسية (الـ 5 اللي بتدخل في المجموع = 280 درجة)
const CORE_SUBJECTS: { key: keyof StudentResult; label: string; max: number }[] = [
  { key: "arabic", label: "اللغة العربية", max: 80 },
  { key: "english", label: "اللغة الإنجليزية", max: 60 },
  { key: "studies", label: "الدراسات الاجتماعية", max: 40 },
  { key: "math", label: "الرياضيات", max: 60 },
  { key: "science", label: "العلوم", max: 40 },
];
const EXTRA_SUBJECTS: { key: keyof StudentResult; label: string }[] = [
  { key: "religion", label: "التربية الدينية" },
  { key: "computer", label: "الحاسب الآلي" },
  { key: "art", label: "التربية الفنية" },
];
const MAX_TOTAL = 280;

// كل محافظات مصر — كل محافظة لها رابطها الخاص داخل صفحة النتائج
// المتاح حالياً: بني سويف · باقي المحافظات تُفتح فور توفر البيانات الرسمية
const GOVERNORATES: { slug: string; name: string; available: boolean }[] = [
  { slug: "beni-suef", name: "بني سويف", available: true },
  { slug: "cairo", name: "القاهرة", available: false },
  { slug: "giza", name: "الجيزة", available: false },
  { slug: "alexandria", name: "الإسكندرية", available: false },
  { slug: "dakahlia", name: "الدقهلية", available: false },
  { slug: "sharqia", name: "الشرقية", available: false },
  { slug: "qalyubia", name: "القليوبية", available: false },
  { slug: "gharbia", name: "الغربية", available: false },
  { slug: "menoufia", name: "المنوفية", available: false },
  { slug: "beheira", name: "البحيرة", available: false },
  { slug: "kafr-elsheikh", name: "كفر الشيخ", available: false },
  { slug: "damietta", name: "دمياط", available: false },
  { slug: "port-said", name: "بورسعيد", available: false },
  { slug: "ismailia", name: "الإسماعيلية", available: false },
  { slug: "suez", name: "السويس", available: false },
  { slug: "fayoum", name: "الفيوم", available: false },
  { slug: "minya", name: "المنيا", available: false },
  { slug: "assiut", name: "أسيوط", available: false },
  { slug: "sohag", name: "سوهاج", available: false },
  { slug: "qena", name: "قنا", available: false },
  { slug: "luxor", name: "الأقصر", available: false },
  { slug: "aswan", name: "أسوان", available: false },
  { slug: "red-sea", name: "البحر الأحمر", available: false },
  { slug: "new-valley", name: "الوادي الجديد", available: false },
  { slug: "matrouh", name: "مطروح", available: false },
  { slug: "north-sinai", name: "شمال سيناء", available: false },
  { slug: "south-sinai", name: "جنوب سيناء", available: false },
];

const isNumeric = (v: string | null | undefined) => {
  if (v == null || v === "") return false;
  return !isNaN(parseFloat(v));
};

const PrepResultsPage = () => {
  const [seatQ, setSeatQ] = useState("");
  const [nameQ, setNameQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StudentResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setResults(null);
    const seat = seatQ.trim();
    const name = nameQ.trim();
    if (!seat && !name) {
      setError("اكتب رقم الجلوس أو اسم الطالب يا نجم");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (seat) {
        if (!/^\d+$/.test(seat)) {
          setError("رقم الجلوس لازم يكون أرقام بس");
          setLoading(false);
          return;
        }
        body.seat_number = seat;
      } else if (name) {
        if (name.length < 3) {
          setError("الاسم لازم يكون 3 أحرف على الأقل");
          setLoading(false);
          return;
        }
        body.student_name = name;
      }
      const { data, error: err } = await supabase.functions.invoke("prep-lookup", { body });
      if (err) throw err;
      const rows = ((data as any)?.data ?? []) as StudentResult[];
      setResults(rows);
      if (rows.length === 0) {
        setError("مفيش نتائج للبيانات دي. تأكد من رقم الجلوس أو الاسم.");
      }
    } catch (e: any) {
      setError("حصل خطأ أثناء البحث. حاول تاني بعد لحظات.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-right" dir="rtl">
      <Helmet>
        <title>نتائج الشهادة الإعدادية 2026 | مصدري</title>
        <meta name="description" content="استعلم عن نتيجة الشهادة الإعدادية 2026 برقم الجلوس فوراً على منصة مصدري الإخباري." />
        <link rel="canonical" href={`${SITE_URL}/prep-results`} />
        <meta property="og:title" content="نتائج الشهادة الإعدادية 2026 | مصدري" />
        <meta property="og:description" content="استعلم عن نتيجتك فوراً برقم الجلوس." />
        <meta property="og:url" content={`${SITE_URL}/prep-results`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/images/logo.png`} />
      </Helmet>
      <SiteHeader />


      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* الهيدر الفخم */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mb-4 shadow-2xl ring-4 ring-yellow-500/20">
            <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-black mb-2 text-foreground">
            نتيجة الشهادة الإعدادية ٢٠٢٦
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-bold">
            مصدري · بوابة نتائج المحافظات الرسمية
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            اختر محافظتك من الأسفل ثم استعلم برقم الجلوس أو باسم الطالب
          </p>
        </motion.div>

        {/* شبكة المحافظات */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 md:mb-10"
          aria-label="المحافظات المتاحة"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-yellow-600" />
            <h2 className="text-sm md:text-base font-black text-foreground">المحافظات</h2>
            <span className="text-[11px] text-muted-foreground font-bold">
              ({GOVERNORATES.filter(g => g.available).length} متاحة الآن)
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {GOVERNORATES.map((g) => (
              <a
                key={g.slug}
                href={g.available ? `/results/prep?gov=${g.slug}` : undefined}
                aria-disabled={!g.available}
                onClick={(e) => { if (!g.available) e.preventDefault(); }}
                className={`relative group rounded-xl border-2 px-2 py-2.5 text-center text-xs md:text-sm font-black transition-all overflow-hidden ${
                  g.available
                    ? "border-yellow-500/60 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/40 dark:to-yellow-900/20 text-yellow-900 dark:text-yellow-200 hover:scale-[1.04] hover:shadow-lg hover:border-yellow-500 cursor-pointer"
                    : "border-border bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60"
                }`}
              >
                {g.available && (
                  <span className="absolute -top-1 -left-1 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-md rounded-tr-md">
                    متاح
                  </span>
                )}
                <span className="block leading-tight">{g.name}</span>
                {!g.available && (
                  <span className="block text-[9px] opacity-70 mt-0.5 font-bold">قريباً</span>
                )}
              </a>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-bold">
            <Sparkles className="w-3 h-3 text-yellow-600" />
            <span>يتم تفعيل المحافظات تلقائياً فور رصد نتائجها من المصادر الرسمية</span>
          </div>
        </motion.section>


        {/* فورم البحث */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border-2 border-yellow-500/40 rounded-2xl p-5 md:p-7 shadow-2xl space-y-4 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground">رقم الجلوس</label>
              <input
                type="text"
                inputMode="numeric"
                value={seatQ}
                onChange={(e) => { setSeatQ(e.target.value); setNameQ(""); }}
                placeholder="مثال: 12345"
                className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-lg font-bold focus:border-yellow-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground">اسم الطالب (أو جزء منه)</label>
              <input
                type="text"
                value={nameQ}
                onChange={(e) => { setNameQ(e.target.value); setSeatQ(""); }}
                placeholder="مثال: محمد أحمد"
                className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-lg font-bold focus:border-yellow-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-3 md:py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
            {loading ? "جارٍ البحث..." : "استعلم عن النتيجة"}
          </button>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 font-bold">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
        </motion.form>

        {/* النتائج */}
        <AnimatePresence>
          {results && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <p className="text-sm text-muted-foreground font-bold">
                عدد النتائج: <span className="text-foreground">{results.length}</span>
              </p>
              {results.map((r) => <ResultCard key={r.id} r={r} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
};

const ResultCard = ({ r }: { r: StudentResult }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // حساب النجاح/الرسوب: ناجح لو كل المواد الأساسية فيها 50% أو أكتر
  const totalNum = r.total ?? CORE_SUBJECTS.reduce((s, sub) => {
    const v = r[sub.key] as string | null;
    return s + (isNumeric(v) ? parseFloat(v!) : 0);
  }, 0);
  const percentage = (totalNum / MAX_TOTAL) * 100;

  let passed = true;
  for (const sub of CORE_SUBJECTS) {
    const v = r[sub.key] as string | null;
    if (!isNumeric(v)) { passed = false; break; }
    if (parseFloat(v!) < sub.max / 2) { passed = false; break; }
  }

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `نتيجة-${r.student_name}-${r.seat_number}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div
        ref={cardRef}
        className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-xl"
      >
        {/* شريط الهوية (يظهر في الصورة المنزّلة) */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-l from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="مصدري" crossOrigin="anonymous" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
            <div>
              <p className="font-black text-base leading-tight">مصدري</p>
              <p className="text-[11px] opacity-95 font-bold">برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم</p>
            </div>
          </div>
          <p className="text-xs font-black opacity-95">نتيجة الإعدادية ٢٠٢٦</p>
        </div>

        {/* رأس البطاقة */}
        <div className={`p-5 md:p-6 ${passed ? 'bg-gradient-to-l from-green-600 to-emerald-700' : 'bg-gradient-to-l from-rose-600 to-red-700'} text-white`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-xl md:text-2xl font-black">{r.student_name}</h3>
              <p className="text-sm opacity-90 mt-1 font-bold">رقم الجلوس: {r.seat_number}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
              {passed ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
              <span className="font-black text-lg">{passed ? "ناجح" : "راسب"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div className="bg-white/15 rounded-lg p-2">
              <span className="opacity-80">الإدارة التعليمية: </span>
              <span className="font-bold">{r.administration || "-"}</span>
            </div>
            <div className="bg-white/15 rounded-lg p-2">
              <span className="opacity-80">المدرسة: </span>
              <span className="font-bold">{r.school || "-"}</span>
            </div>
          </div>
        </div>

        {/* الدرجات */}
        <div className="p-5 md:p-6">
          <h4 className="font-black text-base mb-3 border-r-4 border-yellow-500 pr-3">المواد الأساسية</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 text-foreground">
                  <th className="text-right p-2 font-black">المادة</th>
                  <th className="text-center p-2 font-black">الدرجة</th>
                  <th className="text-center p-2 font-black">من</th>
                </tr>
              </thead>
              <tbody>
                {CORE_SUBJECTS.map(sub => {
                  const v = r[sub.key] as string | null;
                  const num = isNumeric(v) ? parseFloat(v!) : null;
                  const half = sub.max / 2;
                  return (
                    <tr key={sub.key} className="border-b border-border/60">
                      <td className="p-2 font-bold">{sub.label}</td>
                      <td className={`p-2 text-center font-black ${num != null && num < half ? 'text-red-600' : 'text-green-700 dark:text-green-400'}`}>{v || "-"}</td>
                      <td className="p-2 text-center text-muted-foreground">{sub.max}</td>
                    </tr>
                  );
                })}
                <tr className="bg-yellow-50 dark:bg-yellow-950/30 font-black text-base">
                  <td className="p-3">المجموع الكلي</td>
                  <td className="p-3 text-center text-yellow-700 dark:text-yellow-400">{totalNum.toFixed(2)}</td>
                  <td className="p-3 text-center">{MAX_TOTAL}</td>
                </tr>
                <tr className="bg-yellow-100/60 dark:bg-yellow-900/30 font-black">
                  <td className="p-3">النسبة المئوية</td>
                  <td className="p-3 text-center text-yellow-800 dark:text-yellow-300" colSpan={2}>{percentage.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-black text-base mt-6 mb-3 border-r-4 border-blue-500 pr-3">مواد لا تضاف للمجموع</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXTRA_SUBJECTS.map(sub => (
              <div key={sub.key} className="bg-muted/40 rounded-lg p-3 text-center border border-border">
                <p className="text-xs text-muted-foreground font-bold mb-1">{sub.label}</p>
                <p className="font-black text-lg">{(r[sub.key] as string) || "-"}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border text-center text-[11px] text-muted-foreground space-y-1">
            <p className="font-black">مصدري · برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم</p>
            <p className="font-bold">تطوير وتصميم التقني/ خالد عاطف عبدالحكيم عويس</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-3 rounded-xl font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
        {downloading ? "جارٍ التحضير..." : "تنزيل النتيجة كصورة"}
      </button>
    </motion.div>
  );
};

export default PrepResultsPage;
