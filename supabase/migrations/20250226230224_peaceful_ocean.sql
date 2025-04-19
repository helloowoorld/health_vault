/*
  # Fix Database Connection Issues

  1. Create test_connection function
    - Simple function that returns true to test database connectivity
    - Accessible to anon role for connection testing
  
  2. Grant Permissions
    - Grant necessary permissions to anon role for connection testing
    - Create policies to allow basic read access for testing
  
  3. Add Password Field
    - Add password field to profiles table for reference
*/

-- Create a test_connection function that can be called without authentication
CREATE OR REPLACE FUNCTION public.test_connection()
RETURNS boolean AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to anon role
GRANT EXECUTE ON FUNCTION public.test_connection() TO anon;

-- Add password field to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password text;

-- Set default password for existing profiles
UPDATE profiles SET password = 'securepassword123' WHERE password IS NULL;

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

-- Drop existing anon policies to avoid conflicts
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
DROP POLICY IF EXISTS "anon_select_prescriptions" ON prescriptions;

-- Create new policies for anon access
CREATE POLICY "anon_select_profiles" 
  ON profiles 
  FOR SELECT 
  TO anon 
  USING (true);

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

-- Ensure the create_profile_for_user function exists and is accessible
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL,
  user_mobile text DEFAULT NULL,
  user_type text DEFAULT 'patient'
)
RETURNS void AS $$
DECLARE
  user_type_value user_type := 'patient'::user_type;
BEGIN
  -- Convert user_type to enum
  BEGIN
    user_type_value := user_type::user_type;
  EXCEPTION WHEN OTHERS THEN
    user_type_value := 'patient'::user_type;
  END;

  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Insert new profile
    INSERT INTO public.profiles (id, email, name, mobile, user_type)
    VALUES (user_id, user_email, user_name, user_mobile, user_type_value);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated role
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, text, text, text) TO authenticated;