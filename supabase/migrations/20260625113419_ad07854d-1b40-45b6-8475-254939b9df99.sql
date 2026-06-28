
CREATE POLICY "Block direct client access"
  ON public.prep_results_2026
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
