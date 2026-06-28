
-- 1. Revoke client write grants on content tables
REVOKE INSERT, UPDATE, DELETE ON public.articles    FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.categories  FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.ads         FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.videos      FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_settings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.app_releases   FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.article_entities FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.news_fetch_log FROM anon, authenticated;

GRANT ALL ON public.articles, public.categories, public.ads, public.videos,
              public.admin_settings, public.app_releases,
              public.article_entities, public.news_fetch_log TO service_role;

-- 2. Subscribers hardening
REVOKE SELECT ON public.subscribers FROM anon, authenticated;
GRANT  INSERT ON public.subscribers TO anon, authenticated;
GRANT  ALL    ON public.subscribers TO service_role;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;
CREATE POLICY "Anyone can subscribe with a valid email"
  ON public.subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 5 AND 320
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

DROP POLICY IF EXISTS "Subscriber emails are private" ON public.subscribers;
CREATE POLICY "Subscriber emails are private"
  ON public.subscribers FOR SELECT TO anon, authenticated
  USING (false);

-- 3. Push subscriptions — tighten WITH CHECK
DROP POLICY IF EXISTS "anyone can subscribe" ON public.push_subscriptions;
CREATE POLICY "Push subscriptions must be well-formed"
  ON public.push_subscriptions FOR INSERT TO anon, authenticated
  WITH CHECK (
    endpoint IS NOT NULL AND length(endpoint) BETWEEN 32 AND 2048
    AND endpoint ~* '^https://'
    AND p256dh IS NOT NULL AND length(p256dh) BETWEEN 60 AND 200
    AND auth   IS NOT NULL AND length(auth)   BETWEEN  8 AND 100
  );

REVOKE SELECT, UPDATE, DELETE ON public.push_subscriptions FROM anon, authenticated;
GRANT  INSERT ON public.push_subscriptions TO anon, authenticated;
GRANT  ALL    ON public.push_subscriptions TO service_role;

-- 4. Revoke EXECUTE on SECURITY DEFINER public functions
REVOKE EXECUTE ON FUNCTION public.recategorize_all_articles()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_article_category()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.infer_article_category(text, text)  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_category(text, text)         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_extract_article_metadata()     FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.recategorize_all_articles()         TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_assign_article_category()      TO service_role;
GRANT EXECUTE ON FUNCTION public.infer_article_category(text, text)  TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_category(text, text)         TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_extract_article_metadata()     TO service_role;

-- 5. Replace increment_article_views with event-log + trigger pattern
DROP FUNCTION IF EXISTS public.increment_article_views(uuid);

CREATE TABLE IF NOT EXISTS public.article_view_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS article_view_events_article_id_idx
  ON public.article_view_events (article_id, created_at DESC);

GRANT INSERT ON public.article_view_events TO anon, authenticated;
GRANT ALL    ON public.article_view_events TO service_role;

ALTER TABLE public.article_view_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log an article view" ON public.article_view_events;
CREATE POLICY "Anyone can log an article view"
  ON public.article_view_events FOR INSERT TO anon, authenticated
  WITH CHECK (article_id IS NOT NULL);

DROP POLICY IF EXISTS "View events are private" ON public.article_view_events;
CREATE POLICY "View events are private"
  ON public.article_view_events FOR SELECT TO anon, authenticated
  USING (false);

CREATE OR REPLACE FUNCTION public.bump_article_view_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.articles
     SET view_count = COALESCE(view_count, 0) + 1
   WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bump_article_view_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bump_article_view_count ON public.article_view_events;
CREATE TRIGGER trg_bump_article_view_count
  AFTER INSERT ON public.article_view_events
  FOR EACH ROW EXECUTE FUNCTION public.bump_article_view_count();

-- 6. Storage RLS — public read, service_role-only writes
DROP POLICY IF EXISTS "Public read article-images" ON storage.objects;
CREATE POLICY "Public read article-images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Public read videos" ON storage.objects;
CREATE POLICY "Public read videos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Service role manages article-images" ON storage.objects;
CREATE POLICY "Service role manages article-images"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'article-images')
  WITH CHECK (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Service role manages videos" ON storage.objects;
CREATE POLICY "Service role manages videos"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'videos')
  WITH CHECK (bucket_id = 'videos');

DROP POLICY IF EXISTS "Block client uploads to managed buckets" ON storage.objects;
CREATE POLICY "Block client uploads to managed buckets"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id NOT IN ('article-images', 'videos'));

DROP POLICY IF EXISTS "Block client updates to managed buckets" ON storage.objects;
CREATE POLICY "Block client updates to managed buckets"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id NOT IN ('article-images', 'videos'));

DROP POLICY IF EXISTS "Block client deletes from managed buckets" ON storage.objects;
CREATE POLICY "Block client deletes from managed buckets"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id NOT IN ('article-images', 'videos'));
