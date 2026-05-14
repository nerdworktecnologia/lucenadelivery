-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
DECLARE
  has_user_id boolean;
  has_id boolean;
  col_name text;
BEGIN
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

  col_name := CASE WHEN has_user_id THEN 'user_id' WHEN has_id THEN 'id' ELSE 'user_id' END;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = %I)',
      col_name
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = %I)',
      col_name
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = %I)',
      col_name
    );
  END IF;
END $$;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_avatar_url text;
  has_user_id boolean;
  has_id boolean;
  id_has_default boolean;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

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

  BEGIN
    IF has_id AND has_user_id AND NOT id_has_default THEN
      EXECUTE
        'INSERT INTO public.profiles (id, user_id, full_name, avatar_url) VALUES ($1, $1, $2, $3) ON CONFLICT DO NOTHING'
      USING NEW.id, v_full_name, v_avatar_url;
    ELSIF has_user_id THEN
      EXECUTE
        'INSERT INTO public.profiles (user_id, full_name, avatar_url) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING'
      USING NEW.id, v_full_name, v_avatar_url;
    ELSIF has_id THEN
      EXECUTE
        'INSERT INTO public.profiles (id, full_name, avatar_url) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING'
      USING NEW.id, v_full_name, v_avatar_url;
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
