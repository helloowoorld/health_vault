-- Create function to get all pending prescriptions with patient and doctor info
CREATE OR REPLACE FUNCTION public.get_all_pending_prescriptions()
RETURNS TABLE (
  id uuid,
  patientId uuid,
  doctorId uuid,
  patientName text,
  doctorName text,
  patientEmail text,
  medications jsonb,
  photoHash text,
  status text,
  prescriptionDate timestamptz,
  createdAt timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.patient_id as "patientId",
    pr.doctor_id as "doctorId",
    patient.name as "patientName",
    doctor.name as "doctorName",
    patient.email as "patientEmail",
    pr.medications,
    pr.photo_hash as "photoHash",
    pr.status,
    pr.prescription_date as "prescriptionDate",
    pr.created_at as "createdAt"
  FROM 
    prescriptions pr
  JOIN 
    profiles patient ON pr.patient_id = patient.id
  JOIN 
    profiles doctor ON pr.doctor_id = doctor.id
  WHERE 
    pr.status = 'pending'
  ORDER BY
    pr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_all_pending_prescriptions() TO authenticated;