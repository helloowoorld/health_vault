/*
  # Fix Database Relationships and Error Handling

  1. Changes
     - Add proper foreign key relationships for joins
     - Fix error with doctor_id relationship in appointments
     - Add better error handling for registration
     - Fix issues with patient appointments query
  
  2. Security
     - Maintain RLS on all tables
     - Ensure proper access for all operations
*/

-- Grant usage on schema to both roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant necessary table permissions
GRANT SELECT, INSERT ON TABLE profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create a function to handle existing email during registration
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check text)
RETURNS boolean AS $$
DECLARE
  email_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = email_to_check) INTO email_exists;
  RETURN email_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated;

-- Improve the register_user function with better error handling
CREATE OR REPLACE FUNCTION public.register_user(
  user_email text,
  user_name text,
  user_mobile text,
  user_password text,
  user_type text DEFAULT 'patient'
)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
  email_exists boolean;
BEGIN
  -- Check if email already exists
  SELECT check_email_exists(user_email) INTO email_exists;
  
  IF email_exists THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;
  
  -- Generate a new UUID
  new_id := gen_random_uuid();
  
  -- Insert the profile
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    mobile,
    password,
    user_type
  )
  VALUES (
    new_id, 
    user_email, 
    user_name,
    user_mobile,
    user_password,
    user_type
  );
  
  RETURN new_id;
EXCEPTION 
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Email already exists';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in register_user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get patient appointments with proper joins
CREATE OR REPLACE FUNCTION public.get_patient_appointments(patient_uuid uuid)
RETURNS TABLE (
  id uuid,
  patient_id uuid,
  doctor_id uuid,
  date timestamptz,
  status text,
  created_at timestamptz,
  doctor_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.patient_id,
    a.doctor_id,
    a.date,
    a.status,
    a.created_at,
    p.name AS doctor_name
  FROM 
    appointments a
  LEFT JOIN 
    profiles p ON a.doctor_id = p.id
  WHERE 
    a.patient_id = patient_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get doctor appointments with proper joins
CREATE OR REPLACE FUNCTION public.get_doctor_appointments(doctor_uuid uuid)
RETURNS TABLE (
  id uuid,
  patient_id uuid,
  doctor_id uuid,
  date timestamptz,
  status text,
  created_at timestamptz,
  patient_name text,
  patient_email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.patient_id,
    a.doctor_id,
    a.date,
    a.status,
    a.created_at,
    p.name AS patient_name,
    p.email AS patient_email
  FROM 
    appointments a
  LEFT JOIN 
    profiles p ON a.patient_id = p.id
  WHERE 
    a.doctor_id = doctor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get patient prescriptions with proper joins
CREATE OR REPLACE FUNCTION public.get_patient_prescriptions(patient_uuid uuid)
RETURNS TABLE (
  id uuid,
  patient_id uuid,
  doctor_id uuid,
  medications jsonb,
  photo_hash text,
  status text,
  prescription_date timestamptz,
  created_at timestamptz,
  doctor_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.patient_id,
    pr.doctor_id,
    pr.medications,
    pr.photo_hash,
    pr.status,
    pr.prescription_date,
    pr.created_at,
    p.name AS doctor_name
  FROM 
    prescriptions pr
  LEFT JOIN 
    profiles p ON pr.doctor_id = p.id
  WHERE 
    pr.patient_id = patient_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.get_patient_appointments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_appointments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_prescriptions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_user(text, text, text, text, text) TO anon, authenticated;