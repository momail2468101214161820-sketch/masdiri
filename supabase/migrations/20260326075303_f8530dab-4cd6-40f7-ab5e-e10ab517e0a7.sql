CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  category_id uuid REFERENCES public.categories(id),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are publicly readable" ON public.videos FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Allow all insert videos" ON public.videos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update videos" ON public.videos FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete videos" ON public.videos FOR DELETE TO public USING (true);
CREATE POLICY "Allow all select videos admin" ON public.videos FOR SELECT TO public USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

CREATE POLICY "Public video read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'videos');
CREATE POLICY "Allow video upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'videos');
CREATE POLICY "Allow video delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'videos');