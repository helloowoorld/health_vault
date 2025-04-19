import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Download, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { databaseService } from '../../services/databaseService';

const DocumentList = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get documents from database service
      const userDocuments = await databaseService.getPatientDocuments(user.id);
      setDocuments(userDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc) => {
    try {
      if (!doc.ipfsHash) {
        alert('No document available');
        return;
      }
      
      // Get IPFS URL from database service
      const ipfsUrl = databaseService.getIpfsUrl(doc.ipfsHash);
      
      // For demo purposes, just show an alert with the URL
      window.open(ipfsUrl, "_blank");
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document');
    }
  };

  const handleDeleteClick = (docId) => {
    setConfirmDelete(docId);
  };

  const handleDeleteConfirm = async (docId) => {
    // Only patients can delete their documents
    if (user?.userType === 'patient') {
      try {
        // Use database service
        const success = await databaseService.deleteDocument(docId, user.id);
        
        if (!success) {
          throw new Error('Failed to delete document');
        }
        
        // Remove the document from the list
        const updatedDocuments = documents.filter(doc => doc.id !== docId);
        setDocuments(updatedDocuments);
        
        setConfirmDelete(null);
      } catch (error) {
        console.error('Error deleting document:', error);
        alert(error.message || 'Error deleting document');
      }
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">My Documents</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">My Documents</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No documents found</p>
          <p className="text-sm text-gray-400 mt-1">Upload a document to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-start mb-3 md:mb-0">
                <FileText className="h-6 w-6 text-teal-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-medium">{doc.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{doc.type.replace('_', ' ')}</p>
                  
                  {/* Display test date if available */}
                  {doc.testDate && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Test date: {format(new Date(doc.testDate), 'MMM d, yyyy')}
                    </p>
                  )}
                  
                  {/* Always show upload date */}
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded: {format(new Date(doc.uploadDate || doc.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex items-center text-teal-600 hover:text-teal-700 px-2 py-1 rounded hover:bg-teal-50"
                >
                  <Download className="h-5 w-5 mr-1" />
                  <span>Download</span>
                </button>
                
                {/* Only show delete button for patients */}
                {user?.userType === 'patient' && (
                  <>
                    {confirmDelete === doc.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteConfirm(doc.id)}
                          className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={handleDeleteCancel}
                          className="text-gray-600 hover:text-gray-700 px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(doc.id)}
                        className="flex items-center text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5 mr-1" />
                        <span>Delete</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;