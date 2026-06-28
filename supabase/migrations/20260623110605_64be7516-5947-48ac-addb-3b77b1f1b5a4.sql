
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.prep_results_2026 (
  id BIGSERIAL PRIMARY KEY,
  administration TEXT,
  school TEXT,
  seat_number INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  arabic TEXT,
  english TEXT,
  studies TEXT,
  math TEXT,
  science TEXT,
  total NUMERIC,
  computer TEXT,
  religion TEXT,
  art TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prep_results_2026 TO anon, authenticated;
GRANT ALL ON public.prep_results_2026 TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.prep_results_2026_id_seq TO service_role;

CREATE UNIQUE INDEX prep_results_2026_seat_idx ON public.prep_results_2026(seat_number);
CREATE INDEX prep_results_2026_name_trgm_idx ON public.prep_results_2026 USING gin (student_name gin_trgm_ops);

ALTER TABLE public.prep_results_2026 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Results publicly readable"
  ON public.prep_results_2026 FOR SELECT
  USING (true);
