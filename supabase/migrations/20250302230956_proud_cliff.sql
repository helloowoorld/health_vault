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
DROP POLICY IF EXISTS "authenticated_all_appointments" ON appointments;
CREATE POLICY "authenticated_all_appointments" 
  ON appointments 
  FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "authenticated_all_documents" ON documents;
CREATE POLICY "authenticated_all_documents" 
  ON documents 
  FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "authenticated_all_prescriptions" ON prescriptions;
CREATE POLICY "authenticated_all_prescriptions" 
  ON prescriptions 
  FOR ALL 
  TO authenticated 
  USING (true);

-- Remove foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END
$$;

-- Seed dummy data if tables are empty
DO $$
DECLARE
  profile_count integer;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  -- Only seed data if the profiles table is empty
  IF profile_count = 0 THEN
    -- Insert dummy users/profiles with generated UUIDs
    INSERT INTO profiles (id, name, email, mobile, user_type, password, public_key, created_at)
    VALUES 
      (gen_random_uuid(), 'John Patient', 'patient@example.com', '555-123-4567', 'patient', 'patient123', 'patient_public_key_123', now()),
      (gen_random_uuid(), 'Dr. Jane Smith', 'doctor@example.com', '555-987-6543', 'doctor', 'doctor123', 'doctor_public_key_456', now()),
      (gen_random_uuid(), 'MedPlus Pharmacy', 'pharma@example.com', '555-789-0123', 'pharma', 'pharma123', 'pharma_public_key_789', now()),
      (gen_random_uuid(), 'Sarah Johnson', 'sarah@example.com', '555-222-3333', 'patient', 'sarah123', 'patient_public_key_456', now()),
      (gen_random_uuid(), 'Michael Brown', 'michael@example.com', '555-444-5555', 'patient', 'michael123', 'patient_public_key_789', now());

    -- Get the IDs of the inserted profiles
    DECLARE
      patient_id uuid;
      doctor_id uuid;
      patient2_id uuid;
      patient3_id uuid;
    BEGIN
      SELECT id INTO patient_id FROM profiles WHERE email = 'patient@example.com' LIMIT 1;
      SELECT id INTO doctor_id FROM profiles WHERE email = 'doctor@example.com' LIMIT 1;
      SELECT id INTO patient2_id FROM profiles WHERE email = 'sarah@example.com' LIMIT 1;
      SELECT id INTO patient3_id FROM profiles WHERE email = 'michael@example.com' LIMIT 1;

      -- Insert dummy appointments using the actual profile IDs
      IF patient_id IS NOT NULL AND doctor_id IS NOT NULL THEN
        INSERT INTO appointments (patient_id, doctor_id, date, status, created_at)
        VALUES
          (patient_id, doctor_id, now() + interval '2 days', 'pending', now()),
          (patient_id, doctor_id, now() + interval '5 days', 'confirmed', now()),
          (patient_id, doctor_id, now() - interval '3 days', 'completed', now());
      END IF;

      -- Insert dummy documents
      IF patient_id IS NOT NULL THEN
        INSERT INTO documents (user_id, name, type, ipfs_hash, created_at)
        VALUES
          (patient_id, 'Blood Test Results', 'medical_report', 'ipfs_hash_123', now() - interval '10 days'),
          (patient_id, 'X-Ray Report', 'medical_report', 'ipfs_hash_456', now() - interval '20 days'),
          (patient_id, 'Vaccination Record', 'medical_report', 'ipfs_hash_789', now() - interval '30 days');
      END IF;

      -- Insert dummy prescriptions (without prescription_date since it doesn't exist)
      IF patient_id IS NOT NULL AND doctor_id IS NOT NULL THEN
        INSERT INTO prescriptions (patient_id, doctor_id, medications, status, created_at)
        VALUES
          (patient_id, doctor_id, 
           '[{"name": "Amoxicillin", "dosage": "500mg", "frequency": "3 times daily", "duration": "7 days"}]', 
           'pending', now() - interval '5 days'),
          
          (patient_id, doctor_id, 
           '[{"name": "Ibuprofen", "dosage": "400mg", "frequency": "as needed", "duration": "for pain"}]', 
           'dispensed', now() - interval '15 days'),
          
          (patient_id, doctor_id, 
           '[{"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "duration": "30 days"}]', 
           'pending', now() - interval '2 days');
      END IF;
    END;

    RAISE NOTICE 'Dummy data seeded successfully';
  ELSE
    RAISE NOTICE 'Database already contains data, skipping seed';
  END IF;
END
$$;