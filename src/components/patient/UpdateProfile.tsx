import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const UpdateProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    publicKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        publicKey: user.publicKey || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // In a real app, this would update the profile in the database
      // For now, just simulate a successful update
      setTimeout(() => {
        setMessage('Profile updated successfully!');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Update Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile</label>
          <input
            type="tel"
            value={profile.mobile}
            onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Public Key</label>
          <input
            type="text"
            value={profile.publicKey}
            onChange={(e) => setProfile({ ...profile, publicKey: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          />
        </div>

        {message && (
          <div className={`p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default UpdateProfile;