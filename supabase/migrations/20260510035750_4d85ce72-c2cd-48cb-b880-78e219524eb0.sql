-- Drop existing policies for system_audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.system_audit_logs;
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.system_audit_logs;

-- Create clean policies using has_role function
CREATE POLICY "Admins and super admins can view audit logs"
ON public.system_audit_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
