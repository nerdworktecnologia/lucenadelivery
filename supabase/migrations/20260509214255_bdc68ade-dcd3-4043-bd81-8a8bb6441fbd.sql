-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    target_id UUID REFERENCES auth.users(id),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.system_audit_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Admins can view audit logs"
ON public.system_audit_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Function to log administrative actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    _action_type TEXT,
    _target_id UUID,
    _details JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.system_audit_logs (action_type, actor_id, target_id, details)
    VALUES (_action_type, auth.uid(), _target_id, _details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
