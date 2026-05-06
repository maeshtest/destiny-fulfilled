-- Allow admins to view all volunteers
CREATE POLICY "Admins can view all volunteers"
  ON public.volunteers FOR SELECT
  USING (public.is_admin(auth.uid()));