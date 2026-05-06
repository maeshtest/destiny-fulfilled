-- Create volunteers table
CREATE TABLE public.volunteers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  county TEXT,
  constituency TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on volunteers (public insert, admin read)
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit volunteer form
CREATE POLICY "Anyone can submit volunteer form"
ON public.volunteers
FOR INSERT
WITH CHECK (true);

-- Create donations table  
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_method TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'one-time',
  message TEXT,
  show_info BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a donation
CREATE POLICY "Anyone can create donation"
ON public.donations
FOR INSERT
WITH CHECK (true);