
-- 1) push_subscriptions: drop overly-permissive DELETE policy. Cleanup still works via service_role (bypasses RLS).
DROP POLICY IF EXISTS "anyone can unsubscribe by endpoint" ON public.push_subscriptions;

-- 2) app_releases: restrict SELECT to authenticated users only (admin panel reads with auth).
DROP POLICY IF EXISTS "Releases are publicly readable" ON public.app_releases;
CREATE POLICY "Authenticated can read releases"
  ON public.app_releases
  FOR SELECT
  TO authenticated
  USING (true);

-- 3) news_fetch_log: remove public read. Service role bypasses RLS for internal logging.
DROP POLICY IF EXISTS "Anyone can read fetch log" ON public.news_fetch_log;
CREATE POLICY "Authenticated can read fetch log"
  ON public.news_fetch_log
  FOR SELECT
  TO authenticated
  USING (true);

-- 4) Revoke EXECUTE on SECURITY DEFINER functions from public roles. Service role retains access.
REVOKE EXECUTE ON FUNCTION public.auto_assign_article_category() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_category(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.infer_article_category(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recategorize_all_articles() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ensure_category(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.infer_article_category(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.recategorize_all_articles() TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_assign_article_category() TO service_role;
