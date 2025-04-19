import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, Database, Check, AlertTriangle } from 'lucide-react';

const DatabaseSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const seedDatabase = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Check if we already have data
      const { data: existingProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        console.error('Error checking profiles:', profilesError);
        throw new Error(`Error checking profiles: ${profilesError.message}`);
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        setStatus('success');
        setMessage('Database already has data. No need to seed.');
        setLoading(false);
        return;
      }
      
      // Insert dummy users/profiles
      const { error: profilesInsertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'John Patient',
            email: 'patient@example.com',
            mobile: '555-123-4567',
            user_type: 'patient',
            password: 'patient123',
            public_key: 'patient_public_key_123'
          },
          {
            id: '00000000-0000-0000-0000-000000000002',
            name: 'Dr. Jane Smith',
            email: 'doctor@example.com',
            mobile: '555-987-6543',
            user_type: 'doctor',
            password: 'doctor123',
            public_key: 'doctor_public_key_456'
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            name: 'MedPlus Pharmacy',
            email: 'pharma@example.com',
            mobile: '555-789-0123',
            user_type: 'pharma',
            password: 'pharma123',
            public_key: 'pharma_public_key_789'
          },
          {
            id: '00000000-0000-0000-0000-000000000004',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            mobile: '555-222-3333',
            user_type: 'patient',
            password: 'sarah123',
            public_key: 'patient_public_key_456'
          },
          {
            id: '00000000-0000-0000-0000-000000000005',
            name: 'Michael Brown',
            email: 'michael@example.com',
            mobile: '555-444-5555',
            user_type: 'patient',
            password: 'michael123',
            public_key: 'patient_public_key_789'
          }
        ]);
      
      if (profilesInsertError) {
        console.error('Error inserting profiles:', profilesInsertError);
        throw new Error(`Error inserting profiles: ${profilesInsertError.message}`);
      }
      
      // Insert dummy appointments
      const { error: appointmentsError } = await supabase
        .from('appointments')
        .insert([
          {
            id: '00000000-0000-0000-0000-000000000101',
            patient_id: '00000000-0000-0000-0000-000000000001',
            doctor_id: '00000000-0000-0000-0000-000000000002',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
          },
          {
            id: '00000000-0000-0000-0000-000000000102',
            patient_id: '00000000-0000-0000-0000-000000000001',
            doctor_id: '00000000-0000-0000-0000-000000000002',
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed'
          },
          {
            id: '00000000-0000-0000-0000-000000000103',
            patient_id: '00000000-0000-0000-0000-000000000001',
            doctor_id: '00000000-0000-0000-0000-000000000002',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed'
          }
        ]);
      
      if (appointmentsError) {
        console.error('Error inserting appointments:', appointmentsError);
        throw new Error(`Error inserting appointments: ${appointmentsError.message}`);
      }
      
      // Insert dummy documents
      const { error: documentsError } = await supabase
        .from('documents')
        .insert([
          {
            id: '00000000-0000-0000-0000-000000000201',
            user_id: '00000000-0000-0000-0000-000000000001',
            name: 'Blood Test Results',
            type: 'medical_report',
            ipfs_hash: 'ipfs_hash_123',
            test_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '00000000-0000-0000-0000-000000000202',
            user_id: '00000000-0000-0000-0000-000000000001',
            name: 'X-Ray Report',
            type: 'medical_report',
            ipfs_hash: 'ipfs_hash_456',
            test_date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '00000000-0000-0000-0000-000000000203',
            user_id: '00000000-0000-0000-0000-000000000001',
            name: 'Vaccination Record',
            type: 'medical_report',
            ipfs_hash: 'ipfs_hash_789',
            test_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      
      if (documentsError) {
        console.error('Error inserting documents:', documentsError);
        throw new Error(`Error inserting documents: ${documentsError.message}`);
      }
      
      // Insert dummy prescriptions
      const { error: prescriptionsError } = await supabase
        .from('prescriptions')
        .insert([
          {
            id: '00000000-0000-0000-0000-000000000301',
            patient_id: '00000000-0000-0000-0000-000000000001',
            doctor_id: '00000000-0000-0000-0000-000000000002',
            medications: [
              {
                name: 'Amoxicillin',
                dosage: '500mg',
                frequency: '3 times daily',
                duration: '7 days'
              }
            ],
            status: 'pending',
            prescription_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '00000000-0000-0000-0000-000000000302',
            patient_id: '00000000-0000-0000-0000-000000000001',
            doctor_id: '00000000-0000-0000-0000-000000000002',
            medications: [
              {
                name: 'Ibuprofen',
                dosage: '400mg',
                frequency: 'as needed',
                duration: 'for pain'
              }
            ],
            status: 'dispensed',
            prescription_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '00000000-0000-0000-0000-000000000303',
            patient_id: '00000000-0000-0000-0000-000000000001',
            doctor_id: '00000000-0000-0000-0000-000000000002',
            medications: [
              {
                name: 'Lisinopril',
                dosage: '10mg',
                frequency: 'once daily',
                duration: '30 days'
              }
            ],
            status: 'pending',
            prescription_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      
      if (prescriptionsError) {
        console.error('Error inserting prescriptions:', prescriptionsError);
        throw new Error(`Error inserting prescriptions: ${prescriptionsError.message}`);
      }
      
      setStatus('success');
      setMessage('Database seeded successfully!');
    } catch (error: any) {
      console.error('Error seeding database:', error);
      setStatus('error');
      setMessage(error.message || 'An error occurred while seeding the database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Database Seeder</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          This tool will seed your database with test data for the HealthVault application. 
          Use this if you need to populate your database with sample users, appointments, documents, and prescriptions.
        </p>
        
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <span className="font-medium">Note:</span> This will only seed the database if it's empty. 
                If you already have data, no changes will be made.
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={seedDatabase}
          disabled={loading}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Seeding Database...
            </>
          ) : (
            <>
              <Database className="h-5 w-5 mr-2" />
              Seed Database
            </>
          )}
        </button>
      </div>
      
      {status === 'success' && (
        <div className="bg-green-100 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <span className="font-medium">Success!</span> {message}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-100 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">Error!</span> {message}
              </p>
              <p className="text-sm text-red-700 mt-2">
                Please make sure your database connection is working properly. You may need to run the database fix migration.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSeeder;