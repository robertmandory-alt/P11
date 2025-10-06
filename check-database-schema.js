import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
    console.log('🔍 Checking database schema...\n');
    
    try {
        // Get list of tables in public schema
        const { data: tables, error } = await supabase
            .rpc('list_tables');
            
        if (error) {
            // Alternative method - try to select from information_schema
            const queries = [
                'profiles',
                'personnel', 
                'shifts',
                'bases',
                'performance_records',
                'performance_submissions'
            ];
            
            console.log('📊 Checking main tables:');
            for (const table of queries) {
                try {
                    const { data, error, count } = await supabase
                        .from(table)
                        .select('*', { count: 'exact', head: true });
                    
                    if (error) {
                        console.log(`❌ ${table}: ${error.message}`);
                    } else {
                        console.log(`✅ ${table}: ${count} records`);
                    }
                } catch (e) {
                    console.log(`❌ ${table}: Error accessing table`);
                }
            }
        } else {
            console.log('📋 Available tables:', tables);
        }
        
        // Check specific tables we need
        console.log('\n🔬 Detailed schema check:');
        
        // Check performance_records table structure
        const { data: perfRecords, error: perfError } = await supabase
            .from('performance_records')
            .select('*')
            .limit(1);
            
        if (perfError) {
            console.log('❌ performance_records table:', perfError.message);
        } else {
            console.log('✅ performance_records table accessible');
            if (perfRecords && perfRecords.length > 0) {
                console.log('📋 performance_records columns:', Object.keys(perfRecords[0]));
            }
        }
        
        // Check performance_submissions table structure  
        const { data: perfSubs, error: subError } = await supabase
            .from('performance_submissions')
            .select('*')
            .limit(1);
            
        if (subError) {
            console.log('❌ performance_submissions table:', subError.message);
        } else {
            console.log('✅ performance_submissions table accessible');
            if (perfSubs && perfSubs.length > 0) {
                console.log('📋 performance_submissions columns:', Object.keys(perfSubs[0]));
            }
        }
        
        // Check personnel table
        const { data: personnel, error: personnelError } = await supabase
            .from('personnel')
            .select('*')
            .limit(3);
            
        if (personnelError) {
            console.log('❌ personnel table:', personnelError.message);
        } else {
            console.log('✅ personnel table accessible');
            console.log('👥 Sample personnel:', personnel?.length || 0, 'records');
            if (personnel && personnel.length > 0) {
                console.log('📋 personnel columns:', Object.keys(personnel[0]));
            }
        }
        
        // Check shifts table
        const { data: shifts, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .limit(3);
            
        if (shiftsError) {
            console.log('❌ shifts table:', shiftsError.message);
        } else {
            console.log('✅ shifts table accessible');
            console.log('🕐 Sample shifts:', shifts?.length || 0, 'records');
            if (shifts && shifts.length > 0) {
                console.log('📋 shifts columns:', Object.keys(shifts[0]));
            }
        }
        
    } catch (error) {
        console.error('❌ Database schema check failed:', error.message);
    }
}

checkDatabaseSchema();