
-- 1) Add short_id column + sequence
CREATE SEQUENCE IF NOT EXISTS public.articles_short_id_seq START 1000;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS short_id BIGINT;

-- 2) Backfill existing rows in creation order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM public.articles
  WHERE short_id IS NULL
)
UPDATE public.articles a
SET short_id = 1000 + o.rn
FROM ordered o
WHERE a.id = o.id;

-- 3) Advance sequence past max
SELECT setval('public.articles_short_id_seq', GREATEST(1000, COALESCE((SELECT MAX(short_id) FROM public.articles), 1000)) + 1, false);

-- 4) Make it required + unique + default from sequence
ALTER TABLE public.articles
  ALTER COLUMN short_id SET DEFAULT nextval('public.articles_short_id_seq'),
  ALTER COLUMN short_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS articles_short_id_unique ON public.articles(short_id);
ALTER SEQUENCE public.articles_short_id_seq OWNED BY public.articles.short_id;
