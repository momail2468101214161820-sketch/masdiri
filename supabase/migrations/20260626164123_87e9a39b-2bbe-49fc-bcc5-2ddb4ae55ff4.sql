-- 1) Seed/upsert the 22 official categories
INSERT INTO public.categories (slug, name) VALUES
  ('politics','سياسة'),
  ('economy','اقتصاد'),
  ('sports','رياضة'),
  ('entertainment','فن ومشاهير'),
  ('education','تعليم'),
  ('technology','تكنولوجيا'),
  ('science-health','علوم وطب'),
  ('accidents','حوادث وجرائم'),
  ('society','مجتمع'),
  ('lifestyle','منوعات ولايف ستايل'),
  ('weather','طقس ومناخ'),
  ('energy','طاقة وبيئة'),
  ('autos','سيارات ومخترعات'),
  ('realestate','عقارات وأسواق'),
  ('women-family','مرأة وأسرة'),
  ('tourism','سياحة وسفر'),
  ('heritage','آثار ومتاحف'),
  ('citizen','صحافة المواطن'),
  ('live','بث مباشر وتغطيات'),
  ('multimedia','ملتيميديا'),
  ('caricature','كاريكاتير'),
  ('obituaries','وفيات وتعازي')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2) Fix ensure_category to accept the parameter names the edge function uses (p_slug, p_name)
DROP FUNCTION IF EXISTS public.ensure_category(text, text);
CREATE OR REPLACE FUNCTION public.ensure_category(p_slug text, p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM categories WHERE slug = p_slug;
  IF cid IS NULL THEN
    INSERT INTO categories (name, slug) VALUES (p_name, p_slug)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cid;
  END IF;
  RETURN cid;
END;
$$;

-- 3) Rewrite infer_article_category with full 22-category taxonomy
CREATE OR REPLACE FUNCTION public.infer_article_category(_title text, _content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  txt text := lower(COALESCE(_title,'') || ' ' || COALESCE(_content,''));
  slug text;
  nm text;
BEGIN
  -- Priority order: most specific / life-safety first
  IF txt ~ 'وفاة|نعى|نعي|نعت|ينعى|عزاء|تشييع|الجنازة|جنازة|الراحل|الفقيد|في ذمة الله|إلى رحمة الله' THEN
    slug := 'obituaries'; nm := 'وفيات وتعازي';
  ELSIF txt ~ 'كاريكاتير|كاريكاتور|رسم ساخر|رسوم ساخرة' THEN
    slug := 'caricature'; nm := 'كاريكاتير';
  ELSIF txt ~ 'بث مباشر|البث المباشر|تغطية مباشرة|لحظة بلحظة|نقل حي' THEN
    slug := 'live'; nm := 'بث مباشر وتغطيات';
  ELSIF txt ~ 'بودكاست|تقرير مصور|فيديوجراف|إنفوجراف|فيديو حصري|بالفيديو|بالصور والفيديو' THEN
    slug := 'multimedia'; nm := 'ملتيميديا';
  ELSIF txt ~ 'شكوى|شكاوى|صحافة المواطن|مواطنون يشكون|مطالب الأهالي|أزمة في حي|بلاغات المواطنين' THEN
    slug := 'citizen'; nm := 'صحافة المواطن';
  ELSIF txt ~ 'طقس|الأرصاد|أرصاد جوية|درجات الحرارة|موجة حر|موجة برد|أمطار|عاصفة|سيول|نشرة جوية' THEN
    slug := 'weather'; nm := 'طقس ومناخ';
  ELSIF txt ~ 'آثار|الآثار|أثري|متحف|المتحف|اكتشاف أثري|مومياء|الفراعنة|الحضارة المصرية|بعثة أثرية|ترميم|مقبرة|نقوش|توت عنخ آمون' THEN
    slug := 'heritage'; nm := 'آثار ومتاحف';
  ELSIF txt ~ 'سيارة|سيارات|موديل|مرسيدس|بي إم دبليو|تويوتا|هيونداي|كيا|تسلا|قيادة ذاتية|محرك|معرض السيارات|دراجة نارية|موتوسيكل' THEN
    slug := 'autos'; nm := 'سيارات ومخترعات';
  ELSIF txt ~ 'عقار|عقارات|شقة|شقق|فيلا|كمبوند|مشروع سكني|العاصمة الإدارية|سعر المتر|تشطيب|وحدة سكنية|التجمع|الشيخ زايد' THEN
    slug := 'realestate'; nm := 'عقارات وأسواق';
  ELSIF txt ~ 'سياحة|سياحي|سفر|مطار|طيران|رحلات|فندق|فنادق|الأقصر|أسوان|شرم الشيخ|الغردقة|مرسى علم|تأشيرة|فيزا سياحية|وجهة سياحية' THEN
    slug := 'tourism'; nm := 'سياحة وسفر';
  ELSIF txt ~ 'الطاقة المتجددة|طاقة شمسية|طاقة الرياح|بيئة|التغير المناخي|الاحتباس الحراري|انبعاثات|قطع الكهرباء|محطة كهرباء|تلوث|البيئة' THEN
    slug := 'energy'; nm := 'طاقة وبيئة';
  ELSIF txt ~ 'المجلس القومي للمرأة|تمكين المرأة|الأمومة|الأسرة|الأطفال|الطفل|التربية|عنف ضد المرأة|الزواج|المطلقات' THEN
    slug := 'women-family'; nm := 'مرأة وأسرة';
  ELSIF txt ~ 'موضة|أزياء|ديكور|طبخ|طهي|وصفة|وصفات|تطوير الذات|نصائح|لايف ستايل|تخسيس|رشاقة|عناية بالبشرة' THEN
    slug := 'lifestyle'; nm := 'منوعات ولايف ستايل';
  ELSIF txt ~ 'ظاهرة اجتماعية|قضايا الأسرة|المجتمع المصري|تنمر|طلاق|تعاطي|إدمان|مبادرة مجتمعية|قرية|عشوائيات' THEN
    slug := 'society'; nm := 'مجتمع';
  ELSIF txt ~ 'حادث|حوادث|تصادم|اصطدام|جريمة|جرائم|قتيل|قتلى|مقتل|اغتيال|ضحايا|زلزال|حريق|انفجار|نيابة|محكمة|ضبط|بلاغ|سرقة|اختطاف|طعن|إطلاق نار|غرق|انهيار' THEN
    slug := 'accidents'; nm := 'حوادث وجرائم';
  ELSIF txt ~ 'الأهلي|الزمالك|بيراميدز|الاتحاد|كرة القدم|مباراة|الدوري|الكأس|كأس|لاعب|منتخب|بطولة|مدرب|هدف|أهداف|ملعب|الكرة|أولمبياد|فيفا|كاف|ميسي|رونالدو|صلاح' THEN
    slug := 'sports'; nm := 'رياضة';
  ELSIF txt ~ 'وزارة التربية|وزير التعليم|التعليم|مدرسة|مدارس|طالب|طلاب|طلبة|امتحان|امتحانات|نتيجة|نتائج|الثانوية|الإعدادية|الابتدائية|الجامعة|جامعات|كلية|تنسيق|الأزهر' THEN
    slug := 'education'; nm := 'تعليم';
  ELSIF txt ~ 'صحة|طبيب|مستشفى|دواء|علاج|وباء|فيروس|لقاح|مرض|جراحة|سرطان|كورونا|كوفيد|اكتشاف علمي|أبحاث|الباحثون|دراسة علمية|ناسا|الفضاء' THEN
    slug := 'science-health'; nm := 'علوم وطب';
  ELSIF txt ~ 'تكنولوجيا|تقنية|ذكاء اصطناعي|chatgpt|تطبيق|إنترنت|هاتف|آيفون|سامسونج|جوجل|فيسبوك|واتساب|تيك توك|أندرويد|ios|روبوت|سوفتوير|برمجة|أمن سيبراني|قرصنة|ميتا' THEN
    slug := 'technology'; nm := 'تكنولوجيا';
  ELSIF txt ~ 'اقتصاد|بنك|بنوك|المركزي|استثمار|تمويل|صادرات|واردات|تضخم|ميزانية|موازنة|بترول|نفط|غاز|تجارة|بورصة|دولار|يورو|عملة|قرض|صندوق النقد|ضرائب|جمارك|سعر|أسعار|الذهب|عيار' THEN
    slug := 'economy'; nm := 'اقتصاد';
  ELSIF txt ~ 'فنان|فنانة|مسلسل|سينما|مهرجان|أغنية|ألبوم|مطرب|مطربة|ممثل|ممثلة|فيلم|أفلام|مسرح|دراما|كليب|موسيقى|نجمة|نجم|هوليوود|بوليوود|تامر حسني|عمرو دياب|محمد رمضان' THEN
    slug := 'entertainment'; nm := 'فن ومشاهير';
  ELSIF txt ~ 'سياسة|الرئيس|السيسي|الحكومة|مجلس الوزراء|مجلس النواب|البرلمان|وزير|وزارة|سفير|دبلوماس|قمة|معاهدة|اتفاقية|الأمم المتحدة|الجامعة العربية|أمريكا|روسيا|الصين|إيران|إسرائيل|غزة|فلسطين|سوريا|لبنان|تركيا|أردوغان|بوتين|ترامب|نتنياهو|حماس' THEN
    slug := 'politics'; nm := 'سياسة';
  ELSE
    slug := 'politics'; nm := 'سياسة';
  END IF;

  RETURN public.ensure_category(p_slug => slug, p_name => nm);
END;
$$;

-- 4) Recategorize entire archive against the new 22-category taxonomy
SELECT public.recategorize_all_articles();