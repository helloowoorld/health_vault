/*
  # Fix user_type handling in trigger function

  This migration updates the trigger function to properly handle the user_type field
  from the user metadata during registration.
*/

-- Update the function to handle new users with proper metadata extraction
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value user_type;
BEGIN
  -- Try to extract user_type from metadata
  BEGIN
    -- First try to get it from raw_user_meta_data
    user_type_value := (new.raw_user_meta_data->>'user_type')::user_type;
  EXCEPTION WHEN OTHERS THEN
    -- If that fails, try to get it from raw_app_meta_data
    BEGIN
      user_type_value := (new.raw_app_meta_data->>'user_type')::user_type;
    EXCEPTION WHEN OTHERS THEN
      -- Default to patient if all else fails
      user_type_value := 'patient'::user_type;
    END;
  END;

  -- Insert the profile with the extracted or default user_type
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (new.id, new.email, user_type_value);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update existing profiles with correct user_type
CREATE OR REPLACE FUNCTION fix_existing_profiles()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
  auth_user RECORD;
  user_type_value user_type;
BEGIN
  FOR profile_record IN SELECT * FROM profiles WHERE user_type IS NULL LOOP
    -- Try to get the auth user
    SELECT * INTO auth_user FROM auth.users WHERE id = profile_record.id;
    
    -- Try to extract user_type from metadata
    BEGIN
      -- First try to get it from raw_user_meta_data
      user_type_value := (auth_user.raw_user_meta_data->>'user_type')::user_type;
    EXCEPTION WHEN OTHERS THEN
      -- If that fails, try to get it from raw_app_meta_data
      BEGIN
        user_type_value := (auth_user.raw_app_meta_data->>'user_type')::user_type;
      EXCEPTION WHEN OTHERS THEN
        -- Default to patient if all else fails
        user_type_value := 'patient'::user_type;
      END;
    END;
    
    -- Update the profile
    UPDATE profiles SET user_type = user_type_value WHERE id = profile_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the fix function
SELECT fix_existing_profiles();

-- Drop the function after use
DROP FUNCTION fix_existing_profiles();