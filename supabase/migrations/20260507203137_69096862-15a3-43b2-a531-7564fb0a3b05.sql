-- Create a function to restore demo data
CREATE OR REPLACE FUNCTION public.restore_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Ensure extensions
  -- (Assuming pgcrypto is available for crypt/gen_salt)

  -- 2. Clean up existing demo data based on specific IDs
  DELETE FROM public.user_roles WHERE user_id IN ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');
  DELETE FROM public.profiles WHERE user_id IN ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');
  DELETE FROM auth.users WHERE id IN ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003') OR email IN ('admin@lucena.app', 'lojista@lucena.app', 'cliente@lucena.app');

  -- 3. Re-insert demo users in auth.users (Password: Lucena@2026)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data)
  VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'admin@lucena.app', crypt('Lucena@2026', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Lucena"}'),
  ('d0000000-0000-0000-0000-000000000002', 'lojista@lucena.app', crypt('Lucena@2026', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Lojista Demo"}'),
  ('d0000000-0000-0000-0000-000000000003', 'cliente@lucena.app', crypt('Lucena@2026', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"full_name":"Cliente Demo"}');

  -- 4. Re-insert profiles
  INSERT INTO public.profiles (user_id, full_name)
  VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'Admin Lucena'),
  ('d0000000-0000-0000-0000-000000000002', 'Lojista Demo'),
  ('d0000000-0000-0000-0000-000000000003', 'Cliente Demo');

  -- 5. Re-insert roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES 
  ('d0000000-0000-0000-0000-000000000001', 'super_admin'),
  ('d0000000-0000-0000-0000-000000000002', 'admin'),
  ('d0000000-0000-0000-0000-000000000003', 'user');
END;
$$;
