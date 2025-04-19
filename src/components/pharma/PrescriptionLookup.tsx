import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Calendar, User, UserCheck, Filter, Clock, X, AlertTriangle, CheckCircle, Pill } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  patientEmail: string;
  medications: Medication[];
  photoHash?: string;
  status: 'pending' | 'dispensed';
  prescriptionDate?: string;
  createdAt: string;
}

interface PrescriptionSearchParams {
  patientName: string;
  doctorName: string;
  visitDate: string;
}

interface PrescriptionLookupProps {
  onAddToQueue: (prescription: any) => void;
}

const PrescriptionLookup: React.FC<PrescriptionLookupProps> = ({ onAddToQueue }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState<PrescriptionSearchParams>({
    patientName: '',
    doctorName: '',
    visitDate: ''
  });
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [publicKeyInput, setPublicKeyInput] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [publicKeyError, setPublicKeyError] = useState('');
  const [publicKeySuccess, setPublicKeySuccess] = useState('');
  const [doctors, setDoctors] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    loadAllPrescriptions();
    loadDoctors();
  }, []);

  useEffect(() => {
    if (allPrescriptions.length > 0) {
      filterPrescriptions();
    }
  }, [searchParams, allPrescriptions]);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'No date available';
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'PPP') : 'Invalid date';
  };

  const loadAllPrescriptions = async () => {
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.rpc('get_all_pending_prescriptions');
      console.log('✅ Loaded prescriptions:', data);

      if (error) {
        console.error('Error loading prescriptions:', error);
        throw new Error('Failed to load prescriptions');
      }
      
      if (data) {
        // Ensure all required fields are present
        const formattedData = data.map((prescription: any) => ({
          ...prescription,
          patientName: prescription.patientname || 'Unknown Patient',
          doctorName: prescription.doctorname || 'Unknown Doctor',
          prescriptionDate: prescription.prescriptiondate || prescription.createdAt
        }));
        
        setAllPrescriptions(formattedData);
        setFilteredPrescriptions(formattedData);
      } else {
        setAllPrescriptions([]);
        setFilteredPrescriptions([]);
      }
    } catch (err: any) {
      console.error('Error loading prescriptions:', err);
      setError(err.message || 'Failed to load prescriptions');
      setAllPrescriptions([]);
      setFilteredPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('user_type', 'doctor');
        
      if (error) {
        console.error('Error loading doctors:', error);
      } else if (data) {
        setDoctors(data);
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const filterPrescriptions = () => {
    if (!allPrescriptions || allPrescriptions.length === 0) {
      setFilteredPrescriptions([]);
      return;
    }
    
    let filtered = [...allPrescriptions];
    
    // Filter by patient name
    if (searchParams.patientName && searchParams.patientName.trim() !== '') {
      filtered = filtered.filter(prescription => 
        prescription.patientName && 
        prescription.patientName.toLowerCase().includes(searchParams.patientName.toLowerCase())
      );
    }
    
    // Filter by doctor name
    if (searchParams.doctorName && searchParams.doctorName.trim() !== '') {
      filtered = filtered.filter(prescription => 
        prescription.doctorName && 
        prescription.doctorName.toLowerCase().includes(searchParams.doctorName.toLowerCase())
      );
    }
    
    // Filter by visit date
    if (searchParams.visitDate && searchParams.visitDate.trim() !== '') {
      const searchDate = new Date(searchParams.visitDate).toDateString();
      filtered = filtered.filter(prescription => {
        const date = new Date(prescription.prescriptionDate || prescription.createdAt);
        return isValid(date) ? date.toDateString() === searchDate : false;
      });
    }
    
    setFilteredPrescriptions(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setSearchParams({
      patientName: '',
      doctorName: '',
      visitDate: ''
    });
  };

  const handleAddToQueueClick = async (prescription: Prescription) => {
    if (!user?.id) {
      setError('Pharma user not logged in.');
      return;
    }
  
    await supabase
      .from('prescriptions')
      .update({ status: 'in_process' })
      .eq('id', prescription.id);
  
    onAddToQueue({
      ...prescription,
      pharmaId: user.id,
      queueStatus: 'In Process',
      addedToQueueAt: new Date().toISOString(),
      completedAt: null,
      medicationPrices: prescription.medications.map(med => ({
        ...med,
        price: 0
      })),
      totalPrice: 0
    });
  
    setFilteredPrescriptions(prev =>
      prev.filter(p => p.id !== prescription.id)
    );
  
    setAllPrescriptions(prev =>
      prev.filter(p => p.id !== prescription.id)
    );
  
    setMessage('Prescription added to your queue');
  };
  

  const handlePublicKeySubmit = async () => {
    if (!selectedPrescription) return;
    
    setPublicKeyError('');
    setPublicKeySuccess('');
    
    if (!publicKeyInput.trim()) {
      setPublicKeyError('Please enter the patient\'s public key');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('public_key')
        .eq('id', selectedPrescription.patientId)
        .single();
        
      if (error) {
        console.error('Error verifying public key:', error);
        setPublicKeyError('Error verifying public key');
        return;
      }
      
      if (data.public_key !== publicKeyInput) {
        setPublicKeyError('Invalid public key. Please try again.');
        return;
      }
      
      setPublicKeySuccess('Public key verified successfully!');
      
      onAddToQueue({
        ...selectedPrescription,
        pharmaId: user?.id,
        queueStatus: 'In Process',
        addedToQueueAt: new Date().toISOString(),
        completedAt: null,
        medicationPrices: selectedPrescription.medications.map(med => ({
          ...med,
          price: 0
        })),
        totalPrice: 0
      });
      
      setFilteredPrescriptions(prev => 
        prev.filter(p => p.id !== selectedPrescription.id)
      );
      
      setAllPrescriptions(prev => 
        prev.filter(p => p.id !== selectedPrescription.id)
      );
      
      setTimeout(() => {
        setSelectedPrescription(null);
        setMessage('Prescription added to your queue');
      }, 1500);
    } catch (error: any) {
      console.error('Error verifying public key:', error);
      setPublicKeyError('Error verifying public key: ' + error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-bold mb-4">Prescription Lookup</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="patientName"
              value={searchParams.patientName}
              onChange={handleInputChange}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              placeholder="Search patient name..."
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Filter className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor
                </label>
                <select
                  name="doctorName"
                  value={searchParams.doctorName}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                >
                  <option value="">All Doctors</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.name}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prescription Date
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="visitDate"
                    value={searchParams.visitDate}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {message && (
        <div className="p-4 rounded mb-4 bg-green-100 text-green-700">
          {message}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : (
        <>
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No pending prescriptions found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-lg mb-3">
                Pending Prescriptions ({filteredPrescriptions.length})
              </h3>
              <div className="space-y-4">
                {filteredPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:justify-between">
                      <div>
                        <h4 className="font-medium">{prescription.patientName}</h4>
                        <p className="text-sm text-gray-500">
                          <span className="inline-flex items-center">
                            <UserCheck className="h-4 w-4 mr-1" />
                            Dr. {prescription.doctorName}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          <span className="inline-flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(prescription.prescriptionDate || prescription.createdAt)}
                          </span>
                        </p>
                        <div className="mt-2">
                          <h5 className="text-sm font-medium">Medications:</h5>
                          <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                            {prescription.medications.map((med, idx) => (
                              <li key={idx}>
                                {med.name} - {med.dosage}
                                {med.frequency && `, ${med.frequency}`}
                                {med.duration && `, ${med.duration}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <button
                          onClick={() => handleAddToQueueClick(prescription)}
                          className="px-3 py-1 bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200"
                        >
                          Add to Queue
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
    </div>
  );
};

export default PrescriptionLookup;