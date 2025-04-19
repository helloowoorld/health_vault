import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Key, Save, X, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EditProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    publicKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [publicKeyMessage, setPublicKeyMessage] = useState('');
  const [error, setError] = useState('');

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
    setError('');

    try {
      // Ensure public key is not changed
      const updatedProfile = {
        ...profile,
        publicKey: user?.publicKey || '' // Always use the original public key
      };
      
      // Try to update profile in Supabase
      if (user) {
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              name: updatedProfile.name,
              email: updatedProfile.email,
              mobile: updatedProfile.mobile
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating Supabase profile:', updateError);
          }
        } catch (supabaseError) {
          console.error('Supabase update error:', supabaseError);
        }
      }
      
      // Update the user object in the auth context
      // This is a mock update since we're using dummy data
      if (user) {
        user.name = updatedProfile.name;
        user.email = updatedProfile.email;
        user.mobile = updatedProfile.mobile;
        // Public key remains unchanged
      }
      
      // Update the profile state with the correct public key
      setProfile(updatedProfile);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        publicKey: user.publicKey || ''
      });
    }
    setIsEditing(false);
    setPublicKeyMessage('');
  };

  const handlePublicKeyChange = () => {
    setPublicKeyMessage('Public key cannot be updated for security reasons.');
    // Reset to original value
    setProfile({
      ...profile,
      publicKey: user?.publicKey || ''
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-teal-100 p-6 rounded-full">
            <User className="h-16 w-16 text-teal-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-center">{user?.name}</h3>
        <p className="text-gray-500 text-center capitalize">{user?.userType}</p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={profile.mobile}
                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Public Key</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={profile.publicKey}
                onChange={handlePublicKeyChange}
                className="pl-10 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500"
                disabled
              />
            </div>
            {publicKeyMessage && (
              <p className="mt-1 text-sm text-amber-600">{publicKeyMessage}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 flex items-center">
              <Lock className="h-3 w-3 mr-1" /> Public keys are read-only for security reasons
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {loading ? 'Updating...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="mt-1 text-lg">{profile.name}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-lg">{profile.email}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Mobile</p>
              <p className="mt-1 text-lg">{profile.mobile || 'Not set'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500 flex items-center">
                Public Key <Lock className="h-3 w-3 ml-1 text-gray-400" />
              </p>
              <p className="mt-1 text-sm break-all font-mono">{profile.publicKey || 'Not set'}</p>
            </div>
          </div>
          
          {message && (
            <div className="p-4 rounded bg-green-100 text-green-700">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditProfile;