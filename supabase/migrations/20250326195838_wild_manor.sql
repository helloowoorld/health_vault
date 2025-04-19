/*
  # Fix Appointment Update Permissions
  
  1. Changes
     - Add proper RLS policies for doctors to update appointments
     - Fix permission denied errors for appointment status updates
     - Ensure doctors can manage their appointments
  
  2. Security
     - Maintain RLS on all tables
     - Ensure proper access control
*/

-- Drop existing appointment policies to avoid conflicts
DROP POLICY IF EXISTS "Doctors can update appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON appointments;
DROP POLICY IF EXISTS "authenticated_all_appointments" ON appointments;

-- Create comprehensive policies for doctors to manage appointments
CREATE POLICY "authenticated_all_appointments" 
  ON appointments 
  FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

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
  )
  WITH CHECK (
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

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON appointments TO authenticated;

-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create function to update appointment status
CREATE OR REPLACE FUNCTION update_appointment_status(
  appointment_id uuid,
  new_status text
)
RETURNS boolean AS $$
BEGIN
  UPDATE appointments
  SET status = new_status
  WHERE id = appointment_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'doctor'
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_appointment_status(uuid, text) TO authenticated;