import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Zap, Shield, Database, Users, FileText, Lock, ArrowRight, Settings } from 'lucide-react';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their respective dashboards
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.userType}`);
    }
  }, [isAuthenticated, user, navigate]);

  const handleLaunchClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">HealthVault: Blockchain Healthcare System</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A secure and transparent healthcare management system powered by blockchain technology.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Capstone Project MSCS3999 | Developed by Sarvesh Sahasrabudhe, Rohit Deshpande, Soham Kukkar
          </p>
          
          {!isAuthenticated && (
            <div className="mt-6 flex justify-center space-x-4">
              <Link 
                to="/database-admin" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Settings className="mr-2 h-5 w-5" />
                Database Admin
              </Link>
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-700 rounded-xl shadow-xl overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-bold text-white mb-4">Revolutionizing Healthcare Data Management</h2>
                <p className="text-teal-100 mb-6">
                  HealthVault addresses the critical challenges of healthcare data fragmentation, security vulnerabilities, and limited patient control by leveraging blockchain technology to create a unified, secure, and patient-centered healthcare ecosystem.
                </p>
                <button 
                  onClick={handleLaunchClick}
                  className="bg-white text-teal-700 px-6 py-3 rounded-lg font-medium hover:bg-teal-50 transition duration-200 flex items-center"
                >
                  Launch Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
              <div className="md:w-1/2 bg-teal-800 p-8 md:p-12 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                  alt="Healthcare Technology" 
                  className="rounded-lg shadow-lg max-h-64 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Current System Issues */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12 mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Current Healthcare System Challenges</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Database className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Data Fragmentation</h3>
                  <p className="text-gray-600">
                    Patient records are scattered across multiple healthcare providers, making it difficult to access complete medical histories and leading to inefficient care coordination.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Security Vulnerabilities</h3>
                  <p className="text-gray-600">
                    Traditional healthcare systems are susceptible to data breaches and unauthorized access, compromising patient privacy and confidentiality.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Limited Patient Control</h3>
                  <p className="text-gray-600">
                    Patients have minimal control over who can access their medical data and how it's shared between healthcare providers and other stakeholders.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Prescription Fraud</h3>
                  <p className="text-gray-600">
                    Paper-based and traditional electronic prescription systems are vulnerable to fraud, forgery, and unauthorized modifications.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Solution */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Blockchain-Based Solution</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-teal-50 p-6 rounded-lg border border-teal-100">
                <div className="bg-teal-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Immutable Records</h3>
                <p className="text-gray-600">
                  Blockchain technology ensures that medical records cannot be altered or deleted once added to the system, creating a tamper-proof audit trail.
                </p>
              </div>
              
              <div className="bg-teal-50 p-6 rounded-lg border border-teal-100">
                <div className="bg-teal-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Enhanced Security</h3>
                <p className="text-gray-600">
                  Cryptographic techniques protect sensitive patient data, while decentralized storage reduces the risk of large-scale data breaches.
                </p>
              </div>
              
              <div className="bg-teal-50 p-6 rounded-lg border border-teal-100">
                <div className="bg-teal-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Patient Control</h3>
                <p className="text-gray-600">
                  Patients have granular control over who can access their medical records, with the ability to grant and revoke permissions as needed.
                </p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">For Patients</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Secure storage of medical records and documents</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Book appointments with healthcare providers</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>View and manage prescriptions</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Control access to personal health information</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">For Healthcare Providers</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Access to comprehensive patient medical histories</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Manage appointments and patient interactions</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Create and manage digital prescriptions</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Secure communication with patients and pharmacies</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">For Pharmacies</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Verify and process digital prescriptions</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Manage prescription queue and status updates</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Track medication dispensing history</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Secure communication with doctors and patients</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Technical Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Blockchain-based data integrity and immutability</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>End-to-end encryption for sensitive data</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Decentralized storage using IPFS</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                    <span>Smart contracts for automated access control</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-700 rounded-xl shadow-xl overflow-hidden mb-12 text-center p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience the Future of Healthcare?</h2>
            <p className="text-teal-100 mb-6 max-w-3xl mx-auto">
              Join HealthVault today and take control of your healthcare data with our secure, transparent, and patient-centered platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={handleLaunchClick}
                className="bg-white text-teal-700 px-8 py-3 rounded-lg font-medium hover:bg-teal-50 transition duration-200 flex items-center justify-center"
              >
                Launch Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              
              {!isAuthenticated && (
                <Link 
                  to="/database-admin" 
                  className="bg-teal-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-900 transition duration-200 flex items-center justify-center"
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Database Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 HealthVault. All rights reserved.</p>
          <p className="text-gray-400 text-sm mt-2">
            Capstone Project MSCS3999 | Developed by Sarvesh Sahasrabudhe, Rohit Deshpande, Soham Kukkar
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;