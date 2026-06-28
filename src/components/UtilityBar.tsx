/* ================================================================
   UtilityBar — organized, collapsible quick-actions strip
   ================================================================ */
import { useState } from "react";
import { ChevronDown, Activity, Wrench, Share2 } from "lucide-react";
import { LiveVisitorsBadge, SiteReadingMinutes } from "@/components/ProFeatures4";
import { ReadingStreak, BookmarkChip, NotificationBell } from "@/components/ProFeatures2";
import { LivePulse, BatterySaverChip, NetworkChip, PerfBadge, LangSwitcherChip, DensityToggle, FocusModeButton } from "@/components/ProFeatures3";
import { ContrastQuickToggle, CopyLinkButton, NativeShareButton } from "@/components/ProFeatures";
import { VoiceSearchButton, PIPVideoButton } from "@/components/ProFeatures5";

const Group = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2 min-w-0">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
      style={{ fontFamily: "'Cairo',sans-serif" }}>
      <span style={{ color: "hsl(var(--gold))" }}>{icon}</span> {title}
    </div>
    <div className="flex flex-wrap items-center gap-1.5">{children}</div>
  </div>
);

const UtilityBar = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-3">
      <div className="rounded-2xl border shadow-sm overflow-hidden"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--gold)/0.35)" }}>
        {/* Compact header (always visible) */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[hsl(var(--gold)/0.06)] transition"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <LiveVisitorsBadge />
            <LivePulse />
            <ReadingStreak />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground shrink-0"
            style={{ fontFamily: "'Cairo',sans-serif" }}>
            <span className="hidden sm:inline">{open ? "إخفاء الأدوات" : "أدوات التصفح"}</span>
            <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`}
              style={{ color: "hsl(var(--gold))" }} />
          </div>
        </button>

        {/* Expanded panel */}
        {open && (
          <div className="px-4 pb-4 pt-3 border-t border-[hsl(var(--gold)/0.2)] grid gap-5 md:grid-cols-3">
            <Group icon={<Activity size={11} />} title="الحالة المباشرة">
              <SiteReadingMinutes selector="main" />
              <PerfBadge />
              <NetworkChip />
              <BatterySaverChip />
            </Group>
            <Group icon={<Wrench size={11} />} title="التخصيص">
              <ContrastQuickToggle />
              <LangSwitcherChip />
              <DensityToggle />
              <FocusModeButton />
            </Group>
            <Group icon={<Share2 size={11} />} title="الإجراءات">
              <CopyLinkButton />
              <NativeShareButton title="صوت البلد" />
              <BookmarkChip />
              <NotificationBell />
              <VoiceSearchButton />
              <PIPVideoButton />
            </Group>
          </div>
        )}
      </div>
    </div>
  );
};

export default UtilityBar;
