-- Drop existing appointment policies to avoid conflicts
DROP POLICY IF EXISTS "Doctors can update appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON appointments;
DROP POLICY IF EXISTS "authenticated_all_appointments" ON appointments;
DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;

-- Create base policy for authenticated users
CREATE POLICY "authenticated_all_appointments" 
  ON appointments 
  FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Create policy for anon access (needed for connection testing)
CREATE POLICY "anon_select_appointments" 
  ON appointments 
  FOR SELECT 
  TO anon 
  USING (true);

-- Create specific policy for doctors to update appointments
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

-- Create policy for doctors to view all appointments
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON appointments TO authenticated;
GRANT SELECT ON appointments TO anon;

-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create secure function to update appointment status
CREATE OR REPLACE FUNCTION update_appointment_status(
  appointment_id uuid,
  new_status text
)
RETURNS boolean AS $$
DECLARE
  is_doctor boolean;
  is_valid_status boolean;
BEGIN
  -- Check if user is a doctor
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'doctor'
  ) INTO is_doctor;

  IF NOT is_doctor THEN
    RAISE EXCEPTION 'Only doctors can update appointment status';
  END IF;

  -- Validate status
  SELECT new_status = ANY(ARRAY['pending', 'confirmed', 'rejected', 'completed'])
  INTO is_valid_status;

  IF NOT is_valid_status THEN
    RAISE EXCEPTION 'Invalid appointment status';
  END IF;

  -- Update the appointment
  UPDATE appointments
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = appointment_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'doctor'
  );
  
  RETURN FOUND;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't expose details
  RAISE NOTICE 'Error in update_appointment_status: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_appointment_status(uuid, text) TO authenticated;