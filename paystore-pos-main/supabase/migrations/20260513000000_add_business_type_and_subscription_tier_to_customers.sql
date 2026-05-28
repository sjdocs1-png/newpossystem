-- Add business_type and subscription_tier columns to customers table
-- These columns were referenced in the create-owner Edge Function but were missing from the schema

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'restaurant'::text,
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'basic'::text;

-- Add comment to document the columns
COMMENT ON COLUMN public.customers.business_type IS 'Type of business: restaurant, retail, etc.';
COMMENT ON COLUMN public.customers.subscription_tier IS 'Subscription tier: basic, gold, platinum, etc.';
