-- Comments system for articles
CREATE TABLE public.article_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.article_comments(id) ON DELETE CASCADE,
  author_name text NOT NULL CHECK (length(trim(author_name)) BETWEEN 1 AND 60),
  author_country text,
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  likes integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_comments_article ON public.article_comments(article_id, created_at DESC);
CREATE INDEX idx_article_comments_parent ON public.article_comments(parent_id);

GRANT SELECT, INSERT ON public.article_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_comments TO authenticated;
GRANT ALL ON public.article_comments TO service_role;

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-hidden comments
CREATE POLICY "Read visible comments" ON public.article_comments
  FOR SELECT USING (is_hidden = false);

-- Anyone (anon included) can post a comment; never hidden by default
CREATE POLICY "Anyone can comment" ON public.article_comments
  FOR INSERT WITH CHECK (is_hidden = false);

-- Like-bump via RPC only (no client UPDATE/DELETE for anon)

CREATE TRIGGER trg_article_comments_updated
  BEFORE UPDATE ON public.article_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic like increment safe for anon
CREATE OR REPLACE FUNCTION public.like_comment(_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.article_comments
     SET likes = likes + 1
   WHERE id = _id AND is_hidden = false
   RETURNING likes;
$$;

GRANT EXECUTE ON FUNCTION public.like_comment(uuid) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.article_comments;