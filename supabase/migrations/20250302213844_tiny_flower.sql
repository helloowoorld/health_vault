/*
  # Fix Profile Data Saving Migration

  1. Updates
     - Modifies handle_new_user function to save password and mobile
     - Updates create_profile_for_user function to save password
     - Ensures all user data is properly saved to profiles table

  2. Security
     - Maintains existing security policies
     - Preserves SECURITY DEFINER attribute for functions
*/

-- Update the handle_new_user function to save password and mobile
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

-- Update the create_profile_for_user function to include password
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL,
  user_mobile text DEFAULT NULL,
  user_type text DEFAULT 'patient',
  user_password text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Insert new profile with password
    INSERT INTO public.profiles (id, email, name, mobile, user_type, password)
    VALUES (user_id, user_email, user_name, user_mobile, user_type, user_password);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in create_profile_for_user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the updated function
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid, text, text, text, text, text) TO authenticated;