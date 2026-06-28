import AdSlot from "./AdSlot";

/** Sticky floating ad towers on left + right (desktop only) */
const StickyAdTowers = => (
 <>
 <aside className="hidden xl:block fixed top-32 right-2 w-40 z-30">
 <AdSlot slot="sidebar" className="h-[420px]" />
 </aside>
 <aside className="hidden xl:block fixed top-32 left-2 w-40 z-30">
 <AdSlot slot="sidebar" className="h-[420px]" />
 </aside>
 </>
);

export default StickyAdTowers;
