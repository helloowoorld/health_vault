/*
  # Fix Database Permissions for Doctors
  
  1. Changes
     - Add proper RLS policies for doctors to manage prescriptions
     - Add proper RLS policies for doctors to manage appointments
     - Fix permission denied errors for authenticated users
  
  2. Security
     - Maintain RLS on all tables
     - Ensure proper access control
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can update prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can update appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view appointments" ON appointments;

-- Create comprehensive policies for doctors to manage prescriptions
CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'doctor'
    )
  );

CREATE POLICY "Doctors can update prescriptions"
  ON prescriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'doctor'
    )
  );

-- Create comprehensive policies for doctors to manage appointments
CREATE POLICY "Doctors can update appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'doctor'
    )
  );

CREATE POLICY "Doctors can view appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'doctor'
    )
  );

-- Create policy for doctors to view their own appointments
CREATE POLICY "Doctors can view their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'doctor'
    )
  );

-- Create policy for doctors to view patient prescriptions
CREATE POLICY "Doctors can view prescriptions"
  ON prescriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'doctor'
    )
  );

-- Create policy for doctors to view their own prescriptions
CREATE POLICY "Doctors can view their prescriptions"
  ON prescriptions
  FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'doctor'
    )
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON prescriptions TO authenticated;
GRANT ALL ON appointments TO authenticated;

-- Enable RLS on tables
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;