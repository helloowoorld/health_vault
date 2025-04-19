import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// User types
export type UserType = 'patient' | 'doctor' | 'pharma';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  userType: UserType;
  publicKey?: string;
  password?: string;
}

// Appointment types
export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'completed';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: AppointmentStatus;
  createdAt: string;
}

// Document types
export interface Document {
  id: string;
  userId: string;
  name: string;
  type: string;
  ipfsHash: string;
  testDate?: string;
  uploadDate?: string;
  createdAt: string;
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
  status: PrescriptionStatus;
  prescriptionDate?: string;
  createdAt: string;
}

// Database service functions
export const databaseService = {
  // Auth functions
  async login(email: string, password: string, userType?: string): Promise<User | null> {
    try {
      // Query the profiles table
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('password', password);
        
      // Add userType filter if provided
      if (userType) {
        query.eq('user_type', userType);
      }
      
      const { data, error } = await query.single();
      
      if (error || !data) {
        console.error('Login error:', error);
        return null;
      }
      
      // Convert to User type
      return {
        id: data.id,
        name: data.name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        userType: data.user_type as UserType,
        publicKey: data.public_key,
        password: data.password
      };
    } catch (error) {
      console.error('Error in login:', error);
      return null;
    }
  },
  
  async register(userData: Omit<User, 'id'>): Promise<User | null> {
    try {
      // Check if email already exists
      try {
        const { data: emailExists, error: checkError } = await supabase.rpc(
          'check_email_exists',
          { email_to_check: userData.email }
        );
        
        if (checkError) {
          console.error('Error checking email:', checkError);
        } else if (emailExists) {
          throw new Error('Email already exists');
        }
      } catch (checkError) {
        console.error('Error checking email existence:', checkError);
        // Continue to registration attempt
      }
      
      // First try to use the register_user function
      try {
        const { data: functionData, error: functionError } = await supabase.rpc(
          'register_user',
          {
            user_email: userData.email,
            user_name: userData.name,
            user_mobile: userData.mobile,
            user_password: userData.password,
            user_type: userData.userType
          }
        );
        
        if (functionError) {
          console.error('Error calling register_user function:', functionError);
          if (functionError.message.includes('Email already exists')) {
            throw new Error('Email already exists');
          }
          // Continue to fallback method
        } else if (functionData) {
          // Generate public key from the first 15 characters of the user ID
          const generatedPublicKey = functionData.substring(0, 15);
          
          // Update the profile with the public key
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ public_key: generatedPublicKey })
            .eq('id', functionData);
            
          if (updateError) {
            console.error('Error updating public key:', updateError);
          }
          
          // Function worked, return the user
          return {
            id: functionData,
            name: userData.name,
            email: userData.email,
            mobile: userData.mobile,
            userType: userData.userType,
            publicKey: generatedPublicKey,
            password: userData.password
          };
        }
      } catch (functionCallError: any) {
        console.error('Error calling register_user function:', functionCallError);
        if (functionCallError.message.includes('Email already exists')) {
          throw new Error('Email already exists');
        }
        // Continue to fallback method
      }
      
      // Fallback: Direct insert
      // Generate a new ID
      const id = uuidv4();
      
      // Generate public key from the first 15 characters of the ID
      const generatedPublicKey = id.substring(0, 15);
      
      // Insert the new user
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id,
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile,
          user_type: userData.userType,
          password: userData.password,
          public_key: generatedPublicKey
        })
        .select()
        .single();
        
      if (error) {
        console.error('Registration error:', error);
        throw error;
      }
      
      // Convert to User type
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        userType: data.user_type as UserType,
        publicKey: data.public_key,
        password: data.password
      };
    } catch (error: any) {
      console.error('Error in register:', error);
      throw error;
    }
  },
  
  // Patient functions
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    try {
      // Use the RPC function instead of direct join
      const { data, error } = await supabase.rpc(
        'get_patient_appointments',
        { patient_uuid: patientId }
      );
      
      if (error) {
        console.error('Error getting patient appointments:', error);
        
        // Fallback to direct query without join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientId);
          
        if (fallbackError) {
          console.error('Fallback error getting patient appointments:', fallbackError);
          return [];
        }
        
        return fallbackData.map(appointment => ({
          id: appointment.id,
          patientId: appointment.patient_id,
          doctorId: appointment.doctor_id,
          date: appointment.date,
          status: appointment.status as AppointmentStatus,
          createdAt: appointment.created_at,
          doctorName: 'Unknown Doctor' // No join data available
        }));
      }
      
      // Convert to Appointment type
      return data.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        date: appointment.date,
        status: appointment.status as AppointmentStatus,
        createdAt: appointment.created_at,
        doctorName: appointment.doctor_name || 'Unknown Doctor'
      }));
    } catch (error) {
      console.error('Error in getPatientAppointments:', error);
      return [];
    }
  },
  
  async getPatientDocuments(patientId: string): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', patientId);
        
      if (error) {
        console.error('Error getting patient documents:', error);
        return [];
      }
      
      // Convert to Document type
      return data.map(doc => ({
        id: doc.id,
        userId: doc.user_id,
        name: doc.name,
        type: doc.type,
        ipfsHash: doc.ipfs_hash,
        testDate: doc.test_date,
        uploadDate: doc.created_at,
        createdAt: doc.created_at
      }));
    } catch (error) {
      console.error('Error in getPatientDocuments:', error);
      return [];
    }
  },
  
  async getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    try {
      // Use the RPC function instead of direct join
      const { data, error } = await supabase.rpc(
        'get_patient_prescriptions',
        { patient_uuid: patientId }
      );
      
      if (error) {
        console.error('Error getting patient prescriptions:', error);
        
        // Fallback to direct query without join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', patientId);
          
        if (fallbackError) {
          console.error('Fallback error getting patient prescriptions:', fallbackError);
          return [];
        }
        
        return fallbackData.map(prescription => ({
          id: prescription.id,
          patientId: prescription.patient_id,
          doctorId: prescription.doctor_id,
          medications: prescription.medications,
          photoHash: prescription.photo_hash,
          status: prescription.status as PrescriptionStatus,
          prescriptionDate: prescription.prescription_date || prescription.created_at,
          createdAt: prescription.created_at,
          doctorName: 'Unknown Doctor' // No join data available
        }));
      }
      
      // Convert to Prescription type
      return data.map(prescription => ({
        id: prescription.id,
        patientId: prescription.patient_id,
        doctorId: prescription.doctor_id,
        medications: prescription.medications,
        photoHash: prescription.photo_hash,
        status: prescription.status as PrescriptionStatus,
        prescriptionDate: prescription.prescription_date || prescription.created_at,
        createdAt: prescription.created_at,
        doctorName: prescription.doctor_name || 'Unknown Doctor'
      }));
    } catch (error) {
      console.error('Error in getPatientPrescriptions:', error);
      return [];
    }
  },
  
  async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment | null> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          id,
          patient_id: appointment.patientId,
          doctor_id: appointment.doctorId,
          date: appointment.date,
          status: appointment.status,
          created_at: now
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating appointment:', error);
        return null;
      }
      
      // Convert to Appointment type
      return {
        id: data.id,
        patientId: data.patient_id,
        doctorId: data.doctor_id,
        date: data.date,
        status: data.status as AppointmentStatus,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error in createAppointment:', error);
      return null;
    }
  },
  
  async uploadDocument(document: Omit<Document, 'id' | 'createdAt'>): Promise<Document | null> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          id,
          user_id: document.userId,
          name: document.name,
          type: document.type,
          ipfs_hash: document.ipfsHash,
          test_date: document.testDate,
          created_at: now
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error uploading document:', error);
        return null;
      }
      
      // Convert to Document type
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        type: data.type,
        ipfsHash: data.ipfs_hash,
        testDate: data.test_date,
        uploadDate: data.created_at,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      return null;
    }
  },
  
  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error deleting document:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      return false;
    }
  },
  
  // Doctor functions
  async getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
    try {
      // Use the RPC function instead of direct join
      const { data, error } = await supabase.rpc(
        'get_doctor_appointments',
        { doctor_uuid: doctorId }
      );
      
      if (error) {
        console.error('Error getting doctor appointments:', error);
        
        // Fallback to direct query without join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctorId);
          
        if (fallbackError) {
          console.error('Fallback error getting doctor appointments:', fallbackError);
          return [];
        }
        
        return fallbackData.map(appointment => ({
          id: appointment.id,
          patientId: appointment.patient_id,
          doctorId: appointment.doctor_id,
          date: appointment.date,
          status: appointment.status as AppointmentStatus,
          createdAt: appointment.created_at,
          patient: {
            name: 'Unknown Patient',
            email: 'unknown@example.com'
          }
        }));
      }
      
      // Convert to Appointment type with patient info
      return data.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        date: appointment.date,
        status: appointment.status as AppointmentStatus,
        createdAt: appointment.created_at,
        patient: {
          name: appointment.patient_name || 'Unknown Patient',
          email: appointment.patient_email || 'unknown@example.com'
        }
      }));
    } catch (error) {
      console.error('Error in getDoctorAppointments:', error);
      return [];
    }
  },
  
  // async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<boolean> {
  //   try {
  //     const { error } = await supabase
  //       .from('appointments')
  //       .update({ status })
  //       .eq('id', appointmentId);
        
  //     if (error) {
  //       console.error('Error updating appointment status:', error);
  //       return false;
  //     }
      
  //     return true;
  //   } catch (error) {
  //     console.error('Error in updateAppointmentStatus:', error);
  //     return false;
  //   }
  // }
  async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    doctorId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .eq('doctor_id', doctorId);
  
      if (error) {
        // Fallback: Manual fetch with anon key
        console.warn('⚠️ Supabase client update failed. Trying raw PATCH request...');
  
        const res = await fetch(
          `https://vuyhwhdxdnfxaxnsuqmm.supabase.co/rest/v1/appointments?id=eq.${appointmentId}&doctor_id=eq.${doctorId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // 👈 ADD THIS
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ status })
          }
        );
        
        if (!res.ok) {
          throw new Error(`Raw PATCH failed with status ${res.status}`);
        }
  
        console.log('✅ Fallback PATCH successful.');
        return true;
      }
  
      console.log('✅ Supabase client update successful');
      return true;
    } catch (err: any) {
      console.error('❌ Final error updating appointment:', err.message);
      return false;
    }
  }
  
  
  ,
  
  async getDoctors(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'doctor');
        
      if (error) {
        console.error('Error getting doctors:', error);
        return [];
      }
      
      // Convert to User type
      return data.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        mobile: doctor.mobile,
        userType: doctor.user_type as UserType,
        publicKey: doctor.public_key
      }));
    } catch (error) {
      console.error('Error in getDoctors:', error);
      return [];
    }
  },
  
  async searchPatients(query: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'patient')
        .ilike('name', `%${query}%`);
        
      if (error) {
        console.error('Error searching patients:', error);
        return [];
      }
      
      // Convert to User type
      return data.map(patient => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        mobile: patient.mobile,
        userType: patient.user_type as UserType,
        publicKey: patient.public_key
      }));
    } catch (error) {
      console.error('Error in searchPatients:', error);
      return [];
    }
  },
  
  async createPrescription(prescription: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription | null> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          id,
          patient_id: prescription.patientId,
          doctor_id: prescription.doctorId,
          medications: prescription.medications,
          photo_hash: prescription.photoHash,
          status: prescription.status,
          prescription_date: prescription.prescriptionDate,
          created_at: now
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating prescription:', error);
        return null;
      }
      
      // Convert to Prescription type
      return {
        id: data.id,
        patientId: data.patient_id,
        doctorId: data.doctor_id,
        medications: data.medications,
        photoHash: data.photo_hash,
        status: data.status as PrescriptionStatus,
        prescriptionDate: data.prescription_date,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error in createPrescription:', error);
      return null;
    }
  },
  
  // Pharma functions
  async getPendingPrescriptions(): Promise<Prescription[]> {
    try {
      console.log('📦 inside get prescriptionsssssdadsad');


      const { data, error } = await supabase
  .from('prescriptions')
  .select(`
    id,
    patient_id,
    doctor_id,
    medications,
    photo_hash,
    status,
    prescription_date,
    created_at,
    patient:patient_id (
      name,
      email
    ),
    doctor:doctor_id (
      name
    )
  `)
  .eq('status', 'pending');


    

        
      if (error) {
        console.error('Error getting pending prescriptions:', error);
        return [];
      }
      console.log('📦 Prescription data received from Supabase:', data);

      
      return data.map(prescription => ({
        id: prescription.id,
        patientId: prescription.patient_id,
        doctorId: prescription.doctor_id,
        medications: prescription.medications,
        photoHash: prescription.photo_hash,
        status: prescription.status,
        prescriptionDate: prescription.prescription_date,
        createdAt: prescription.created_at,
        patientName: prescription.patient?.name || 'Unknown Patient',
        patientEmail: prescription.patient?.email || 'unknown@example.com',
        doctorName: prescription.doctor?.name || 'Unknown Doctor'
      }));
      
      
      
    } catch (error) {
      console.error('Error in getPendingPrescriptions:', error);
      return [];
    }
  },
  
  async dispensePrescription(prescriptionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: 'dispensed' })
        .eq('id', prescriptionId);
        
      if (error) {
        console.error('Error dispensing prescription:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in dispensePrescription:', error);
      return false;
    }
  },

  // Helper functions for IPFS simulation
  getIpfsUrl: (hash: string): string => {
    return `https://olive-nearby-muskox-418.mypinata.cloud/ipfs/${hash}`;
  },
  
  getIpfsUrlFromEncrypted: (encryptedHash: string): string => {
    return `https://olive-nearby-muskox-418.mypinata.cloud/ipfs/${encryptedHash.replace('encrypted_', '')}`;
  }
};

export default databaseService;