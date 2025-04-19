import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'healthvault'
    }
  }
});

// Test the connection on initialization
(async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // First check if auth service is available
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('Supabase auth service test failed:', authError);
      } else {
        console.log('Supabase auth service is available');
      }
    } catch (authTestError) {
      console.error('Error testing auth service:', authTestError);
    }
    
    // Try to run the test_connection function
    try {
      const { data: testData, error: testError } = await supabase.rpc('test_connection');
      if (testError) {
        console.error('Supabase test_connection function failed:', testError);
      } else {
        console.log('Supabase test_connection function successful');
      }
    } catch (testError) {
      console.error('Error calling test_connection function:', testError);
    }
    
    // Try a simple query that should work even without auth
    try {
      // Use a simple select query instead of count
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .limit(1);
      
      if (error) {
        console.error('Supabase profiles query failed:', error);
      } else {
        console.log('Supabase profiles query successful');
      }
    } catch (queryError) {
      console.error('Error querying profiles:', queryError);
    }
  } catch (err) {
    console.error('Unexpected error testing Supabase connection:', err);
  }
})();