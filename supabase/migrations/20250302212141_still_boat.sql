-- Create a test_connection function that can be called without authentication
CREATE OR REPLACE FUNCTION public.test_connection()
RETURNS boolean AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to anon role
GRANT EXECUTE ON FUNCTION public.test_connection() TO anon;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  name text,
  email text,
  mobile text,
  public_key text,
  user_type text NOT NULL DEFAULT 'patient',
  password text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key if it doesn't exist - fixed syntax
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE profiles 
      ADD CONSTRAINT profiles_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      -- If there's an error, we'll just continue
      NULL;
    END;
  END IF;
END
$$;

-- Create other tables if they don't exist
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid,
  doctor_id uuid,
  date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed'))
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  ipfs_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid,
  doctor_id uuid,
  medications jsonb NOT NULL,
  photo_hash text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'dispensed'))
);

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Grant usage on schema to anon role
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select permissions on all tables to anon role for connection testing
GRANT SELECT ON TABLE profiles TO anon;
GRANT SELECT ON TABLE appointments TO anon;
GRANT SELECT ON TABLE documents TO anon;
GRANT SELECT ON TABLE prescriptions TO anon;

-- Create policies for anon access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'anon_select_profiles'
  ) THEN
    CREATE POLICY "anon_select_profiles" 
      ON profiles 
      FOR SELECT 
      TO anon 
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' AND policyname = 'anon_select_appointments'
  ) THEN
    CREATE POLICY "anon_select_appointments" 
      ON appointments 
      FOR SELECT 
      TO anon 
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' AND policyname = 'anon_select_documents'
  ) THEN
    CREATE POLICY "anon_select_documents" 
      ON documents 
      FOR SELECT 
      TO anon 
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prescriptions' AND policyname = 'anon_select_prescriptions'
  ) THEN
    CREATE POLICY "anon_select_prescriptions" 
      ON prescriptions 
      FOR SELECT 
      TO anon 
      USING (true);
  END IF;
END
$$;

-- Ensure the create_profile_for_user function exists and is accessible
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
    VALUES (user_id, user_email, user_name, user_mobile, user_type);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated role
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, text, text, text) TO authenticated;