-- Helper: ensure a category exists by slug+name, return its id
CREATE OR REPLACE FUNCTION public.ensure_category(_slug text, _name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM categories WHERE slug = _slug;
  IF cid IS NULL THEN
    INSERT INTO categories (name, slug) VALUES (_name, _slug)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cid;
  END IF;
  RETURN cid;
END;
$$;

-- Infer a category id from title+content; auto-create the category if missing
CREATE OR REPLACE FUNCTION public.infer_article_category(_title text, _content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  txt text := COALESCE(_title,'') || ' ' || COALESCE(_content,'');
  slug text;
  nm text;
BEGIN
  IF txt ~ 'حادث|حوادث|جريمة|قتيل|قتلى|ضحايا|زلزال|حريق|انفجار|نيابة|محكمة|ضبط|بلاغ|سرقة|اغتيال|اصطدام|غرق' THEN
    slug := 'accidents'; nm := 'حوادث';
  ELSIF txt ~ 'الأهلي|الزمالك|كرة القدم|مباراة|الدوري|كأس|لاعب|منتخب|بطولة|مدرب|هدف|أهداف|ملعب|الكرة|الرياضة المصرية' THEN
    slug := 'sports'; nm := 'رياضة';
  ELSIF txt ~ 'سعر|أسعار|بورصة|دولار|يورو|ذهب|فضة|الفراخ|الدواجن|البنزين|السولار|تسعيرة' THEN
    slug := 'prices'; nm := 'أسعار';
  ELSIF txt ~ 'تكنولوجيا|ذكاء اصطناعي|تطبيق|إنترنت|هاتف|آيفون|سامسونج|جوجل|فيسبوك|واتساب|تيك توك|تقنية|روبوت|سوفتوير|تحديث' THEN
    slug := 'technology'; nm := 'تكنولوجيا';
  ELSIF txt ~ 'اقتصاد|بنك|استثمار|تمويل|صادرات|واردات|تضخم|ميزانية|موازنة|بترول|نفط|غاز|تجارة' THEN
    slug := 'economy'; nm := 'اقتصاد';
  ELSIF txt ~ 'فنان|فنانة|مسلسل|سينما|مهرجان|أغنية|ألبوم|مطرب|مطربة|ممثل|ممثلة|فيلم|مسرح|دراما|كليب' THEN
    slug := 'entertainment'; nm := 'فن ومنوعات';
  ELSIF txt ~ 'صحة|طبيب|مستشفى|دواء|علاج|وباء|فيروس|لقاح|مرض|إصاب|الصحة' THEN
    slug := 'health'; nm := 'صحة وأسرة';
  ELSE
    slug := 'politics'; nm := 'سياسة';
  END IF;
  RETURN public.ensure_category(slug, nm);
END;
$$;

-- Trigger: auto-assign category when missing on insert/update
CREATE OR REPLACE FUNCTION public.auto_assign_article_category()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.category_id IS NULL THEN
    NEW.category_id := public.infer_article_category(NEW.title, NEW.content);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_article_category ON public.articles;
CREATE TRIGGER trg_auto_assign_article_category
BEFORE INSERT OR UPDATE OF title, content, category_id ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_article_category();

-- Upgrade recategorize to use the inference helper (auto-creates missing cats)
CREATE OR REPLACE FUNCTION public.recategorize_all_articles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed integer := 0;
  r record;
  new_cat uuid;
BEGIN
  FOR r IN SELECT id, title, content, category_id FROM articles LOOP
    new_cat := public.infer_article_category(r.title, r.content);
    IF r.category_id IS DISTINCT FROM new_cat THEN
      UPDATE articles SET category_id = new_cat WHERE id = r.id;
      changed := changed + 1;
    END IF;
  END LOOP;
  RETURN changed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recategorize_all_articles() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.infer_article_category(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_category(text, text) TO anon, authenticated, service_role;