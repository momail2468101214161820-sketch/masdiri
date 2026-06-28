
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (name, slug) VALUES
  ('سياسة', 'politics'),
  ('رياضة', 'sports'),
  ('حوادث', 'accidents'),
  ('اقتصاد', 'economy'),
  ('تكنولوجيا', 'technology'),
  ('أسعار', 'prices');

-- Create news articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  is_breaking BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot TEXT NOT NULL,
  image_url TEXT,
  target_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscribers table
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Published articles are publicly readable" ON public.articles FOR SELECT USING (is_published = true);
CREATE POLICY "Active ads are publicly readable" ON public.ads FOR SELECT USING (is_active = true);

-- Allow public insert for subscribers
CREATE POLICY "Anyone can subscribe" ON public.subscribers FOR INSERT WITH CHECK (true);

-- Allow all operations for articles (admin via edge functions)
CREATE POLICY "Allow all insert articles" ON public.articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update articles" ON public.articles FOR UPDATE USING (true);
CREATE POLICY "Allow all delete articles" ON public.articles FOR DELETE USING (true);

-- Allow all operations for ads
CREATE POLICY "Allow all insert ads" ON public.ads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update ads" ON public.ads FOR UPDATE USING (true);
CREATE POLICY "Allow all delete ads" ON public.ads FOR DELETE USING (true);
CREATE POLICY "Allow all select ads admin" ON public.ads FOR SELECT USING (true);

-- Enable realtime for articles
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
