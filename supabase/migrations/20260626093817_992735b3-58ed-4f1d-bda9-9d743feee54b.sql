
CREATE OR REPLACE FUNCTION public.recategorize_all_articles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed integer;
BEGIN
  WITH classified AS (
    SELECT a.id,
      CASE
        WHEN (COALESCE(a.title,'') || ' ' || COALESCE(a.content,'')) ~ 'حادث|حوادث|جريمة|قتيل|قتلى|ضحايا|زلزال|حريق|انفجار|نيابة|محكمة|ضبط|بلاغ|سرقة|اغتيال|اصطدام|غرق' THEN 'accidents'
        WHEN (COALESCE(a.title,'') || ' ' || COALESCE(a.content,'')) ~ 'الأهلي|الزمالك|كرة القدم|مباراة|الدوري|كأس|لاعب|منتخب|بطولة|مدرب|هدف|أهداف|ملعب|الكرة|الرياضة المصرية' THEN 'sports'
        WHEN (COALESCE(a.title,'') || ' ' || COALESCE(a.content,'')) ~ 'سعر|أسعار|بورصة|دولار|يورو|ذهب|فضة|الفراخ|الدواجن|البنزين|السولار|تسعيرة' THEN 'prices'
        WHEN (COALESCE(a.title,'') || ' ' || COALESCE(a.content,'')) ~ 'تكنولوجيا|ذكاء اصطناعي|تطبيق|إنترنت|هاتف|آيفون|سامسونج|جوجل|فيسبوك|واتساب|تيك توك|تقنية|روبوت|سوفتوير|تحديث' THEN 'technology'
        WHEN (COALESCE(a.title,'') || ' ' || COALESCE(a.content,'')) ~ 'اقتصاد|بنك|استثمار|تمويل|صادرات|واردات|تضخم|ميزانية|موازنة|بترول|نفط|غاز|تجارة' THEN 'economy'
        WHEN (COALESCE(a.title,'') || ' ' || COALESCE(a.content,'')) ~ 'فنان|فنانة|مسلسل|سينما|مهرجان|أغنية|ألبوم|مطرب|مطربة|ممثل|ممثلة|فيلم|مسرح|دراما|كليب' THEN 'entertainment'
        WHEN (COALESCE(a.title,'') || ' ' || COALESCE(a.content,'')) ~ 'صحة|طبيب|مستشفى|دواء|علاج|وباء|فيروس|لقاح|مرض|إصاب|الصحة' THEN 'health'
        ELSE 'politics'
      END AS slug
    FROM articles a
  ),
  upd AS (
    UPDATE articles a
    SET category_id = c.id
    FROM classified cl
    JOIN categories c ON c.slug = cl.slug
    WHERE cl.id = a.id
      AND a.category_id IS DISTINCT FROM c.id
    RETURNING 1
  )
  SELECT count(*) INTO changed FROM upd;
  RETURN COALESCE(changed, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recategorize_all_articles() TO anon, authenticated, service_role;
