-- 1. Create the new schema
CREATE SCHEMA IF NOT EXISTS auth_internal;

-- 2. Define functions in the new schema
CREATE OR REPLACE FUNCTION auth_internal.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION auth_internal.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role::public.app_role
  );
END;
$$;

CREATE OR REPLACE FUNCTION auth_internal.assign_role(_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION auth_internal.log_admin_action(_action_type text, _target_id uuid, _details jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  INSERT INTO public.system_audit_logs (actor_id, action_type, target_id, details)
  VALUES (auth.uid(), _action_type, _target_id, _details);
END;
$$;

-- 3. Update all dependent policies BEFORE dropping old functions
-- public.tenants
DROP POLICY IF EXISTS "Super admins can manage tenants" ON public.tenants;
CREATE POLICY "Super admins can manage tenants" 
ON public.tenants FOR ALL TO authenticated 
USING (auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role));

-- public.customers
DROP POLICY IF EXISTS "Super admins can view all customers" ON public.customers;
CREATE POLICY "Super admins can view all customers" 
ON public.customers FOR SELECT TO authenticated 
USING (auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role));

-- public.orders
DROP POLICY IF EXISTS "Super admins can view all orders" ON public.orders;
CREATE POLICY "Super admins can view all orders" 
ON public.orders FOR SELECT TO authenticated 
USING (auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role));

-- public.order_items
DROP POLICY IF EXISTS "Super admins can view all order items" ON public.order_items;
CREATE POLICY "Super admins can view all order items" 
ON public.order_items FOR SELECT TO authenticated 
USING (auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role));

-- public.user_roles
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
CREATE POLICY "Super admins can view all roles" 
ON public.user_roles FOR SELECT TO authenticated 
USING (auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
CREATE POLICY "Super admins can manage all roles" 
ON public.user_roles FOR ALL TO authenticated 
USING (auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role));

-- public.system_audit_logs
DROP POLICY IF EXISTS "Admins and super admins can view audit logs" ON public.system_audit_logs;
CREATE POLICY "Admins and super admins can view audit logs" 
ON public.system_audit_logs FOR SELECT TO authenticated 
USING (auth_internal.has_role(auth.uid(), 'admin'::public.app_role) OR auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role));

-- storage.objects
DROP POLICY IF EXISTS "Admins can list all product images" ON storage.objects;
CREATE POLICY "Admins can list all product images" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'product-images' AND (auth_internal.has_role(auth.uid(), 'admin'::public.app_role) OR auth_internal.has_role(auth.uid(), 'super_admin'::public.app_role)));

-- 4. Drop the old functions from public
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.assign_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action(text, uuid, jsonb) CASCADE;

-- 5. Final grants
GRANT USAGE ON SCHEMA auth_internal TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth_internal TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth_internal TO anon; -- Needed if called via RPC as anon (though we check auth.uid inside)

-- 6. Add auth_internal to search_path so we don't have to prefix in RPC calls?
-- This might not work if PostgREST doesn't support it, but it's worth a try.
-- Actually, the best way to handle RPC is to prefix them in the client code.
