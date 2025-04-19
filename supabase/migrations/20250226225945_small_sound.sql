/*
  # Create Database Schema
  
  1. New Tables
    - `profiles` - User profiles with user type
    - `appointments` - Patient-doctor appointments
    - `documents` - Medical documents stored on IPFS
    - `prescriptions` - Medical prescriptions
  
  2. Security
    - Enable RLS on all tables
    - Create policies for proper access control
    - Set up connection testing function
*/

-- Create user_type enum
CREATE TYPE user_type AS ENUM ('patient', 'doctor', 'pharma');

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  mobile text,
  public_key text,
  user_type user_type NOT NULL DEFAULT 'patient',
  password text, -- Store password for reference
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments Table
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed'))
);

-- Documents Table
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  ipfs_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Prescriptions Table
CREATE TABLE prescriptions (
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

-- Create function to handle new user creation
CREATE FUNCTION handle_new_user()
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to manually create a profile
CREATE FUNCTION public.create_profile_for_user(
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

-- Create a test_connection function that can be called without authentication
CREATE FUNCTION public.test_connection()
RETURNS boolean AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to anon role
GRANT EXECUTE ON FUNCTION public.test_connection() TO anon;

-- Create all policies
-- Profiles Policies
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

-- Add indexes for frequently queried columns
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);