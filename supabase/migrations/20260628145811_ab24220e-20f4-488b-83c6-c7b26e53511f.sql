
CREATE OR REPLACE FUNCTION public.clean_article_sources(_txt text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
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

  -- Remove attribution phrases ("نقلاً عن ...", "بحسب ...", "وفقًا لما نشره ...", "أفاد/كشف/ذكر موقع ...")
  t := regexp_replace(t,
    '(نقلاً?\s*عن|بحسب|وفقاً?\s*ل(ما\s*(نشره|نشرته|أعلنه|أعلنته|ذكره|ذكرته))?|ذكر(ت)?\s+(موقع|جريدة|صحيفة|قناة|وكالة|منصة)|أفاد(ت)?\s+(موقع|جريدة|صحيفة|قناة|وكالة|منصة)|كما\s+(ذكر|أفاد|نشر|أعلن)\s+(موقع|جريدة|صحيفة|قناة|وكالة|منصة)|كشف(ت)?\s+(موقع|جريدة|صحيفة|قناة|وكالة))[^.\n،]*[.،\n]?',
    '', 'gi');

  -- Remove leftover "موقع/منصة/جريدة/صحيفة/قناة/وكالة X"
  t := regexp_replace(t, '(موقع|منصة|جريدة|صحيفة|قناة|وكالة)\s+\S+', '', 'gi');

  -- Strip stray HTML
  t := regexp_replace(t, '<[^>]+>', ' ', 'g');
  t := replace(replace(replace(t, '&nbsp;', ' '), '&amp;', '&'), '&quot;', '"');

  -- Trailing ellipsis from removed sources
  t := regexp_replace(t, '\s*(\.\.\.|…|\[\.\.\.\])\s*$', '.', 'g');

  -- Collapse duplicate commas / empty parens / extra whitespace
  t := regexp_replace(t, '\s*،\s*،+', '،', 'g');
  t := regexp_replace(t, '\(\s*\)', '', 'g');
  t := regexp_replace(t, '[ \t]+', ' ', 'g');
  t := regexp_replace(t, '\s*\n\s*', E'\n', 'g');

  RETURN btrim(t);
END;
$$;

CREATE OR REPLACE FUNCTION public.clean_all_article_sources()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed integer := 0;
  r record;
  new_content text;
  new_title text;
  new_excerpt text;
BEGIN
  FOR r IN SELECT id, title, content, excerpt FROM articles LOOP
    new_title   := public.clean_article_sources(r.title);
    new_content := public.clean_article_sources(r.content);
    new_excerpt := public.clean_article_sources(r.excerpt);
    IF r.title    IS DISTINCT FROM new_title
    OR r.content  IS DISTINCT FROM new_content
    OR r.excerpt  IS DISTINCT FROM new_excerpt THEN
      UPDATE articles
         SET title   = COALESCE(NULLIF(new_title,   ''), title),
             content = COALESCE(NULLIF(new_content, ''), content),
             excerpt = CASE WHEN r.excerpt IS NULL THEN NULL ELSE new_excerpt END
       WHERE id = r.id;
      changed := changed + 1;
    END IF;
  END LOOP;
  RETURN changed;
END;
$$;
