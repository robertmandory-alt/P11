import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPersonnelInsert() {
    console.log('🧪 Testing personnel insertion...');
    
    // First, check the table structure
    const { data: structure, error: structError } = await supabase
        .from('personnel')
        .select('*')
        .limit(0);
    
    if (structError) {
        console.error('❌ Error checking table structure:', structError.message);
    }
    
    // Try to insert a test personnel
    const testPersonnel = {
        name: 'تست شخص',
        first_name: 'تست',
        last_name: 'شخص',
        national_id: '1234567890',
        employment_status: 'Official',
        productivity_status: 'Productive',
        driver_status: 'Non-Driver',
        work_experience: '0-4'
    };
    
    console.log('📝 Attempting to insert:', testPersonnel);
    
    const { data, error } = await supabase
        .from('personnel')
        .insert(testPersonnel)
        .select()
        .single();
    
    if (error) {
        console.error('❌ Error inserting personnel:', error);
        console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
    } else {
        console.log('✅ Personnel inserted successfully:', data);
        
        // Clean up - delete the test record
        const { error: deleteError } = await supabase
            .from('personnel')
            .delete()
            .eq('id', data.id);
            
        if (deleteError) {
            console.error('⚠️  Error cleaning up test record:', deleteError.message);
        } else {
            console.log('🗑️  Test record cleaned up successfully');
        }
    }
}

testPersonnelInsert();