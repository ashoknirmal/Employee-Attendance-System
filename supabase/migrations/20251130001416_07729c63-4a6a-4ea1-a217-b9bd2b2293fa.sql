-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('employee', 'manager');

-- Create enum for attendance status
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half-day');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  status attendance_status NOT NULL DEFAULT 'present',
  total_hours DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create function to automatically insert profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, employee_id, department, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'employee_id', 'EMP' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0')),
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
-- Users can view all profiles (for manager dashboard)
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for attendance
-- Employees can view their own attendance
CREATE POLICY "Employees can view own attendance"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Employees can insert their own attendance
CREATE POLICY "Employees can insert own attendance"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Employees can update their own attendance
CREATE POLICY "Employees can update own attendance"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_status ON public.attendance(status);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_employee_id ON public.profiles(employee_id);