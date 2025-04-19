import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, FileText, Download, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { databaseService } from '../../services/databaseService';

interface Patient {
  id: string;
  name: string;
  email: string;
  documents: {
    id: string;
    name: string;
    type: string;
    ipfsHash: string;
    createdAt: string;
    testDate?: string;
    uploadDate?: string;
  }[];
  prescriptions: {
    id: string;
    medications: any;
    createdAt: string;
    prescriptionDate?: string;
    status: string;
  }[];
}

const SearchPatients = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setMessage('Please enter a search term');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Search patients using database service
      const patientUsers = await databaseService.searchPatients(searchTerm);
      
      if (patientUsers.length === 0) {
        setMessage('No patients found');
        setPatients([]);
        setLoading(false);
        return;
      }
      
      // Format the results with documents and prescriptions
      const formattedPatients = await Promise.all(patientUsers.map(async (patient) => {
        // Get patient documents
        const patientDocuments = await databaseService.getPatientDocuments(patient.id);
        
        // Get patient prescriptions
        const patientPrescriptions = await databaseService.getPatientPrescriptions(patient.id);
        
        return {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          documents: patientDocuments,
          prescriptions: patientPrescriptions
        };
      }));
      
      setPatients(formattedPatients);
      
      if (formattedPatients.length === 0) {
        setMessage('No patients found');
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setError('Error searching patients. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc) => {
    try {
      if (!doc.ipfsHash) {
        alert('No document available');
        return;
      }
      
      // Get IPFS URL from database service
      const ipfsUrl = databaseService.getIpfsUrl(doc.ipfsHash);
      
      // For demo purposes, just show an alert with the URL
      window.open(ipfsUrl, "_blank");
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Search Patients</h2>

      <div className="mb-6">
        <div className="flex space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name..."
              className="pl-10 flex-1 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </button>
        </div>

        {message && (
          <p className={`mt-2 text-sm ${message.includes('Error') ? 'text-red-600' : 'text-gray-500'}`}>
            {message}
          </p>
        )}
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mt-4">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      )}

      {patients.length > 0 && !selectedPatient && !loading && (
        <div className="space-y-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedPatient(patient)}
            >
              <h3 className="font-medium">{patient.name}</h3>
              <p className="text-sm text-gray-500">{patient.email}</p>
            </div>
          ))}
        </div>
      )}

      {selectedPatient && (
        <div>
          <button
            onClick={() => setSelectedPatient(null)}
            className="mb-4 text-teal-600 hover:text-teal-700"
          >
            ← Back to search results
          </button>

          <div className="border-b pb-4 mb-4">
            <h3 className="text-xl font-semibold">{selectedPatient.name}</h3>
            <p className="text-gray-600">{selectedPatient.email}</p>
          </div>

          <div className="mb-8">
            <h4 className="font-medium mb-4">Documents</h4>
            {selectedPatient.documents.length === 0 ? (
              <p className="text-gray-500">No documents found</p>
            ) : (
              <div className="space-y-3">
                {selectedPatient.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-teal-600 mr-2 mt-1" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.type}</p>
                        {doc.testDate && (
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            Test date: {format(new Date(doc.testDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center text-teal-600 hover:text-teal-700"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-4">Prescriptions</h4>
            {selectedPatient.prescriptions.length === 0 ? (
              <p className="text-gray-500">No prescriptions found</p>
            ) : (
              <div className="space-y-3">
                {selectedPatient.prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {format(new Date(prescription.prescriptionDate || prescription.createdAt), 'PPP')}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          Status: {prescription.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Medications:</h5>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPatients;