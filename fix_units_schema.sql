-- Add description column to units table if it doesn't exist
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add is_published column to units table if it doesn't exist
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Add order_index column to units table if it doesn't exist (likely needed too)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'units';
