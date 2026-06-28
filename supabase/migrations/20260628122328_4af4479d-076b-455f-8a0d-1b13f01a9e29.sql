
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread','Read','Replied')),
  source text NOT NULL DEFAULT 'web',
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.messages TO anon, authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a message"
  ON public.messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(coalesce(name,'')) BETWEEN 1 AND 120
    AND length(coalesce(email,'')) BETWEEN 3 AND 254
    AND length(coalesce(message,'')) BETWEEN 1 AND 8000
    AND length(coalesce(subject,'')) <= 200
  );

CREATE INDEX IF NOT EXISTS messages_status_created_idx
  ON public.messages (status, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_created_idx
  ON public.messages (created_at DESC);

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
