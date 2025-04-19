import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  FileText, 
  User, 
  Upload, 
  Search, 
  Clock,
  Pill,
  Settings,
  ShoppingBag,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  userType: 'patient' | 'doctor' | 'pharma';
}

const Sidebar: React.FC<SidebarProps> = ({ userType }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = {
    patient: [
      { icon: Calendar, label: 'Book Appointment', path: '/patient' },
      { icon: FileText, label: 'My Documents', path: '/patient/documents' },
      { icon: User, label: 'Update Profile', path: '/patient/profile' },
      { icon: Upload, label: 'Upload Documents', path: '/patient/upload' },
      { icon: Pill, label: 'Prescriptions', path: '/patient/prescriptions' },
    ],
    doctor: [
      { icon: Clock, label: 'Appointments', path: '/doctor' },
      { icon: Search, label: 'Search Patients', path: '/doctor/search' },
      { icon: FileText, label: 'Prescriptions', path: '/doctor/prescriptions' },
      { icon: Settings, label: 'Settings', path: '/doctor/settings' },
    ],
    pharma: [
      { icon: ShoppingBag, label: 'Prescription Queue', path: '/pharma' },
      { icon: Settings, label: 'Settings', path: '/pharma/settings' },
    ],
  };

  const currentMenu = menuItems[userType];

  const handleMenuClick = (path: string) => {
    navigate(path);
    setMobileSidebarOpen(false);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <div className="fixed bottom-4 right-4 md:hidden z-30">
        <button
          onClick={toggleMobileSidebar}
          className="bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 focus:outline-none"
        >
          {mobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="bg-white h-screen w-64 border-r border-gray-200 fixed left-0 top-0 pt-16 hidden md:block">
        <div className="p-4">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700">{user?.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{userType}</p>
          </div>
          <nav>
            <ul className="space-y-2">
              {currentMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleMenuClick(item.path)}
                    className={`flex items-center w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 bg-gray-800 bg-opacity-75 z-20 transition-opacity duration-300 md:hidden ${
        mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className={`fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-700">{user?.name}</h2>
              <button
                onClick={toggleMobileSidebar}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-gray-500 capitalize">{userType}</p>
          </div>
          <div className="p-4">
            <nav>
              <ul className="space-y-2">
                {currentMenu.map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleMenuClick(item.path)}
                      className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === item.path
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5 mr-3" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;