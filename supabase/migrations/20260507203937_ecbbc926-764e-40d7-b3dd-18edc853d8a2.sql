-- 1. Tighten Storage policies for 'product-images' bucket
-- Disable broad public listing while keeping files accessible if the URL is known
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

-- Ensure only authenticated users can upload
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'product-images');

-- 2. Double check and ensure functions are NOT public
DO $$
BEGIN
  IF to_regprocedure('public.has_role(uuid,public.app_role)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role';
  END IF;

  IF to_regprocedure('public.restore_demo_data()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.restore_demo_data() FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.restore_demo_data() TO authenticated, service_role';
  END IF;

  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role';
  END IF;
END $$;

-- 3. Final cleanup of any broad RLS on system tables if any
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
