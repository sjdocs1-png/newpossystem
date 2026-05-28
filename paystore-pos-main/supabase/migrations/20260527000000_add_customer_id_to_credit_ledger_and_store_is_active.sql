ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.credit_ledger
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.pos_customers(id) ON DELETE SET NULL;
