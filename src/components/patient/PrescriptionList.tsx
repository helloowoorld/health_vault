import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { FileText, Download } from 'lucide-react';
import { databaseService } from '../../services/databaseService';

interface PrescriptionWithDoctor {
  id: string;
  patientId: string;
  doctorId: string;
  medications: any[];
  photoHash?: string;
  status: 'pending' | 'dispensed';
  prescriptionDate?: string;
  createdAt: string;
  doctorName: string;
}

const PrescriptionList = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadPrescriptions();
    }
  }, [user]);

  const loadPrescriptions = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get prescriptions from database service
      const userPrescriptions = await databaseService.getPatientPrescriptions(user.id);
      setPrescriptions(userPrescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setError('Failed to load prescriptions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPhoto = (prescription: PrescriptionWithDoctor) => {
    try {
      if (!prescription.photoHash) {
        alert('No photo available for this prescription');
        return;
      }
      
      // Get IPFS URL from database service
      const ipfsUrl = databaseService.getIpfsUrl(prescription.photoHash);
      
      // For demo purposes, just show an alert with the URL
      alert(`In a real app, this would open the photo from: ${ipfsUrl}`);
    } catch (error) {
      console.error('Error viewing prescription photo:', error);
      alert('Error viewing prescription photo');
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">My Prescriptions</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">My Prescriptions</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {prescriptions.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No prescriptions found</p>
          <p className="text-sm text-gray-400 mt-1">Your prescriptions will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription: PrescriptionWithDoctor) => (
            <div
              key={prescription.id}
              className="p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-teal-600 mr-3" />
                  <div>
                    <h3 className="font-medium">
                      Prescription from {prescription.doctorName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(prescription.prescriptionDate || prescription.createdAt), 'PPP')}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  prescription.status === 'dispensed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                </span>
              </div>
              
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Medications:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {prescription.medications.map((med: any, index: number) => (
                    <li key={index}>
                      {med.name} - {med.dosage}
                      {med.frequency && `, ${med.frequency}`}
                      {med.duration && `, ${med.duration}`}
                    </li>
                  ))}
                </ul>
              </div>
              
              {prescription.photoHash && (
                <div className="mt-3">
                  <button
                    onClick={() => handleViewPhoto(prescription)}
                    className="flex items-center text-teal-600 hover:text-teal-700 text-sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    View Prescription Photo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrescriptionList;