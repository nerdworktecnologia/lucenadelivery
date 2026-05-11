-- 1. Fix Function Search Paths and Security in public schema
-- Assign Role
ALTER FUNCTION public.assign_role(uuid, text) SET search_path = public;
-- Has Role overloads
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
-- Handle New User
ALTER FUNCTION public.handle_new_user() SET search_path = public;
-- Log Admin Action
ALTER FUNCTION public.log_admin_action(text, uuid, jsonb) SET search_path = public;
-- Update Updated At
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
-- Setup Demo Data
ALTER FUNCTION public.setup_new_user_demo_data() SET search_path = public;

-- 2. Revoke and Grant EXECUTE permissions
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant back only what is necessary
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, uuid, jsonb) TO authenticated;

-- Update assign_role to check for super_admin role inside
CREATE OR REPLACE FUNCTION public.assign_role(_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user (the one calling the function) is a super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Apenas Super Admins podem atribuir cargos.';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role::public.app_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_role(uuid, text) TO authenticated;

-- 3. Fix Storage Listing Policies
-- Remove the policies that allow public SELECT (listing) on product-images
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create a more restrictive SELECT policy that allows authenticated users to see files.
-- Public access for downloading via direct URL is still allowed because the bucket is public.
CREATE POLICY "Authenticated users can see all product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images');

-- 4. Fix whatsapp_messages policy to be more explicit
DROP POLICY IF EXISTS "Anon can insert inbound messages" ON public.whatsapp_messages;
CREATE POLICY "Anon can insert inbound messages"
ON public.whatsapp_messages
FOR INSERT
TO anon
WITH CHECK (true);
