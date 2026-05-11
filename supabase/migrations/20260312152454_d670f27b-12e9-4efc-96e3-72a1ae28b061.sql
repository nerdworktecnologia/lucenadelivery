
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS slug text UNIQUE;

UPDATE public.tenants SET slug = 'tempero-de-maria', owner_id = 'd10a8756-3c8a-41f4-94cf-c9366f9c4db9' WHERE id = '7b738dd8-61ee-4028-8311-07725fb0e6c3';

-- Allow anyone to read tenant by slug (for public menu lookup)
CREATE POLICY "Anyone can view tenants by slug" ON public.tenants FOR SELECT TO anon USING (slug IS NOT NULL);
