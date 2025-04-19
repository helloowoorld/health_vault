-- Update the create_tables_if_not_exist function to include the new columns
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_tables_if_not_exist() TO authenticated, anon;

-- Insert additional test data with prescription_date and test_date
DO $$
DECLARE
  patient_id uuid;
  doctor_id uuid;
BEGIN
  -- Get existing user IDs
  SELECT id INTO patient_id FROM profiles WHERE email = 'patient@example.com' LIMIT 1;
  SELECT id INTO doctor_id FROM profiles WHERE email = 'doctor@example.com' LIMIT 1;
  
  -- Only insert if we have valid IDs and there's existing data
  IF patient_id IS NOT NULL AND doctor_id IS NOT NULL THEN
    -- Insert additional prescriptions with prescription_date
    INSERT INTO prescriptions (patient_id, doctor_id, medications, status, prescription_date, created_at)
    VALUES
      (patient_id, doctor_id, 
       '[{"name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "duration": "30 days"}]', 
       'pending', now() - interval '7 days', now() - interval '7 days'),
      
      (patient_id, doctor_id, 
       '[{"name": "Atorvastatin", "dosage": "20mg", "frequency": "once daily", "duration": "90 days"}]', 
       'dispensed', now() - interval '20 days', now() - interval '20 days');
    
    -- Insert additional documents with test_date
    INSERT INTO documents (user_id, name, type, ipfs_hash, test_date, created_at)
    VALUES
      (patient_id, 'Cholesterol Test', 'medical_report', 'ipfs_hash_chol', now() - interval '15 days', now() - interval '14 days'),
      (patient_id, 'Allergy Panel', 'medical_report', 'ipfs_hash_allergy', now() - interval '25 days', now() - interval '24 days');
  END IF;
END
$$;