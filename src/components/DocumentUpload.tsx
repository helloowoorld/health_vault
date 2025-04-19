
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [testDate, setTestDate] = useState('');
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    if (!file || !userId || !name || !type) {
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
      const { error } = await supabase.from('documents').insert([
        {
          user_id: userId,
          name,
          type,
          ipfs_hash: ipfsHash,
          test_date: testDate ? new Date(testDate).toISOString() : null,
        }
      ]);

      if (error) throw error;
      setStatus('✅ Document uploaded & saved!');
    } catch (err: any) {
      console.error(err);
      setStatus('❌ Error: ' + err.message);
    }
  };

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-bold">Upload Document</h2>
      <input type="text" placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} />
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input type="text" placeholder="Type" value={type} onChange={e => setType(e.target.value)} />
      <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} />
      <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
      {status && <p>{status}</p>}
    </div>
  );
};

export default DocumentUpload;
