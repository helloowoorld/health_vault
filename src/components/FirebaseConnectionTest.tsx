import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, isFirebaseInitialized } from '../services/firebaseConfig';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const FirebaseConnectionTest = () => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    initialized: boolean;
    auth: boolean;
    firestore: boolean;
    collections: string[];
  } | null>(null);

  // Run a basic initialization check on component mount
  useEffect(() => {
    const checkInitialization = () => {
      const initialized = isFirebaseInitialized();
      if (!initialized) {
        setTestStatus('error');
        setErrorMessage('Firebase is not properly initialized. Check your configuration.');
        setTestResults({
          initialized: false,
          auth: false,
          firestore: false,
          collections: []
        });
      }
    };
    
    checkInitialization();
  }, []);

  const testFirebaseConnection = async () => {
    setTestStatus('testing');
    setErrorMessage(null);
    setTestResults(null);

    try {
      // Test 1: Check if Firebase is initialized
      const initialized = isFirebaseInitialized();
      if (!initialized) {
        throw new Error('Firebase is not properly initialized. Check your configuration in .env file.');
      }

      // Test 2: Try to authenticate anonymously
      let authSuccess = false;
      try {
        await signInAnonymously(auth);
        authSuccess = true;
      } catch (authError: any) {
        console.error('Auth test failed:', authError);
        // Continue with other tests even if auth fails
      }

      // Test 3: Try to access Firestore
      let firestoreSuccess = false;
      let collections: string[] = [];
      
      try {
        // Try to get a list of collections
        const usersQuery = query(collection(db, 'users'), limit(1));
        const usersSnapshot = await getDocs(usersQuery);
        firestoreSuccess = true;
        
        if (!usersSnapshot.empty) {
          collections.push('users');
        }
        
        const appointmentsQuery = query(collection(db, 'appointments'), limit(1));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        
        if (!appointmentsSnapshot.empty) {
          collections.push('appointments');
        }
        
        const documentsQuery = query(collection(db, 'documents'), limit(1));
        const documentsSnapshot = await getDocs(documentsQuery);
        
        if (!documentsSnapshot.empty) {
          collections.push('documents');
        }
        
        const prescriptionsQuery = query(collection(db, 'prescriptions'), limit(1));
        const prescriptionsSnapshot = await getDocs(prescriptionsQuery);
        
        if (!prescriptionsSnapshot.empty) {
          collections.push('prescriptions');
        }
      } catch (firestoreError: any) {
        console.error('Firestore test failed:', firestoreError);
        // If Firestore test fails, we'll report it but continue
      }

      // Set the test results
      setTestResults({
        initialized,
        auth: authSuccess,
        firestore: firestoreSuccess,
        collections
      });

      // If all tests passed, set status to success
      if (initialized && authSuccess && firestoreSuccess) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setErrorMessage('Some Firebase services are not available. See details below.');
      }
    } catch (error: any) {
      console.error('Firebase connection test failed:', error);
      setTestStatus('error');
      setErrorMessage(error.message || 'Unknown error occurred');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Firebase Connection Test</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          Test your connection to Firebase services to ensure the application can properly access authentication and database features.
        </p>
        
        <button
          onClick={testFirebaseConnection}
          disabled={testStatus === 'testing'}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 flex items-center"
        >
          {testStatus === 'testing' ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              Test Firebase Connection
            </>
          )}
        </button>
      </div>
      
      {testStatus === 'success' && (
        <div className="bg-green-100 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <span className="font-medium">Success!</span> Firebase connection is working properly.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {testStatus === 'error' && (
        <div className="bg-red-100 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">Error!</span> {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {testResults && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Test Results</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${testResults.initialized ? 'bg-green-100' : 'bg-red-100'}`}>
                  {testResults.initialized ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <span className="ml-2 font-medium">Initialization</span>
              </div>
              
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${testResults.auth ? 'bg-green-100' : 'bg-red-100'}`}>
                  {testResults.auth ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <span className="ml-2 font-medium">Authentication</span>
              </div>
              
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${testResults.firestore ? 'bg-green-100' : 'bg-red-100'}`}>
                  {testResults.firestore ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <span className="ml-2 font-medium">Firestore Database</span>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Available Collections:</h4>
              {testResults.collections.length > 0 ? (
                <ul className="list-disc list-inside">
                  {testResults.collections.map(collection => (
                    <li key={collection} className="text-gray-700">{collection}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No collections found or accessible.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 border-t pt-6">
        <h3 className="text-lg font-semibold mb-3">Troubleshooting</h3>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <span className="font-medium">Common Firebase Error:</span> If you see "auth/configuration-not-found" error, it means your Firebase project configuration is incorrect or the project doesn't exist.
              </p>
            </div>
          </div>
        </div>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Verify your Firebase configuration in the .env file</li>
          <li>Check if your Firebase project is active in the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Firebase Console</a></li>
          <li>Make sure Authentication is enabled in your Firebase project</li>
          <li>Ensure your Firebase security rules allow the necessary access</li>
          <li>Check browser console for detailed error messages</li>
          <li>Try refreshing the page and testing again</li>
        </ul>
      </div>
    </div>
  );
};

export default FirebaseConnectionTest;