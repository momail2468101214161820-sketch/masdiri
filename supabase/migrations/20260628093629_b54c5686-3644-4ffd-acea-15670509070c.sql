
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS governorate text,
  ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_articles_governorate ON public.articles (governorate);
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON public.articles (view_count DESC);
CREATE INDEX IF NOT EXISTS idx_articles_created_desc ON public.articles (created_at DESC);

CREATE TABLE IF NOT EXISTS public.article_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  entity_slug text NOT NULL,
  entity_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, entity_slug)
);
GRANT SELECT ON public.article_entities TO anon, authenticated;
GRANT ALL ON public.article_entities TO service_role;
ALTER TABLE public.article_entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read entities" ON public.article_entities;
DROP POLICY IF EXISTS "service write entities" ON public.article_entities;
CREATE POLICY "public read entities" ON public.article_entities FOR SELECT USING (true);
CREATE POLICY "service write entities" ON public.article_entities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_article_entities_slug ON public.article_entities (entity_slug);
CREATE INDEX IF NOT EXISTS idx_article_entities_article ON public.article_entities (article_id);

CREATE OR REPLACE FUNCTION public.increment_article_views(p_article_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.articles SET view_count = view_count + 1 WHERE id = p_article_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_article_views(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.infer_governorate(_txt text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE txt text := lower(coalesce(_txt,''));
BEGIN
  IF txt ~ 'القاهرة' THEN RETURN 'cairo';
  ELSIF txt ~ 'الجيزة' THEN RETURN 'giza';
  ELSIF txt ~ 'الإسكندرية|الاسكندرية' THEN RETURN 'alexandria';
  ELSIF txt ~ 'الدقهلية|المنصورة' THEN RETURN 'dakahlia';
  ELSIF txt ~ 'الشرقية|الزقازيق' THEN RETURN 'sharqia';
  ELSIF txt ~ 'الغربية|طنطا' THEN RETURN 'gharbia';
  ELSIF txt ~ 'المنوفية' THEN RETURN 'monufia';
  ELSIF txt ~ 'القليوبية|بنها' THEN RETURN 'qalyubia';
  ELSIF txt ~ 'البحيرة|دمنهور' THEN RETURN 'beheira';
  ELSIF txt ~ 'كفر الشيخ' THEN RETURN 'kafr-elsheikh';
  ELSIF txt ~ 'دمياط' THEN RETURN 'damietta';
  ELSIF txt ~ 'بورسعيد' THEN RETURN 'port-said';
  ELSIF txt ~ 'الإسماعيلية|الاسماعيلية' THEN RETURN 'ismailia';
  ELSIF txt ~ 'السويس' THEN RETURN 'suez';
  ELSIF txt ~ 'شمال سيناء|العريش' THEN RETURN 'north-sinai';
  ELSIF txt ~ 'جنوب سيناء|شرم الشيخ|دهب' THEN RETURN 'south-sinai';
  ELSIF txt ~ 'الفيوم' THEN RETURN 'fayoum';
  ELSIF txt ~ 'بني سويف' THEN RETURN 'beni-suef';
  ELSIF txt ~ 'المنيا' THEN RETURN 'minya';
  ELSIF txt ~ 'أسيوط|اسيوط' THEN RETURN 'assiut';
  ELSIF txt ~ 'سوهاج' THEN RETURN 'sohag';
  ELSIF txt ~ 'قنا' THEN RETURN 'qena';
  ELSIF txt ~ 'الأقصر|الاقصر' THEN RETURN 'luxor';
  ELSIF txt ~ 'أسوان|اسوان' THEN RETURN 'aswan';
  ELSIF txt ~ 'البحر الأحمر|الغردقة' THEN RETURN 'red-sea';
  ELSIF txt ~ 'مطروح' THEN RETURN 'matrouh';
  ELSIF txt ~ 'الوادي الجديد' THEN RETURN 'new-valley';
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.infer_tags(_txt text)
RETURNS text[] LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE txt text := lower(coalesce(_txt,'')); t text[] := ARRAY[]::text[];
BEGIN
  IF txt ~ 'السيسي' THEN t := array_append(t, 'السيسي'); END IF;
  IF txt ~ 'الأهلي' THEN t := array_append(t, 'الأهلي'); END IF;
  IF txt ~ 'الزمالك' THEN t := array_append(t, 'الزمالك'); END IF;
  IF txt ~ 'الدولار' THEN t := array_append(t, 'الدولار'); END IF;
  IF txt ~ 'الذهب' THEN t := array_append(t, 'الذهب'); END IF;
  IF txt ~ 'الثانوية' THEN t := array_append(t, 'الثانوية-العامة'); END IF;
  IF txt ~ 'كأس العالم' THEN t := array_append(t, 'كأس-العالم'); END IF;
  IF txt ~ 'غزة' THEN t := array_append(t, 'غزة'); END IF;
  IF txt ~ 'فلسطين' THEN t := array_append(t, 'فلسطين'); END IF;
  IF txt ~ 'الذكاء الاصطناعي|ذكاء اصطناعي' THEN t := array_append(t, 'الذكاء-الاصطناعي'); END IF;
  IF txt ~ 'الطقس|الأرصاد' THEN t := array_append(t, 'الطقس'); END IF;
  IF txt ~ 'كورونا|كوفيد' THEN t := array_append(t, 'كورونا'); END IF;
  IF txt ~ 'صلاح' THEN t := array_append(t, 'محمد-صلاح'); END IF;
  IF txt ~ 'ميسي' THEN t := array_append(t, 'ميسي'); END IF;
  IF txt ~ 'رونالدو' THEN t := array_append(t, 'رونالدو'); END IF;
  RETURN t;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_extract_article_metadata()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE combined text := coalesce(NEW.title,'') || ' ' || coalesce(NEW.content,'');
BEGIN
  IF (NEW.tags IS NULL OR array_length(NEW.tags,1) IS NULL) THEN
    NEW.tags := public.infer_tags(combined);
  END IF;
  IF NEW.governorate IS NULL THEN
    NEW.governorate := public.infer_governorate(combined);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_extract_article_metadata ON public.articles;
CREATE TRIGGER trg_auto_extract_article_metadata
BEFORE INSERT OR UPDATE OF title, content ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.auto_extract_article_metadata();

UPDATE public.articles
SET tags = public.infer_tags(coalesce(title,'') || ' ' || coalesce(content,'')),
    governorate = COALESCE(governorate, public.infer_governorate(coalesce(title,'') || ' ' || coalesce(content,'')))
WHERE array_length(tags,1) IS NULL OR governorate IS NULL;
