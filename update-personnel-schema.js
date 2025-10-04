import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updatePersonnelSchema() {
    console.log('🚀 Starting personnel schema update...\n');
    
    try {
        // Check current personnel data
        console.log('📊 Checking current personnel data...');
        const { data: currentPersonnel, error: fetchError } = await supabase
            .from('personnel')
            .select('*')
            .limit(5);
        
        if (fetchError) {
            console.error('Error fetching personnel:', fetchError);
            throw fetchError;
        }
        
        console.log(`Found ${currentPersonnel?.length || 0} personnel records (showing max 5)`);
        if (currentPersonnel && currentPersonnel.length > 0) {
            console.log('Sample record:', currentPersonnel[0]);
        }
        
        console.log('\n⚠️  IMPORTANT: Please run the following SQL in your Supabase SQL Editor:');
        console.log('=' . repeat(80));
        console.log(`
-- Add new columns to personnel table
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT CHECK (work_experience IN ('0-4', '4-8', '8-12', '12-16', '16+'));

-- Migrate existing data
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

-- Make first_name NOT NULL
ALTER TABLE public.personnel 
ALTER COLUMN first_name SET NOT NULL;
        `);
        console.log('=' . repeat(80));
        
        console.log('\n✅ Please execute the SQL above in Supabase dashboard');
        console.log('   Then run this script again to verify the changes.\n');
        
        // Try to check if columns exist
        console.log('🔍 Checking if new columns already exist...');
        const { data: checkData, error: checkError } = await supabase
            .from('personnel')
            .select('id, name, first_name, last_name, work_experience')
            .limit(1);
        
        if (!checkError && checkData) {
            console.log('✅ New columns found! Schema update appears to be complete.');
            console.log('Sample with new fields:', checkData[0]);
        } else {
            console.log('ℹ️  New columns not yet added. Please run the SQL above.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

updatePersonnelSchema();
