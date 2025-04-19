import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Upload } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { uploadToPinata } from '../../lib/pinata';

const UploadDocument = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('medical_report');
  const [testDate, setTestDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !testDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Upload file to IPFS via Pinata
      const pinataResponse = await uploadToPinata(file, {
        type,
        testDate,
        userId: user?.id
      });

      if (!pinataResponse.success || !pinataResponse.ipfsHash) {
        throw new Error(pinataResponse.error || 'Failed to upload to IPFS');
      }

      // Upload document using database service
      const result = await databaseService.uploadDocument({
        userId: user?.id || '',
        name,
        type,
        ipfsHash: pinataResponse.ipfsHash,
        testDate,
        uploadDate: new Date().toISOString()
      });
      
      if (!result) {
        throw new Error('Failed to upload document');
      }
      
      setMessage('Document uploaded successfully!');
      setFile(null);
      setName('');
      setTestDate('');
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setError(error.message || 'Error uploading document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Upload Document</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Document Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            placeholder="e.g., Blood Test Report"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Document Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          >
            <option value="medical_report">Medical Report</option>
            <option value="prescription">Prescription</option>
            <option value="test_result">Test Result</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date of Test/Visit <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">When the test was performed or visit occurred</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>

        {message && (
          <div className="p-4 rounded bg-green-100 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 rounded bg-red-100 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">
            <strong>Note:</strong> Your document will be securely stored and encrypted for privacy.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          {loading ? (
            'Uploading...'
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload Document
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default UploadDocument;