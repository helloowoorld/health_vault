import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import FirebaseConnectionTest from '../components/FirebaseConnectionTest';
import SupabaseConnectionTest from '../components/SupabaseConnectionTest';
import FixDatabaseConnection from '../components/FixDatabaseConnection';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor' | 'pharma'>('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const [showSupabaseTest, setShowSupabaseTest] = useState(false);
  const [showFixDatabase, setShowFixDatabase] = useState(false);
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.userType}`);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting login with:', { email, userType });
      const success = await login(email, password, userType);
      
      if (success) {
        navigate(`/${userType}`);
      } else {
        setError('Invalid credentials or user type does not match. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-teal-600 text-white py-4 px-6">
            <h2 className="text-2xl font-bold">Login to HealthVault</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="py-6 px-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="pl-10 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="pl-10 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                User Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="userType"
                    value="patient"
                    checked={userType === 'patient'}
                    onChange={() => setUserType('patient')}
                  />
                  <span className="ml-2">Patient</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="userType"
                    value="doctor"
                    checked={userType === 'doctor'}
                    onChange={() => setUserType('doctor')}
                  />
                  <span className="ml-2">Doctor</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="userType"
                    value="pharma"
                    checked={userType === 'pharma'}
                    onChange={() => setUserType('pharma')}
                  />
                  <span className="ml-2">Pharma</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </button>
              <a className="inline-block align-baseline font-bold text-sm text-teal-600 hover:text-teal-800" href="/register">
                Register
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Demo Accounts:</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="font-semibold">Patient</p>
                  <p>patient@example.com</p>
                  <p>patient123</p>
                </div>
                <div>
                  <p className="font-semibold">Doctor</p>
                  <p>doctor@example.com</p>
                  <p>doctor123</p>
                </div>
                <div>
                  <p className="font-semibold">Pharmacy</p>
                  <p>pharma@example.com</p>
                  <p>pharma123</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setShowConnectionTest(!showConnectionTest)}
                  className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                >
                  {showConnectionTest ? 'Hide Firebase Connection Test' : 'Test Firebase Connection'}
                </button>
                
                {showConnectionTest && (
                  <div className="mt-4">
                    <FirebaseConnectionTest />
                  </div>
                )}
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={() => setShowSupabaseTest(!showSupabaseTest)}
                  className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                >
                  {showSupabaseTest ? 'Hide Supabase Connection Test' : 'Test Supabase Connection'}
                </button>
                
                {showSupabaseTest && (
                  <div className="mt-4">
                    <SupabaseConnectionTest />
                  </div>
                )}
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={() => setShowFixDatabase(!showFixDatabase)}
                  className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                >
                  {showFixDatabase ? 'Hide Database Fix' : 'Fix Database Connection'}
                </button>
                
                {showFixDatabase && (
                  <div className="mt-4">
                    <FixDatabaseConnection />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;