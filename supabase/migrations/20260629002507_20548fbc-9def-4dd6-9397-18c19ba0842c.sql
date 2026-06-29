CREATE INDEX IF NOT EXISTS idx_articles_published_created ON public.articles (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published_breaking_created ON public.articles (is_published, is_breaking, created_at DESC) WHERE is_breaking = true;
CREATE INDEX IF NOT EXISTS idx_articles_published_pinned_created ON public.articles (is_published, is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published_views ON public.articles (is_published, view_count DESC NULLS LAST, created_at DESC);
ANALYZE public.articles;