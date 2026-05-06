-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'editor');

-- User roles table (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Site settings table for dynamic configuration (API keys, site content)
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  is_secret BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Donation goals table for campaign targets
CREATE TABLE public.donation_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_goals ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is any admin type
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'moderator', 'editor')
  )
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Site settings policies
CREATE POLICY "Anyone can read non-secret settings"
  ON public.site_settings FOR SELECT
  USING (is_secret = false);

CREATE POLICY "Admins can read all settings"
  ON public.site_settings FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage settings"
  ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Donation goals policies
CREATE POLICY "Anyone can view active goals"
  ON public.donation_goals FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage goals"
  ON public.donation_goals FOR ALL
  USING (public.is_admin(auth.uid()));

-- Donations policy updates - allow admins to view all
CREATE POLICY "Admins can view all donations"
  ON public.donations FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update donations"
  ON public.donations FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Enable realtime for donations to show live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;

-- Insert default settings
INSERT INTO public.site_settings (key, value, is_secret) VALUES
  ('site_name', 'Maraga ''27', false),
  ('hero_title', 'Building Kenya''s Future Together', false),
  ('hero_subtitle', 'Join the movement for change', false),
  ('donation_cta', 'Support the Campaign', false),
  ('mpesa_paybill', '', true),
  ('mpesa_account', '', true),
  ('stripe_publishable_key', '', true),
  ('stripe_secret_key', '', true),
  ('paypal_client_id', '', true),
  ('paypal_secret', '', true);

-- Insert default donation goal
INSERT INTO public.donation_goals (title, target_amount, currency) VALUES
  ('Campaign Fund 2027', 10000000, 'KES');