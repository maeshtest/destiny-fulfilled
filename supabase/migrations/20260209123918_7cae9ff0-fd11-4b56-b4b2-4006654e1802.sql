
-- Add manual payment verification columns to donations
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS verification_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transaction_code text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS screenshot_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verified_by uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_notes text DEFAULT NULL;

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload screenshots
CREATE POLICY "Anyone can upload payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow public read of screenshots
CREATE POLICY "Payment screenshots are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots');

-- Allow admins to delete screenshots
CREATE POLICY "Admins can delete payment screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-screenshots' AND EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

-- Add NCBA bank-specific settings
INSERT INTO public.site_settings (key, value, is_secret)
VALUES 
  ('ncba_paybill', '', false),
  ('ncba_account_number', '', false),
  ('ncba_bank_name', 'NCBA Bank', false),
  ('payment_instructions', 'Pay via M-Pesa Paybill to NCBA Bank. You can also share a screenshot or transaction code for manual verification.', false)
ON CONFLICT DO NOTHING;
