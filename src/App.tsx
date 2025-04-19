import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientLanding from './pages/PatientLanding';
import DoctorLanding from './pages/DoctorLanding';
import PharmaLanding from './pages/PharmaLanding';
import Home from './pages/Home';
import DatabaseAdmin from './pages/DatabaseAdmin';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/database-admin" element={<DatabaseAdmin />} />
          
          {/* Patient Routes */}
          <Route 
            path="/patient" 
            element={
              <ProtectedRoute userType="patient">
                <PatientLanding />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/documents" 
            element={
              <ProtectedRoute userType="patient">
                <PatientLanding activeTab="documents" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/profile" 
            element={
              <ProtectedRoute userType="patient">
                <PatientLanding activeTab="profile" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/upload" 
            element={
              <ProtectedRoute userType="patient">
                <PatientLanding activeTab="upload" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/prescriptions" 
            element={
              <ProtectedRoute userType="patient">
                <PatientLanding activeTab="prescriptions" />
              </ProtectedRoute>
            } 
          />
          
          {/* Doctor Routes */}
          <Route 
            path="/doctor" 
            element={
              <ProtectedRoute userType="doctor">
                <DoctorLanding />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor/search" 
            element={
              <ProtectedRoute userType="doctor">
                <DoctorLanding activeTab="search" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor/prescriptions" 
            element={
              <ProtectedRoute userType="doctor">
                <DoctorLanding activeTab="prescriptions" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor/settings" 
            element={
              <ProtectedRoute userType="doctor">
                <DoctorLanding activeTab="settings" />
              </ProtectedRoute>
            } 
          />
          
          {/* Pharma Routes */}
          <Route 
            path="/pharma" 
            element={
              <ProtectedRoute userType="pharma">
                <PharmaLanding />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pharma/settings" 
            element={
              <ProtectedRoute userType="pharma">
                <PharmaLanding activeTab="settings" />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;