/*
  # Complete Database Setup

  1. Create Tables
    - Create user_type enum
    - Create profiles table
    - Create appointments table
    - Create documents table
    - Create prescriptions table
  
  2. Setup Functions and Policies
    - Create test_connection function
    - Create profile creation function
    - Setup RLS policies
  
  3. Add Sample Data
    - Create sample users
    - Add sample appointments, documents, and prescriptions
*/

-- First check if user_type enum exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE user_type AS ENUM ('patient', 'doctor', 'pharma');
  END IF;
END
$$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  name text,
  email text,
  mobile text,
  public_key text,
  user_type user_type NOT NULL DEFAULT 'patient',
  password text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, we'll just continue
  END;
END
$$;

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid,
  doctor_id uuid,
  date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed'))
);

-- Add foreign keys if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'appointments_patient_id_fkey'
  ) THEN
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, we'll just continue
  END;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'appointments_doctor_id_fkey'
  ) THEN
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_doctor_id_fkey 
    FOREIGN KEY (doctor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, we'll just continue
  END;
END
$$;

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  ipfs_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'documents_user_id_fkey'
  ) THEN
    ALTER TABLE documents 
    ADD CONSTRAINT documents_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, we'll just continue
  END;
END
$$;

-- Prescriptions Table
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

-- Add foreign keys if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'prescriptions_patient_id_fkey'
  ) THEN
    ALTER TABLE prescriptions 
    ADD CONSTRAINT prescriptions_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, we'll just continue
  END;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'prescriptions_doctor_id_fkey'
  ) THEN
    ALTER TABLE prescriptions 
    ADD CONSTRAINT prescriptions_doctor_id_fkey 
    FOREIGN KEY (doctor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, we'll just continue
  END;
END
$$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Create a test_connection function that can be called without authentication
CREATE OR REPLACE FUNCTION public.test_connection()
RETURNS boolean AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to anon role
GRANT EXECUTE ON FUNCTION public.test_connection() TO anon;

-- Create function to manually create a profile
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

-- Grant usage on schema to anon role
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select permissions on all tables to anon role for connection testing
GRANT SELECT ON TABLE profiles TO anon;
GRANT SELECT ON TABLE appointments TO anon;
GRANT SELECT ON TABLE documents TO anon;
GRANT SELECT ON TABLE prescriptions TO anon;

-- Create policies for anon access
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

-- Create policies for authenticated users
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Appointments Policies
CREATE POLICY "Patients can view their own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = patient_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'doctor'
    )
  );

CREATE POLICY "Patients can create appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = patient_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = doctor_id 
      AND user_type = 'doctor'
    )
  );

CREATE POLICY "Doctors can update their appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'doctor'
    )
  );

-- Documents Policies
CREATE POLICY "Users can view their own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('doctor', 'pharma')
    )
  );

CREATE POLICY "Users can upload their own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Prescriptions Policies
CREATE POLICY "Patients can view their prescriptions"
  ON prescriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('doctor', 'pharma')
    )
  );

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'doctor'
    )
  );

CREATE POLICY "Pharma can update prescriptions"
  ON prescriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'pharma'
    )
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value user_type := 'patient'::user_type;
BEGIN
  -- Try to extract user_type from metadata
  BEGIN
    IF new.raw_user_meta_data->>'user_type' IS NOT NULL THEN
      user_type_value := (new.raw_user_meta_data->>'user_type')::user_type;
    ELSIF new.raw_user_meta_data->>'userType' IS NOT NULL THEN
      user_type_value := (new.raw_user_meta_data->>'userType')::user_type;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    user_type_value := 'patient'::user_type;
  END;

  -- Insert the profile only if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    INSERT INTO public.profiles (id, email, user_type)
    VALUES (new.id, new.email, user_type_value);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Create dummy users if they don't exist
DO $$
DECLARE
  patient_id uuid;
  doctor_id uuid;
  pharma_id uuid;
  p_id uuid; -- For patient ID in queries
  d_id uuid; -- For doctor ID in queries
BEGIN
  -- First check if the dummy users already exist
  SELECT id INTO patient_id FROM auth.users WHERE email = 'patient@example.com';
  SELECT id INTO doctor_id FROM auth.users WHERE email = 'doctor@example.com';
  SELECT id INTO pharma_id FROM auth.users WHERE email = 'pharma@example.com';
  
  -- Create patient user if it doesn't exist
  IF patient_id IS NULL THEN
    BEGIN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'patient@example.com',
        crypt('patient123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"user_type": "patient"}',
        now(),
        now()
      )
      RETURNING id INTO patient_id;
    EXCEPTION WHEN OTHERS THEN
      -- If there's an error, try to get the existing user
      SELECT id INTO patient_id FROM auth.users WHERE email = 'patient@example.com';
    END;
    
    -- Create patient profile only if it doesn't exist and we have a valid ID
    IF patient_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = patient_id) THEN
      INSERT INTO profiles (id, name, email, mobile, user_type, password, public_key)
      VALUES (
        patient_id,
        'John Patient',
        'patient@example.com',
        '555-123-4567',
        'patient',
        'patient123',
        'patient_public_key_123'
      );
    END IF;
  END IF;
  
  -- Create doctor user if it doesn't exist
  IF doctor_id IS NULL THEN
    BEGIN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'doctor@example.com',
        crypt('doctor123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"user_type": "doctor"}',
        now(),
        now()
      )
      RETURNING id INTO doctor_id;
    EXCEPTION WHEN OTHERS THEN
      -- If there's an error, try to get the existing user
      SELECT id INTO doctor_id FROM auth.users WHERE email = 'doctor@example.com';
    END;
    
    -- Create doctor profile only if it doesn't exist and we have a valid ID
    IF doctor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = doctor_id) THEN
      INSERT INTO profiles (id, name, email, mobile, user_type, password, public_key)
      VALUES (
        doctor_id,
        'Dr. Jane Smith',
        'doctor@example.com',
        '555-987-6543',
        'doctor',
        'doctor123',
        'doctor_public_key_456'
      );
    END IF;
  END IF;
  
  -- Create pharma user if it doesn't exist
  IF pharma_id IS NULL THEN
    BEGIN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'pharma@example.com',
        crypt('pharma123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"user_type": "pharma"}',
        now(),
        now()
      )
      RETURNING id INTO pharma_id;
    EXCEPTION WHEN OTHERS THEN
      -- If there's an error, try to get the existing user
      SELECT id INTO pharma_id FROM auth.users WHERE email = 'pharma@example.com';
    END;
    
    -- Create pharma profile only if it doesn't exist and we have a valid ID
    IF pharma_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = pharma_id) THEN
      INSERT INTO profiles (id, name, email, mobile, user_type, password, public_key)
      VALUES (
        pharma_id,
        'MedPlus Pharmacy',
        'pharma@example.com',
        '555-789-0123',
        'pharma',
        'pharma123',
        'pharma_public_key_789'
      );
    END IF;
  END IF;
  
  -- If we don't have valid IDs, try to get them from existing records
  IF patient_id IS NULL THEN
    SELECT id INTO patient_id FROM profiles WHERE email = 'patient@example.com';
  END IF;
  
  IF doctor_id IS NULL THEN
    SELECT id INTO doctor_id FROM profiles WHERE email = 'doctor@example.com';
  END IF;
  
  -- Store IDs in separate variables to avoid ambiguity in queries
  p_id := patient_id;
  d_id := doctor_id;
  
  -- Only insert appointments if we have valid IDs and no existing appointments
  IF p_id IS NOT NULL AND d_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM appointments WHERE appointments.patient_id = p_id AND appointments.doctor_id = d_id LIMIT 1) THEN
      INSERT INTO appointments (patient_id, doctor_id, date, status)
      VALUES 
        (p_id, d_id, now() + interval '2 days', 'pending'),
        (p_id, d_id, now() + interval '5 days', 'confirmed'),
        (p_id, d_id, now() - interval '3 days', 'completed');
    END IF;
  END IF;

  -- Only insert documents if we have a valid patient ID and no existing documents
  IF p_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM documents WHERE documents.user_id = p_id LIMIT 1) THEN
      INSERT INTO documents (user_id, name, type, ipfs_hash)
      VALUES 
        (p_id, 'Blood Test Results', 'medical_report', 'ipfs_hash_123'),
        (p_id, 'X-Ray Report', 'medical_report', 'ipfs_hash_456'),
        (p_id, 'Vaccination Record', 'medical_report', 'ipfs_hash_789');
    END IF;
  END IF;

  -- Only insert prescriptions if we have valid IDs and no existing prescriptions
  IF p_id IS NOT NULL AND d_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM prescriptions WHERE prescriptions.patient_id = p_id AND prescriptions.doctor_id = d_id LIMIT 1) THEN
      INSERT INTO prescriptions (patient_id, doctor_id, medications, status)
      VALUES 
        (
          p_id, 
          d_id, 
          '[{"name": "Amoxicillin", "dosage": "500mg", "frequency": "3 times daily", "duration": "7 days"}]'::jsonb, 
          'pending'
        ),
        (
          p_id, 
          d_id, 
          '[{"name": "Ibuprofen", "dosage": "400mg", "frequency": "as needed", "duration": "for pain"}]'::jsonb, 
          'dispensed'
        ),
        (
          p_id, 
          d_id, 
          '[{"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "duration": "30 days"}]'::jsonb, 
          'pending'
        );
    END IF;
  END IF;
END $$;