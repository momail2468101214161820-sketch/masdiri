import { useState } from "react";
import { Lock, Delete, Settings } from "lucide-react";
import { verifyAdminPin, changeAdminPin } from "@/lib/adminApi";

interface NumericKeypadProps {
  onSuccess: () => void;
}

const NumericKeypad = ({ onSuccess }: NumericKeypadProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [busy, setBusy] = useState(false);

  const attempt = async (full: string) => {
    setBusy(true);
    try {
      await verifyAdminPin(full);
      setError(null);
      onSuccess();
    } catch (e: any) {
      setError(e.message || "رمز غير صحيح");
      setTimeout(() => { setCode(""); setError(null); }, 900);
    } finally {
      setBusy(false);
    }
  };

  const handlePress = (digit: string) => {
    if (busy) return;
    setError(null);
    const newC = code + digit;
    setCode(newC);
    if (newC.length === 4) attempt(newC);
  };

  const handleSaveCode = async () => {
    if (!/^\d{4}$/.test(newCode)) { setError("الرمز الجديد لازم يكون 4 أرقام"); return; }
    setBusy(true);
    try {
      // verify old PIN first, then change it
      await verifyAdminPin(oldCode);
      await changeAdminPin(newCode);
      setOldCode(""); setNewCode(""); setShowSettings(false); setError(null);
    } catch (e: any) {
      setError(e.message || "فشل تحديث الرمز");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="border-2 border-[hsl(var(--gold)/0.6)] p-8 w-full max-w-sm rounded-lg card-3d bg-card"
           style={{ boxShadow: "0 20px 50px -15px hsl(var(--accent)/0.3)" }}>
        <div className="text-center mb-6 relative">
          <button onClick={() => setShowSettings(!showSettings)}
            className="absolute top-0 left-0 p-1 text-muted-foreground hover:text-primary" title="مركز الأمان">
            <Settings size={18} />
          </button>
          <Lock className="mx-auto mb-3" size={28} style={{ color: "hsl(var(--gold))" }} />
          <h2 className="newspaper-heading text-xl">صوت البلد</h2>
          <p className="text-muted-foreground text-sm mt-1">{showSettings ? "مركز الأمان — تغيير رمز الدخول" : "أدخل رمز الدخول"}</p>
        </div>

        {showSettings ? (
          <div className="space-y-3">
            <input type="password" inputMode="numeric" maxLength={4} value={oldCode}
              onChange={(e) => setOldCode(e.target.value)} placeholder="الرمز الحالي"
              className="w-full border-2 border-border px-3 py-2 text-center font-bold tracking-widest bg-background" />
            <input type="password" inputMode="numeric" maxLength={4} value={newCode}
              onChange={(e) => setNewCode(e.target.value)} placeholder="الرمز الجديد (4 أرقام)"
              className="w-full border-2 border-border px-3 py-2 text-center font-bold tracking-widest bg-background" />
            {error && <p className="text-accent text-xs text-center">{error}</p>}
            <button onClick={handleSaveCode} disabled={busy}
              className="w-full bg-primary text-primary-foreground py-2 font-bold hover:opacity-90 disabled:opacity-50">
              {busy ? "جارٍ الحفظ..." : "حفظ الرمز"}
            </button>
            <button onClick={() => { setShowSettings(false); setError(null); }}
              className="w-full border border-border py-2 text-sm">إلغاء</button>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-12 h-12 border-2 flex items-center justify-center text-xl font-bold rounded ${
                  code.length > i
                    ? error ? "border-accent bg-accent/10 text-accent" : "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.15)] text-primary"
                    : "border-border"}`}>
                  {code.length > i ? "●" : ""}
                </div>
              ))}
            </div>
            {error && <p className="text-accent text-xs text-center mb-2">{error}</p>}
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6,7,8,9].map((d) => (
                <button key={d} onClick={() => handlePress(String(d))} disabled={busy}
                  className="h-14 border border-border text-foreground font-bold text-lg hover:bg-primary hover:text-primary-foreground transition-colors rounded disabled:opacity-50">
                  {d}
                </button>
              ))}
              <button onClick={() => { setCode(code.slice(0,-1)); setError(null); }}
                className="h-14 border border-border flex items-center justify-center hover:bg-accent/10 rounded">
                <Delete size={20} />
              </button>
              <button onClick={() => handlePress("0")} disabled={busy}
                className="h-14 border border-border font-bold text-lg hover:bg-primary hover:text-primary-foreground transition-colors rounded disabled:opacity-50">0</button>
              <div />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NumericKeypad;
