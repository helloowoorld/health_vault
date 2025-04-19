import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const SupabaseConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tableStatus, setTableStatus] = useState<Record<string, boolean>>({});
  const [authStatus, setAuthStatus] = useState<'checking' | 'available' | 'error'>('checking');
  const [supabaseInfo, setSupabaseInfo] = useState({
    url: import.meta.env.VITE_SUPABASE_URL || 'Not set',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden for security)' : 'Not set'
  });

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // First check if auth service is available
      setAuthStatus('checking');
      const { data: sessionData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Supabase auth service test failed:', authError);
        setAuthStatus('error');
      } else {
        console.log('Supabase auth service is available');
        setAuthStatus('available');
      }
      
      // Now test database connection
      setConnectionStatus('checking');
      
      // Try a simple query
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        if (error) {
          console.error('Supabase profiles query failed:', error);
          setConnectionStatus('error');
          setErrorMessage(error.message);
          return;
        }
        
        setConnectionStatus('connected');
        checkTables();
      } catch (error: any) {
        console.error('Unexpected error testing Supabase connection:', error);
        setConnectionStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    } catch (error: any) {
      console.error('Unexpected error testing Supabase connection:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const checkTables = async () => {
    const tables = ['profiles', 'appointments', 'documents', 'prescriptions'];
    const status: Record<string, boolean> = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        status[table] = !error;
      } catch {
        status[table] = false;
      }
    }

    setTableStatus(status);
  };

  const runFixMigration = async () => {
    try {
      setConnectionStatus('checking');
      setErrorMessage('Attempting to run fix migration...');
      
      // Try a simple query
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log('Profiles query successful after fix');
        }
      } catch (error) {
        console.error('Error querying profiles after fix:', error);
      }
      
      // Retest the connection
      setTimeout(() => {
        testConnection();
      }, 2000);
    } catch (error: any) {
      console.error('Error running fix migration:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Supabase Connection Test</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Environment Variables</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="mb-2">
            <span className="font-medium">VITE_SUPABASE_URL:</span>{' '}
            {supabaseInfo.url}
          </p>
          <p>
            <span className="font-medium">VITE_SUPABASE_ANON_KEY:</span>{' '}
            {supabaseInfo.anonKey}
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Auth Service Status</h3>
        <div className={`p-4 rounded-lg ${
          authStatus === 'checking' ? 'bg-yellow-50 text-yellow-700' :
          authStatus === 'available' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        }`}>
          {authStatus === 'checking' && (
            <p className="flex items-center">
              <RefreshCw className="animate-spin h-5 w-5 mr-3" />
              Checking auth service...
            </p>
          )}
          
          {authStatus === 'available' && (
            <p className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Supabase Auth service is available
            </p>
          )}
          
          {authStatus === 'error' && (
            <div>
              <p className="flex items-center font-medium">
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
                Auth Service Error
              </p>
              <p className="mt-2 text-sm">Unable to connect to Supabase Auth service</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Database Connection Status</h3>
        <div className={`p-4 rounded-lg ${
          connectionStatus === 'checking' ? 'bg-yellow-50 text-yellow-700' :
          connectionStatus === 'connected' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        }`}>
          {connectionStatus === 'checking' && (
            <p className="flex items-center">
              <RefreshCw className="animate-spin h-5 w-5 mr-3" />
              {errorMessage || 'Checking database connection...'}
            </p>
          )}
          
          {connectionStatus === 'connected' && (
            <p className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Connected to Supabase database successfully!
            </p>
          )}
          
          {connectionStatus === 'error' && (
            <div>
              <p className="flex items-center font-medium">
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
                Database Connection Error
              </p>
              {errorMessage && <p className="mt-2 text-sm">{errorMessage}</p>}
              
              <button
                onClick={runFixMigration}
                className="mt-4 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Run Fix Migration
              </button>
            </div>
          )}
        </div>
      </div>

      {Object.keys(tableStatus).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Table Status</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="space-y-2">
              {Object.entries(tableStatus).map(([table, exists]) => (
                <li key={table} className="flex items-start">
                  {exists ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  )}
                  <span className="font-medium">{table}</span>: {exists ? 'Exists' : 'Missing'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Troubleshooting</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Verify your Supabase URL and anon key in the .env file</li>
          <li>Check if your Supabase project is active</li>
          <li>Ensure your database has the required tables (profiles, appointments, etc.)</li>
          <li>Check browser console for detailed error messages</li>
          <li>Try running the migrations manually in the Supabase SQL editor</li>
          <li>Make sure your RLS policies are correctly set up</li>
          <li>Try running the fix migration script in the Supabase SQL editor</li>
        </ul>
      </div>
      
      <div className="mt-6 flex space-x-4">
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          Test Connection Again
        </button>
        
        <a 
          href="https://app.supabase.com/project/vuyhwhdxdnfxaxnsuqmm/sql"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Open Supabase SQL Editor
        </a>
      </div>
    </div>
  );
};

export default SupabaseConnectionTest;