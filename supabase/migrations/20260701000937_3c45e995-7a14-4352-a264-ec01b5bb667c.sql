
-- 1. Remove scraper cron jobs (safe if none exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE command ILIKE '%news-fetcher%' OR command ILIKE '%ai-journalist%' OR command ILIKE '%rates-fetcher%' OR command ILIKE '%dynamic-rss%' OR command ILIKE '%dynamic-sitemap%' OR command ILIKE '%gsc-indexing%' OR command ILIKE '%indexnow%';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Drop scraper-related triggers on articles before dropping functions
DROP TRIGGER IF EXISTS trg_articles_auto_category ON public.articles;
DROP TRIGGER IF EXISTS trg_articles_auto_metadata ON public.articles;
DROP TRIGGER IF EXISTS trg_articles_sync_entities ON public.articles;
DROP TRIGGER IF EXISTS trg_article_view_bump ON public.article_view_events;

-- 3. Delete all scraper articles
DELETE FROM public.articles WHERE ai_rewritten = true;

-- 4. Drop scraper-support tables (cascades)
DROP TABLE IF EXISTS public.article_entities CASCADE;
DROP TABLE IF EXISTS public.news_fetch_log CASCADE;
DROP TABLE IF EXISTS public.news_merge_log CASCADE;
DROP TABLE IF EXISTS public.news_sources_health CASCADE;
DROP TABLE IF EXISTS public.suggested_categories CASCADE;

-- 5. Drop comments / reactions / view events
DROP TABLE IF EXISTS public.article_comments CASCADE;
DROP TABLE IF EXISTS public.article_view_events CASCADE;

-- 6. Drop scraper-related functions
DROP FUNCTION IF EXISTS public.infer_tags(text) CASCADE;
DROP FUNCTION IF EXISTS public.infer_governorate(text) CASCADE;
DROP FUNCTION IF EXISTS public.infer_article_category(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.auto_extract_article_metadata() CASCADE;
DROP FUNCTION IF EXISTS public.auto_assign_article_category() CASCADE;
DROP FUNCTION IF EXISTS public.sync_article_entities() CASCADE;
DROP FUNCTION IF EXISTS public.find_similar_article(text, text, real, integer) CASCADE;
DROP FUNCTION IF EXISTS public.clean_article_sources(text) CASCADE;
DROP FUNCTION IF EXISTS public.clean_all_article_sources() CASCADE;
DROP FUNCTION IF EXISTS public.recategorize_all_articles() CASCADE;
DROP FUNCTION IF EXISTS public.phase2_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.like_comment(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.bump_article_view_count() CASCADE;

-- 7. Drop scraper-related article columns (keep manual publishing essentials)
ALTER TABLE public.articles
  DROP COLUMN IF EXISTS content_hash,
  DROP COLUMN IF EXISTS source_url,
  DROP COLUMN IF EXISTS source_name,
  DROP COLUMN IF EXISTS ai_rewritten,
  DROP COLUMN IF EXISTS merged_from_count,
  DROP COLUMN IF EXISTS last_merged_at,
  DROP COLUMN IF EXISTS persons,
  DROP COLUMN IF EXISTS organizations,
  DROP COLUMN IF EXISTS places,
  DROP COLUMN IF EXISTS keywords;

-- 8. Reset categories to Beni Suef focus
-- First, move all articles to a temp NULL and re-seed
UPDATE public.articles SET category_id = NULL;
DELETE FROM public.categories;

INSERT INTO public.categories (name, slug) VALUES
  ('بني سويف', 'beni-suef'),
  ('قصص نجاح', 'success-stories'),
  ('شخصيات ملهمة', 'inspiring-people'),
  ('مبادرات مجتمعية', 'community-initiatives'),
  ('إنجازات محلية', 'local-achievements'),
  ('أخبار عامة', 'general');

-- Reassign surviving articles to "أخبار عامة"
UPDATE public.articles
  SET category_id = (SELECT id FROM public.categories WHERE slug='general')
  WHERE category_id IS NULL;

-- 9. Ensure ensure_category still works with the new set (already exists as SECURITY DEFINER)
