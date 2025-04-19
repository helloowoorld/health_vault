import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { Calendar, Clock, User } from 'lucide-react';
import { databaseService } from '../../services/databaseService';

interface Doctor {
  id: string;
  name: string;
}

const BookAppointment = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load doctors when component mounts
  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      // Get doctors from database service
      const doctorsList = await databaseService.getDoctors();
      setDoctors(doctorsList.map(d => ({ id: d.id, name: d.name })));
    } catch (error) {
      console.error('Error loading doctors:', error);
      setError('Failed to load doctors. Please try again later.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !date || !time) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const appointmentDate = new Date(`${date}T${time}`);
      
      // Create appointment using database service
      const newAppointment = await databaseService.createAppointment({
        patientId: user?.id || '',
        doctorId: selectedDoctor,
        date: appointmentDate.toISOString(),
        status: 'pending'
      });
      
      if (newAppointment) {
        setMessage('Appointment requested successfully!');
        setSelectedDoctor('');
        setDate('');
        setTime('');
      } else {
        throw new Error('Failed to create appointment');
      }
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      setError(error.message || 'Error booking appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Book Appointment</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            >
              <option value="">Select a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Time</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Booking...
            </div>
          ) : (
            'Book Appointment'
          )}
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;