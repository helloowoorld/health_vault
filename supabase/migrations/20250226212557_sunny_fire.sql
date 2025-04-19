/*
  # Fix database schema and triggers

  1. Tables
    - Ensures all required tables exist with proper structure
    - Adds usertype text column for frontend compatibility
  
  2. Triggers
    - Creates sync trigger to keep user_type and usertype in sync
    - Updates handle_new_user function to properly extract metadata
  
  3. Security
    - Enables RLS on all tables
    - Creates appropriate policies for data access
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
  usertype text, -- Text version for frontend compatibility
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed'))
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  ipfs_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  medications jsonb NOT NULL,
  photo_hash text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'dispensed'))
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- First check if the usertype column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'usertype'
  ) THEN
    -- Add the usertype column
    ALTER TABLE profiles ADD COLUMN usertype text;
    
    -- Update existing rows to copy values from user_type to usertype
    UPDATE profiles SET usertype = user_type::text;
  END IF;
END
$$;

-- Create a trigger function to keep the columns in sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'sync_user_type_columns'
  ) THEN
    CREATE FUNCTION sync_user_type_columns()
    RETURNS TRIGGER AS $FUNC$
    BEGIN
      IF TG_OP = 'INSERT' OR NEW.user_type IS DISTINCT FROM OLD.user_type THEN
        NEW.usertype := NEW.user_type::text;
      ELSIF NEW.usertype IS DISTINCT FROM OLD.usertype THEN
        BEGIN
          NEW.user_type := NEW.usertype::user_type;
        EXCEPTION WHEN OTHERS THEN
          -- If conversion fails, keep the old value
          NEW.user_type := OLD.user_type;
          NEW.usertype := OLD.user_type::text;
        END;
      END IF;
      RETURN NEW;
    END;
    $FUNC$ LANGUAGE plpgsql;
  END IF;
END
$$;

-- Drop the trigger if it exists, then recreate it
DO $$
BEGIN
  DROP TRIGGER IF EXISTS sync_user_type_trigger ON profiles;
  
  CREATE TRIGGER sync_user_type_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_user_type_columns();
END
$$;

-- Update existing rows to ensure usertype is set
UPDATE profiles SET usertype = user_type::text WHERE usertype IS NULL;

-- Update the handle_new_user function to handle both fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value user_type;
  user_type_text text;
BEGIN
  -- Try to extract user_type from metadata
  BEGIN
    -- First try to get it from raw_user_meta_data
    user_type_text := new.raw_user_meta_data->>'user_type';
    IF user_type_text IS NULL THEN
      user_type_text := new.raw_user_meta_data->>'userType';
    END IF;
    
    IF user_type_text IS NOT NULL THEN
      user_type_value := user_type_text::user_type;
    ELSE
      -- Default to patient if not found
      user_type_value := 'patient'::user_type;
      user_type_text := 'patient';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Default to patient if conversion fails
    user_type_value := 'patient'::user_type;
    user_type_text := 'patient';
  END;

  -- Insert the profile with both fields
  INSERT INTO public.profiles (id, email, user_type, usertype)
  VALUES (new.id, new.email, user_type_value, user_type_text);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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
  user_type_value user_type;
BEGIN
  -- Convert user_type to enum
  BEGIN
    user_type_value := user_type::user_type;
  EXCEPTION WHEN OTHERS THEN
    user_type_value := 'patient'::user_type;
  END;

  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Insert new profile with both fields
    INSERT INTO public.profiles (id, email, name, mobile, user_type, usertype)
    VALUES (user_id, user_email, user_name, user_mobile, user_type_value, user_type);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
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

-- Appointments Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' AND policyname = 'Patients can view their own appointments'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' AND policyname = 'Patients can create appointments'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments' AND policyname = 'Doctors can update their appointments'
  ) THEN
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
  END IF;
END
$$;

-- Documents Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' AND policyname = 'Users can view their own documents'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' AND policyname = 'Users can upload their own documents'
  ) THEN
    CREATE POLICY "Users can upload their own documents"
      ON documents
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Prescriptions Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prescriptions' AND policyname = 'Patients can view their prescriptions'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prescriptions' AND policyname = 'Doctors can create prescriptions'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prescriptions' AND policyname = 'Pharma can update prescriptions'
  ) THEN
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
  END IF;
END
$$;