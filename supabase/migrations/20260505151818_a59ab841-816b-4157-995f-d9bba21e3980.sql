
-- payment_provider on donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'pesaflux';

-- kopokopo_transactions
CREATE TABLE IF NOT EXISTS public.kopokopo_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid,
  k2_payment_id text UNIQUE,
  reference text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  msisdn text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  gateway_event_id text UNIQUE,
  raw_callback jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kopokopo_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert kopokopo_transactions"
  ON public.kopokopo_transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage kopokopo_transactions"
  ON public.kopokopo_transactions FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- webhook_logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_type text,
  donation_id uuid,
  payload jsonb,
  signature_valid boolean,
  processed boolean DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhook_logs"
  ON public.webhook_logs FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kopokopo_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_logs;
ALTER TABLE public.kopokopo_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.webhook_logs REPLICA IDENTITY FULL;
