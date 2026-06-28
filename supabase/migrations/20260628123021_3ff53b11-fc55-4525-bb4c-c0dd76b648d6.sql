
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS focus_keyword text;

ALTER TABLE public.articles
  ADD CONSTRAINT seo_title_len_chk CHECK (seo_title IS NULL OR length(seo_title) <= 70),
  ADD CONSTRAINT seo_desc_len_chk CHECK (seo_description IS NULL OR length(seo_description) <= 180),
  ADD CONSTRAINT focus_kw_len_chk CHECK (focus_keyword IS NULL OR length(focus_keyword) <= 80);
