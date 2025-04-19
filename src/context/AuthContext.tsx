import React, { createContext, useState, useContext, useEffect } from 'react';
import { dummyDataService, User as DummyUser } from '../lib/dummyData';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/databaseService';

interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  userType: 'patient' | 'doctor' | 'pharma';
  publicKey?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: string) => Promise<boolean>;
  register: (name: string, email: string, mobile: string, password: string, userType: string, publicKey?: string) => Promise<{success: boolean; message: string}>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is stored in localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, userType: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { email, userType });
      
      // Use database service for login
      const result = await databaseService.login(email, password, userType);
      
      if (result) {
        // Convert to our User type
        const userData: User = {
          id: result.id,
          name: result.name,
          email: result.email,
          mobile: result.mobile,
          userType: result.userType,
          publicKey: result.publicKey
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      
      console.error('Login failed: Invalid credentials or user type mismatch');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    name: string, 
    email: string, 
    mobile: string, 
    password: string, 
    userType: string,
    publicKey?: string
  ): Promise<{success: boolean; message: string}> => {
    try {
      console.log('Attempting registration with:', { name, email, userType, publicKey });
      
      // Check if email already exists
      try {
        const { data: emailExists, error: checkError } = await supabase.rpc(
          'check_email_exists',
          { email_to_check: email }
        );
        
        if (!checkError && emailExists) {
          return { 
            success: false, 
            message: 'Email already exists. Please use a different email or login instead.' 
          };
        }
      } catch (checkError) {
        console.error('Error checking email existence:', checkError);
        // Continue to registration attempt
      }
      
      // First try direct registration with Supabase Auth
      try {
        // Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              mobile,
              user_type: userType,
              password // Store password in metadata for reference
            }
          }
        });
        
        if (authError) {
          console.error('Supabase Auth registration error:', authError);
          if (authError.message.includes('already exists')) {
            return { 
              success: false, 
              message: 'Email already exists. Please use a different email or login instead.' 
            };
          }
          // Fall back to database service
        } else if (authData.user) {
          // Generate public key from the first 15 characters of the user ID
          const generatedPublicKey = authData.user.id.substring(0, 15);
          
          // Auth registration successful, now ensure profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          if (profileError || !profileData) {
            // Profile doesn't exist yet, create it
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                name,
                email,
                mobile,
                user_type: userType,
                password,
                public_key: generatedPublicKey
              });
              
            if (insertError) {
              console.error('Error creating profile after auth signup:', insertError);
              // Continue to try database service
            } else {
              // Successfully created profile
              const userData: User = {
                id: authData.user.id,
                name,
                email,
                mobile,
                userType: userType as 'patient' | 'doctor' | 'pharma',
                publicKey: generatedPublicKey
              };
              
              setUser(userData);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(userData));
              
              return { success: true, message: 'Registration successful!' };
            }
          } else {
            // Profile already exists
            const userData: User = {
              id: profileData.id,
              name: profileData.name,
              email: profileData.email,
              mobile: profileData.mobile,
              userType: profileData.user_type as 'patient' | 'doctor' | 'pharma',
              publicKey: profileData.public_key
            };
            
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(userData));
            
            return { success: true, message: 'Registration successful!' };
          }
        }
      } catch (authError: any) {
        console.error('Error during Supabase Auth registration:', authError);
        if (authError.message && authError.message.includes('already exists')) {
          return { 
            success: false, 
            message: 'Email already exists. Please use a different email or login instead.' 
          };
        }
        // Fall back to database service
      }
      
      // Fallback to database service registration
      try {
        const result = await databaseService.register({
          name,
          email,
          mobile,
          password,
          userType: userType as 'patient' | 'doctor' | 'pharma'
          // Don't pass publicKey, let the service generate it from the ID
        });
        
        if (result) {
          // Convert to our User type
          const userData: User = {
            id: result.id,
            name: result.name,
            email: result.email,
            mobile: result.mobile,
            userType: result.userType,
            publicKey: result.publicKey
          };
          
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userData));
          
          return { success: true, message: 'Registration successful!' };
        }
      } catch (error: any) {
        console.error('Database service registration error:', error);
        if (error.message && error.message.includes('already exists')) {
          return { 
            success: false, 
            message: 'Email already exists. Please use a different email or login instead.' 
          };
        }
        throw error;
      }
      
      return { 
        success: false, 
        message: 'Registration failed. Please try again.' 
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred during registration. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      // Try to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }
    
    // Always clear local state
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};