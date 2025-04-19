// Dummy data for the healthcare application
// This will be used instead of actual database calls

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  mobile: string;
  userType: 'patient' | 'doctor' | 'pharma';
  publicKey?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  type: string;
  ipfsHash: string;
  createdAt: string;
  testDate?: string;  // Date of the test or visit
  uploadDate?: string; // Date when document was uploaded
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medications: Medication[];
  photoHash?: string;
  status: 'pending' | 'dispensed';
  createdAt: string;
  prescriptionDate?: string; // Date when prescription was written
}

// Dummy users
export const users: User[] = [
  // Patient users
  {
    id: '1',
    name: 'John Patient',
    email: 'patient@example.com',
    password: 'patient123',
    mobile: '555-123-4567',
    userType: 'patient',
    publicKey: 'patient_public_key_123'
  },
  {
    id: '4',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    password: 'sarah123',
    mobile: '555-222-3333',
    userType: 'patient',
    publicKey: 'patient_public_key_456'
  },
  {
    id: '5',
    name: 'Michael Brown',
    email: 'michael@example.com',
    password: 'michael123',
    mobile: '555-444-5555',
    userType: 'patient',
    publicKey: 'patient_public_key_789'
  },
  
  // Doctor users
  {
    id: '2',
    name: 'Dr. Jane Smith',
    email: 'doctor@example.com',
    password: 'doctor123',
    mobile: '555-987-6543',
    userType: 'doctor',
    publicKey: 'doctor_public_key_456'
  },
  {
    id: '6',
    name: 'Dr. Robert Wilson',
    email: 'robert@example.com',
    password: 'robert123',
    mobile: '555-666-7777',
    userType: 'doctor',
    publicKey: 'doctor_public_key_abc'
  },
  {
    id: '7',
    name: 'Dr. Emily Davis',
    email: 'emily@example.com',
    password: 'emily123',
    mobile: '555-888-9999',
    userType: 'doctor',
    publicKey: 'doctor_public_key_def'
  },
  
  // Pharma users
  {
    id: '3',
    name: 'MedPlus Pharmacy',
    email: 'pharma@example.com',
    password: 'pharma123',
    mobile: '555-789-0123',
    userType: 'pharma',
    publicKey: 'pharma_public_key_789'
  },
  {
    id: '8',
    name: 'City Drugs',
    email: 'citydrugs@example.com',
    password: 'city123',
    mobile: '555-111-2222',
    userType: 'pharma',
    publicKey: 'pharma_public_key_ghi'
  },
  {
    id: '9',
    name: 'HealthRx Pharmacy',
    email: 'healthrx@example.com',
    password: 'health123',
    mobile: '555-333-4444',
    userType: 'pharma',
    publicKey: 'pharma_public_key_jkl'
  }
];

// Dummy appointments - shared global array
export const appointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    doctorId: '2',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    status: 'pending'
  },
  {
    id: '2',
    patientId: '1',
    doctorId: '2',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    status: 'confirmed'
  },
  {
    id: '3',
    patientId: '1',
    doctorId: '2',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'completed'
  },
  {
    id: '4',
    patientId: '4',
    doctorId: '6',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    status: 'pending'
  },
  {
    id: '5',
    patientId: '5',
    doctorId: '7',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    status: 'confirmed'
  },
  {
    id: '6',
    patientId: '4',
    doctorId: '7',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: 'completed'
  }
];

// Dummy documents
export const documents: Document[] = [
  {
    id: '1',
    userId: '1',
    name: 'Blood Test Results',
    type: 'medical_report',
    ipfsHash: 'ipfs_hash_123',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    testDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  {
    id: '2',
    userId: '1',
    name: 'X-Ray Report',
    type: 'medical_report',
    ipfsHash: 'ipfs_hash_456',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    testDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), // 22 days ago
    uploadDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
  },
  {
    id: '3',
    userId: '1',
    name: 'Vaccination Record',
    type: 'medical_report',
    ipfsHash: 'ipfs_hash_789',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    testDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    id: '4',
    userId: '4',
    name: 'MRI Scan',
    type: 'medical_report',
    ipfsHash: 'ipfs_hash_abc',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    testDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
    uploadDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
  },
  {
    id: '5',
    userId: '5',
    name: 'Allergy Test Results',
    type: 'medical_report',
    ipfsHash: 'ipfs_hash_def',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    testDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days ago
    uploadDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() // 25 days ago
  },
  {
    id: '6',
    userId: '4',
    name: 'Annual Physical Results',
    type: 'medical_report',
    ipfsHash: 'ipfs_hash_ghi',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
    testDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(), // 42 days ago
    uploadDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() // 40 days ago
  }
];

// Dummy prescriptions
export const prescriptions: Prescription[] = [
  {
    id: '1',
    patientId: '1',
    doctorId: '2',
    medications: [
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: '3 times daily',
        duration: '7 days'
      }
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    prescriptionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    id: '2',
    patientId: '1',
    doctorId: '2',
    medications: [
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'as needed',
        duration: 'for pain'
      }
    ],
    status: 'dispensed',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    prescriptionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
  },
  {
    id: '3',
    patientId: '1',
    doctorId: '2',
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'once daily',
        duration: '30 days'
      }
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    prescriptionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: '4',
    patientId: '4',
    doctorId: '6',
    medications: [
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily',
        duration: '90 days'
      }
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    prescriptionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: '5',
    patientId: '5',
    doctorId: '7',
    medications: [
      {
        name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'once daily',
        duration: '30 days'
      }
    ],
    status: 'dispensed',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    prescriptionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  {
    id: '6',
    patientId: '4',
    doctorId: '7',
    medications: [
      {
        name: 'Albuterol',
        dosage: '90mcg',
        frequency: 'as needed',
        duration: 'for breathing difficulty'
      }
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    prescriptionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  }
];

// Encrypt data for secure storage
const encryptData = (data: any, key: string): string => {
  return JSON.stringify(data); // Simplified for dummy data
};

// Decrypt data
const decryptData = (ciphertext: string, key: string): any => {
  return JSON.parse(ciphertext); // Simplified for dummy data
};

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Dummy data service functions
export const dummyDataService = {
  // Auth functions
  login: (email: string, password: string, userType: string) => {
    const user = users.find(u => 
      u.email === email && 
      u.password === password && 
      (userType ? u.userType === userType : true)
    );
    return user || null;
  },
  
  register: (userData: Omit<User, 'id'>) => {
    const newUser = {
      ...userData,
      id: generateId()
    };
    users.push(newUser);
    return newUser;
  },
  
  // Patient functions
  getPatientAppointments: (patientId: string) => {
    // Return a copy of the appointments to avoid direct mutation
    return appointments.filter(a => a.patientId === patientId);
  },
  
  getPatientDocuments: (patientId: string) => {
    return documents.filter(d => d.userId === patientId);
  },
  
  getPatientPrescriptions: (patientId: string) => {
    return prescriptions.filter(p => p.patientId === patientId);
  },
  
  createAppointment: (appointment: Omit<Appointment, 'id'>) => {
    // Create a new appointment with a unique ID
    const newAppointment = {
      ...appointment,
      id: generateId(),
      date: typeof appointment.date === 'string' ? appointment.date : appointment.date.toISOString()
    };
    
    // Add to the shared appointments array
    appointments.push(newAppointment);
    
    console.log('Appointment created:', newAppointment);
    console.log('Total appointments:', appointments.length);
    
    return newAppointment;
  },
  
  uploadDocument: (document: Omit<Document, 'id' | 'createdAt'>) => {
    const newDocument = {
      ...document,
      id: generateId(),
      createdAt: new Date().toISOString(),
      uploadDate: document.uploadDate || new Date().toISOString(),
      testDate: document.testDate || new Date().toISOString()
    };
    documents.push(newDocument);
    return newDocument;
  },
  
  deleteDocument: (documentId: string, userId: string, userType: string) => {
    // Only patients can delete their own documents
    if (userType !== 'patient') {
      throw new Error('Only patients can delete documents');
    }
    
    const index = documents.findIndex(d => d.id === documentId && d.userId === userId);
    if (index === -1) {
      throw new Error('Document not found or you do not have permission to delete it');
    }
    
    documents.splice(index, 1);
    return true;
  },
  
  // Doctor functions
  getDoctorAppointments: (doctorId: string) => {
    // Return a copy of the appointments to avoid direct mutation
    return appointments.filter(a => a.doctorId === doctorId);
  },
  
  updateAppointmentStatus: (appointmentId: string, status: 'confirmed' | 'rejected' | 'completed' | 'pending') => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      appointment.status = status;
      console.log(`Appointment ${appointmentId} status updated to ${status}`);
    } else {
      console.error(`Appointment ${appointmentId} not found`);
    }
    return appointment;
  },
  
  getPatients: () => {
    return users.filter(u => u.userType === 'patient');
  },
  
  searchPatients: (query: string) => {
    return users.filter(u => 
      u.userType === 'patient' && 
      (u.name.toLowerCase().includes(query.toLowerCase()) || 
       u.email.toLowerCase().includes(query.toLowerCase()))
    );
  },
  
  createPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt'>) => {
    const newPrescription = {
      ...prescription,
      id: generateId(),
      createdAt: new Date().toISOString(),
      prescriptionDate: prescription.prescriptionDate ? 
        (typeof prescription.prescriptionDate === 'string' ? 
          prescription.prescriptionDate : 
          prescription.prescriptionDate.toISOString()) : 
        new Date().toISOString()
    };
    prescriptions.push(newPrescription);
    return newPrescription;
  },
  
  // Pharma functions
  getPendingPrescriptions: () => {
    return prescriptions.filter(p => p.status === 'pending');
  },
  
  dispensePrescription: (prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (prescription) {
      prescription.status = 'dispensed';
    }
    return prescription;
  },

  // Secure data functions
  encryptData: (data: any) => {
    const key = 'healthvault_secure_key_2025';
    return encryptData(data, key);
  },

  decryptData: (ciphertext: string) => {
    const key = 'healthvault_secure_key_2025';
    return decryptData(ciphertext, key);
  },

  // Helper functions for IPFS simulation
  getIpfsUrl: (hash: string) => {
    return `https://example.com/ipfs/${hash}`;
  },
  
  getIpfsUrlFromEncrypted: (encryptedHash: string) => {
    return `https://example.com/ipfs/${encryptedHash.replace('encrypted_', '')}`;
  },
  
  uploadToPinata: (file: File, metadata: any = {}) => {
    // Simulate a successful upload
    const mockHash = `ipfs_${Math.random().toString(36).substring(2, 15)}`;
    const encryptedHash = `encrypted_${mockHash}`;
    
    return {
      success: true,
      ipfsHash: mockHash,
      encryptedHash,
      url: `https://example.com/ipfs/${mockHash}`
    };
  }
};