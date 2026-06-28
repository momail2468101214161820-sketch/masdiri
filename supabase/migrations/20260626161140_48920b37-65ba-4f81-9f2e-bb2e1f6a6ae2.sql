-- Auto-classify articles into the correct section when news-fetcher (or admin) inserts without category_id
DROP TRIGGER IF EXISTS articles_auto_category ON public.articles;
CREATE TRIGGER articles_auto_category
BEFORE INSERT OR UPDATE OF title, content, category_id ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_article_category();

-- Backfill: re-classify any existing rows missing a category
UPDATE public.articles
SET category_id = public.infer_article_category(title, content)
WHERE category_id IS NULL;