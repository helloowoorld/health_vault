/*
  # Drop All Tables and Schema Objects

  1. Drop all existing tables and functions
    - Drop all tables (profiles, appointments, documents, prescriptions)
    - Drop all functions and triggers
    - Drop user_type enum
*/

-- First drop all triggers and functions to avoid dependency issues
DROP TRIGGER IF EXISTS sync_user_type_trigger ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS sync_user_type_columns() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user(uuid, text, text, text, text) CASCADE;

-- Drop tables in correct order to avoid foreign key constraint issues
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS profiles;

-- Drop the enum type if it exists
DROP TYPE IF EXISTS user_type;