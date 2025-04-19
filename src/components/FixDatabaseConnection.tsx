import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, Database, RefreshCw } from 'lucide-react';

const FixDatabaseConnection = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

  const runFixMigration = async () => {
    setIsFixing(true);
    setResult(null);
    
    try {
      // First check if auth service is available
      const { error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        setResult({
          success: false,
          message: 'Auth service is not available. Please check your Supabase configuration.'
        });
        setIsFixing(false);
        return;
      }
      
      // Try to run the create_tables_if_not_exist function
      try {
        const { error } = await supabase.rpc('create_tables_if_not_exist');
        if (error) {
          console.error('Error calling create_tables_if_not_exist:', error);
          
          // If the function doesn't exist, we need to run the SQL directly
          const { error: sqlError } = await supabase.rpc('exec_sql', {
            sql: `
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
            `
          });
          
          if (sqlError) {
            console.error('Error executing SQL:', sqlError);
          }
        } else {
          console.log('Successfully called create_tables_if_not_exist');
        }
      } catch (error) {
        console.error('Error calling create_tables_if_not_exist:', error);
      }
      
      // Try a simple query
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
          
        if (!error) {
          setResult({
            success: true,
            message: 'Database connection fixed successfully!'
          });
        } else {
          setResult({
            success: false,
            message: `Database query error: ${error.message}. Please run the fix migration in the Supabase SQL Editor.`
          });
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: `Database query error: ${error.message}. Please run the fix migration in the Supabase SQL Editor.`
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Unexpected error: ${error.message}`
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Fix Database Connection</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          If you're experiencing database connection issues, you can try to fix them by running the migration script in the Supabase SQL Editor.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> This will attempt to fix your database connection by running a migration script. If this doesn't work, you'll need to run the migration manually in the Supabase SQL Editor.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={runFixMigration}
            disabled={isFixing}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 flex items-center"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Database className="h-5 w-5 mr-2" />
                Fix Database Connection
              </>
            )}
          </button>
          
          <a 
            href="https://app.supabase.com/project/vuyhwhdxdnfxaxnsuqmm/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center"
          >
            <Database className="h-5 w-5 mr-2" />
            Open Supabase SQL Editor
          </a>
        </div>
      </div>
      
      {result && (
        <div className={`p-4 rounded ${result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="font-medium">{result.success ? 'Success!' : 'Error'}</p>
              <p>{result.message}</p>
              
              {!result.success && (
                <div className="mt-4">
                  <p className="font-medium">Steps to fix manually:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Click the "Open Supabase SQL Editor" button above</li>
                    <li>Copy and paste the following SQL:</li>
                    <pre className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto text-sm">
                      {`-- Grant usage on schema to both roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant necessary table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create a test_connection function
CREATE OR REPLACE FUNCTION public.test_connection()
RETURNS boolean AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon
GRANT EXECUTE ON FUNCTION public.test_connection() TO anon, authenticated;

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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" 
  ON profiles 
  FOR SELECT 
  TO anon 
  USING (true);

-- Create policies for authenticated users
DROP POLICY IF EXISTS "authenticated_all_profiles" ON profiles;
CREATE POLICY "authenticated_all_profiles" 
  ON profiles 
  FOR ALL 
  TO authenticated 
  USING (true);

-- Create policies for authenticated users to manage all tables
DROP POLICY IF EXISTS "authenticated_all_appointments" ON appointments;
CREATE POLICY "authenticated_all_appointments" 
  ON appointments 
  FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "authenticated_all_documents" ON documents;
CREATE POLICY "authenticated_all_documents" 
  ON documents 
  FOR ALL 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "authenticated_all_prescriptions" ON prescriptions;
CREATE POLICY "authenticated_all_prescriptions" 
  ON prescriptions 
  FOR ALL 
  TO authenticated 
  USING (true);`}
                    </pre>
                    <li>Click "Run" to execute the SQL</li>
                    <li>Return to this page and click "Fix Database Connection" again</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixDatabaseConnection;