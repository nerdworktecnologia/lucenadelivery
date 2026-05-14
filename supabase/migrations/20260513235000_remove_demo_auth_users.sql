DO $$
DECLARE
  demo_ids uuid[] := ARRAY[
    'd0000000-0000-0000-0000-000000000001'::uuid,
    'd0000000-0000-0000-0000-000000000002'::uuid,
    'd0000000-0000-0000-0000-000000000003'::uuid
  ];
BEGIN
  DELETE FROM public.user_roles WHERE user_id = ANY(demo_ids);
  DELETE FROM public.store_settings WHERE user_id = ANY(demo_ids);
  DELETE FROM public.profiles WHERE id = ANY(demo_ids) OR user_id = ANY(demo_ids);
  DELETE FROM auth.identities WHERE user_id = ANY(demo_ids);
  DELETE FROM auth.users
    WHERE id = ANY(demo_ids)
       OR email IN ('admin@lucena.app', 'lojista@lucena.app', 'cliente@lucena.app');

  DROP FUNCTION IF EXISTS public.restore_demo_data();
END $$;
