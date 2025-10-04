import fetch from 'node-fetch';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

async function executeSQLMigration() {
    console.log('🚀 Executing SQL migration via Supabase REST API...\n');
    
    const sqlQuery = `
-- Add new columns to personnel table
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT;

-- Add check constraint for work_experience
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'personnel_work_experience_check'
    ) THEN
        ALTER TABLE public.personnel 
        ADD CONSTRAINT personnel_work_experience_check 
        CHECK (work_experience IN ('0-4', '4-8', '8-12', '12-16', '16+'));
    END IF;
END $$;

-- Migrate existing data from name field to first_name and last_name
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

-- Make first_name NOT NULL after data migration
ALTER TABLE public.personnel 
ALTER COLUMN first_name SET NOT NULL;
`;

    try {
        // Try to execute via RPC call
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ query: sqlQuery })
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.log('❌ Direct SQL execution not available via REST API');
            console.log('   This is expected - Supabase doesn\'t allow DDL via REST API\n');
            throw new Error(error);
        }
        
        const result = await response.json();
        console.log('✅ Migration executed successfully!', result);
        
    } catch (error) {
        console.log('ℹ️  As expected, we need to run the migration via Supabase Dashboard SQL Editor\n');
        console.log('📋 INSTRUCTIONS FOR MANUAL SQL EXECUTION:');
        console.log('=' . repeat(80));
        console.log('1. Go to: https://supabase.com/dashboard/project/frcrtkfyuejqgclrlpna/sql');
        console.log('2. Click "New query"');
        console.log('3. Copy and paste the SQL below:');
        console.log('=' . repeat(80));
        console.log(sqlQuery);
        console.log('=' . repeat(80));
        console.log('\n4. Click "Run" to execute the migration');
        console.log('5. After successful execution, proceed with the application updates\n');
    }
}

executeSQLMigration();
