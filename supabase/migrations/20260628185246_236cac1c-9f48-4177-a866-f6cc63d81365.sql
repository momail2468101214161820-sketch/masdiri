
-- 1) push_subscriptions: require authenticated insert
DROP POLICY IF EXISTS "Push subscriptions must be well-formed" ON public.push_subscriptions;

CREATE POLICY "Authenticated users insert own push subs"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND endpoint IS NOT NULL
  AND length(endpoint) BETWEEN 32 AND 2048
  AND endpoint ~* '^https://'
  AND p256dh IS NOT NULL
  AND length(p256dh) BETWEEN 60 AND 200
  AND auth IS NOT NULL
  AND length(auth) BETWEEN 8 AND 100
);

-- 2) article_comments.ip_hash: hide from anon/authenticated
REVOKE SELECT ON public.article_comments FROM anon, authenticated;

GRANT SELECT (
  id, article_id, parent_id, author_name, author_country, body,
  likes, is_hidden, created_at, updated_at
) ON public.article_comments TO anon, authenticated;

GRANT INSERT ON public.article_comments TO anon, authenticated;

-- 3) Revoke EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.clean_all_article_sources()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.like_comment(uuid)           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.phase2_dashboard_stats()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recategorize_all_articles()  FROM PUBLIC, anon, authenticated;
