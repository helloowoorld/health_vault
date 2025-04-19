import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  TruckIcon, 
  DollarSign, 
  Calendar, 
  User, 
  Edit, 
  X, 
  Save, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { dummyDataService } from '../../lib/dummyData';

interface PrescriptionQueueProps {
  queue: any[];
  onUpdatePrescription: (prescription: any) => void;
  onRemoveFromQueue: (prescriptionId: string) => void;
}

const PrescriptionQueue: React.FC<PrescriptionQueueProps> = ({ queue, onUpdatePrescription, onRemoveFromQueue }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedPrescription, setEditedPrescription] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handleStatusChange = (id: string, newStatus: string) => {
    // If we're in edit mode, update the edited prescription
    if (editingId === id && editedPrescription) {
      const updatedPrescription = {
        ...editedPrescription,
        queueStatus: newStatus
      };

      // If status is completed, add completion date
      if (newStatus === 'Completed') {
        updatedPrescription.completedAt = new Date().toISOString();
      }

      setEditedPrescription(updatedPrescription);
    } else {
      // If we're not in edit mode, update the prescription directly
      const prescription = queue.find(p => p.id === id);
      if (!prescription) return;

      let updatedPrescription = {
        ...prescription,
        queueStatus: newStatus
      };

      // If status is completed, add completion date
      if (newStatus === 'Completed') {
        updatedPrescription.completedAt = new Date().toISOString();
      }

      onUpdatePrescription(updatedPrescription);
    }
  };

  const handleEditClick = (prescription: any) => {
    setEditingId(prescription.id);
    setEditedPrescription({
      ...prescription,
      medicationPrices: [...prescription.medicationPrices]
    });
  };

  const handlePriceChange = (index: number, price: string) => {
    const numericPrice = parseFloat(price) || 0;
    
    const updatedMedicationPrices = [...editedPrescription.medicationPrices];
    updatedMedicationPrices[index] = {
      ...updatedMedicationPrices[index],
      price: numericPrice
    };
    
    // Calculate total price
    const totalPrice = updatedMedicationPrices.reduce((sum, med) => sum + med.price, 0);
    
    setEditedPrescription({
      ...editedPrescription,
      medicationPrices: updatedMedicationPrices,
      totalPrice
    });
  };

  const handleSaveEdit = () => {
    setError('');
    try {
      // Update the prescription status in dummy data if completed
      if (editedPrescription.queueStatus === 'Completed') {
        dummyDataService.dispensePrescription(editedPrescription.id);
      }
      
      onUpdatePrescription(editedPrescription);
      setEditingId(null);
      setEditedPrescription(null);
    } catch (error) {
      console.error('Error updating prescription:', error);
      setError('Failed to update prescription. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedPrescription(null);
    setError('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Process':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'Ready for Shipment':
        return <TruckIcon className="h-5 w-5 text-orange-500" />;
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'In Process':
        return 'bg-blue-100 text-blue-800';
      case 'Ready for Shipment':
        return 'bg-orange-100 text-orange-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (queue.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Prescription Queue</h2>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No prescriptions in your queue</p>
          <p className="text-sm text-gray-400 mt-1">Use the lookup tool above to add prescriptions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Prescription Queue ({queue.length})</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        {queue.map((prescription) => (
          <div key={prescription.id} className="border rounded-lg overflow-hidden">
            {editingId === prescription.id ? (
              // Edit mode
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">{prescription.patientName}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Prescribed by: {prescription.doctorName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Date: {format(new Date(prescription.prescriptionDate || prescription.createdAt), 'PPP')}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Status:</h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(prescription.id, 'In Process')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        editedPrescription.queueStatus === 'In Process' 
                          ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-blue-50'
                      }`}
                    >
                      In Process
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(prescription.id, 'Ready for Shipment')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        editedPrescription.queueStatus === 'Ready for Shipment' 
                          ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-orange-50'
                      }`}
                    >
                      Ready for Shipment
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(prescription.id, 'Completed')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        editedPrescription.queueStatus === 'Completed' 
                          ? 'bg-green-100 text-green-800 ring-2 ring-green-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-green-50'
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Medications & Pricing:</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs text-gray-500">
                          <th className="pb-2">Medication</th>
                          <th className="pb-2">Dosage</th>
                          <th className="pb-2">Price ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editedPrescription.medicationPrices.map((med: any, index: number) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="py-2 text-sm">{med.name}</td>
                            <td className="py-2 text-sm">{med.dosage}</td>
                            <td className="py-2">
                              <div className="relative rounded-md shadow-sm max-w-[100px]">
                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                  <DollarSign className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={med.price}
                                  onChange={(e) => handlePriceChange(index, e.target.value)}
                                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm py-1"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-gray-200 font-medium">
                          <td className="py-2" colSpan={2}>Total</td>
                          <td className="py-2">${editedPrescription.totalPrice.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {editedPrescription.queueStatus === 'Completed' && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Completion Date:</h4>
                    <p className="text-sm text-gray-600">
                      {editedPrescription.completedAt 
                        ? format(new Date(editedPrescription.completedAt), 'PPP p')
                        : 'Will be set when saved'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // View mode
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{prescription.patientName}</h3>
                    <p className="text-sm text-gray-500">
                      Prescribed by: {prescription.doctorName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Date: {format(new Date(prescription.prescriptionDate || prescription.createdAt), 'PPP')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(prescription.queueStatus)}`}>
                      {getStatusIcon(prescription.queueStatus)}
                      <span className="ml-1">{prescription.queueStatus}</span>
                    </span>
                    <button
                      onClick={() => handleEditClick(prescription)}
                      className="flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <h4 className="text-sm font-medium mb-2">Medications:</h4>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="pb-2">Medication</th>
                        <th className="pb-2">Dosage</th>
                        <th className="pb-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescription.medicationPrices.map((med: any, index: number) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-2 text-sm">{med.name}</td>
                          <td className="py-2 text-sm">{med.dosage}</td>
                          <td className="py-2 text-sm">${med.price.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-gray-200 font-medium">
                        <td className="py-2" colSpan={2}>Total</td>
                        <td className="py-2">${prescription.totalPrice.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {prescription.queueStatus === 'Completed' && prescription.completedAt && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Completed on:</span> {format(new Date(prescription.completedAt), 'PPP p')}
                  </div>
                )}
                
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => onRemoveFromQueue(prescription.id)}
                    className="flex items-center text-red-600 hover:text-red-700 text-sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Remove from Queue
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrescriptionQueue;