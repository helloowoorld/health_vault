/*
  # Change user_type column to text type

  1. Changes
     - First drop all policies that depend on the user_type column
     - Create a temporary column to store the current values
     - Drop the original column and rename the temporary column
     - Recreate all policies to use the text column
  
  2. Security
     - Recreates all existing RLS policies to maintain security
*/

-- First drop all policies that depend on the user_type column
DROP POLICY IF EXISTS "Patients can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can update their appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Patients can view their prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Pharma can update prescriptions" ON prescriptions;

-- Drop the triggers that depend on user_type
DROP TRIGGER IF EXISTS sync_user_type_trigger ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the functions that depend on user_type
DROP FUNCTION IF EXISTS sync_user_type_columns() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user(uuid, text, text, text, text) CASCADE;

-- Create a temporary column to store the values
ALTER TABLE profiles ADD COLUMN temp_user_type text;

-- Copy values from user_type to temp_user_type
UPDATE profiles SET temp_user_type = user_type::text;

-- Drop the user_type column
ALTER TABLE profiles DROP COLUMN user_type CASCADE;

-- Rename temp_user_type to user_type
ALTER TABLE profiles RENAME COLUMN temp_user_type TO user_type;

-- Add NOT NULL constraint and default value
ALTER TABLE profiles ALTER COLUMN user_type SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN user_type SET DEFAULT 'patient';

-- Drop the usertype column as it's no longer needed
ALTER TABLE profiles DROP COLUMN IF EXISTS usertype;

-- Create new function to handle new user creation with text type
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value text := 'patient';
BEGIN
  -- Try to extract user_type from metadata
  IF new.raw_user_meta_data->>'user_type' IS NOT NULL THEN
    user_type_value := new.raw_user_meta_data->>'user_type';
  ELSIF new.raw_user_meta_data->>'userType' IS NOT NULL THEN
    user_type_value := new.raw_user_meta_data->>'userType';
  END IF;

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

-- Recreate all policies with text comparison
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

-- Drop the user_type enum if it's no longer needed
DROP TYPE IF EXISTS user_type;