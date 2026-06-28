
CREATE OR REPLACE FUNCTION public.clean_all_article_sources()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed integer := 0;
  r record;
  new_content text;
  new_title text;
BEGIN
  FOR r IN SELECT id, title, content FROM articles LOOP
    new_title   := public.clean_article_sources(r.title);
    new_content := public.clean_article_sources(r.content);
    IF r.title   IS DISTINCT FROM new_title
    OR r.content IS DISTINCT FROM new_content THEN
      UPDATE articles
         SET title   = COALESCE(NULLIF(new_title,   ''), title),
             content = COALESCE(NULLIF(new_content, ''), content)
       WHERE id = r.id;
      changed := changed + 1;
    END IF;
  END LOOP;
  RETURN changed;
END;
$$;
