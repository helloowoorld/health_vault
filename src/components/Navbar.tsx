import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LogIn, UserPlus, LogOut, User, Zap, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Don't show the navbar on the home page if not authenticated
  if (location.pathname === '/' && !isAuthenticated) {
    return (
      <nav className="bg-teal-600 text-white shadow-md fixed w-full z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Link to="/" className="text-xl font-bold flex items-center">
                <Zap className="h-6 w-6 mr-2" />
                HealthVault
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="flex items-center hover:text-teal-200">
                <LogIn size={18} className="mr-1" />
                Login
              </Link>
              <Link to="/register" className="flex items-center hover:text-teal-200">
                <UserPlus size={18} className="mr-1" />
                Register
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="text-white focus:outline-none"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 py-3 border-t border-teal-500">
              <Link 
                to="/login" 
                className="block py-2 px-4 text-white hover:bg-teal-700 rounded"
                onClick={closeMobileMenu}
              >
                <div className="flex items-center">
                  <LogIn size={18} className="mr-2" />
                  Login
                </div>
              </Link>
              <Link 
                to="/register" 
                className="block py-2 px-4 text-white hover:bg-teal-700 rounded"
                onClick={closeMobileMenu}
              >
                <div className="flex items-center">
                  <UserPlus size={18} className="mr-2" />
                  Register
                </div>
              </Link>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-teal-600 text-white shadow-md fixed w-full z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-xl font-bold flex items-center">
              <Zap className="h-6 w-6 mr-2" />
              HealthVault
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="flex items-center hover:text-teal-200">
              <Home size={18} className="mr-1" />
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="flex items-center hover:text-teal-200">
                  <User size={18} className="mr-1" />
                  {user?.name}
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center hover:text-teal-200"
                >
                  <LogOut size={18} className="mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center hover:text-teal-200">
                  <LogIn size={18} className="mr-1" />
                  Login
                </Link>
                <Link to="/register" className="flex items-center hover:text-teal-200">
                  <UserPlus size={18} className="mr-1" />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 py-3 border-t border-teal-500">
            <Link 
              to="/" 
              className="block py-2 px-4 text-white hover:bg-teal-700 rounded"
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <Home size={18} className="mr-2" />
                Home
              </div>
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="block py-2 px-4 text-white">
                  <div className="flex items-center">
                    <User size={18} className="mr-2" />
                    {user?.name}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="block w-full text-left py-2 px-4 text-white hover:bg-teal-700 rounded"
                >
                  <div className="flex items-center">
                    <LogOut size={18} className="mr-2" />
                    Logout
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-2 px-4 text-white hover:bg-teal-700 rounded"
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <LogIn size={18} className="mr-2" />
                    Login
                  </div>
                </Link>
                <Link 
                  to="/register" 
                  className="block py-2 px-4 text-white hover:bg-teal-700 rounded"
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <UserPlus size={18} className="mr-2" />
                    Register
                  </div>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;