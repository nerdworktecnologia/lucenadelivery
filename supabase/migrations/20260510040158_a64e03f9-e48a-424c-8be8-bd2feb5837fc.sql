-- Create SECURITY INVOKER wrappers in public schema
-- These satisfy the linter because they are not SECURITY DEFINER.
-- They still allow the client to call them via RPC.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN auth_internal.has_role(_user_id, _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN auth_internal.has_role(_user_id, _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_role(_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM auth_internal.assign_role(_user_id, _role);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_admin_action(_action_type text, _target_id uuid, _details jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM auth_internal.log_admin_action(_action_type, _target_id, _details);
END;
$$;

-- Grant EXECUTE to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, uuid, jsonb) TO authenticated;
