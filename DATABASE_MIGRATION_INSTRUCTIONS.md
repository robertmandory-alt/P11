# Database Migration Instructions

## ⚠️ IMPORTANT: Database Schema Update Required

Before running the updated application, you MUST update the Supabase database schema to add the new fields to the `personnel` table.

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/frcrtkfyuejqgclrlpna
2. Click on "SQL Editor" in the left sidebar
3. Click "New query" to create a new SQL query

### 2. Execute the Migration SQL

Copy and paste the following SQL into the SQL Editor and click "Run":

```sql
-- ============================================================================
-- Personnel Table Schema Update
-- Date: 2025-10-04
-- Description: Add first_name, last_name, and work_experience fields
-- ============================================================================

-- Step 1: Add new columns to the personnel table
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT;

-- Step 2: Add check constraint for work_experience field
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'personnel_work_experience_check'
    ) THEN
        ALTER TABLE public.personnel 
        ADD CONSTRAINT personnel_work_experience_check 
        CHECK (work_experience IN ('0-4', '4-8', '8-12', '12-16', '16+'));
    END IF;
END $$;

-- Step 3: Migrate existing data from 'name' field to first_name and last_name
-- This splits full names into first and last names
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
SELECT id, name, first_name, last_name, work_experience 
FROM public.personnel 
LIMIT 10;
```

### 3. Verify the Migration

After running the SQL above:

1. Check the output in the "Results" section at the bottom
2. You should see the personnel records with the new `first_name` and `last_name` columns populated
3. The `work_experience` column will be NULL for existing records (can be updated in the application)

### 4. Test the Migration

Run the verification script to ensure everything worked correctly:

```bash
cd /home/user/webapp
node update-personnel-schema.js
```

You should see output confirming that the new columns exist:

```
✅ New columns found! Schema update appears to be complete.
Sample with new fields: { id: '...', name: '...', first_name: '...', last_name: '...', work_experience: null }
```

## What Changed?

### Added Fields

1. **first_name** (TEXT, NOT NULL)
   - Stores the first name of personnel
   - Migrated from the first part of the existing `name` field

2. **last_name** (TEXT)
   - Stores the last name of personnel
   - Migrated from the remaining part of the existing `name` field

3. **work_experience** (TEXT, OPTIONAL)
   - Stores work experience category
   - Valid values: '0-4', '4-8', '8-12', '12-16', '16+'
   - Represents years of experience

### Backward Compatibility

- The `name` field is kept for backward compatibility
- New personnel records will have both `name` (full name) and `first_name`/`last_name`
- Existing code that uses `name` will continue to work
- New code should use `first_name` and `last_name` separately

## Troubleshooting

### If migration fails:

1. **Error: column already exists**
   - This is fine! It means the migration was already run
   - The script uses `ADD COLUMN IF NOT EXISTS` to prevent errors

2. **Error: constraint already exists**
   - This is also fine! The script handles this automatically

3. **Data migration issues**
   - Check if the `name` field has the expected format
   - For names without spaces, everything goes to `first_name`
   - For multi-part names, first word goes to `first_name`, rest to `last_name`

4. **Need to rollback**
   ```sql
   -- Remove the new columns (WARNING: This will delete data!)
   ALTER TABLE public.personnel DROP COLUMN IF EXISTS first_name;
   ALTER TABLE public.personnel DROP COLUMN IF EXISTS last_name;
   ALTER TABLE public.personnel DROP COLUMN IF EXISTS work_experience;
   ```

## Next Steps

After successful migration:

1. ✅ Start the development server
2. ✅ Test personnel management features
3. ✅ Verify that existing personnel display correctly
4. ✅ Test adding new personnel with separate first/last names
5. ✅ Test work experience dropdown selection

## Support

If you encounter any issues with the migration:

1. Check the Supabase logs for error details
2. Review the SQL output in the SQL Editor
3. Verify that your database user has ALTER TABLE permissions
4. Contact support if problems persist
