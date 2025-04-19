-- Seed dummy data into the database
-- This migration adds initial data for testing purposes

-- First, check if we already have data to avoid duplicates
DO $$
DECLARE
  profile_count integer;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  -- Only seed data if the profiles table is empty
  IF profile_count = 0 THEN
    -- Insert dummy users/profiles
    INSERT INTO profiles (id, name, email, mobile, user_type, password, public_key, created_at)
    VALUES 
      ('00000000-0000-0000-0000-000000000001', 'John Patient', 'patient@example.com', '555-123-4567', 'patient', 'patient123', 'patient_public_key_123', now()),
      ('00000000-0000-0000-0000-000000000002', 'Dr. Jane Smith', 'doctor@example.com', '555-987-6543', 'doctor', 'doctor123', 'doctor_public_key_456', now()),
      ('00000000-0000-0000-0000-000000000003', 'MedPlus Pharmacy', 'pharma@example.com', '555-789-0123', 'pharma', 'pharma123', 'pharma_public_key_789', now()),
      ('00000000-0000-0000-0000-000000000004', 'Sarah Johnson', 'sarah@example.com', '555-222-3333', 'patient', 'sarah123', 'patient_public_key_456', now()),
      ('00000000-0000-0000-0000-000000000005', 'Michael Brown', 'michael@example.com', '555-444-5555', 'patient', 'michael123', 'patient_public_key_789', now()),
      ('00000000-0000-0000-0000-000000000006', 'Dr. Robert Wilson', 'robert@example.com', '555-666-7777', 'doctor', 'robert123', 'doctor_public_key_abc', now()),
      ('00000000-0000-0000-0000-000000000007', 'Dr. Emily Davis', 'emily@example.com', '555-888-9999', 'doctor', 'emily123', 'doctor_public_key_def', now()),
      ('00000000-0000-0000-0000-000000000008', 'City Drugs', 'citydrugs@example.com', '555-111-2222', 'pharma', 'city123', 'pharma_public_key_ghi', now()),
      ('00000000-0000-0000-0000-000000000009', 'HealthRx Pharmacy', 'healthrx@example.com', '555-333-4444', 'pharma', 'health123', 'pharma_public_key_jkl', now());

    -- Insert dummy appointments
    INSERT INTO appointments (id, patient_id, doctor_id, date, status, created_at)
    VALUES
      ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', now() + interval '2 days', 'pending', now()),
      ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', now() + interval '5 days', 'confirmed', now()),
      ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', now() - interval '3 days', 'completed', now()),
      ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', now() + interval '1 day', 'pending', now()),
      ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000007', now() + interval '3 days', 'confirmed', now()),
      ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', now() - interval '5 days', 'completed', now());

    -- Insert dummy documents
    INSERT INTO documents (id, user_id, name, type, ipfs_hash, test_date, created_at)
    VALUES
      ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'Blood Test Results', 'medical_report', 'ipfs_hash_123', now() - interval '12 days', now() - interval '10 days'),
      ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'X-Ray Report', 'medical_report', 'ipfs_hash_456', now() - interval '22 days', now() - interval '20 days'),
      ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'Vaccination Record', 'medical_report', 'ipfs_hash_789', now() - interval '30 days', now() - interval '30 days'),
      ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000004', 'MRI Scan', 'medical_report', 'ipfs_hash_abc', now() - interval '18 days', now() - interval '15 days'),
      ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000005', 'Allergy Test Results', 'medical_report', 'ipfs_hash_def', now() - interval '28 days', now() - interval '25 days'),
      ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000004', 'Annual Physical Results', 'medical_report', 'ipfs_hash_ghi', now() - interval '42 days', now() - interval '40 days');

    -- Insert dummy prescriptions
    INSERT INTO prescriptions (id, patient_id, doctor_id, medications, status, prescription_date, created_at)
    VALUES
      ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 
       '[{"name": "Amoxicillin", "dosage": "500mg", "frequency": "3 times daily", "duration": "7 days"}]', 
       'pending', now() - interval '5 days', now() - interval '5 days'),
      
      ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 
       '[{"name": "Ibuprofen", "dosage": "400mg", "frequency": "as needed", "duration": "for pain"}]', 
       'dispensed', now() - interval '15 days', now() - interval '15 days'),
      
      ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 
       '[{"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "duration": "30 days"}]', 
       'pending', now() - interval '2 days', now() - interval '2 days'),
      
      ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', 
       '[{"name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "duration": "90 days"}]', 
       'pending', now() - interval '3 days', now() - interval '3 days'),
      
      ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000007', 
       '[{"name": "Atorvastatin", "dosage": "20mg", "frequency": "once daily", "duration": "30 days"}]', 
       'dispensed', now() - interval '10 days', now() - interval '10 days'),
      
      ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 
       '[{"name": "Albuterol", "dosage": "90mcg", "frequency": "as needed", "duration": "for breathing difficulty"}]', 
       'pending', now() - interval '1 day', now() - interval '1 day');

    RAISE NOTICE 'Dummy data seeded successfully';
  ELSE
    RAISE NOTICE 'Database already contains data, skipping seed';
  END IF;
END
$$;