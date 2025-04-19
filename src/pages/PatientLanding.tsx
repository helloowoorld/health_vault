import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UpdateProfile from '../components/patient/UpdateProfile';
import UploadDocument from '../components/patient/UploadDocument';
import DocumentList from '../components/patient/DocumentList';
import BookAppointment from '../components/patient/BookAppointment';
import PrescriptionList from '../components/patient/PrescriptionList';
import UpcomingAppointments from '../components/patient/UpcomingAppointments';
import { useLocation } from 'react-router-dom';
import EditProfile from '../components/EditProfile';

interface PatientLandingProps {
  activeTab?: string;
}

const PatientLanding: React.FC<PatientLandingProps> = ({ activeTab: initialActiveTab }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'appointments');
  const location = useLocation();

  useEffect(() => {
    // Update active tab based on URL path
    const path = location.pathname;
    if (path.includes('/patient/documents')) {
      setActiveTab('documents');
    } else if (path.includes('/patient/profile')) {
      setActiveTab('profile');
    } else if (path.includes('/patient/upload')) {
      setActiveTab('upload');
    } else if (path.includes('/patient/prescriptions')) {
      setActiveTab('prescriptions');
    } else {
      setActiveTab('appointments');
    }
  }, [location.pathname, initialActiveTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <EditProfile />;
      case 'upload':
        return <UploadDocument />;
      case 'documents':
        return <DocumentList />;
      case 'appointments':
        return (
          <div className="space-y-6">
            <UpcomingAppointments />
            <BookAppointment />
          </div>
        );
      case 'prescriptions':
        return <PrescriptionList />;
      default:
        return (
          <div className="space-y-6">
            <UpcomingAppointments />
            <BookAppointment />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar userType="patient" />
      
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
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Welcome to HealthVault, {user?.name}</h1>
                <p className="text-gray-600">Patient Dashboard</p>
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
                Book Appointment
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'documents'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                My Documents
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'profile'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'upload'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`px-3 py-2 text-sm md:px-4 md:py-2 rounded-lg ${
                  activeTab === 'prescriptions'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Prescriptions
              </button>
            </nav>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PatientLanding;