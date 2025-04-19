
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const PrescriptionUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [medications, setMedications] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    if (!file || !patientId || !doctorId || !medications) {
      setStatus("Please fill all fields");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      const ipfsHash = result.IpfsHash;

      const { error } = await supabase.from('prescriptions').insert([
        {
          patient_id: patientId,
          doctor_id: doctorId,
          medications: JSON.parse(medications),
          photo_hash: ipfsHash,
          status: 'active',
          prescription_date: prescriptionDate ? new Date(prescriptionDate).toISOString() : null,
        }
      ]);

      if (error) throw error;
      setStatus('✅ Prescription uploaded & saved!');
    } catch (err: any) {
      console.error(err);
      setStatus('❌ Error: ' + err.message);
    }
  };

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-bold">Upload Prescription</h2>
      <input type="text" placeholder="Patient ID" value={patientId} onChange={e => setPatientId(e.target.value)} />
      <input type="text" placeholder="Doctor ID" value={doctorId} onChange={e => setDoctorId(e.target.value)} />
      <textarea placeholder='Medications (JSON)' value={medications} onChange={e => setMedications(e.target.value)} />
      <input type="date" value={prescriptionDate} onChange={e => setPrescriptionDate(e.target.value)} />
      <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} className="bg-green-600 text-white px-4 py-2 rounded">Upload</button>
      {status && <p>{status}</p>}
    </div>
  );
};

export default PrescriptionUpload;
