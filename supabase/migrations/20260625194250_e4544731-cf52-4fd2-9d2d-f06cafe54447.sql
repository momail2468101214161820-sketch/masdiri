
-- Add dedup columns to articles
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS articles_content_hash_uniq
  ON public.articles (content_hash) WHERE content_hash IS NOT NULL;

-- News automation log
CREATE TABLE IF NOT EXISTS public.news_fetch_log (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  items_found INT DEFAULT 0,
  items_inserted INT DEFAULT 0,
  items_skipped INT DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_fetch_log TO authenticated;
GRANT ALL ON public.news_fetch_log TO service_role;
ALTER TABLE public.news_fetch_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fetch log" ON public.news_fetch_log FOR SELECT USING (true);

-- Enable extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
