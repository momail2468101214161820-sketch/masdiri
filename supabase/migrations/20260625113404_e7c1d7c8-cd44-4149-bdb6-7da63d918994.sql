
-- =========================================================
-- 1) admin_settings: drop permissive policies, hide admin_code
-- =========================================================
DROP POLICY IF EXISTS "settings readable" ON public.admin_settings;
DROP POLICY IF EXISTS "settings insert"   ON public.admin_settings;
DROP POLICY IF EXISTS "settings update"   ON public.admin_settings;

-- public can read every key EXCEPT the admin_code
CREATE POLICY "Public settings readable except admin_code"
  ON public.admin_settings
  FOR SELECT
  TO anon, authenticated
  USING (key <> 'admin_code');

REVOKE INSERT, UPDATE, DELETE ON public.admin_settings FROM anon, authenticated;
GRANT  SELECT ON public.admin_settings TO anon, authenticated;
GRANT  ALL    ON public.admin_settings TO service_role;

-- =========================================================
-- 2) articles: keep public read of published only, drop writes
-- =========================================================
DROP POLICY IF EXISTS "Allow all select articles admin" ON public.articles;
DROP POLICY IF EXISTS "Allow all insert articles"        ON public.articles;
DROP POLICY IF EXISTS "Allow all update articles"        ON public.articles;
DROP POLICY IF EXISTS "Allow all delete articles"        ON public.articles;

REVOKE INSERT, UPDATE, DELETE ON public.articles FROM anon, authenticated;
GRANT  SELECT ON public.articles TO anon, authenticated;
GRANT  ALL    ON public.articles TO service_role;

-- =========================================================
-- 3) ads: keep public read of active only, drop writes
-- =========================================================
DROP POLICY IF EXISTS "Allow all select ads admin" ON public.ads;
DROP POLICY IF EXISTS "Allow all insert ads"        ON public.ads;
DROP POLICY IF EXISTS "Allow all update ads"        ON public.ads;
DROP POLICY IF EXISTS "Allow all delete ads"        ON public.ads;

REVOKE INSERT, UPDATE, DELETE ON public.ads FROM anon, authenticated;
GRANT  SELECT ON public.ads TO anon, authenticated;
GRANT  ALL    ON public.ads TO service_role;

-- =========================================================
-- 4) categories: keep public read, drop writes
-- =========================================================
DROP POLICY IF EXISTS "Allow insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow delete categories" ON public.categories;

REVOKE INSERT, UPDATE, DELETE ON public.categories FROM anon, authenticated;
GRANT  SELECT ON public.categories TO anon, authenticated;
GRANT  ALL    ON public.categories TO service_role;

-- =========================================================
-- 5) videos: keep public read of published only, drop writes
-- =========================================================
DROP POLICY IF EXISTS "Allow all select videos admin" ON public.videos;
DROP POLICY IF EXISTS "Allow all insert videos"        ON public.videos;
DROP POLICY IF EXISTS "Allow all update videos"        ON public.videos;
DROP POLICY IF EXISTS "Allow all delete videos"        ON public.videos;

REVOKE INSERT, UPDATE, DELETE ON public.videos FROM anon, authenticated;
GRANT  SELECT ON public.videos TO anon, authenticated;
GRANT  ALL    ON public.videos TO service_role;

-- =========================================================
-- 6) prep_results_2026: remove blanket public read
-- =========================================================
DROP POLICY IF EXISTS "Results publicly readable" ON public.prep_results_2026;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.prep_results_2026 FROM anon, authenticated;
GRANT  ALL ON public.prep_results_2026 TO service_role;

-- =========================================================
-- 7) Storage: drop public write + listing policies for our buckets
-- =========================================================
DROP POLICY IF EXISTS "Anyone can upload article images"  ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete article images"  ON storage.objects;
DROP POLICY IF EXISTS "Allow video upload"                ON storage.objects;
DROP POLICY IF EXISTS "Allow video delete"                ON storage.objects;
-- The broad SELECT policies enable "listing" of files inside public buckets.
-- Dropping them blocks listing; direct public URLs still work because the buckets are marked public.
DROP POLICY IF EXISTS "Public read article images" ON storage.objects;
DROP POLICY IF EXISTS "Public video read"          ON storage.objects;
