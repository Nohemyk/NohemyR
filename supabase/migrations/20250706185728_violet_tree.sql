/*
  # Complete Database Schema Setup for VP Technology Indicators System

  1. New Tables
    - `profiles` - User profiles with roles and areas
    - `indicators` - KPI indicators with targets and actual values
    - `activities` - Activities associated with indicators
    - `risks` - Risk management with impact and probability
    - `import_history` - Track data import operations

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for role-based access
    - Secure data access based on user roles and areas

  3. Automation
    - Triggers for automatic timestamp updates
    - Automatic profile creation for new users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'area_manager', 'analyst', 'consultant')),
  area TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Create indicators table
CREATE TABLE IF NOT EXISTS indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  target NUMERIC NOT NULL,
  actual NUMERIC NOT NULL,
  measurement_date DATE NOT NULL,
  responsible TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('achieved', 'at_risk', 'critical', 'in_progress')),
  observations TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'suspended', 'postponed')),
  progress INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  estimated_end_date DATE NOT NULL,
  actual_end_date DATE,
  responsible TEXT NOT NULL,
  observations TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create risks table
CREATE TABLE IF NOT EXISTS risks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  category TEXT NOT NULL,
  impact TEXT NOT NULL CHECK (impact IN ('alto', 'medio', 'bajo')),
  probability TEXT NOT NULL CHECK (probability IN ('alta', 'media', 'baja')),
  exposure INTEGER NOT NULL,
  mitigation_plan TEXT NOT NULL,
  mitigation_status TEXT NOT NULL CHECK (mitigation_status IN ('pending', 'in_progress', 'completed')),
  status TEXT NOT NULL CHECK (status IN ('active', 'mitigated', 'monitoring')),
  responsible TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create import history table
CREATE TABLE IF NOT EXISTS import_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash TEXT NOT NULL,
  import_date TIMESTAMPTZ DEFAULT NOW(),
  file_type TEXT NOT NULL,
  indicators_count INTEGER DEFAULT 0,
  activities_count INTEGER DEFAULT 0,
  risks_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  imported_by UUID REFERENCES auth.users(id) NOT NULL,
  areas_affected TEXT[] DEFAULT '{}'
);

-- Enable RLS on all tables (only if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'profiles' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'indicators' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'activities' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'risks' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'import_history' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Profiles policies
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

  -- Indicators policies
  DROP POLICY IF EXISTS "Users can view indicators based on role" ON indicators;
  CREATE POLICY "Users can view indicators based on role" ON indicators
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = indicators.area OR profiles.role = 'consultant')
      )
    );

  DROP POLICY IF EXISTS "Users can insert indicators in their area" ON indicators;
  CREATE POLICY "Users can insert indicators in their area" ON indicators
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = indicators.area)
      )
    );

  DROP POLICY IF EXISTS "Users can update indicators in their area" ON indicators;
  CREATE POLICY "Users can update indicators in their area" ON indicators
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = indicators.area)
      )
    );

  DROP POLICY IF EXISTS "Users can delete indicators in their area" ON indicators;
  CREATE POLICY "Users can delete indicators in their area" ON indicators
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = indicators.area)
      )
    );

  -- Activities policies
  DROP POLICY IF EXISTS "Users can view activities based on role" ON activities;
  CREATE POLICY "Users can view activities based on role" ON activities
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = activities.area OR profiles.role = 'consultant')
      )
    );

  DROP POLICY IF EXISTS "Users can insert activities in their area" ON activities;
  CREATE POLICY "Users can insert activities in their area" ON activities
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = activities.area)
      )
    );

  DROP POLICY IF EXISTS "Users can update activities in their area" ON activities;
  CREATE POLICY "Users can update activities in their area" ON activities
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = activities.area)
      )
    );

  DROP POLICY IF EXISTS "Users can delete activities in their area" ON activities;
  CREATE POLICY "Users can delete activities in their area" ON activities
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = activities.area)
      )
    );

  -- Risks policies
  DROP POLICY IF EXISTS "Users can view risks based on role" ON risks;
  CREATE POLICY "Users can view risks based on role" ON risks
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = risks.area OR profiles.role = 'consultant')
      )
    );

  DROP POLICY IF EXISTS "Users can insert risks in their area" ON risks;
  CREATE POLICY "Users can insert risks in their area" ON risks
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = risks.area)
      )
    );

  DROP POLICY IF EXISTS "Users can update risks in their area" ON risks;
  CREATE POLICY "Users can update risks in their area" ON risks
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = risks.area)
      )
    );

  DROP POLICY IF EXISTS "Users can delete risks in their area" ON risks;
  CREATE POLICY "Users can delete risks in their area" ON risks
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.area = risks.area)
      )
    );

  -- Import history policies
  DROP POLICY IF EXISTS "Users can view import history" ON import_history;
  CREATE POLICY "Users can view import history" ON import_history
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.id = import_history.imported_by)
      )
    );

  DROP POLICY IF EXISTS "Users can insert import history" ON import_history;
  CREATE POLICY "Users can insert import history" ON import_history
    FOR INSERT WITH CHECK (auth.uid() = imported_by);
END $$;

-- Function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop and recreate to avoid conflicts)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_indicators_updated_at ON indicators;
  CREATE TRIGGER update_indicators_updated_at BEFORE UPDATE ON indicators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
  CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_risks_updated_at ON risks;
  CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, area)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'analyst'),
    NEW.raw_user_meta_data->>'area'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration (drop and recreate to avoid conflicts)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
END $$;