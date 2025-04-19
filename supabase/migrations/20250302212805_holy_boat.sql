/*
  # Fix Permissions Migration

  1. Functions
     - Updates create_profile_for_user function with SECURITY DEFINER
     - Adds insert policy for profiles table
     - Grants necessary permissions to authenticated users

  2. Security
     - Enables Row Level Security (RLS) on all tables
     - Creates policies for authenticated users to insert into profiles
     - Grants necessary permissions
*/

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Grant usage on schema to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant insert permissions on profiles to authenticated role
GRANT INSERT ON TABLE profiles TO authenticated;

-- Create policy for authenticated users to insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Update the create_profile_for_user function with SECURITY DEFINER
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated role
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, text, text, text) TO authenticated;

-- Create a function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_type_value text := 'patient';
BEGIN
  -- Try to extract user_type from metadata
  IF new.raw_user_meta_data->>'user_type' IS NOT NULL THEN
    user_type_value := new.raw_user_meta_data->>'user_type';
  ELSIF new.raw_user_meta_data->>'userType' IS NOT NULL THEN
    user_type_value := new.raw_user_meta_data->>'userType';
  END IF;

  -- Insert the profile only if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    INSERT INTO public.profiles (id, email, name, user_type)
    VALUES (
      new.id, 
      new.email, 
      new.raw_user_meta_data->>'name',
      user_type_value
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();