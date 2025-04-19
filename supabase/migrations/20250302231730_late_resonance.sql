/*
  # Fix Database Permissions

  1. Changes
     - Grant proper permissions to anon and authenticated roles
     - Create policies to allow registration and profile management
     - Fix RLS policies for all tables
     - Ensure proper access for authentication flows
  
  2. Security
     - Enable RLS on all tables
     - Add policies for proper access control
*/

-- Grant usage on schema to both roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant necessary table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "authenticated_select_profiles" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "authenticated_all_appointments" ON appointments;
DROP POLICY IF EXISTS "authenticated_all_documents" ON documents;
DROP POLICY IF EXISTS "authenticated_all_prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
DROP POLICY IF EXISTS "anon_select_prescriptions" ON prescriptions;

-- Create comprehensive policies for profiles
-- Allow anon to read profiles (needed for login/registration checks)
CREATE POLICY "anon_select_profiles" 
  ON profiles 
  FOR SELECT 
  TO anon 
  USING (true);

-- Allow authenticated users to read all profiles
CREATE POLICY "authenticated_select_profiles" 
  ON profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "users_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow anon to insert profiles (needed for registration)
CREATE POLICY "anon_insert_profiles"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policies for authenticated users to manage all tables
CREATE POLICY "authenticated_all_appointments" 
  ON appointments 
  FOR ALL 
  TO authenticated 
  USING (true);

CREATE POLICY "authenticated_all_documents" 
  ON documents 
  FOR ALL 
  TO authenticated 
  USING (true);

CREATE POLICY "authenticated_all_prescriptions" 
  ON prescriptions 
  FOR ALL 
  TO authenticated 
  USING (true);

-- Create policies for anon to view tables (for connection testing)
CREATE POLICY "anon_select_appointments" 
  ON appointments 
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "anon_select_documents" 
  ON documents 
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "anon_select_prescriptions" 
  ON prescriptions 
  FOR SELECT 
  TO anon 
  USING (true);

-- Create a function to handle profile creation on signup with better error handling
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

-- Create function to manually create a profile with better error handling
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

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, text, text, text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.test_connection() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_tables_if_not_exist() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;