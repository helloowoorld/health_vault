import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { databaseService } from '../../services/databaseService';

interface AppointmentWithDoctor {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  createdAt: string;
  doctorName: string;
}

const UpcomingAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
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
      const patientAppointments = await databaseService.getPatientAppointments(user.id);
      
      // Filter for upcoming appointments (not completed or rejected)
      const upcomingAppointments = patientAppointments
        .filter(a => a.status !== 'completed' && a.status !== 'rejected');
      
      // Sort by date
      upcomingAppointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setAppointments(upcomingAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Awaiting Confirmation';
      case 'rejected':
        return 'Rejected';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Upcoming Appointments</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Upcoming Appointments</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No upcoming appointments</p>
          <p className="text-sm text-gray-400 mt-1">Book an appointment to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-teal-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium">{appointment.doctorName}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{format(new Date(appointment.date), 'h:mm a')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusIcon(appointment.status)}
                    <span className="ml-1">{getStatusText(appointment.status)}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingAppointments;