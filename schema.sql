-- Emergency Personnel Performance Management System
-- Complete Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create bases table (organizational units)
CREATE TABLE IF NOT EXISTS public.bases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Urban', 'Road', 'Bus', 'Headquarters', 'Support')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create personnel table (staff members)
CREATE TABLE IF NOT EXISTS public.personnel (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    national_id TEXT UNIQUE NOT NULL,
    employment_status TEXT NOT NULL CHECK (employment_status IN ('Official', 'Contractual')),
    productivity_status TEXT NOT NULL CHECK (productivity_status IN ('Productive', 'Non-Productive')),
    driver_status TEXT NOT NULL CHECK (driver_status IN ('Driver', 'Non-Driver')),
    base_id UUID REFERENCES public.bases(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create profiles table (links to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    personnel_id UUID REFERENCES public.personnel(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    base_id UUID REFERENCES public.bases(id),
    profile_completed BOOLEAN DEFAULT false,
    status TEXT CHECK (status IN ('pending', 'active')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create shifts table (work shift types)
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('Work', 'Leave', 'Miscellaneous')),
    title TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    equivalent_hours INTEGER NOT NULL DEFAULT 0,
    holiday_hours INTEGER DEFAULT 0,
    effect TEXT CHECK (effect IN ('Incremental', 'Decremental')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create performance_records table (tracks personnel performance)
CREATE TABLE IF NOT EXISTS public.performance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    personnel_id UUID NOT NULL REFERENCES public.personnel(id),
    day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
    shift_id UUID NOT NULL REFERENCES public.shifts(id),
    base_id UUID NOT NULL REFERENCES public.bases(id),
    submitting_base_id UUID NOT NULL REFERENCES public.bases(id),
    year_month TEXT NOT NULL, -- e.g., "1403-6"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create performance_submissions table (tracks submission status)
CREATE TABLE IF NOT EXISTS public.performance_submissions (
    year_month TEXT NOT NULL,
    base_id UUID NOT NULL REFERENCES public.bases(id),
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (year_month, base_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_personnel_id ON public.profiles(personnel_id);
CREATE INDEX IF NOT EXISTS idx_profiles_base_id ON public.profiles(base_id);
CREATE INDEX IF NOT EXISTS idx_personnel_national_id ON public.personnel(national_id);
CREATE INDEX IF NOT EXISTS idx_personnel_base_id ON public.personnel(base_id);
CREATE INDEX IF NOT EXISTS idx_shifts_code ON public.shifts(code);
CREATE INDEX IF NOT EXISTS idx_performance_records_year_month ON public.performance_records(year_month);
CREATE INDEX IF NOT EXISTS idx_performance_records_personnel_id ON public.performance_records(personnel_id);
CREATE INDEX IF NOT EXISTS idx_performance_records_submitting_base ON public.performance_records(submitting_base_id);
CREATE INDEX IF NOT EXISTS idx_performance_submissions_status ON public.performance_submissions(status);

-- Add unique constraint for performance records to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS performance_records_unique_submission 
ON public.performance_records (year_month, personnel_id, day, submitting_base_id, shift_id, base_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can view bases" ON public.bases;
DROP POLICY IF EXISTS "Admins can manage bases" ON public.bases;

DROP POLICY IF EXISTS "Authenticated users can view personnel" ON public.personnel;
DROP POLICY IF EXISTS "Admins can manage personnel" ON public.personnel;

DROP POLICY IF EXISTS "Authenticated users can view shifts" ON public.shifts;
DROP POLICY IF EXISTS "Admins can manage shifts" ON public.shifts;

DROP POLICY IF EXISTS "Users can view all submitted records" ON public.performance_records;
DROP POLICY IF EXISTS "Users can manage their base records" ON public.performance_records;

DROP POLICY IF EXISTS "Users can view relevant submissions" ON public.performance_submissions;
DROP POLICY IF EXISTS "Users can manage their base submissions" ON public.performance_submissions;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Bases policies
CREATE POLICY "Authenticated users can view bases" ON public.bases
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage bases" ON public.bases
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Personnel policies
CREATE POLICY "Authenticated users can view personnel" ON public.personnel
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage personnel" ON public.personnel
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Shifts policies
CREATE POLICY "Authenticated users can view shifts" ON public.shifts
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage shifts" ON public.shifts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Performance records policies
CREATE POLICY "Users can view all submitted records" ON public.performance_records
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.performance_submissions ps 
            WHERE ps.year_month = performance_records.year_month 
            AND ps.base_id = performance_records.submitting_base_id 
            AND ps.status = 'submitted'
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND (p.role = 'admin' OR p.base_id = performance_records.submitting_base_id)
        )
    );

CREATE POLICY "Users can manage their base records" ON public.performance_records
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND (p.role = 'admin' OR p.base_id = submitting_base_id)
        )
    );

-- Performance submissions policies  
CREATE POLICY "Users can view relevant submissions" ON public.performance_submissions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND (p.role = 'admin' OR p.base_id = base_id)
        )
    );

CREATE POLICY "Users can manage their base submissions" ON public.performance_submissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND (p.role = 'admin' OR p.base_id = base_id)
        )
    );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, role, status)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        'user',
        'pending'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_bases_updated_at ON public.bases;
DROP TRIGGER IF EXISTS update_personnel_updated_at ON public.personnel;
DROP TRIGGER IF EXISTS update_shifts_updated_at ON public.shifts;
DROP TRIGGER IF EXISTS update_performance_records_updated_at ON public.performance_records;
DROP TRIGGER IF EXISTS update_performance_submissions_updated_at ON public.performance_submissions;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON public.bases
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON public.personnel
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_performance_records_updated_at BEFORE UPDATE ON public.performance_records
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_performance_submissions_updated_at BEFORE UPDATE ON public.performance_submissions
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Insert sample data
-- Insert a headquarters base first
INSERT INTO public.bases (name, number, type, description) 
VALUES (
    'مرکز فرماندهی اصلی',
    'HQ-001', 
    'Headquarters',
    'مرکز فرماندهی و مدیریت اصلی سازمان'
) ON CONFLICT (number) DO NOTHING;

-- Get the base ID for reference
DO $$
DECLARE
    base_uuid UUID;
    personnel_uuid UUID;
BEGIN
    -- Get the base ID
    SELECT id INTO base_uuid FROM public.bases WHERE number = 'HQ-001' LIMIT 1;
    
    -- Insert sample personnel
    INSERT INTO public.personnel (name, national_id, employment_status, productivity_status, driver_status, base_id) 
    VALUES (
        'مدیر سیستم',
        '0000000000',
        'Official',
        'Productive', 
        'Non-Driver',
        base_uuid
    ) ON CONFLICT (national_id) DO NOTHING;
    
    -- Insert sample shifts
    INSERT INTO public.shifts (type, title, code, equivalent_hours, holiday_hours, effect) 
    VALUES 
        ('Work', 'شیفت کاری عادی', 'WORK-8H', 8, 0, 'Incremental'),
        ('Leave', 'مرخصی روزانه', 'LEAVE-DAILY', 0, 0, NULL)
    ON CONFLICT (code) DO NOTHING;
END $$;