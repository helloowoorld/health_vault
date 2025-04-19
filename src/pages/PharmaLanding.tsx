import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { User, FileText, Settings, Pill, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useLocation } from 'react-router-dom';
import EditProfile from '../components/EditProfile';
import PrescriptionLookup from '../components/pharma/PrescriptionLookup';
import PrescriptionQueue from '../components/pharma/PrescriptionQueue';

interface PharmaLandingProps {
  activeTab?: string;
}

const PharmaLanding: React.FC<PharmaLandingProps> = ({ activeTab: initialActiveTab }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'prescriptions');
  const location = useLocation();
  const [prescriptionQueue, setPrescriptionQueue] = useState([]);

  useEffect(() => {
    // Update active tab based on URL path
    const path = location.pathname;
    if (path.includes('/pharma/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab('prescriptions');
    }
  }, [location.pathname, initialActiveTab]);

  // Load queue from localStorage on component mount
  useEffect(() => {
    if (user) {
      const savedQueue = localStorage.getItem(`pharma_queue_${user.id}`);
      if (savedQueue) {
        try {
          setPrescriptionQueue(JSON.parse(savedQueue));
        } catch (error) {
          console.error('Error parsing saved queue:', error);
          // If there's an error parsing, start with an empty queue
          setPrescriptionQueue([]);
        }
      }
    }
  }, [user]);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (user && prescriptionQueue.length > 0) {
      localStorage.setItem(`pharma_queue_${user.id}`, JSON.stringify(prescriptionQueue));
    }
  }, [prescriptionQueue, user]);

  const handleAddToQueue = (prescription) => {
    // Check if prescription is already in queue
    const exists = prescriptionQueue.some(p => p.id === prescription.id);
    if (exists) return;
    
    setPrescriptionQueue(prev => [...prev, prescription]);
  };

  const handleUpdatePrescription = (updatedPrescription) => {
    setPrescriptionQueue(prev => 
      prev.map(p => p.id === updatedPrescription.id ? updatedPrescription : p)
    );
  };

  const handleRemoveFromQueue = (prescriptionId) => {
    setPrescriptionQueue(prev => prev.filter(p => p.id !== prescriptionId));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return <EditProfile />;
      default:
        return (
          <>
            <PrescriptionLookup onAddToQueue={handleAddToQueue} />
            <PrescriptionQueue 
              queue={prescriptionQueue} 
              onUpdatePrescription={handleUpdatePrescription}
              onRemoveFromQueue={handleRemoveFromQueue}
            />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar userType="pharma" />
      
      <div className="md:pl-64 pt-16">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center mb-4">
              <div className="bg-teal-100 p-3 rounded-full mr-4 mb-4 md:mb-0 self-center md:self-auto">
                <User className="h-8 w-8 text-teal-600" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Welcome to HealthVault, {user?.name}</h1>
                <p className="text-gray-600">Pharmacy Dashboard</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">Public Key</h3>
                <p className="text-blue-700 text-sm break-all">{user?.publicKey || 'Not set'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="font-semibold text-green-800 mb-2">Email</h3>
                <p className="text-green-700">{user?.email}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="font-semibold text-purple-800 mb-2">Queue Status</h3>
                <p className="text-purple-700">
                  {prescriptionQueue.length} prescription{prescriptionQueue.length !== 1 ? 's' : ''} in queue
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <nav className="flex space-x-2 md:space-x-4">
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`flex items-center px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'prescriptions'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Pill className="h-5 w-5 mr-2" />
                <span className="hidden md:inline">Prescriptions</span>
                <span className="inline md:hidden">Queue</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'settings'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </button>
            </nav>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PharmaLanding;