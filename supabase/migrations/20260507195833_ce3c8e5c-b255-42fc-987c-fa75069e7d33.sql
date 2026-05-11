-- 1. Admin (Super Admin do Sistema)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  'd0000000-0000-0000-0000-000000000001', 
  'admin@lucena.app', 
  crypt('Lucena@2026', gen_salt('bf')), 
  now(), 
  '{"provider":"email","providers":["email"]}', 
  '{"full_name":"Admin Lucena"}', 
  now(), now(), 'authenticated', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Lojista (Dono de Restaurante - Admin do PDV)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  'd0000000-0000-0000-0000-000000000002', 
  'lojista@lucena.app', 
  crypt('Lucena@2026', gen_salt('bf')), 
  now(), 
  '{"provider":"email","providers":["email"]}', 
  '{"full_name":"Lojista Demo"}', 
  now(), now(), 'authenticated', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- 3. Cliente Final (Usuário do Cardápio)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  'd0000000-0000-0000-0000-000000000003', 
  'cliente@lucena.app', 
  crypt('Lucena@2026', gen_salt('bf')), 
  now(), 
  '{"provider":"email","providers":["email"]}', 
  '{"full_name":"Cliente Demo"}', 
  now(), now(), 'authenticated', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Vincular roles e criar perfis
DO $$ 
BEGIN
  -- Roles
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES 
      ('d0000000-0000-0000-0000-000000000001', 'super_admin'),
      ('d0000000-0000-0000-0000-000000000002', 'admin'),
      ('d0000000-0000-0000-0000-000000000003', 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Perfis (Usando UPSERT para evitar violação de UNIQUE no user_id)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    INSERT INTO public.profiles (id, user_id, full_name) 
    VALUES 
      ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Admin Lucena'),
      ('d0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Lojista Demo'),
      ('d0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Cliente Demo')
    ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;
  END IF;
END $$;
