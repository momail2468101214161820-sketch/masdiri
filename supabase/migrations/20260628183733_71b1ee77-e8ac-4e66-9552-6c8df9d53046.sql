
-- 1) article_comments: hide ip_hash from public reads via column-level revoke
REVOKE SELECT (ip_hash) ON public.article_comments FROM anon, authenticated;
-- Keep all other columns readable per existing policy

-- 2) push_subscriptions: add ownership + scoped policies
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS fingerprint text;

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_fingerprint_idx ON public.push_subscriptions(fingerprint);

-- Tighten INSERT: when authenticated, user_id must match auth.uid()
DROP POLICY IF EXISTS "Push subscriptions must be well-formed" ON public.push_subscriptions;
CREATE POLICY "Push subscriptions must be well-formed"
ON public.push_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  endpoint IS NOT NULL
  AND length(endpoint) BETWEEN 32 AND 2048
  AND endpoint ~* '^https://'
  AND p256dh IS NOT NULL AND length(p256dh) BETWEEN 60 AND 200
  AND auth IS NOT NULL AND length(auth) BETWEEN 8 AND 100
  AND (auth.uid() IS NULL OR user_id = auth.uid())
);

-- Owners can read their own subscriptions
CREATE POLICY "Owners can read own push subs"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Owners can delete their own subscriptions; anyone can delete by exact endpoint match (for unsub flows)
CREATE POLICY "Owners can delete own push subs"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());

-- 3) SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated for internal helpers & triggers.
--    Service role retains access; client-facing RPCs (like_comment, phase2_dashboard_stats,
--    recategorize_all_articles, clean_all_article_sources) remain executable by current callers.
REVOKE EXECUTE ON FUNCTION public.infer_article_category(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_article_category() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_extract_article_metadata() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_article_view_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_article_entities() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_category(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.find_similar_article(text, text, real, integer) FROM PUBLIC, anon, authenticated;

-- 4) Public buckets listing: drop broad SELECT policies that allow listing every object.
--    Files in public buckets remain reachable via /storage/v1/object/public/... URLs without RLS.
DROP POLICY IF EXISTS "Public read article-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read videos" ON storage.objects;
