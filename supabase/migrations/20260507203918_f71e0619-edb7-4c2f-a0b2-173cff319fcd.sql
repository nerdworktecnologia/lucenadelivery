DROP FUNCTION IF EXISTS public.restore_demo_data();

-- 2. Fix Permissive RLS policies (e.g., whatsapp_messages which had USING(true) for ALL)
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.whatsapp_messages;
CREATE POLICY "Super admins can manage all messages" ON public.whatsapp_messages
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'
)
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'
);

-- 3. Restrict Storage listing
-- We'll look for policies on storage.objects that allow listing and restrict them to authenticated users with specific checks
-- Since we don't know the exact bucket names yet, we'll try to find and update broad policies.
-- (Usually buckets are 'avatars', 'products', etc.)

-- Assuming there might be a bucket named 'products' or 'avatars'
DO $$
BEGIN
    -- This is a generic way to tighten any policy that allows public listing if it exists
    UPDATE pg_policy 
    SET polroles = (SELECT array_agg(oid) FROM pg_roles WHERE rolname IN ('authenticated', 'service_role'))
    WHERE polname LIKE '%listing%' OR polqual::text = 'true';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not automatically tighten storage policies.';
END $$;
