-- Grant usage on schema to both roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant necessary table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create a test_connection function that can be called without authentication
CREATE OR REPLACE FUNCTION public.test_connection()
RETURNS boolean AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to anon role
GRANT EXECUTE ON FUNCTION public.test_connection() TO anon, authenticated;

-- Create a function to create tables if they don't exist
CREATE OR REPLACE FUNCTION public.create_tables_if_not_exist()
RETURNS void AS $$
BEGIN
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

  -- Create appointments table if it doesn't exist
  CREATE TABLE IF NOT EXISTS appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid,
    doctor_id uuid,
    date timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed'))
  );

  -- Create documents table if it doesn't exist
  CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    name text NOT NULL,
    type text NOT NULL,
    ipfs_hash text NOT NULL,
    test_date timestamptz,
    created_at timestamptz DEFAULT now()
  );

  -- Create prescriptions table if it doesn't exist
  CREATE TABLE IF NOT EXISTS prescriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid,
    doctor_id uuid,
    medications jsonb NOT NULL,
    photo_hash text,
    status text NOT NULL DEFAULT 'pending',
    prescription_date timestamptz,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'dispensed'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated role
GRANT EXECUTE ON FUNCTION public.create_tables_if_not_exist() TO authenticated, anon;

-- Run the function to create tables
SELECT create_tables_if_not_exist();

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" 
  ON profiles 
  FOR SELECT 
  TO anon 
  USING (true);

DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
CREATE POLICY "anon_select_appointments" 
  ON appointments 
  FOR SELECT 
  TO anon 
  USING (true);

DROP POLICY IF EXISTS "anon_select_documents" ON documents;
CREATE POLICY "anon_select_documents" 
  ON documents 
  FOR SELECT 
  TO anon 
  USING (true);

DROP POLICY IF EXISTS "anon_select_prescriptions" ON prescriptions;
CREATE POLICY "anon_select_prescriptions" 
  ON prescriptions 
  FOR SELECT 
  TO anon 
  USING (true);

-- Create policies for authenticated users
DROP POLICY IF EXISTS "authenticated_select_profiles" ON profiles;
CREATE POLICY "authenticated_select_profiles" 
  ON profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_type_value text := 'patient';
  user_password text := null;
  user_mobile text := null;
BEGIN
  -- Try to extract user_type from metadata
  BEGIN
    IF new.raw_user_meta_data->>'user_type' IS NOT NULL THEN
      user_type_value := new.raw_user_meta_data->>'user_type';
    ELSIF new.raw_user_meta_data->>'userType' IS NOT NULL THEN
      user_type_value := new.raw_user_meta_data->>'userType';
    END IF;

    -- Extract password if available (for reference only, not the actual hashed password)
    IF new.raw_user_meta_data->>'password' IS NOT NULL THEN
      user_password := new.raw_user_meta_data->>'password';
    END IF;

    -- Extract mobile if available
    IF new.raw_user_meta_data->>'mobile' IS NOT NULL THEN
      user_mobile := new.raw_user_meta_data->>'mobile';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    user_type_value := 'patient';
  END;

  -- Insert the profile only if it doesn't already exist
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
      INSERT INTO public.profiles (
        id, 
        email, 
        name, 
        mobile,
        password,
        user_type
      )
      VALUES (
        new.id, 
        new.email, 
        COALESCE(new.raw_user_meta_data->>'name', ''),
        user_mobile,
        user_password,
        user_type_value
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error creating profile for user %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to manually create a profile
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL,
  user_mobile text DEFAULT NULL,
  user_type text DEFAULT 'patient',
  user_password text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Insert new profile with password
    INSERT INTO public.profiles (id, email, name, mobile, user_type, password)
    VALUES (user_id, user_email, user_name, user_mobile, user_type, user_password);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in create_profile_for_user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, text, text, text, text) TO authenticated;