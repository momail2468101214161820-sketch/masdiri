
-- 1) Add two missing categories with proper English slugs
INSERT INTO public.categories (name, slug) VALUES
  ('فن ومنوعات', 'entertainment'),
  ('صحة وأسرة', 'health')
ON CONFLICT (slug) DO NOTHING;

-- 2) Remove videos linking to soon-to-be-deleted junk categories
UPDATE public.videos
SET category_id = NULL
WHERE category_id IN (
  SELECT id FROM public.categories
  WHERE slug NOT IN ('politics','sports','accidents','economy','technology','prices','entertainment','health')
);

-- 3) Move every article off the bad "فن" bucket and any junk categories to NULL (so the re-categorization below can re-assign cleanly)
UPDATE public.articles
SET category_id = NULL
WHERE category_id IN (
  SELECT id FROM public.categories
  WHERE slug NOT IN ('politics','sports','accidents','economy','technology','prices','entertainment','health')
);

-- 4) Delete every unused / junk category (only the 8 official ones survive)
DELETE FROM public.categories
WHERE slug NOT IN ('politics','sports','accidents','economy','technology','prices','entertainment','health');

-- 5) Smart re-categorization of EVERY article based on title keywords (priority order: most specific first)
WITH cats AS (
  SELECT slug, id FROM public.categories
)
UPDATE public.articles a
SET category_id = (
  SELECT id FROM cats WHERE slug = (
    CASE
      WHEN a.title ~ '(حادث|حوادث|جريمة|قتيل|قتلى|ضحايا|زلزال|حريق|انفجار|نيابة|محكمة|ضبط|بلاغ|سرقة|اغتيال)' THEN 'accidents'
      WHEN a.title ~ '(الأهلي|الزمالك|كرة القدم|مباراة|دوري|كأس|لاعب|منتخب|نادي|بطولة|مدرب)' THEN 'sports'
      WHEN a.title ~ '(سعر|أسعار|بورصة|دولار|يورو|ذهب|فضة|الفراخ|الدواجن|البنزين|السولار)' THEN 'prices'
      WHEN a.title ~ '(تكنولوجيا|ذكاء اصطناعي|تطبيق|إنترنت|هاتف|آيفون|سامسونج|جوجل|فيسبوك|واتساب|تيك توك|تقنية|روبوت)' THEN 'technology'
      WHEN a.title ~ '(اقتصاد|بنك|استثمار|تمويل|صادرات|واردات|تضخم|ميزانية|موازنة|بترول|نفط|غاز)' THEN 'economy'
      WHEN a.title ~ '(فنان|فنانة|مسلسل|سينما|مهرجان|أغنية|ألبوم|مطرب|مطربة|ممثل|ممثلة|فيلم|مسرح|دراما)' THEN 'entertainment'
      WHEN a.title ~ '(صحة|طبيب|مستشفى|دواء|علاج|وباء|فيروس|لقاح|مرض|إصاب)' THEN 'health'
      WHEN a.title ~ '(وزير|وزارة|حكومة|رئيس|برلمان|سياسة|دبلوماس|سفير|اتفاق|قمة|انتخاب|الرئاسة|مجلس النواب)' THEN 'politics'
      ELSE 'politics'
    END
  )
);
