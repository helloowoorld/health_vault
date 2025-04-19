/*
  # Fix profiles table and triggers

  This migration ensures the profiles table exists and fixes the trigger mechanism.
*/

-- Check if user_type enum exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE user_type AS ENUM ('patient', 'doctor', 'pharma');
  END IF;
END
$$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  mobile text,
  public_key text,
  user_type user_type NOT NULL DEFAULT 'patient',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace the function to handle new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(
      (new.raw_user_meta_data->>'user_type')::user_type, 
      'patient'::user_type
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists and create if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END
$$;

-- Create or replace the function to manually create a profile
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL,
  user_mobile text DEFAULT NULL,
  user_type text DEFAULT 'patient'
)
RETURNS void AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Insert new profile
    INSERT INTO public.profiles (id, email, name, mobile, user_type)
    VALUES (user_id, user_email, user_name, user_mobile, user_type::user_type);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END
$$;