-- Update demo users to ensure they are fully valid for Supabase Auth
UPDATE auth.users 
SET 
  aud = 'authenticated',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}',
  raw_user_meta_data = CASE 
    WHEN email = 'admin@lucena.app' THEN '{"full_name":"Admin Lucena"}'
    WHEN email = 'lojista@lucena.app' THEN '{"full_name":"Lojista Demo"}'
    WHEN email = 'cliente@lucena.app' THEN '{"full_name":"Cliente Demo"}'
    ELSE raw_user_meta_data
  END
WHERE email IN ('admin@lucena.app', 'lojista@lucena.app', 'cliente@lucena.app');
