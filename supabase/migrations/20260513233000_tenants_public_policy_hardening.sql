-- Remove overly-permissive policy and restrict anon column access on tenants

DROP POLICY IF EXISTS "Public read for tenants" ON public.tenants;

REVOKE SELECT ON TABLE public.tenants FROM anon;
GRANT SELECT (id, slug, name, owner_id) ON TABLE public.tenants TO anon;

REVOKE SELECT (email, phone, notes) ON TABLE public.tenants FROM anon;
REVOKE SELECT (billing_provider, billing_status, billing_subscription_id, billing_plan, billing_current_period_end, billing_updated_at) ON TABLE public.tenants FROM anon;
