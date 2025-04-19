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
  USING (true);

DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
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