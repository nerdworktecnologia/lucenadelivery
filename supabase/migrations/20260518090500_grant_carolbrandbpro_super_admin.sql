DO $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'super_admin'
  FROM auth.users
  WHERE lower(email) IN ('carolbrandb@gmail.com', 'carolbrandbpro@gmail.com')
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN others THEN
END $$;

CREATE OR REPLACE FUNCTION public.grant_super_admin_for_carolbrand()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) IN ('carolbrandb@gmail.com', 'carolbrandbpro@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_carolbrand_super_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_carolbrand_super_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_super_admin_for_carolbrand();

