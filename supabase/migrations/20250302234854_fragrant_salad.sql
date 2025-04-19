/*
  # Fix Registration Permissions

  1. Changes
     - Grant proper permissions to anon role for registration
     - Create explicit policy for anon to insert into profiles
     - Fix RLS policies for registration flow
     - Ensure proper access for authentication flows
  
  2. Security
     - Maintain RLS on all tables
     - Add specific policies for registration
*/

-- Grant usage on schema to both roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant necessary table permissions
GRANT SELECT, INSERT ON TABLE profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create explicit policy for anon to insert profiles (needed for registration)
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create a function to handle profile creation on signup with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_type_value text := 'patient';
  user_password text := null;
  user_mobile text := null;
BEGIN
  -- Try to extract user_type from metadata
  BEGIN
    IF new.raw_user_meta_data->>'user_type' IS NOT NULL THEN
      user_type_value := new.raw_user_meta_data->>'user_type';
    ELSIF new.raw_user_meta_data->>'userType' IS NOT NULL THEN
      user_type_value := new.raw_user_meta_data->>'userType';
    END IF;

    -- Extract password if available (for reference only, not the actual hashed password)
    IF new.raw_user_meta_data->>'password' IS NOT NULL THEN
      user_password := new.raw_user_meta_data->>'password';
    END IF;

    -- Extract mobile if available
    IF new.raw_user_meta_data->>'mobile' IS NOT NULL THEN
      user_mobile := new.raw_user_meta_data->>'mobile';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    user_type_value := 'patient';
  END;

  -- Insert the profile only if it doesn't already exist
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
      INSERT INTO public.profiles (
        id, 
        email, 
        name, 
        mobile,
        password,
        user_type
      )
      VALUES (
        new.id, 
        new.email, 
        COALESCE(new.raw_user_meta_data->>'name', ''),
        user_mobile,
        user_password,
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

-- Create the trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- Create a manual registration function that can be called directly
CREATE OR REPLACE FUNCTION public.register_user(
  user_email text,
  user_name text,
  user_mobile text,
  user_password text,
  user_type text DEFAULT 'patient'
)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Generate a new UUID
  new_id := gen_random_uuid();
  
  -- Insert the profile
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    mobile,
    password,
    user_type
  )
  VALUES (
    new_id, 
    user_email, 
    user_name,
    user_mobile,
    user_password,
    user_type
  );
  
  RETURN new_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error in register_user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the registration function
GRANT EXECUTE ON FUNCTION public.register_user(text, text, text, text, text) TO anon, authenticated;