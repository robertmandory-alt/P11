# Supabase Database Setup Guide

## Quick Setup Instructions

**IMPORTANT**: You need to manually create the database schema in your Supabase dashboard before the application will work properly.

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project: https://frcrtkfyuejqgclrlpna.supabase.co
2. Click on "SQL Editor" in the left sidebar

### Step 2: Execute the Database Schema

Copy and paste the following SQL commands one by one into the SQL Editor and execute them:

```sql
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
    year_month TEXT NOT NULL,
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
```

## Admin User Setup

After creating the database schema:

1. **Sign up manually**: Use username: `admin` and password: `admin1`
2. **Update to admin**: Manually update role in Supabase dashboard

**Final Login Credentials:**
- Username: admin
- Password: admin1

---

**Note**: Execute all SQL commands in the Supabase SQL Editor in order.