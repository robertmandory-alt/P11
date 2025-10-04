-- Migration: Update personnel table schema
-- Date: 2025-10-04
-- Description: Add first_name, last_name, work_experience fields and migrate existing data

-- Step 1: Add new columns
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT CHECK (work_experience IN ('0-4', '4-8', '8-12', '12-16', '16+'));

-- Step 2: Migrate existing data from 'name' field
-- Split existing names into first_name and last_name
UPDATE public.personnel
SET 
    first_name = CASE 
        WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1)
        ELSE name
    END,
    last_name = CASE 
        WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
        ELSE ''
    END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: Make first_name NOT NULL after migration
ALTER TABLE public.personnel 
ALTER COLUMN first_name SET NOT NULL;

-- Step 4: Keep the 'name' column for backward compatibility
-- Update it to be a computed full name (we'll handle this in the application)
-- The 'name' column will continue to exist for display purposes

-- Note: The 'name' column is kept for backward compatibility with existing code
-- New code should use first_name and last_name separately
