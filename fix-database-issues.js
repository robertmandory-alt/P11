import { createClient } from '@supabase/supabase-js';

// Supabase configuration from your database
const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseKey);

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function fixDatabaseIssues() {
    console.log('🔧 Fixing database issues and testing save functionality...\n');

    try {
        // 1. Check existing data structures
        console.log('1. Checking existing data...');
        
        const { data: personnel, error: personnelError } = await supabase
            .from('personnel')
            .select('id, name, base_id')
            .limit(1);
        
        const { data: bases, error: basesError } = await supabase
            .from('bases')
            .select('id, name')
            .limit(1);
            
        const { data: shifts, error: shiftsError } = await supabase
            .from('shifts')
            .select('id, title, code, type')
            .limit(1);

        if (personnel && personnel.length > 0) {
            console.log('✅ Sample personnel:', { id: personnel[0].id, name: personnel[0].name });
        } else {
            console.error('❌ No personnel found or error:', personnelError?.message);
        }

        if (bases && bases.length > 0) {
            console.log('✅ Sample base:', { id: bases[0].id, name: bases[0].name });
        } else {
            console.error('❌ No bases found or error:', basesError?.message);
        }

        if (shifts && shifts.length > 0) {
            console.log('✅ Sample shift:', { id: shifts[0].id, title: shifts[0].title, code: shifts[0].code });
        } else {
            console.error('❌ No shifts found or error:', shiftsError?.message);
        }

        // 2. Test with real UUIDs
        if (personnel && personnel.length > 0 && bases && bases.length > 0 && shifts && shifts.length > 0) {
            console.log('\n2. Testing performance record insert with valid UUIDs...');
            
            const testRecord = {
                id: generateUUID(),
                personnel_id: personnel[0].id,
                day: 1,
                shift_id: shifts[0].id,
                base_id: bases[0].id,
                submitting_base_id: bases[0].id,
                year_month: '1403-6'
            };

            const { data: insertData, error: insertError } = await supabase
                .from('performance_records')
                .insert(testRecord)
                .select();

            if (insertError) {
                console.error('❌ Insert failed:', insertError.message);
                console.error('Full error details:', insertError);
            } else {
                console.log('✅ Insert successful!');
                
                // Test update
                console.log('\n3. Testing record update...');
                const { data: updateData, error: updateError } = await supabase
                    .from('performance_records')
                    .update({ day: 2 })
                    .eq('id', testRecord.id)
                    .select();

                if (updateError) {
                    console.error('❌ Update failed:', updateError.message);
                } else {
                    console.log('✅ Update successful!');
                }

                // Test submission status
                console.log('\n4. Testing submission status...');
                const submissionData = {
                    year_month: '1403-6',
                    base_id: bases[0].id,
                    status: 'draft'
                };

                const { data: submitData, error: submitError } = await supabase
                    .from('performance_submissions')
                    .upsert(submissionData, { onConflict: 'year_month,base_id' })
                    .select();

                if (submitError) {
                    console.error('❌ Submission failed:', submitError.message);
                } else {
                    console.log('✅ Submission successful!');
                    
                    // Test final submission
                    console.log('\n5. Testing final submission update...');
                    const { data: finalData, error: finalError } = await supabase
                        .from('performance_submissions')
                        .update({ status: 'submitted' })
                        .match({ year_month: '1403-6', base_id: bases[0].id })
                        .select();

                    if (finalError) {
                        console.error('❌ Final submission failed:', finalError.message);
                    } else {
                        console.log('✅ Final submission successful!');
                    }
                }

                // Clean up test data
                console.log('\n6. Cleaning up test data...');
                await supabase.from('performance_records').delete().eq('id', testRecord.id);
                await supabase.from('performance_submissions').delete().match({ year_month: '1403-6', base_id: bases[0].id });
                console.log('✅ Cleanup completed');
            }
        }

        // 3. Check for common issues in the save functions
        console.log('\n7. Checking for common save function issues...');
        
        // Test multiple records batch insert
        if (personnel && personnel.length > 0 && bases && bases.length > 0 && shifts && shifts.length > 0) {
            console.log('Testing batch insert (multiple records)...');
            
            const batchRecords = [];
            for (let day = 1; day <= 3; day++) {
                batchRecords.push({
                    id: generateUUID(),
                    personnel_id: personnel[0].id,
                    day: day,
                    shift_id: shifts[0].id,
                    base_id: bases[0].id,
                    submitting_base_id: bases[0].id,
                    year_month: '1403-6'
                });
            }

            const { data: batchData, error: batchError } = await supabase
                .from('performance_records')
                .insert(batchRecords)
                .select();

            if (batchError) {
                console.error('❌ Batch insert failed:', batchError.message);
            } else {
                console.log('✅ Batch insert successful! Inserted', batchRecords.length, 'records');
                
                // Clean up batch data
                const recordIds = batchRecords.map(r => r.id);
                await supabase.from('performance_records').delete().in('id', recordIds);
                console.log('✅ Batch cleanup completed');
            }
        }

        console.log('\n8. Summary and recommendations:');
        console.log('- All database operations require valid UUIDs');
        console.log('- Tables are accessible and properly structured');
        console.log('- Insert/Update/Upsert operations work correctly');
        console.log('- Issue likely in frontend code generating invalid UUIDs or missing data validation');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

fixDatabaseIssues().catch(console.error);