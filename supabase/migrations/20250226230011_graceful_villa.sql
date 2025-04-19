/*
  # Add Anonymous Access for Connection Testing
  
  This migration adds policies and permissions to allow anonymous access
  for connection testing purposes.
*/

-- Grant usage on schema to anon role
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select permissions on all tables to anon role for connection testing
GRANT SELECT ON TABLE profiles TO anon;
GRANT SELECT ON TABLE appointments TO anon;
GRANT SELECT ON TABLE documents TO anon;
GRANT SELECT ON TABLE prescriptions TO anon;

-- Create policies for anon access
CREATE POLICY "anon_select_profiles" 
  ON profiles 
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "anon_select_appointments" 
  ON appointments 
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "anon_select_documents" 
  ON documents 
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "anon_select_prescriptions" 
  ON prescriptions 
  FOR SELECT 
  TO anon 
  USING (true);

-- Grant execute permission on the test_connection function to anon role
GRANT EXECUTE ON FUNCTION public.test_connection() TO anon;
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, text, text, text) TO authenticated;