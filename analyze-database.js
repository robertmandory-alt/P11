import { createClient } from '@supabase/supabase-js';

// Supabase configuration from your database
const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDatabase() {
    console.log('🔍 Analyzing database structure...\n');

    try {
        // Test connection
        console.log('1. Testing connection...');
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
        
        if (profileError) {
            console.error('❌ Connection failed:', profileError.message);
            return;
        }
        console.log('✅ Connection successful!\n');

        // Analyze performance_records table structure
        console.log('2. Analyzing performance_records table...');
        const { data: recordSample, error: recordError } = await supabase
            .from('performance_records')
            .select('*')
            .limit(1);
        
        if (recordError) {
            console.error('❌ Error accessing performance_records:', recordError.message);
        } else {
            console.log('✅ performance_records table accessible');
            if (recordSample && recordSample.length > 0) {
                console.log('Sample record structure:', Object.keys(recordSample[0]));
            }
        }

        // Analyze performance_submissions table structure
        console.log('\n3. Analyzing performance_submissions table...');
        const { data: submissionSample, error: submissionError } = await supabase
            .from('performance_submissions')
            .select('*')
            .limit(1);
        
        if (submissionError) {
            console.error('❌ Error accessing performance_submissions:', submissionError.message);
        } else {
            console.log('✅ performance_submissions table accessible');
            if (submissionSample && submissionSample.length > 0) {
                console.log('Sample submission structure:', Object.keys(submissionSample[0]));
            }
        }

        // Test a sample performance_records insert
        console.log('\n4. Testing performance_records insert...');
        const testRecord = {
            id: 'test-' + Date.now(),
            personnel_id: '00000000-0000-0000-0000-000000000001', // Test ID
            day: 1,
            shift_id: 'test-shift-id',
            base_id: 'test-base-id',
            submitting_base_id: 'test-base-id',
            year_month: '1403-6'
        };

        const { data: insertData, error: insertError } = await supabase
            .from('performance_records')
            .insert(testRecord)
            .select();

        if (insertError) {
            console.error('❌ Insert test failed:', insertError.message);
            
            // Check specific constraint errors
            if (insertError.message.includes('foreign key')) {
                console.log('📋 Foreign key constraint issue detected');
                
                // Check related tables
                console.log('\n5. Checking related tables...');
                
                // Check personnel table
                const { data: personnel, error: personnelError } = await supabase
                    .from('personnel')
                    .select('id, name')
                    .limit(3);
                if (personnel) {
                    console.log('✅ Personnel table accessible, sample IDs:', personnel.map(p => ({ id: p.id, name: p.name })));
                } else {
                    console.error('❌ Personnel table error:', personnelError?.message);
                }

                // Check shifts table
                const { data: shifts, error: shiftsError } = await supabase
                    .from('shifts')
                    .select('id, title, code')
                    .limit(3);
                if (shifts) {
                    console.log('✅ Shifts table accessible, sample IDs:', shifts.map(s => ({ id: s.id, title: s.title, code: s.code })));
                } else {
                    console.error('❌ Shifts table error:', shiftsError?.message);
                }

                // Check bases table
                const { data: bases, error: basesError } = await supabase
                    .from('bases')
                    .select('id, name')
                    .limit(3);
                if (bases) {
                    console.log('✅ Bases table accessible, sample IDs:', bases.map(b => ({ id: b.id, name: b.name })));
                } else {
                    console.error('❌ Bases table error:', basesError?.message);
                }
            }
        } else {
            console.log('✅ Insert test successful!');
            // Clean up test record
            await supabase
                .from('performance_records')
                .delete()
                .eq('id', testRecord.id);
        }

        // Test performance_submissions table
        console.log('\n6. Testing performance_submissions table...');
        const testSubmission = {
            year_month: '1403-6',
            base_id: 'test-base-id',
            status: 'draft'
        };

        const { data: submitData, error: submitError } = await supabase
            .from('performance_submissions')
            .upsert(testSubmission, { onConflict: 'year_month,base_id' })
            .select();

        if (submitError) {
            console.error('❌ Submission test failed:', submitError.message);
        } else {
            console.log('✅ Submission test successful!');
            // Clean up test submission
            await supabase
                .from('performance_submissions')
                .delete()
                .match({ year_month: '1403-6', base_id: 'test-base-id' });
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

analyzeDatabase().catch(console.error);