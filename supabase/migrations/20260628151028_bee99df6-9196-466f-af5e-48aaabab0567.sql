CREATE OR REPLACE FUNCTION public.clean_article_sources(_txt text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE t text := COALESCE(_txt, '');
BEGIN
  IF t = '' THEN RETURN t; END IF;

  -- Remove URLs
  t := regexp_replace(t, 'https?://\S+', '', 'gi');
  t := regexp_replace(t, 'www\.\S+', '', 'gi');

  -- Remove "اقرأ/اضغط/تابع/شاهد هنا/المزيد..." phrases
  t := regexp_replace(t, '(اضغط|اقرأ|تابع|شاهد)\s+(هنا|المزيد|على الرابط|التفاصيل)[^\n.]*', '', 'gi');

  -- Remove "المصدر: ..." lines
  t := regexp_replace(t, 'المصدر\s*[:،\-]?\s*[^\n]*', '', 'gi');

  -- Remove competing source/agency/channel names entirely
  t := regexp_replace(t,
    '(اليوم\s*السابع|المصري\s*اليوم|بوابة\s*الأهرام|الأهرام|الوطن\s*سبورت|الوطن|المصراوي|مصراوي|الدستور|صدى\s*البلد|الشروق|الأخبار|الجمهورية|الفجر|البديل|اليوم\s*المصري|في\s*الفن|كووورة|كورة|يلا\s*كورة|بي\s*ان\s*سبورتس?|سكاي\s*نيوز(\s*عربية)?|العربية(\.نت)?|الجزيرة(\.نت)?|روسيا\s*اليوم|RT|بي\s*بي\s*سي|BBC|CNN|سي\s*ان\s*ان|رويترز|أ\s?ف\s?ب|AFP|Reuters|AP|Bloomberg|بلومبرغ|Google\s*News?|جوجل\s*نيوز|فيسبوك|تويتر|إكس|انستغرام|إنستغرام|تيك\s*توك|يوتيوب|واتساب)\s*[:،\-]?',
    '', 'gi');

  -- Remove attribution phrases
  t := regexp_replace(t,
    '(نقلاً?\s*عن|بحسب|وفقاً?\s*ل(ما\s*(نشره|نشرته|أعلنه|أعلنته|ذكره|ذكرته))?|ذكر(ت)?\s+(موقع|جريدة|صحيفة|قناة|وكالة|منصة)|أفاد(ت)?\s+(موقع|جريدة|صحيفة|قناة|وكالة|منصة)|كما\s+(ذكر|أفاد|نشر|أعلن)\s+(موقع|جريدة|صحيفة|قناة|وكالة|منصة)|كشف(ت)?\s+(موقع|جريدة|صحيفة|قناة|وكالة))[^.\n،]*[.،\n]?',
    '', 'gi');

  -- Remove leftover "موقع/منصة/جريدة/صحيفة/قناة/وكالة X"
  t := regexp_replace(t, '(موقع|منصة|جريدة|صحيفة|قناة|وكالة)\s+\S+', '', 'gi');

  -- Strip stray HTML
  t := regexp_replace(t, '<[^>]+>', ' ', 'g');
  t := replace(replace(replace(t, '&nbsp;', ' '), '&amp;', '&'), '&quot;', '"');

  -- === NEW: Repair artifacts from removed source names ===

  -- Empty quotes/brackets left after removal
  t := regexp_replace(t, '"\s*"', '', 'g');
  t := regexp_replace(t, '«\s*»', '', 'g');
  t := regexp_replace(t, '“\s*”', '', 'g');
  t := regexp_replace(t, '‘\s*’', '', 'g');
  t := regexp_replace(t, '\(\s*\)', '', 'g');
  t := regexp_replace(t, '\[\s*\]', '', 'g');

  -- Remove pronoun-verb + empty quotes ("ينتجها  باستخدام" → "باستخدام")
  t := regexp_replace(t,
    '\s*(ينتجها|تنتجها|يقدمها|تقدمها|يصدرها|تصدرها|يبثها|تبثها|ينشرها|تنشرها|يعدها|تعدها)\s+(?=باستخدام|عبر|من\s+خلال|بواسطة)',
    ' ', 'g');

  -- Convert leading verb-without-subject to passive (start of text or after newline)
  t := regexp_replace(t, '(^|\n)\s*أطلقت?\s+', E'\\1تم إطلاق ', 'g');
  t := regexp_replace(t, '(^|\n)\s*أعلنت?\s+(?!عن)', E'\\1تم الإعلان عن ', 'g');
  t := regexp_replace(t, '(^|\n)\s*نشرت?\s+', E'\\1تم نشر ', 'g');
  t := regexp_replace(t, '(^|\n)\s*أصدرت?\s+', E'\\1تم إصدار ', 'g');
  t := regexp_replace(t, '(^|\n)\s*قدمت?\s+', E'\\1تم تقديم ', 'g');
  t := regexp_replace(t, '(^|\n)\s*عرضت?\s+', E'\\1تم عرض ', 'g');
  t := regexp_replace(t, '(^|\n)\s*كشفت?\s+(?!عن|النقاب)', E'\\1تم الكشف عن ', 'g');
  t := regexp_replace(t, '(^|\n)\s*بثت?\s+', E'\\1تم بث ', 'g');
  t := regexp_replace(t, '(^|\n)\s*أكدت?\s+(?=ال)', E'\\1تم تأكيد ', 'g');

  -- Remove dangling prepositions/words before period or end ("إلى مختلف أنحاء .")
  t := regexp_replace(t, '\s+(في|من|إلى|على|عن|لدى|بـ|بـ\s*|لـ)\s*([.،!?]|$)', E'\\2', 'g');
  t := regexp_replace(t, '\s+(أنحاء|مختلف|عبر|خلال)\s*([.،!?]|$)', E'\\2', 'g');

  -- Trailing ellipsis from removed sources
  t := regexp_replace(t, '\s*(\.\.\.|…|\[\.\.\.\])\s*$', '.', 'g');

  -- Collapse duplicate commas / empty parens / extra whitespace
  t := regexp_replace(t, '\s*،\s*،+', '،', 'g');
  t := regexp_replace(t, '\s+([.،!?])', E'\\1', 'g');
  t := regexp_replace(t, '[ \t]+', ' ', 'g');
  t := regexp_replace(t, '\s*\n\s*', E'\n', 'g');

  RETURN btrim(t);
END;
$function$;

-- Re-clean all existing articles with the improved rules
SELECT public.clean_all_article_sources();