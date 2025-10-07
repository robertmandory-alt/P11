import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPersonnelSchema() {
    console.log('🔍 Checking personnel table schema...');
    
    // Get existing personnel to see the actual structure
    const { data: personnel, error } = await supabase
        .from('personnel')
        .select('*')
        .limit(3);
    
    if (error) {
        console.error('❌ Error fetching personnel:', error.message);
        return;
    }
    
    console.log('📊 Personnel records found:', personnel.length);
    if (personnel.length > 0) {
        console.log('📋 Sample personnel record structure:');
        console.log(JSON.stringify(personnel[0], null, 2));
        
        console.log('📝 All column names in first record:');
        console.log(Object.keys(personnel[0]));
    } else {
        console.log('⚠️  No personnel records found');
    }
}

checkPersonnelSchema();