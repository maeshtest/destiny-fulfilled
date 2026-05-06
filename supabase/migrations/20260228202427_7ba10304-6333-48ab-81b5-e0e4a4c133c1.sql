
-- PesaFlux transactions table
CREATE TABLE public.pesaflux_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid REFERENCES public.donations(id) ON DELETE SET NULL,
  transaction_request_id text,
  merchant_request_id text,
  checkout_request_id text,
  amount numeric NOT NULL,
  msisdn text NOT NULL,
  reference text,
  receipt text,
  status text NOT NULL DEFAULT 'pending',
  response_code text,
  raw_callback jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pesaflux_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pesaflux_transactions"
  ON public.pesaflux_transactions FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert pesaflux_transactions"
  ON public.pesaflux_transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SMS logs table
CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  message text NOT NULL,
  sender_id text DEFAULT 'fluxsms',
  message_id text,
  status text NOT NULL DEFAULT 'pending',
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sms_logs"
  ON public.sms_logs FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service can insert sms_logs"
  ON public.sms_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Insert PesaFlux settings into site_settings
INSERT INTO public.site_settings (key, value, is_secret) VALUES
  ('pesaflux_api_key', '', true),
  ('pesaflux_email', '', false)
ON CONFLICT (key) DO NOTHING;
