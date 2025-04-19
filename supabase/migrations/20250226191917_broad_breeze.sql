/*
  # Initial Schema Setup for Healthcare System

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references auth.users)
      - `doctor_id` (uuid, references auth.users)
      - `date` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
    
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `type` (text)
      - `ipfs_hash` (text)
      - `created_at` (timestamptz)
    
    - `prescriptions`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references auth.users)
      - `doctor_id` (uuid, references auth.users)
      - `medications` (jsonb)
      - `photo_hash` (text)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for each role
*/

-- Create user_type enum
CREATE TYPE user_type AS ENUM ('patient', 'doctor', 'pharma');

-- Create profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  mobile text,
  public_key text,
  user_type user_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed'))
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  ipfs_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  medications jsonb NOT NULL,
  photo_hash text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'dispensed'))
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Appointments Policies
CREATE POLICY "Patients can view their own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = patient_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'doctor'
    )
  );

CREATE POLICY "Patients can create appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = patient_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = doctor_id 
      AND user_type = 'doctor'
    )
  );

CREATE POLICY "Doctors can update their appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'doctor'
    )
  );

-- Documents Policies
CREATE POLICY "Users can view their own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('doctor', 'pharma')
    )
  );

CREATE POLICY "Users can upload their own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Prescriptions Policies
CREATE POLICY "Patients can view their prescriptions"
  ON prescriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('doctor', 'pharma')
    )
  );

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = doctor_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'doctor'
    )
  );

CREATE POLICY "Pharma can update prescriptions"
  ON prescriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'pharma'
    )
  );

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();