import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { Calendar, Check, X, RefreshCw, CheckCircle } from 'lucide-react';
import { databaseService } from '../../services/databaseService';

interface Appointment {
  id: string;
  patient: {
    name: string;
    email: string;
  };
  date: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
}

const AppointmentList = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get appointments from database service
      const doctorAppointments = await databaseService.getDoctorAppointments(user?.id);
      
      // Sort by status priority and date
      doctorAppointments.sort((a, b) => {
        // First sort by status priority
        const statusPriority = { 'pending': 0, 'confirmed': 1, 'rejected': 2, 'completed': 3 };
        const statusDiff = statusPriority[a.status] - statusPriority[b.status];
        
        if (statusDiff !== 0) return statusDiff;
        
        // Then sort by date (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setAppointments(doctorAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // const handleStatusUpdate = async (id: string, status: 'confirmed' | 'rejected' | 'completed' | 'pending') => {
  //   try {
  //     setMessage('');
      
  //     // Update appointment status using database service
  //     const success = await databaseService.updateAppointmentStatus(id, status);
      
  //     if (!success) {
  //       throw new Error('Failed to update appointment status');
  //     }
      
  //     setMessage(`Appointment ${status} successfully`);
      
  //     // Refresh the appointments list to show the updated status
  //     loadAppointments();
  //   } catch (error) {
  //     console.error('Error updating appointment:', error);
  //     setMessage('Error updating appointment status');
  //   }
  // };
  const handleStatusUpdate = async (appointmentId, status) => {
    const success = await databaseService.updateAppointmentStatus(appointmentId, status, user.id); // pass user.id
    if (!success) {
      alert('Error updating appointment status');
    } else {
      loadAppointments(); // refresh UI
    }
  };
  

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Appointments</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Appointments</h2>
      
      {message && (
        <div className={`p-4 rounded mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center mb-3 md:mb-0">
                  <Calendar className="h-6 w-6 text-teal-600 mr-3" />
                  <div>
                    <h3 className="font-medium">{appointment.patient.name}</h3>
                    <p className="text-sm text-gray-500">{appointment.patient.email}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(appointment.date), 'PPP p')}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {appointment.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'rejected')}
                        className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                        ${appointment.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                        ${appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      
                      {/* Edit options for confirmed/rejected appointments */}
                      {appointment.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                            title="Mark as completed"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(appointment.id, 'rejected')}
                            className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                            title="Change to rejected"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      
                      {appointment.status === 'rejected' && (
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                          title="Change to confirmed"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Confirm
                        </button>
                      )}
                      
                      {(appointment.status === 'rejected' || appointment.status === 'confirmed') && (
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'pending')}
                          className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                          title="Reset to pending"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reset
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;