/*
  # Add dummy data and test users

  1. New Fields
    - Add password field to profiles table
  
  2. Test Data
    - Create dummy users for patient, doctor, and pharmacy
    - Add sample appointments, documents, and prescriptions
*/

-- Add password field to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password text;

-- Set default password for existing profiles
UPDATE profiles SET password = 'securepassword123' WHERE password IS NULL;

-- Create auth users and profiles for dummy data
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
    
    -- Create patient profile only if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = patient_id) THEN
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
    
    -- Create doctor profile only if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = doctor_id) THEN
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
    
    -- Create pharma profile only if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = pharma_id) THEN
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
  IF p_id IS NOT NULL AND d_id IS NOT NULL AND 
     NOT EXISTS (SELECT 1 FROM appointments WHERE appointments.patient_id = p_id AND appointments.doctor_id = d_id LIMIT 1) THEN
    INSERT INTO appointments (patient_id, doctor_id, date, status)
    VALUES 
      (p_id, d_id, now() + interval '2 days', 'pending'),
      (p_id, d_id, now() + interval '5 days', 'confirmed'),
      (p_id, d_id, now() - interval '3 days', 'completed');
  END IF;

  -- Only insert documents if we have a valid patient ID and no existing documents
  IF p_id IS NOT NULL AND 
     NOT EXISTS (SELECT 1 FROM documents WHERE documents.user_id = p_id LIMIT 1) THEN
    INSERT INTO documents (user_id, name, type, ipfs_hash)
    VALUES 
      (p_id, 'Blood Test Results', 'medical_report', 'ipfs_hash_123'),
      (p_id, 'X-Ray Report', 'medical_report', 'ipfs_hash_456'),
      (p_id, 'Vaccination Record', 'medical_report', 'ipfs_hash_789');
  END IF;

  -- Only insert prescriptions if we have valid IDs and no existing prescriptions
  IF p_id IS NOT NULL AND d_id IS NOT NULL AND 
     NOT EXISTS (SELECT 1 FROM prescriptions WHERE prescriptions.patient_id = p_id AND prescriptions.doctor_id = d_id LIMIT 1) THEN
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
END $$;