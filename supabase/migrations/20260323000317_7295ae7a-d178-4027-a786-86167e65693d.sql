
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS ad_type text NOT NULL DEFAULT 'image',
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
