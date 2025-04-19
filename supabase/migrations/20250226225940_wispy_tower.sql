/*
  # Reset Database
  
  This migration drops all existing tables, functions, triggers, and types
  to provide a clean slate for a new database setup.
*/

-- First drop all triggers and functions to avoid dependency issues
DROP TRIGGER IF EXISTS sync_user_type_trigger ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS sync_user_type_columns() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user(uuid, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.test_connection() CASCADE;

-- Drop tables in correct order to avoid foreign key constraint issues
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS profiles;

-- Drop the enum type if it exists
DROP TYPE IF EXISTS user_type;

-- Revoke any special permissions granted to anon role
REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;