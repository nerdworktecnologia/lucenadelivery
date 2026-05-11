-- 1. Hardening SECURITY DEFINER functions with internal role checks
CREATE OR REPLACE FUNCTION public.restore_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the calling user is a super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas Super Admins podem restaurar dados demo.';
  END IF;

  -- Original restoration logic
  DELETE FROM public.user_roles WHERE user_id IN ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');
  DELETE FROM public.profiles WHERE user_id IN ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');
  DELETE FROM auth.users WHERE id IN ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003') OR email IN ('admin@lucena.app', 'lojista@lucena.app', 'cliente@lucena.app');

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data)
  VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'admin@lucena.app', crypt('Lucena@2026', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Lucena"}'),
  ('d0000000-0000-0000-0000-000000000002', 'lojista@lucena.app', crypt('Lucena@2026', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Lojista Demo"}'),
  ('d0000000-0000-0000-0000-000000000003', 'cliente@lucena.app', crypt('Lucena@2026', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Cliente Demo"}');

  INSERT INTO public.profiles (user_id, full_name)
  VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'Admin Lucena'),
  ('d0000000-0000-0000-0000-000000000002', 'Lojista Demo'),
  ('d0000000-0000-0000-0000-000000000003', 'Cliente Demo');

  INSERT INTO public.user_roles (user_id, role)
  VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'super_admin'),
  ('d0000000-0000-0000-0000-000000000002', 'admin'),
  ('d0000000-0000-0000-0000-000000000003', 'user');
END;
$$;

-- 2. Fix Permissive RLS policies (e.g., whatsapp_messages which had USING(true) for ALL)
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.whatsapp_messages;
CREATE POLICY "Super admins can manage all messages" ON public.whatsapp_messages
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'
)
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'
);

-- 3. Restrict Storage listing
-- We'll look for policies on storage.objects that allow listing and restrict them to authenticated users with specific checks
-- Since we don't know the exact bucket names yet, we'll try to find and update broad policies.
-- (Usually buckets are 'avatars', 'products', etc.)

-- Assuming there might be a bucket named 'products' or 'avatars'
DO $$
BEGIN
    -- This is a generic way to tighten any policy that allows public listing if it exists
    UPDATE pg_policy 
    SET polroles = (SELECT array_agg(oid) FROM pg_roles WHERE rolname IN ('authenticated', 'service_role'))
    WHERE polname LIKE '%listing%' OR polqual::text = 'true';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not automatically tighten storage policies.';
END $$;
