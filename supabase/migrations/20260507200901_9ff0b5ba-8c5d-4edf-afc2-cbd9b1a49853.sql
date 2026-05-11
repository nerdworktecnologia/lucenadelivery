DO $$
DECLARE
    admin_id UUID := 'd0000000-0000-0000-0000-000000000001';
    lojista_id UUID := 'd0000000-0000-0000-0000-000000000002';
    cliente_id UUID := 'd0000000-0000-0000-0000-000000000003';
    password_hash TEXT := crypt('Lucena@2026', gen_salt('bf'));
BEGIN
    -- Limpeza de roles e identidades que não causam problemas de FK
    DELETE FROM public.user_roles WHERE user_id IN (admin_id, lojista_id, cliente_id);
    DELETE FROM auth.identities WHERE user_id IN (admin_id, lojista_id, cliente_id);
    
    -- Deletar usuários para recriá-los com a senha correta
    DELETE FROM auth.users WHERE email IN ('admin@lucena.app', 'lojista@lucena.app', 'cliente@lucena.app');
    DELETE FROM auth.users WHERE id IN (admin_id, lojista_id, cliente_id);

    -- Criar Usuários
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@lucena.app', password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Lucena"}', now(), now(), 'authenticated', 'authenticated');

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES (lojista_id, '00000000-0000-0000-0000-000000000000', 'lojista@lucena.app', password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lojista Demo"}', now(), now(), 'authenticated', 'authenticated');

    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES (cliente_id, '00000000-0000-0000-0000-000000000000', 'cliente@lucena.app', password_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Cliente Demo"}', now(), now(), 'authenticated', 'authenticated');

    -- Criar Identidades
    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
    SELECT gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now(), id::text
    FROM auth.users WHERE id IN (admin_id, lojista_id, cliente_id);

    -- Sincronizar Perfis (UPDATE no que sobrou, ou INSERT se faltar)
    UPDATE public.profiles SET user_id = admin_id, full_name = 'Admin Lucena' WHERE full_name LIKE '%Admin%';
    UPDATE public.profiles SET user_id = lojista_id, full_name = 'Lojista Demo' WHERE full_name LIKE '%Lojista%';
    UPDATE public.profiles SET user_id = cliente_id, full_name = 'Cliente Demo' WHERE full_name LIKE '%Cliente%';

    -- Se algum não foi atualizado por falta de registro, tenta inserir
    INSERT INTO public.profiles (user_id, full_name) VALUES (admin_id, 'Admin Lucena') ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.profiles (user_id, full_name) VALUES (lojista_id, 'Lojista Demo') ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.profiles (user_id, full_name) VALUES (cliente_id, 'Cliente Demo') ON CONFLICT (user_id) DO NOTHING;

    -- Configurar Roles
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'super_admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (lojista_id, 'admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (cliente_id, 'user');
END $$;
