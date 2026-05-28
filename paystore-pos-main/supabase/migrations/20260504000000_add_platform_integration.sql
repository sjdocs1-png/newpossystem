-- Add Swiggy/Zomato integration fields to qr_orders table
ALTER TABLE public.qr_orders
ADD COLUMN platform_type TEXT CHECK (platform_type IN ('swiggy', 'zomato', 'qr', 'direct')),
ADD COLUMN platform_order_id TEXT,
ADD COLUMN platform_customer_id TEXT,
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_instructions TEXT,
ADD COLUMN estimated_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN platform_commission NUMERIC DEFAULT 0;

-- Add index for platform queries
CREATE INDEX idx_qr_orders_platform_type ON public.qr_orders(platform_type);
CREATE INDEX idx_qr_orders_platform_order_id ON public.qr_orders(platform_order_id);

-- Update existing records to have platform_type = 'qr'
UPDATE public.qr_orders SET platform_type = 'qr' WHERE platform_type IS NULL;