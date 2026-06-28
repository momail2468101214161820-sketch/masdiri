
CREATE INDEX IF NOT EXISTS idx_articles_published_created ON public.articles (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_created ON public.articles (category_id, created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_articles_pinned ON public.articles (is_pinned, created_at DESC) WHERE is_published = true AND is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_articles_breaking ON public.articles (is_breaking, created_at DESC) WHERE is_published = true AND is_breaking = true;
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON public.articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prep_results_seat ON public.prep_results_2026 (seat_number);
CREATE INDEX IF NOT EXISTS idx_prep_results_name_trgm ON public.prep_results_2026 USING gin (student_name gin_trgm_ops);
ANALYZE public.articles;
ANALYZE public.prep_results_2026;
