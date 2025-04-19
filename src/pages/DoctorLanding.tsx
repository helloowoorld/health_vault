import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AppointmentList from '../components/doctor/AppointmentList';
import SearchPatients from '../components/doctor/SearchPatients';
import CreatePrescription from '../components/doctor/CreatePrescription';
import { useLocation } from 'react-router-dom';
import EditProfile from '../components/EditProfile';

interface DoctorLandingProps {
  activeTab?: string;
}

const DoctorLanding: React.FC<DoctorLandingProps> = ({ activeTab: initialActiveTab }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'appointments');
  const location = useLocation();

  useEffect(() => {
    // Update active tab based on URL path
    const path = location.pathname;
    if (path.includes('/doctor/search')) {
      setActiveTab('search');
    } else if (path.includes('/doctor/prescriptions')) {
      setActiveTab('prescriptions');
    } else if (path.includes('/doctor/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab('appointments');
    }
  }, [location.pathname, initialActiveTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return <SearchPatients />;
      case 'prescriptions':
        return <CreatePrescription />;
      case 'settings':
        return <EditProfile />;
      default:
        return <AppointmentList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar userType="doctor" />
      
      <div className="md:pl-64 pt-16">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center mb-4">
              <div className="bg-teal-100 p-3 rounded-full mr-4 mb-4 md:mb-0 self-center md:self-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Welcome to HealthVault, Dr. {user?.name}</h1>
                <p className="text-gray-600">Doctor Dashboard</p>
              </div>
            </div>
          </div>

          <div className="mb-6 overflow-x-auto">
            <nav className="flex space-x-2 md:space-x-4 min-w-max">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'appointments'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'search'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Search Patients
              </button>
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'prescriptions'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Create Prescription
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'settings'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
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

export default DoctorLanding;