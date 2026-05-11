
-- Allow anon to read categories (for public menu)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO anon USING (true);
