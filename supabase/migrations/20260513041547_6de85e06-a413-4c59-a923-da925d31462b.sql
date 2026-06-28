CREATE TABLE IF NOT EXISTS public.admin_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "settings insert" ON public.admin_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "settings update" ON public.admin_settings FOR UPDATE USING (true);
INSERT INTO public.admin_settings (key, value) VALUES ('admin_code','7777') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.admin_settings (key, value) VALUES ('domain_target','185.158.133.1') ON CONFLICT (key) DO NOTHING;