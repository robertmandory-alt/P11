import { createClient } from '@supabase/supabase-js';

// Supabase configuration
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

// Simulate the savePerformanceDataForMonth function
async function savePerformanceDataForMonth(year, month, records, totals, status) {
    const key = `${year}-${month}`;
    
    try {
        console.log(`📝 Testing save operation for ${key} with status: ${status}`);
        console.log(`📊 Records to save: ${records.length}`);
        console.log(`📈 Totals to save: ${totals.length}`);
        
        // Get the first available base for testing
        const { data: bases, error: basesError } = await supabase
            .from('bases')
            .select('id, name')
            .limit(1);
            
        if (basesError || !bases || bases.length === 0) {
            console.error('❌ Cannot get base for testing:', basesError?.message);
            return false;
        }
        
        const testBaseId = bases[0].id;
        console.log(`🏢 Using base: ${bases[0].name} (${testBaseId})`);
        
        // 1. Delete old records for this base and month
        console.log('🗑️ Deleting old records...');
        const { error: deleteError } = await supabase
            .from('performance_records')
            .delete()
            .match({ year_month: key, submitting_base_id: testBaseId });
        
        if (deleteError) {
            console.error("❌ Error deleting old records:", deleteError.message);
            return false;
        }
        console.log('✅ Old records deleted successfully');
        
        // 2. Insert new records with proper IDs
        if (records.length > 0) {
            console.log('📝 Inserting new records...');
            const recordsWithIds = records.map(record => ({
                ...record,
                id: record.id || generateUUID(),
                year_month: key,
                submitting_base_id: testBaseId
            }));
            
            const { error: insertError } = await supabase
                .from('performance_records')
                .insert(recordsWithIds);
            
            if (insertError) {
                console.error("❌ Error inserting records:", insertError.message);
                return false;
            }
            console.log('✅ Records inserted successfully');
        }

        // 3. Upsert submission status
        console.log('📤 Updating submission status...');
        const { error: upsertStatusError } = await supabase
            .from('performance_submissions')
            .upsert(
                { year_month: key, base_id: testBaseId, status: status },
                { onConflict: 'year_month,base_id' }
            );
        
        if (upsertStatusError) {
            console.error("❌ Error upserting status:", upsertStatusError.message);
            return false;
        }
        console.log('✅ Submission status updated successfully');

        return true;
    } catch (error) {
        console.error("❌ Unexpected error:", error.message);
        return false;
    }
}

async function testSaveOperations() {
    console.log('🧪 Testing save operations with fixed functions...\n');

    try {
        // Get sample data for testing
        const { data: personnel, error: personnelError } = await supabase
            .from('personnel')
            .select('id, name')
            .limit(1);
            
        const { data: shifts, error: shiftsError } = await supabase
            .from('shifts')
            .select('id, title, code, equivalent_hours')
            .limit(1);
            
        const { data: bases, error: basesError } = await supabase
            .from('bases')
            .select('id, name')
            .limit(1);

        if (!personnel || personnel.length === 0) {
            console.error('❌ No personnel found for testing');
            return;
        }
        
        if (!shifts || shifts.length === 0) {
            console.error('❌ No shifts found for testing');
            return;
        }
        
        if (!bases || bases.length === 0) {
            console.error('❌ No bases found for testing');
            return;
        }

        console.log('✅ Test data retrieved successfully');
        console.log(`👤 Personnel: ${personnel[0].name}`);
        console.log(`⏰ Shift: ${shifts[0].title} (${shifts[0].code})`);
        console.log(`🏢 Base: ${bases[0].name}`);

        // Test 1: Save draft records
        console.log('\n--- Test 1: Save Draft Records ---');
        const testRecords1 = [
            {
                id: generateUUID(),
                personnel_id: personnel[0].id,
                day: 1,
                shift_id: shifts[0].id,
                base_id: bases[0].id,
                submitting_base_id: bases[0].id,
                year_month: '1403-6'
            },
            {
                id: generateUUID(),
                personnel_id: personnel[0].id,
                day: 2,
                shift_id: shifts[0].id,
                base_id: bases[0].id,
                submitting_base_id: bases[0].id,
                year_month: '1403-6'
            }
        ];

        const draftResult = await savePerformanceDataForMonth('1403', '6', testRecords1, [], 'draft');
        console.log(`Draft save result: ${draftResult ? '✅ SUCCESS' : '❌ FAILED'}`);

        // Test 2: Update to submitted status
        console.log('\n--- Test 2: Update to Submitted Status ---');
        const submittedResult = await savePerformanceDataForMonth('1403', '6', testRecords1, [], 'submitted');
        console.log(`Submitted save result: ${submittedResult ? '✅ SUCCESS' : '❌ FAILED'}`);

        // Test 3: Verify data was saved
        console.log('\n--- Test 3: Verify Saved Data ---');
        const { data: savedRecords, error: fetchError } = await supabase
            .from('performance_records')
            .select('*')
            .eq('year_month', '1403-6');

        if (fetchError) {
            console.error('❌ Error fetching saved records:', fetchError.message);
        } else {
            console.log(`✅ Found ${savedRecords.length} saved records`);
        }

        const { data: savedSubmissions, error: fetchSubmissionError } = await supabase
            .from('performance_submissions')
            .select('*')
            .eq('year_month', '1403-6');

        if (fetchSubmissionError) {
            console.error('❌ Error fetching submissions:', fetchSubmissionError.message);
        } else {
            console.log(`✅ Found ${savedSubmissions.length} submission records`);
            if (savedSubmissions.length > 0) {
                console.log(`📋 Status: ${savedSubmissions[0].status}`);
            }
        }

        // Cleanup test data
        console.log('\n--- Cleanup Test Data ---');
        await supabase.from('performance_records').delete().eq('year_month', '1403-6');
        await supabase.from('performance_submissions').delete().eq('year_month', '1403-6');
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testSaveOperations().catch(console.error);