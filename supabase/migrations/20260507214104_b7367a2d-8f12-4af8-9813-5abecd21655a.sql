ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS print_width TEXT DEFAULT '58mm',
ADD COLUMN IF NOT EXISTS auto_print_on_selection BOOLEAN DEFAULT false;
