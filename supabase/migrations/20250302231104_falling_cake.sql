-- Add prescription_date column to prescriptions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prescriptions' AND column_name = 'prescription_date'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN prescription_date timestamptz;
  END IF;
END
$$;

-- Add test_date column to documents table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'test_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN test_date timestamptz;
  END IF;
END
$$;

-- Update existing prescriptions to set prescription_date if it's null
UPDATE prescriptions 
SET prescription_date = created_at 
WHERE prescription_date IS NULL;

-- Update existing documents to set test_date if it's null
UPDATE documents 
SET test_date = created_at 
WHERE test_date IS NULL;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage all tables
DROP POLICY IF EXISTS "authenticated_all_prescriptions" ON prescriptions;
CREATE POLICY "authenticated_all_prescriptions" 
  ON prescriptions 
  FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "authenticated_all_documents" ON documents;
CREATE POLICY "authenticated_all_documents" 
  ON documents 
  FOR ALL 
  TO authenticated 
  USING (true);