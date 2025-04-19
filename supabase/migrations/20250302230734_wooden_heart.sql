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

-- First, drop the foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If there's an error, we'll just continue
  RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
END
$$;

-- Create a function to create tables if they don't exist
CREATE OR REPLACE FUNCTION public.create_tables_if_not_exist()
RETURNS void AS $$
BEGIN
  -- Create profiles table if it doesn't exist WITHOUT foreign key constraint
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

-- Create a function to handle profile creation on signup
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

-- Seed dummy data with random UUIDs instead of fixed IDs that would require auth.users entries
DO $$
DECLARE
  profile_count integer;
  patient1_id uuid := gen_random_uuid();
  patient2_id uuid := gen_random_uuid();
  patient3_id uuid := gen_random_uuid();
  doctor1_id uuid := gen_random_uuid();
  doctor2_id uuid := gen_random_uuid();
  pharma1_id uuid := gen_random_uuid();
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  -- Only seed data if the profiles table is empty
  IF profile_count = 0 THEN
    BEGIN
      -- Insert dummy users/profiles with generated UUIDs
      INSERT INTO profiles (id, name, email, mobile, user_type, password, public_key, created_at)
      VALUES 
        (patient1_id, 'John Patient', 'patient@example.com', '555-123-4567', 'patient', 'patient123', 'patient_public_key_123', now()),
        (doctor1_id, 'Dr. Jane Smith', 'doctor@example.com', '555-987-6543', 'doctor', 'doctor123', 'doctor_public_key_456', now()),
        (pharma1_id, 'MedPlus Pharmacy', 'pharma@example.com', '555-789-0123', 'pharma', 'pharma123', 'pharma_public_key_789', now()),
        (patient2_id, 'Sarah Johnson', 'sarah@example.com', '555-222-3333', 'patient', 'sarah123', 'patient_public_key_456', now()),
        (patient3_id, 'Michael Brown', 'michael@example.com', '555-444-5555', 'patient', 'michael123', 'patient_public_key_789', now()),
        (doctor2_id, 'Dr. Robert Wilson', 'robert@example.com', '555-666-7777', 'doctor', 'robert123', 'doctor_public_key_abc', now());

      -- Insert dummy appointments
      INSERT INTO appointments (patient_id, doctor_id, date, status, created_at)
      VALUES
        (patient1_id, doctor1_id, now() + interval '2 days', 'pending', now()),
        (patient1_id, doctor1_id, now() + interval '5 days', 'confirmed', now()),
        (patient1_id, doctor1_id, now() - interval '3 days', 'completed', now()),
        (patient2_id, doctor2_id, now() + interval '1 day', 'pending', now()),
        (patient3_id, doctor2_id, now() + interval '3 days', 'confirmed', now()),
        (patient2_id, doctor2_id, now() - interval '5 days', 'completed', now());

      -- Insert dummy documents
      INSERT INTO documents (user_id, name, type, ipfs_hash, test_date, created_at)
      VALUES
        (patient1_id, 'Blood Test Results', 'medical_report', 'ipfs_hash_123', now() - interval '12 days', now() - interval '10 days'),
        (patient1_id, 'X-Ray Report', 'medical_report', 'ipfs_hash_456', now() - interval '22 days', now() - interval '20 days'),
        (patient1_id, 'Vaccination Record', 'medical_report', 'ipfs_hash_789', now() - interval '30 days', now() - interval '30 days'),
        (patient2_id, 'MRI Scan', 'medical_report', 'ipfs_hash_abc', now() - interval '18 days', now() - interval '15 days'),
        (patient3_id, 'Allergy Test Results', 'medical_report', 'ipfs_hash_def', now() - interval '28 days', now() - interval '25 days'),
        (patient2_id, 'Annual Physical Results', 'medical_report', 'ipfs_hash_ghi', now() - interval '42 days', now() - interval '40 days');

      -- Insert dummy prescriptions
      INSERT INTO prescriptions (patient_id, doctor_id, medications, status, prescription_date, created_at)
      VALUES
        (patient1_id, doctor1_id, 
         '[{"name": "Amoxicillin", "dosage": "500mg", "frequency": "3 times daily", "duration": "7 days"}]', 
         'pending', now() - interval '5 days', now() - interval '5 days'),
        
        (patient1_id, doctor1_id, 
         '[{"name": "Ibuprofen", "dosage": "400mg", "frequency": "as needed", "duration": "for pain"}]', 
         'dispensed', now() - interval '15 days', now() - interval '15 days'),
        
        (patient1_id, doctor1_id, 
         '[{"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "duration": "30 days"}]', 
         'pending', now() - interval '2 days', now() - interval '2 days'),
        
        (patient2_id, doctor2_id, 
         '[{"name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "duration": "90 days"}]', 
         'pending', now() - interval '3 days', now() - interval '3 days'),
        
        (patient3_id, doctor2_id, 
         '[{"name": "Atorvastatin", "dosage": "20mg", "frequency": "once daily", "duration": "30 days"}]', 
         'dispensed', now() - interval '10 days', now() - interval '10 days'),
        
        (patient2_id, doctor2_id, 
         '[{"name": "Albuterol", "dosage": "90mcg", "frequency": "as needed", "duration": "for breathing difficulty"}]', 
         'pending', now() - interval '1 day', now() - interval '1 day');

      RAISE NOTICE 'Dummy data seeded successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error seeding data: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Database already contains data, skipping seed';
  END IF;
END
$$;