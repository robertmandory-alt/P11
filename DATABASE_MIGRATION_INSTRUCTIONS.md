# Database Migration Instructions

## Important: SQL Schema Changes Required

Before the application can work with the new features, you MUST execute the following SQL in your Supabase SQL Editor.

### How to Execute

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/frcrtkfyuejqgclrlpna/sql
2. Click on "SQL Editor" in the left sidebar
3. Click "+ New query"
4. Copy and paste the SQL below
5. Click "Run" to execute the migration

### Migration SQL

```sql
-- ========================================
-- MIGRATION: Add Personnel Name and Work Experience Fields
-- Date: 2025-10-04
-- Description: Split name field into first_name/last_name and add work_experience
-- ========================================

-- Step 1: Add new columns to personnel table
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT;

-- Step 2: Add check constraint for work_experience
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'personnel_work_experience_check'
    ) THEN
        ALTER TABLE public.personnel 
        ADD CONSTRAINT personnel_work_experience_check 
        CHECK (work_experience IN ('0-4', '4-8', '8-12', '12-16', '16+'));
    END IF;
END $$;

-- Step 3: Migrate existing data from name field to first_name and last_name
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

-- Step 4: Make first_name NOT NULL after data migration
ALTER TABLE public.personnel 
ALTER COLUMN first_name SET NOT NULL;

-- Step 5: Verify the changes
SELECT id, name, first_name, last_name, work_experience FROM public.personnel;
```

### Expected Results

After running this migration:

1. **New Columns Added:**
   - `first_name` (TEXT, NOT NULL) - نام
   - `last_name` (TEXT) - نام خانوادگی
   - `work_experience` (TEXT with CHECK constraint) - سابقه کاری

2. **Existing Data Migrated:**
   - All existing names split into first_name and last_name
   - Original `name` field preserved for backward compatibility

3. **Work Experience Options:**
   - `0-4` - ۰ تا ۴ سال
   - `4-8` - ۴ تا ۸ سال
   - `8-12` - ۸ تا ۱۲ سال
   - `12-16` - ۱۲ تا ۱۶ سال
   - `16+` - ۱۶ سال به بالا

### Verification

After running the migration, verify it worked correctly:

```sql
-- Check column structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'personnel' 
AND column_name IN ('first_name', 'last_name', 'work_experience');

-- Check data migration
SELECT id, name, first_name, last_name, work_experience 
FROM public.personnel 
LIMIT 10;
```

### Troubleshooting

If you encounter any errors:

1. **"column already exists"** - This is fine, the migration is idempotent
2. **"violates not-null constraint"** - Check that all personnel have at least a first_name
3. **"constraint already exists"** - This is fine, the constraint check prevents duplicates

### Rollback (If Needed)

If you need to rollback this migration:

```sql
-- WARNING: This will delete the new columns and their data
ALTER TABLE public.personnel 
DROP COLUMN IF EXISTS first_name CASCADE,
DROP COLUMN IF EXISTS last_name CASCADE,
DROP COLUMN IF EXISTS work_experience CASCADE;
```

## Next Steps

After successfully running this migration:

1. ✅ Database schema is updated
2. ✅ Application code is ready
3. ✅ Start the development server
4. ✅ Test the Personnel Management page
5. ✅ Test the Performance Monitoring features

## Notes

- The original `name` column is kept for backward compatibility
- New records should populate both `name` and `first_name`/`last_name`
- The application automatically combines first_name and last_name for display
