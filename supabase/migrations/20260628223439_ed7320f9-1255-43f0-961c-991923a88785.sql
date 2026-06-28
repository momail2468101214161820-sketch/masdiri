
-- 1) article_comments: revoke SELECT on the sensitive ip_hash column from public roles
REVOKE SELECT (ip_hash) ON public.article_comments FROM anon, authenticated, PUBLIC;
-- Service role retains full access for admin/edge functions
GRANT SELECT ON public.article_comments TO service_role;

-- 2) messages: add explicit restrictive deny so no SELECT path can ever leak data
DROP POLICY IF EXISTS "Block all reads from messages" ON public.messages;
CREATE POLICY "Block all reads from messages"
ON public.messages
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (false);

-- Make sure only service_role can read
REVOKE SELECT ON public.messages FROM anon, authenticated, PUBLIC;
GRANT INSERT ON public.messages TO anon, authenticated;
GRANT ALL ON public.messages TO service_role;

-- 3) push_subscriptions: explicitly block anonymous role from any access; only authenticated owners + service role allowed
DROP POLICY IF EXISTS "Block anonymous access to push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Block anonymous access to push subscriptions"
ON public.push_subscriptions
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

REVOKE ALL ON public.push_subscriptions FROM anon, PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
