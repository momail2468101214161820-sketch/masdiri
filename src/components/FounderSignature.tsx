import { Link } from "react-router-dom";

/**
 * FounderSignature — شارة مصدرية ثابتة في كل صفحة
 * تبرز "البشمبرمج / خالد عاطف عبدالحكيم" بتصميم ملكي فاخر
 */
const FounderSignature = () => {
  return (
    <Link
      to="/ownership"
      aria-label="البشمبرمج خالد عاطف عبدالحكيم — مؤسس ومطور مصدري"
      className="founder-sig fixed z-[60] select-none"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
        insetInlineStart: "12px",
      }}
    >
      <span className="founder-sig__crest" aria-hidden="true">
        <span className="founder-sig__monogram">ب</span>
      </span>
      <span className="founder-sig__text">
        <span className="founder-sig__line1">البشمبرمج</span>
        <span className="founder-sig__line2 text-gold-shine">خالد عاطف عبدالحكيم</span>
      </span>
    </Link>
  );
};

export default FounderSignature;
