import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminUploadFile, adminInsert, adminDelete } from "@/lib/adminApi";
import { toast } from "sonner";
import { Download, Trash2, Smartphone, UploadCloud } from "lucide-react";

interface Release {
  id: string;
  version: string;
  file_url: string;
  file_size: number | null;
  notes: string | null;
  created_at: string;
}

const fmtSize = (b: number | null) => {
  if (!b) return "—";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const ApkReleasesPanel = () => {
  const [list, setList] = useState<Release[]>([]);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = async () => {
    const { data, error } = await supabase
      .from("app_releases")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setList((data as Release[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async () => {
    if (!file) return toast.error("اختر ملف APK أولاً");
    if (!version.trim()) return toast.error("أدخل رقم الإصدار");
    if (!/\.apk$/i.test(file.name)) return toast.error("الملف يجب أن يكون بصيغة .apk");

    setBusy(true);
    setProgress(20);
    try {
      const { url, size } = await adminUploadFile(file, "videos");
      setProgress(80);
      await adminInsert("app_releases", {
        version: version.trim(),
        file_url: url,
        file_size: size,
        notes: notes.trim() || null,
      });
      setProgress(100);
      toast.success(`تم رفع الإصدار ${version} ✓`);
      setVersion("");
      setNotes("");
      setFile(null);
      (document.getElementById("apk-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("apk-input") as HTMLInputElement).value = "");
      await load();
    } catch (e: any) {
      toast.error(e.message || "فشل الرفع");
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleDelete = async (r: Release) => {
    if (!confirm(`حذف إصدار v${r.version}؟`)) return;
    try {
      await adminDelete("app_releases", { id: r.id });
      toast.success("تم الحذف");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-2 border-foreground p-6 bg-card rounded-2xl">
        <h2 className="font-black text-xl flex items-center gap-2 border-b-2 border-border pb-3 mb-4">
          <Smartphone className="text-primary" /> إدارة إصدارات تطبيق Android (APK)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold block mb-1">رقم الإصدار *</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="مثال: 1.0.3"
              className="w-full border-2 border-border px-3 py-2 bg-background font-bold rounded focus:border-primary focus:outline-none"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">ملف APK *</label>
            <input
              id="apk-input"
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border-2 border-border px-3 py-2 bg-background font-bold rounded text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold block mb-1">ملاحظات الإصدار (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="ما الجديد في هذا الإصدار..."
              className="w-full border-2 border-border px-3 py-2 bg-background rounded focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {progress > 0 && (
          <div className="mt-3 h-2 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={busy}
          className="mt-4 w-full bg-primary text-primary-foreground px-4 py-3 font-black rounded shadow-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <UploadCloud size={18} /> {busy ? "جاري الرفع..." : "رفع الإصدار الآن"}
        </button>
      </div>

      <div className="border-2 border-border p-4 bg-card rounded-2xl">
        <h3 className="font-black mb-3">الإصدارات السابقة ({list.length})</h3>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد إصدارات بعد.</p>
        ) : (
          <div className="space-y-2">
            {list.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 p-3 border border-border rounded-xl bg-background"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="font-black text-sm">
                    📦 v{r.version}{" "}
                    <span className="text-xs font-bold text-muted-foreground">
                      • {fmtSize(r.file_size)} • {new Date(r.created_at).toLocaleString("ar-EG")}
                    </span>
                  </div>
                  {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
                </div>
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-green-600 text-white rounded font-bold text-xs flex items-center gap-1 hover:bg-green-700"
                >
                  <Download size={14} /> تحميل
                </a>
                <button
                  onClick={() => handleDelete(r)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded font-bold text-xs flex items-center gap-1 hover:bg-red-700"
                >
                  <Trash2 size={14} /> حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApkReleasesPanel;
