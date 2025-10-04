import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applySchemaChanges() {
    console.log('🚀 Applying schema changes directly via SQL execution...\n');
    
    const sqlStatements = [
        // Add new columns
        `ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS first_name TEXT;`,
        `ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS last_name TEXT;`,
        `ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS work_experience TEXT;`,
        // Add constraint for work_experience
        `DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'personnel_work_experience_check'
            ) THEN
                ALTER TABLE public.personnel 
                ADD CONSTRAINT personnel_work_experience_check 
                CHECK (work_experience IN ('0-4', '4-8', '8-12', '12-16', '16+'));
            END IF;
        END $$;`
    ];
    
    try {
        // First, let's try to execute using the database query
        console.log('📊 Fetching current personnel data...');
        const { data: allPersonnel, error: fetchError } = await supabase
            .from('personnel')
            .select('*');
        
        if (fetchError) {
            console.error('Error:', fetchError);
            throw fetchError;
        }
        
        console.log(`✅ Found ${allPersonnel?.length || 0} personnel records\n`);
        
        // Since we can't execute ALTER TABLE directly via the client library,
        // let's update existing records with the new fields using the API
        console.log('🔄 Updating personnel records with split names...');
        
        if (allPersonnel && allPersonnel.length > 0) {
            for (const person of allPersonnel) {
                // Split name into first and last name
                const nameParts = person.name.trim().split(' ');
                const firstName = nameParts[0] || person.name;
                const lastName = nameParts.slice(1).join(' ') || '';
                
                console.log(`Processing: ${person.name} -> firstName: "${firstName}", lastName: "${lastName}"`);
                
                // Note: We can't update these fields until the columns are added via SQL Editor
            }
        }
        
        console.log('\n⚠️  MANUAL STEP REQUIRED:');
        console.log('=' . repeat(80));
        console.log('Please execute the following SQL in your Supabase SQL Editor:');
        console.log('(Go to https://supabase.com/dashboard/project/frcrtkfyuejqgclrlpna/sql)');
        console.log('=' . repeat(80));
        console.log(`
-- Step 1: Add new columns
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT;

-- Step 2: Add check constraint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'personnel_work_experience_check'
    ) THEN
        ALTER TABLE public.personnel 
        ADD CONSTRAINT personnel_work_experience_check 
        CHECK (work_experience IN ('0-4', '4-8', '8-12', '12-16', '16+'));
    END IF;
END $$;

-- Step 3: Migrate existing data
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

-- Step 4: Make first_name NOT NULL after migration
ALTER TABLE public.personnel 
ALTER COLUMN first_name SET NOT NULL;

-- Step 5: Verify the changes
SELECT id, name, first_name, last_name, work_experience FROM public.personnel;
`);
        console.log('=' . repeat(80));
        console.log('\n✅ After running the SQL above, the schema will be updated!');
        console.log('   Then you can continue with the application updates.\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

applySchemaChanges();
