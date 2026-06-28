
-- Re-schedule cron jobs to inject the current admin PIN so the now-protected
-- edge functions (news-fetcher, gsc-indexing) still pass auth.
DO $$
BEGIN
  PERFORM cron.unschedule('soutalbalad-news-fetcher');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('gsc-auto-sitemap');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'soutalbalad-news-fetcher',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://texdxiafabzbampcswsn.supabase.co/functions/v1/news-fetcher?ai=1',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGR4aWFmYWJ6YmFtcGNzd3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODkwODUsImV4cCI6MjA4OTc2NTA4NX0.3FeZQivXN99E-ariQ-nj7IPeCj3Mb_GmJxHS3LJczb4',
      'X-Admin-Pin', COALESCE((SELECT value FROM public.admin_settings WHERE key = 'admin_code'), '')
    ),
    body := '{}'::jsonb
  );
  $cron$
);

SELECT cron.schedule(
  'gsc-auto-sitemap',
  '0 */6 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://texdxiafabzbampcswsn.supabase.co/functions/v1/gsc-indexing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGR4aWFmYWJ6YmFtcGNzd3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODkwODUsImV4cCI6MjA4OTc2NTA4NX0.3FeZQivXN99E-ariQ-nj7IPeCj3Mb_GmJxHS3LJczb4',
      'X-Admin-Pin', COALESCE((SELECT value FROM public.admin_settings WHERE key = 'admin_code'), '')
    ),
    body := '{"action":"submit_sitemap"}'::jsonb
  );
  $cron$
);
