import { Award } from "lucide-react";

const EditorPickBadge = ({ className = "" }: { className?: string }) => (
 <span
 className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${className}`}
 style={{
 background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))",
 color: "hsl(var(--primary))",
 fontFamily: "'IBM Plex Sans Arabic', sans-serif",
 boxShadow: "0 2px 8px hsl(var(--gold) / 0.4)",
 }}
 >
 <Award size={10} />
 اختيار المحرر
 </span>
);

export default EditorPickBadge;
