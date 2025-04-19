/*
  # Update database schema to handle both user_type and userType

  This migration adds compatibility between the database field user_type and the frontend property userType.
*/

-- First check if the usertype column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'usertype'
  ) THEN
    -- Add the usertype column
    ALTER TABLE profiles ADD COLUMN usertype text;
    
    -- Update existing rows to copy values from user_type to usertype
    UPDATE profiles SET usertype = user_type::text;
  END IF;
END
$$;

-- Create a trigger function to keep the columns in sync
CREATE OR REPLACE FUNCTION sync_user_type_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.user_type IS DISTINCT FROM OLD.user_type THEN
    NEW.usertype := NEW.user_type::text;
  ELSIF NEW.usertype IS DISTINCT FROM OLD.usertype THEN
    BEGIN
      NEW.user_type := NEW.usertype::user_type;
    EXCEPTION WHEN OTHERS THEN
      -- If conversion fails, keep the old value
      NEW.user_type := OLD.user_type;
      NEW.usertype := OLD.user_type::text;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sync_user_type_trigger'
  ) THEN
    CREATE TRIGGER sync_user_type_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION sync_user_type_columns();
  END IF;
END
$$;

-- Update the handle_new_user function to handle both fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value user_type;
  user_type_text text;
BEGIN
  -- Try to extract user_type from metadata
  BEGIN
    -- First try to get it from raw_user_meta_data
    user_type_text := new.raw_user_meta_data->>'user_type';
    IF user_type_text IS NULL THEN
      user_type_text := new.raw_user_meta_data->>'userType';
    END IF;
    
    IF user_type_text IS NOT NULL THEN
      user_type_value := user_type_text::user_type;
    ELSE
      -- Default to patient if not found
      user_type_value := 'patient'::user_type;
      user_type_text := 'patient';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Default to patient if conversion fails
    user_type_value := 'patient'::user_type;
    user_type_text := 'patient';
  END;

  -- Insert the profile with both fields
  INSERT INTO public.profiles (id, email, user_type, usertype)
  VALUES (new.id, new.email, user_type_value, user_type_text);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the create_profile_for_user function to handle both fields
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL,
  user_mobile text DEFAULT NULL,
  user_type text DEFAULT 'patient'
)
RETURNS void AS $$
DECLARE
  user_type_value user_type;
BEGIN
  -- Convert user_type to enum
  BEGIN
    user_type_value := user_type::user_type;
  EXCEPTION WHEN OTHERS THEN
    user_type_value := 'patient'::user_type;
  END;

  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Insert new profile with both fields
    INSERT INTO public.profiles (id, email, name, mobile, user_type, usertype)
    VALUES (user_id, user_email, user_name, user_mobile, user_type_value, user_type);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;