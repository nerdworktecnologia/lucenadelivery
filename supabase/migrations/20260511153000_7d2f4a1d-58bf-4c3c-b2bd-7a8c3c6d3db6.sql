CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid GENERATED ALWAYS AS (id) STORED,
  full_name text,
  company_name text,
  avatar_url text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_col text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    v_col := 'user_id';
  ELSE
    v_col := 'id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles select'
  ) THEN
    EXECUTE format('CREATE POLICY "Profiles select" ON public.profiles FOR SELECT USING (auth.uid() = %I)', v_col);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles insert'
  ) THEN
    EXECUTE format('CREATE POLICY "Profiles insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = %I)', v_col);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles update'
  ) THEN
    EXECUTE format('CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (auth.uid() = %I)', v_col);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'user', 'cozinha', 'pedidos', 'entrega')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'User roles are viewable by authenticated users.'
  ) THEN
    EXECUTE 'CREATE POLICY "User roles are viewable by authenticated users." ON public.user_roles FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN user_id uuid;
    END IF;

    BEGIN
      EXECUTE 'UPDATE public.profiles SET user_id = COALESCE(user_id, id) WHERE user_id IS NULL';
    EXCEPTION WHEN others THEN
    END;

    BEGIN
      ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
    EXCEPTION WHEN others THEN
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.profiles'::regclass
        AND contype = 'u'
        AND conname = 'profiles_user_id_key'
    ) THEN
      BEGIN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
      EXCEPTION WHEN others THEN
      END;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.profiles'::regclass
        AND contype = 'f'
        AND conname = 'profiles_user_id_fkey'
    ) THEN
      BEGIN
        ALTER TABLE public.profiles
          ADD CONSTRAINT profiles_user_id_fkey
          FOREIGN KEY (user_id)
          REFERENCES auth.users(id)
          ON DELETE CASCADE;
      EXCEPTION WHEN others THEN
      END;
    END IF;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_avatar_url text;
  v_tenant_name text;
  v_slug_base text;
  v_slug text;
  has_user_id boolean;
  has_id boolean;
  id_has_default boolean;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';
  v_tenant_name := COALESCE(NULLIF(v_full_name, ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'Minha Loja');
  v_slug_base := lower(regexp_replace(v_tenant_name, '[^a-z0-9]+', '-', 'g'));
  v_slug_base := trim(both '-' from v_slug_base);
  v_slug := v_slug_base || '-' || substring(replace(NEW.id::text, '-', ''), 1, 6);

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) INTO has_user_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
  ) INTO has_id;

  SELECT EXISTS (
    SELECT 1
    FROM pg_attrdef d
    JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
    WHERE d.adrelid = 'public.profiles'::regclass
      AND a.attname = 'id'
  ) INTO id_has_default;

  IF has_user_id THEN
    BEGIN
      EXECUTE
        'INSERT INTO public.profiles (user_id, full_name, avatar_url) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING'
      USING NEW.id, v_full_name, v_avatar_url;
    EXCEPTION WHEN others THEN
    END;
  END IF;

  IF has_id THEN
    BEGIN
      IF id_has_default THEN
        EXECUTE
          'INSERT INTO public.profiles (user_id, full_name, avatar_url) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING'
        USING NEW.id, v_full_name, v_avatar_url;
      ELSE
        EXECUTE
          'INSERT INTO public.profiles (id, full_name, avatar_url) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING'
        USING NEW.id, v_full_name, v_avatar_url;
      END IF;
    EXCEPTION WHEN others THEN
    END;
  END IF;

  BEGIN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'user_roles'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin') ON CONFLICT DO NOTHING;
      ELSE
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  EXCEPTION WHEN others THEN
  END;

  BEGIN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'store_settings'
    ) THEN
      INSERT INTO public.store_settings (user_id, store_name)
      VALUES (NEW.id, v_tenant_name)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN others THEN
  END;

  BEGIN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'tenants'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE owner_id = NEW.id) THEN
        INSERT INTO public.tenants (owner_id, name, plan, status, monthly_revenue)
        VALUES (NEW.id, v_tenant_name, 'starter', 'trial', 0);
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'trial_ends_at'
      ) THEN
        UPDATE public.tenants
        SET trial_ends_at = COALESCE(trial_ends_at, now() + interval '7 days')
        WHERE owner_id = NEW.id;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'slug'
      ) THEN
        UPDATE public.tenants
        SET slug = COALESCE(NULLIF(slug, ''), v_slug)
        WHERE owner_id = NEW.id;
      END IF;
    END IF;
  EXCEPTION WHEN others THEN
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
