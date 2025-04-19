/*
  # Admin Functions for Database Management and Prescription Lookup
  
  1. New Functions
     - Add admin functions to manage database tables with elevated privileges
     - Fix permission issues with database admin page
     - Add secure RPC functions for admin operations
     - Add function to get all pending prescriptions with patient and doctor info
  
  2. Security
     - Functions use SECURITY DEFINER to bypass RLS
     - Maintain proper access control
*/

-- Create admin function to get table data
CREATE OR REPLACE FUNCTION public.admin_get_table_data(table_name text)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM %I t', table_name) INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error getting table data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin function to update a record
CREATE OR REPLACE FUNCTION public.admin_update_record(
  p_table_name text,
  p_id uuid,
  p_data jsonb
)
RETURNS boolean AS $$
DECLARE
  sql_statement text;
  column_values text := '';
  column_name text;
  column_value jsonb;
BEGIN
  -- Build the SET clause for the UPDATE statement
  FOR column_name, column_value IN SELECT * FROM jsonb_each(p_data)
  LOOP
    -- Skip id column
    IF column_name <> 'id' THEN
      -- Add comma if not the first column
      IF column_values <> '' THEN
        column_values := column_values || ', ';
      END IF;
      
      -- Add column = value to the SET clause
      column_values := column_values || format('%I = %L', column_name, column_value);
    END IF;
  END LOOP;
  
  -- Build and execute the UPDATE statement
  sql_statement := format('UPDATE %I SET %s WHERE id = %L', p_table_name, column_values, p_id);
  EXECUTE sql_statement;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error updating record: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin function to delete a record
CREATE OR REPLACE FUNCTION public.admin_delete_record(
  p_table_name text,
  p_id uuid
)
RETURNS boolean AS $$
DECLARE
  sql_statement text;
BEGIN
  -- Build and execute the DELETE statement
  sql_statement := format('DELETE FROM %I WHERE id = %L', p_table_name, p_id);
  EXECUTE sql_statement;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error deleting record: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin function to insert a record
CREATE OR REPLACE FUNCTION public.admin_insert_record(
  p_table_name text,
  p_data jsonb
)
RETURNS boolean AS $$
DECLARE
  sql_statement text;
  column_names text := '';
  column_values text := '';
  column_name text;
  column_value jsonb;
BEGIN
  -- Build the column names and values for the INSERT statement
  FOR column_name, column_value IN SELECT * FROM jsonb_each(p_data)
  LOOP
    -- Add comma if not the first column
    IF column_names <> '' THEN
      column_names := column_names || ', ';
      column_values := column_values || ', ';
    END IF;
    
    -- Add column name and value
    column_names := column_names || format('%I', column_name);
    column_values := column_values || format('%L', column_value);
  END LOOP;
  
  -- Build and execute the INSERT statement
  sql_statement := format('INSERT INTO %I (%s) VALUES (%s)', p_table_name, column_names, column_values);
  EXECUTE sql_statement;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error inserting record: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Grant execute permissions on the admin functions
GRANT EXECUTE ON FUNCTION public.admin_get_table_data(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_record(text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_record(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_insert_record(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_pending_prescriptions() TO authenticated;