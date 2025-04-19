import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dummyDataService } from '../lib/dummyData';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor' | 'pharma'>('patient');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.userType}`);
    }
  }, [isAuthenticated, user, navigate]);

  // Check if email already exists
  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!email || !email.trim()) return false;
    
    setCheckingEmail(true);
    try {
      // First check in dummy data
      const existingUser = dummyDataService.login(email, '', '');
      if (existingUser) {
        return true;
      }
      
      // Then check in Supabase
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .limit(1);
          
        if (error) {
          console.error('Error checking existing user:', error);
        }
        
        return data && data.length > 0;
      } catch (error) {
        console.error('Error checking existing user in Supabase:', error);
        return false;
      }
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email change with debounce
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear any existing errors when email changes
    if (error.includes('Email is already registered')) {
      setError('');
    }
    
    // Check email format
    if (newEmail && !isValidEmail(newEmail)) {
      setError('Please enter a valid email address');
      return;
    } else {
      setError('');
    }
  };

  // Handle email blur to check if it exists
  const handleEmailBlur = async () => {
    if (!email || !isValidEmail(email)) return;
    
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      setError('Email is already registered. Please use a different email or login instead.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Only check if fields are filled and passwords match
    if (!name || !email || !mobile || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setError('Email is already registered. Please use a different email or login instead.');
        setLoading(false);
        return;
      }
      
      console.log('Starting registration process...');
      
      // Generate a simple public key for demo purposes
      const publicKey = `${userType}_${Math.random().toString(36).substring(2, 10)}`;
      
      console.log('Generated public key:', publicKey);
      
      const result = await register(name, email, mobile, password, userType, publicKey);
      
      console.log('Registration result:', result);
      
      if (result.success) {
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          navigate(`/${userType}`);
        }, 1500);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration. Please try again.');
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
            <h2 className="text-2xl font-bold">Register for HealthVault</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="py-6 px-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="pl-10 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="name"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className={`pl-10 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    error.includes('Email') ? 'border-red-500' : ''
                  }`}
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mobile">
                Mobile
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="pl-10 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="mobile"
                  type="text"
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
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
                  minLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className={`pl-10 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    password !== confirmPassword && confirmPassword ? 'border-red-500' : ''
                  }`}
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {password !== confirmPassword && confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
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
                disabled={loading || checkingEmail}
              >
                {loading ? (
                  'Registering...'
                ) : checkingEmail ? (
                  'Checking email...'
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </>
                )}
              </button>
              <a className="inline-block align-baseline font-bold text-sm text-teal-600 hover:text-teal-800" href="/login">
                Already have an account?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;