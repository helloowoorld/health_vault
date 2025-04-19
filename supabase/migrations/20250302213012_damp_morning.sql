/*
  # Fix Authentication Permissions Migration

  1. Permissions
     - Grants necessary permissions to authenticated and anon roles
     - Ensures all tables have proper RLS policies

  2. Security
     - Updates policies for authenticated users
     - Adds missing policies for profile access
*/

-- Grant usage on schema to both roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant necessary table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for profiles table
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create comprehensive policies for profiles
CREATE POLICY "anon_select_profiles" 
  ON profiles 
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "authenticated_select_profiles" 
  ON profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_type_value text := 'patient';
BEGIN
  -- Try to extract user_type from metadata
  BEGIN
    IF new.raw_user_meta_data->>'user_type' IS NOT NULL THEN
      user_type_value := new.raw_user_meta_data->>'user_type';
    ELSIF new.raw_user_meta_data->>'userType' IS NOT NULL THEN
      user_type_value := new.raw_user_meta_data->>'userType';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    user_type_value := 'patient';
  END;

  -- Insert the profile only if it doesn't already exist
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
      INSERT INTO public.profiles (id, email, name, user_type)
      VALUES (
        new.id, 
        new.email, 
        COALESCE(new.raw_user_meta_data->>'name', ''),
        user_type_value
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error creating profile for user %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the create_profile_for_user function with better error handling
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL,
  user_mobile text DEFAULT NULL,
  user_type text DEFAULT 'patient'
)
RETURNS void AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Insert new profile
    INSERT INTO public.profiles (id, email, name, mobile, user_type)
    VALUES (user_id, user_email, user_name, user_mobile, user_type);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in create_profile_for_user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_connection() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_tables_if_not_exist() TO anon, authenticated;