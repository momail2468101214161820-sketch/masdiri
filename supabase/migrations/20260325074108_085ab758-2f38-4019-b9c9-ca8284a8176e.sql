INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true);

CREATE POLICY "Public read article images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'article-images');
CREATE POLICY "Anyone can upload article images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'article-images');
CREATE POLICY "Anyone can delete article images" ON storage.objects FOR DELETE TO public USING (bucket_id = 'article-images');

CREATE POLICY "Allow insert categories" ON public.categories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update categories" ON public.categories FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete categories" ON public.categories FOR DELETE TO public USING (true);

CREATE POLICY "Allow all select articles admin" ON public.articles FOR SELECT TO public USING (true);