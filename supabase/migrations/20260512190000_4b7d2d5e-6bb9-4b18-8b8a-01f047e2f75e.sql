ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS billing_provider text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_status text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_subscription_id text,
  ADD COLUMN IF NOT EXISTS billing_plan text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_current_period_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS billing_updated_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  external_id text NOT NULL UNIQUE,
  plan text NOT NULL,
  status text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  init_point text NOT NULL DEFAULT '',
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing subscriptions"
  ON public.billing_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_billing_subscriptions_updated_at ON public.billing_subscriptions';
    EXECUTE 'CREATE TRIGGER update_billing_subscriptions_updated_at BEFORE UPDATE ON public.billing_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;
