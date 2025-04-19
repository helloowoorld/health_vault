import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, Camera, FileText, Search, Calendar, CheckSquare, Upload } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { uploadToPinata } from '../../lib/pinata';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
}

const CreatePrescription = () => {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [medications, setMedications] = useState<Medication[]>([{
    name: '',
    dosage: '',
    frequency: '',
    duration: ''
  }]);
  const [prescriptionPhoto, setPrescriptionPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [reviewChecked, setReviewChecked] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const patientsList = await databaseService.searchPatients('');
      setPatients(patientsList.map(p => ({ 
        id: p.id, 
        name: p.name,
        email: p.email
      })));
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients. Please try again later.');
    }
  };

  const addMedication = () => {
    setMedications([...medications, {
      name: '',
      dosage: '',
      frequency: '',
      duration: ''
    }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setMedications(updatedMedications);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || medications.some(med => !med.name || !med.dosage) || !prescriptionDate) {
      setMessage('Please fill in all required fields');
      return;
    }

    if (!reviewChecked) {
      setMessage('Please review and confirm the prescription details before submitting');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      let photoHash = null;
      
      if (prescriptionPhoto) {
        setUploadingPhoto(true);
        // Upload photo to IPFS via Pinata
        const pinataResponse = await uploadToPinata(prescriptionPhoto, {
          type: 'prescription_photo',
          prescriptionDate,
          doctorId: user?.id,
          patientId: selectedPatient
        });

        if (!pinataResponse.success || !pinataResponse.ipfsHash) {
          throw new Error('Failed to upload prescription photo');
        }

        photoHash = pinataResponse.ipfsHash;
        setUploadingPhoto(false);
      }

      // Create prescription using database service
      const result = await databaseService.createPrescription({
        patientId: selectedPatient,
        doctorId: user?.id || '',
        medications,
        photoHash,
        status: 'pending',
        prescriptionDate
      });
      
      if (!result) {
        throw new Error('Failed to create prescription');
      }
      
      setMessage('Prescription created successfully!');
      setSelectedPatient('');
      setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
      setPrescriptionPhoto(null);
      setSearchTerm('');
      setPrescriptionDate('');
      setReviewChecked(false);
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      setError('Error creating prescription. Please try again.');
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
    const selectedPatientData = patients.find(p => p.id === patientId);
    if (selectedPatientData) {
      setSearchTerm(selectedPatientData.name);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Prescription</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
          <div className="relative">
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if (e.target.value === '') {
                      setSelectedPatient('');
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search patients by name or email"
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>
            
            {isDropdownOpen && searchTerm && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto border border-gray-200">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handlePatientSelect(patient.id)}
                    >
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-gray-500">{patient.email}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No patients found</div>
                )}
              </div>
            )}
          </div>
          {selectedPatient && (
            <div className="mt-2 text-sm text-teal-600">
              Patient selected: {patients.find(p => p.id === selectedPatient)?.name}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Prescription Date <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              value={prescriptionDate}
              onChange={(e) => setPrescriptionDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">Medications</label>
            <button
              type="button"
              onClick={addMedication}
              className="flex items-center text-sm text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Medication
            </button>
          </div>

          <div className="space-y-4">
            {medications.map((medication, index) => (
              <div key={index} className="relative border rounded-lg p-4">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      placeholder="Medication name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dosage</label>
                    <input
                      type="text"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      placeholder="e.g., 500mg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <input
                      type="text"
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      placeholder="e.g., Twice daily"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <input
                      type="text"
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      placeholder="e.g., 7 days"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Upload Prescription Photo (Optional)</label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              onChange={(e) => setPrescriptionPhoto(e.target.files?.[0] || null)}
              accept="image/*"
              className="hidden"
              id="prescription-photo"
            />
            <label
              htmlFor="prescription-photo"
              className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {uploadingPhoto ? (
                <>
                  <Upload className="h-5 w-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  {prescriptionPhoto ? 'Change Photo' : 'Upload Photo'}
                </>
              )}
            </label>
            {prescriptionPhoto && (
              <span className="ml-3 text-sm text-gray-500">
                {prescriptionPhoto.name}
              </span>
            )}
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-start">
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="review-checkbox"
                type="checkbox"
                checked={reviewChecked}
                onChange={(e) => setReviewChecked(e.target.checked)}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                required
              />
            </div>
            <div className="ml-3">
              <label htmlFor="review-checkbox" className="text-sm font-medium text-amber-800">
                <div className="flex items-center">
                   <CheckSquare className="h-4 w-4 mr-1" />
                  Review & Confirm
                </div>
              </label>
              <p className="text-sm text-amber-700 mt-1">
                I have reviewed all prescription details including patient information, medications, dosages, and dates, and confirm they are accurate.
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !reviewChecked}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            !reviewChecked 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
          }`}
        >
          {loading ? 'Creating...' : 'Create Prescription'}
        </button>
      </form>
    </div>
  );
};

export default CreatePrescription;