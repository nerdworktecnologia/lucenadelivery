-- Fix SECURITY DEFINER functions access
-- has_role: Should be callable by authenticated users
-- Correct arguments are (_user_id uuid, _role app_role)
DO $$
BEGIN
  IF to_regprocedure('public.has_role(uuid,public.app_role)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated';
  END IF;

  IF to_regprocedure('public.restore_demo_data()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.restore_demo_data() FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.restore_demo_data() TO authenticated';
  END IF;

  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC';
  END IF;
END $$;

-- Fix Permissive RLS policies for tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for tenants" ON public.tenants;
CREATE POLICY "Public read for tenants" ON public.tenants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage their own tenant" ON public.tenants;
CREATE POLICY "Admins can manage their own tenant" ON public.tenants 
FOR ALL 
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Ensure user_roles is protected and avoid infinite recursion
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
-- We use a non-recursive check for super_admin status or allow select with specific conditions
-- Here we allow super_admins to see everything by checking their own entry without calling the policy recursively
CREATE POLICY "Super admins can view all roles" ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'
);
