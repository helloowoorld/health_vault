import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  UserCredential
} from 'firebase/auth';
import { db, auth, isFirebaseInitialized } from './firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

// User types
export type UserType = 'patient' | 'doctor' | 'pharma';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  userType: UserType;
  publicKey?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Appointment types
export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'completed';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: Timestamp;
  status: AppointmentStatus;
  createdAt: Timestamp;
}

// Document types
export interface Document {
  id: string;
  userId: string;
  name: string;
  type: string;
  ipfsHash: string;
  encryptedIpfsHash?: string;
  testDate: Timestamp;
  uploadDate: Timestamp;
  createdAt: Timestamp;
}

// Medication types
export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

// Prescription types
export type PrescriptionStatus = 'pending' | 'dispensed';

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medications: Medication[];
  photoHash?: string;
  encryptedPhotoHash?: string;
  status: PrescriptionStatus;
  prescriptionDate: Timestamp;
  createdAt: Timestamp;
}

// Authentication functions
export const registerUser = async (
  email: string, 
  password: string, 
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    if (!isFirebaseInitialized()) {
      console.error('Firebase is not properly initialized');
      return { 
        success: false, 
        message: 'Firebase is not properly initialized. Please check your configuration in the .env file.' 
      };
    }

    console.log("Starting user registration with Firebase...");
    
    // Create user in Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    console.log("User created in Firebase Auth with UID:", uid);
    
    // Generate a public key for the user if not provided
    const publicKey = userData.publicKey || 
      `${userData.userType}_${CryptoJS.SHA256(uid + Date.now()).toString().substring(0, 16)}`;
    
    // Create user document in Firestore
    const userDoc: User = {
      id: uid,
      name: userData.name,
      email: userData.email,
      mobile: userData.mobile,
      userType: userData.userType,
      publicKey,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    console.log("Setting user document in Firestore:", userDoc);
    
    // Set the user document with the auth UID as the document ID
    await setDoc(doc(db, 'users', uid), userDoc);
    
    console.log("User document successfully created in Firestore");
    
    return { 
      success: true, 
      message: 'User registered successfully', 
      user: userDoc 
    };
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    // Provide more specific error messages based on Firebase error codes
    let errorMessage = 'Failed to register user';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please use a different email or login instead.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use a stronger password.';
    } else if (error.code === 'auth/configuration-not-found') {
      errorMessage = 'Firebase configuration error. Please check your Firebase project settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      message: errorMessage
    };
  }
};

export const loginUser = async (
  email: string, 
  password: string
): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    if (!isFirebaseInitialized()) {
      console.error('Firebase is not properly initialized');
      return { 
        success: false, 
        message: 'Firebase is not properly initialized. Please check your configuration in the .env file.' 
      };
    }

    // Sign in with Firebase Auth
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Get user data from Firestore
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as User;
      return { 
        success: true, 
        message: 'Login successful', 
        user: userData 
      };
    } else {
      // User document doesn't exist in Firestore
      await signOut(auth); // Sign out the user from Auth
      return { 
        success: false, 
        message: 'User data not found' 
      };
    }
  } catch (error: any) {
    console.error('Error logging in:', error);
    
    // Provide more specific error messages based on Firebase error codes
    let errorMessage = 'Failed to login';
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed login attempts. Please try again later.';
    } else if (error.code === 'auth/configuration-not-found') {
      errorMessage = 'Firebase configuration error. Please check your Firebase project settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      message: errorMessage
    };
  }
};

export const logoutUser = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!isFirebaseInitialized()) {
      return { 
        success: true, 
        message: 'Logout successful (Firebase not initialized)' 
      };
    }

    await signOut(auth);
    return { 
      success: true, 
      message: 'Logout successful' 
    };
  } catch (error: any) {
    console.error('Error logging out:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to logout' 
    };
  }
};

// User functions
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    if (!isFirebaseInitialized() || !userId) {
      console.error('Firebase not initialized or invalid userId:', userId);
      return null;
    }

    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return userDocSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string, 
  userData: Partial<User>
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!isFirebaseInitialized()) {
      return {
        success: false,
        message: 'Firebase is not properly initialized. Please check your configuration in the .env file.'
      };
    }

    const userDocRef = doc(db, 'users', userId);
    
    // Don't allow updating certain fields
    const { id, userType, publicKey, createdAt, ...updatableFields } = userData;
    
    await updateDoc(userDocRef, {
      ...updatableFields,
      updatedAt: Timestamp.now()
    });
    
    return { 
      success: true, 
      message: 'Profile updated successfully' 
    };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to update profile' 
    };
  }
};

// Appointment functions
export const createAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'createdAt'>
): Promise<{ success: boolean; message: string; appointment?: Appointment }> => {
  try {
    if (!isFirebaseInitialized()) {
      return {
        success: false,
        message: 'Firebase is not properly initialized. Please check your configuration in the .env file.'
      };
    }

    // Convert date string to Timestamp if it's not already
    let appointmentDate = appointmentData.date;
    if (!(appointmentDate instanceof Timestamp)) {
      appointmentDate = Timestamp.fromDate(new Date(appointmentDate));
    }
    
    const appointmentDoc: Omit<Appointment, 'id'> = {
      ...appointmentData,
      date: appointmentDate,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'appointments'), appointmentDoc);
    
    // Get the created appointment with ID
    const appointment: Appointment = {
      id: docRef.id,
      ...appointmentDoc
    };
    
    return { 
      success: true, 
      message: 'Appointment created successfully', 
      appointment 
    };
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to create appointment' 
    };
  }
};

export const getAppointmentsByPatientId = async (patientId: string): Promise<Appointment[]> => {
  try {
    if (!isFirebaseInitialized() || !patientId) {
      console.error('Firebase not initialized or invalid patientId:', patientId);
      return [];
    }

    // Create a query to get appointments for this patient
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId)
    );
    
    // Execute the query
    const querySnapshot = await getDocs(appointmentsQuery);
    
    // Map the results to our Appointment type
    const appointments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        patientId: data.patientId,
        doctorId: data.doctorId,
        date: data.date,
        status: data.status,
        createdAt: data.createdAt
      } as Appointment;
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting patient appointments:', error);
    return [];
  }
};

export const getAppointmentsByDoctorId = async (doctorId: string): Promise<Appointment[]> => {
  try {
    if (!isFirebaseInitialized() || !doctorId) {
      console.error('Firebase not initialized or invalid doctorId:', doctorId);
      return [];
    }

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId)
    );
    
    const querySnapshot = await getDocs(appointmentsQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        patientId: data.patientId,
        doctorId: data.doctorId,
        date: data.date,
        status: data.status,
        createdAt: data.createdAt
      } as Appointment;
    });
  } catch (error) {
    console.error('Error getting doctor appointments:', error);
    return [];
  }
};

export const updateAppointmentStatus = async (
  appointmentId: string, 
  status: AppointmentStatus
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!isFirebaseInitialized()) {
      return {
        success: false,
        message: 'Firebase is not properly initialized. Please check your configuration in the .env file.'
      };
    }

    const appointmentDocRef = doc(db, 'appointments', appointmentId);
    
    await updateDoc(appointmentDocRef, {
      status,
      updatedAt: Timestamp.now()
    });
    
    return { 
      success: true, 
      message: `Appointment ${status} successfully` 
    };
  } catch (error: any) {
    console.error('Error updating appointment status:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to update appointment status' 
    };
  }
};

// Document functions
export const uploadDocument = async (
  documentData: Omit<Document, 'id' | 'createdAt'>
): Promise<{ success: boolean; message: string; document?: Document }> => {
  try {
    if (!isFirebaseInitialized()) {
      return {
        success: false,
        message: 'Firebase is not properly initialized. Please check your configuration in the .env file.'
      };
    }

    // Convert dates to Timestamps if they're not already
    let testDate = documentData.testDate;
    let uploadDate = documentData.uploadDate;
    
    if (!(testDate instanceof Timestamp)) {
      testDate = Timestamp.fromDate(new Date(testDate));
    }
    
    if (!(uploadDate instanceof Timestamp)) {
      uploadDate = Timestamp.fromDate(new Date(uploadDate));
    }
    
    const documentDoc: Omit<Document, 'id'> = {
      ...documentData,
      testDate,
      uploadDate,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'documents'), documentDoc);
    
    // Get the created document with ID
    const document: Document = {
      id: docRef.id,
      ...documentDoc
    };
    
    return { 
      success: true, 
      message: 'Document uploaded successfully', 
      document 
    };
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to upload document' 
    };
  }
};

export const getDocumentsByUserId = async (userId: string): Promise<Document[]> => {
  try {
    if (!isFirebaseInitialized() || !userId) {
      console.error('Firebase not initialized or invalid userId:', userId);
      return [];
    }

    const documentsQuery = query(
      collection(db, 'documents'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(documentsQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        type: data.type,
        ipfsHash: data.ipfsHash,
        encryptedIpfsHash: data.encryptedIpfsHash,
        testDate: data.testDate,
        uploadDate: data.uploadDate,
        createdAt: data.createdAt
      } as Document;
    });
  } catch (error) {
    console.error('Error getting user documents:', error);
    return [];
  }
};

export const deleteDocument = async (
  documentId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!isFirebaseInitialized()) {
      return {
        success: false,
        message: 'Firebase is not properly initialized. Please check your configuration in the .env file.'
      };
    }

    const documentDocRef = doc(db, 'documents', documentId);
    
    await deleteDoc(documentDocRef);
    
    return { 
      success: true, 
      message: 'Document deleted successfully' 
    };
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to delete document' 
    };
  }
};

// Prescription functions
export const createPrescription = async (
  prescriptionData: Omit<Prescription, 'id' | 'createdAt'>
): Promise<{ success: boolean; message: string; prescription?: Prescription }> => {
  try {
    if (!isFirebaseInitialized()) {
      return {
        success: false,
        message: 'Firebase is not properly initialized. Please check your configuration in the .env file.'
      };
    }

    // Convert date to Timestamp if it's not already
    let prescriptionDate = prescriptionData.prescriptionDate;
    
    if (!(prescriptionDate instanceof Timestamp)) {
      prescriptionDate = Timestamp.fromDate(new Date(prescriptionDate));
    }
    
    const prescriptionDoc: Omit<Prescription, 'id'> = {
      ...prescriptionData,
      prescriptionDate,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'prescriptions'), prescriptionDoc);
    
    // Get the created prescription with ID
    const prescription: Prescription = {
      id: docRef.id,
      ...prescriptionDoc
    };
    
    return { 
      success: true, 
      message: 'Prescription created successfully', 
      prescription 
    };
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to create prescription' 
    };
  }
};

export const getPrescriptionsByPatientId = async (patientId: string): Promise<Prescription[]> => {
  try {
    if (!isFirebaseInitialized() || !patientId) {
      console.error('Firebase not initialized or invalid patientId:', patientId);
      return [];
    }

    const prescriptionsQuery = query(
      collection(db, 'prescriptions'),
      where('patientId', '==', patientId)
    );
    
    const querySnapshot = await getDocs(prescriptionsQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        patientId: data.patientId,
        doctorId: data.doctorId,
        medications: data.medications || [],
        photoHash: data.photoHash,
        encryptedPhotoHash: data.encryptedPhotoHash,
        status: data.status || 'pending',
        prescriptionDate: data.prescriptionDate,
        createdAt: data.createdAt
      } as Prescription;
    });
  } catch (error) {
    console.error('Error getting patient prescriptions:', error);
    return [];
  }
};

export const getPrescriptionsByDoctorId = async (doctorId: string): Promise<Prescription[]> => {
  try {
    if (!isFirebaseInitialized() || !doctorId) {
      console.error('Firebase not initialized or invalid doctorId:', doctorId);
      return [];
    }

    const prescriptionsQuery = query(
      collection(db, 'prescriptions'),
      where('doctorId', '==', doctorId)
    );
    
    const querySnapshot = await getDocs(prescriptionsQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        patientId: data.patientId,
        doctorId: data.doctorId,
        medications: data.medications || [],
        photoHash: data.photoHash,
        encryptedPhotoHash: data.encryptedPhotoHash,
        status: data.status || 'pending',
        prescriptionDate: data.prescriptionDate,
        createdAt: data.createdAt
      } as Prescription;
    });
  } catch (error) {
    console.error('Error getting doctor prescriptions:', error);
    return [];
  }
};

export const getPendingPrescriptions = async (): Promise<Prescription[]> => {
  try {
    if (!isFirebaseInitialized()) {
      console.error('Firebase not initialized');
      return [];
    }

    const prescriptionsQuery = query(
      collection(db, 'prescriptions'),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(prescriptionsQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        patientId: data.patientId,
        doctorId: data.doctorId,
        medications: data.medications || [],
        photoHash: data.photoHash,
        encryptedPhotoHash: data.encryptedPhotoHash,
        status: data.status || 'pending',
        prescriptionDate: data.prescriptionDate,
        createdAt: data.createdAt
      } as Prescription;
    });
  } catch (error) {
    console.error('Error getting pending prescriptions:', error);
    return [];
  }
};

export const updatePrescriptionStatus = async (
  prescriptionId: string, 
  status: PrescriptionStatus
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!isFirebaseInitialized()) {
      return {
        success: false,
        message: 'Firebase is not properly initialized. Please check your configuration in the .env file.'
      };
    }

    const prescriptionDocRef = doc(db, 'prescriptions', prescriptionId);
    
    await updateDoc(prescriptionDocRef, {
      status,
      updatedAt: Timestamp.now()
    });
    
    return { 
      success: true, 
      message: `Prescription ${status} successfully` 
    };
  } catch (error: any) {
    console.error('Error updating prescription status:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to update prescription status' 
    };
  }
};

// Search functions
export const searchPatientsByName = async (name: string): Promise<User[]> => {
  try {
    if (!isFirebaseInitialized()) {
      console.error('Firebase not initialized');
      return [];
    }

    // In a real app, we would use a more sophisticated search
    // For now, we'll just get all patients and filter client-side
    const usersQuery = query(
      collection(db, 'users'),
      where('userType', '==', 'patient')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    const patients = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
    
    // Filter by name (case-insensitive)
    if (name && name.trim() !== '') {
      return patients.filter(patient => 
        patient.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    
    return patients;
  } catch (error) {
    console.error('Error searching patients:', error);
    return [];
  }
};

export const getDoctors = async (): Promise<User[]> => {
  try {
    if (!isFirebaseInitialized()) {
      console.error('Firebase not initialized');
      return [];
    }

    const usersQuery = query(
      collection(db, 'users'),
      where('userType', '==', 'doctor')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  } catch (error) {
    console.error('Error getting doctors:', error);
    return [];
  }
};

// Helper functions
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

export default {
  // Auth
  registerUser,
  loginUser,
  logoutUser,
  
  // Users
  getUserById,
  updateUserProfile,
  
  // Appointments
  createAppointment,
  getAppointmentsByPatientId,
  getAppointmentsByDoctorId,
  updateAppointmentStatus,
  
  // Documents
  uploadDocument,
  getDocumentsByUserId,
  deleteDocument,
  
  // Prescriptions
  createPrescription,
  getPrescriptionsByPatientId,
  getPrescriptionsByDoctorId,
  getPendingPrescriptions,
  updatePrescriptionStatus,
  
  // Search
  searchPatientsByName,
  getDoctors,
  
  // Helpers
  timestampToDate,
  dateToTimestamp,
  
  // Firebase initialization check
  isFirebaseInitialized
};