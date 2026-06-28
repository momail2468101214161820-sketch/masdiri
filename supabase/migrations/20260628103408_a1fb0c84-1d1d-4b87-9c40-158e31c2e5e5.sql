
-- ============================================================
-- Phase 2: AI Editorial Pipeline + Dedup + Entities + Dashboard
-- ============================================================

-- 1) New article columns for SEO + entity extraction
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS persons text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS organizations text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS places text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS image_alt text,
  ADD COLUMN IF NOT EXISTS image_caption text,
  ADD COLUMN IF NOT EXISTS ai_rewritten boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS merged_from_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_merged_at timestamptz;

-- pg_trgm GIN index for fast similarity search on titles
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm
  ON public.articles USING gin (title public.gin_trgm_ops);

-- 2) Suggested categories (admin must approve before creating real category)
CREATE TABLE IF NOT EXISTS public.suggested_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  reason text,
  occurrences integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.suggested_categories TO authenticated;
GRANT ALL ON public.suggested_categories TO service_role;
ALTER TABLE public.suggested_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read suggested categories" ON public.suggested_categories;
CREATE POLICY "auth read suggested categories" ON public.suggested_categories
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "service write suggested categories" ON public.suggested_categories;
CREATE POLICY "service write suggested categories" ON public.suggested_categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3) News merge log (when AI detected a near-duplicate and merged instead of inserting)
CREATE TABLE IF NOT EXISTS public.news_merge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE,
  source_url text,
  source_name text,
  similarity numeric,
  reason text,
  added_content_length integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_merge_log TO authenticated;
GRANT ALL ON public.news_merge_log TO service_role;
ALTER TABLE public.news_merge_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read merge log" ON public.news_merge_log;
CREATE POLICY "auth read merge log" ON public.news_merge_log
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "service write merge log" ON public.news_merge_log;
CREATE POLICY "service write merge log" ON public.news_merge_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_news_merge_log_article ON public.news_merge_log(article_id);
CREATE INDEX IF NOT EXISTS idx_news_merge_log_created ON public.news_merge_log(created_at DESC);

-- 4) News sources health table
CREATE TABLE IF NOT EXISTS public.news_sources_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'unknown', -- ok | degraded | down | unknown
  consecutive_failures integer NOT NULL DEFAULT 0,
  total_runs integer NOT NULL DEFAULT 0,
  total_inserted integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_sources_health TO authenticated;
GRANT ALL ON public.news_sources_health TO service_role;
ALTER TABLE public.news_sources_health ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read sources health" ON public.news_sources_health;
CREATE POLICY "auth read sources health" ON public.news_sources_health
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "service write sources health" ON public.news_sources_health;
CREATE POLICY "service write sources health" ON public.news_sources_health
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5) Similarity finder: returns id + similarity (0..1) for the best matching recent article
CREATE OR REPLACE FUNCTION public.find_similar_article(
  _title text,
  _content text,
  _threshold real DEFAULT 0.6,
  _days int DEFAULT 7
)
RETURNS TABLE(id uuid, similarity real, title text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id,
         GREATEST(
           public.similarity(a.title, _title),
           CASE
             WHEN length(coalesce(_content,'')) > 80
             THEN public.similarity(left(coalesce(a.content,''), 600), left(_content, 600)) * 0.85
             ELSE 0
           END
         )::real AS similarity,
         a.title
    FROM public.articles a
   WHERE a.created_at > (now() - make_interval(days => _days))
     AND public.similarity(a.title, _title) > _threshold
   ORDER BY public.similarity(a.title, _title) DESC
   LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.find_similar_article(text, text, real, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_similar_article(text, text, real, int) TO service_role;

-- 6) Dashboard stats RPC (single round-trip)
CREATE OR REPLACE FUNCTION public.phase2_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'articles_today',  (SELECT count(*) FROM articles WHERE created_at > now() - interval '1 day'),
    'articles_week',   (SELECT count(*) FROM articles WHERE created_at > now() - interval '7 days'),
    'articles_month',  (SELECT count(*) FROM articles WHERE created_at > now() - interval '30 days'),
    'articles_total',  (SELECT count(*) FROM articles),
    'ai_rewritten',    (SELECT count(*) FROM articles WHERE ai_rewritten = true),
    'merges_total',    (SELECT count(*) FROM news_merge_log),
    'merges_today',    (SELECT count(*) FROM news_merge_log WHERE created_at > now() - interval '1 day'),
    'duplicates_blocked', (SELECT coalesce(sum(items_skipped),0) FROM news_fetch_log WHERE created_at > now() - interval '1 day'),
    'by_category',     (SELECT coalesce(jsonb_object_agg(c.name, sub.cnt), '{}'::jsonb)
                          FROM (SELECT category_id, count(*) cnt FROM articles
                                 WHERE created_at > now() - interval '30 days'
                                 GROUP BY category_id) sub
                          LEFT JOIN categories c ON c.id = sub.category_id
                         WHERE c.name IS NOT NULL),
    'sources_health',  (SELECT coalesce(jsonb_agg(to_jsonb(h)), '[]'::jsonb) FROM news_sources_health h),
    'recent_errors',   (SELECT coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb)
                          FROM (SELECT source, error, created_at FROM news_fetch_log
                                 WHERE error IS NOT NULL
                                 ORDER BY created_at DESC LIMIT 10) e),
    'recent_merges',   (SELECT coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
                          FROM (SELECT * FROM news_merge_log ORDER BY created_at DESC LIMIT 10) m),
    'pending_categories', (SELECT count(*) FROM suggested_categories WHERE status='pending'),
    'images_processed',(SELECT count(*) FROM articles WHERE image_alt IS NOT NULL AND image_alt <> '')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.phase2_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.phase2_dashboard_stats() TO authenticated, service_role;

-- 7) Entity sync helper: writes persons/orgs/places into article_entities table
CREATE OR REPLACE FUNCTION public.sync_article_entities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v text;
BEGIN
  DELETE FROM article_entities WHERE article_id = NEW.id;
  IF NEW.persons IS NOT NULL THEN
    FOREACH v IN ARRAY NEW.persons LOOP
      IF length(trim(v)) > 1 THEN
        INSERT INTO article_entities(article_id, entity_type, entity_name, entity_slug)
        VALUES (NEW.id, 'person', v, lower(regexp_replace(v, '\s+', '-', 'g')))
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  IF NEW.organizations IS NOT NULL THEN
    FOREACH v IN ARRAY NEW.organizations LOOP
      IF length(trim(v)) > 1 THEN
        INSERT INTO article_entities(article_id, entity_type, entity_name, entity_slug)
        VALUES (NEW.id, 'org', v, lower(regexp_replace(v, '\s+', '-', 'g')))
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  IF NEW.places IS NOT NULL THEN
    FOREACH v IN ARRAY NEW.places LOOP
      IF length(trim(v)) > 1 THEN
        INSERT INTO article_entities(article_id, entity_type, entity_name, entity_slug)
        VALUES (NEW.id, 'place', v, lower(regexp_replace(v, '\s+', '-', 'g')))
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_article_entities ON public.articles;
CREATE TRIGGER trg_sync_article_entities
  AFTER INSERT OR UPDATE OF persons, organizations, places ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.sync_article_entities();
