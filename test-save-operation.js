import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSaveOperation() {
    console.log('🧪 Testing save operation...\n');
    
    try {
        // First get existing personnel and shifts
        const { data: personnel, error: personnelError } = await supabase
            .from('personnel')
            .select('*')
            .limit(1);
            
        const { data: shifts, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .limit(1);
            
        const { data: bases, error: basesError } = await supabase
            .from('bases')
            .select('*')
            .limit(1);
            
        if (personnelError || shiftsError || basesError) {
            console.error('Error getting base data:', {personnelError, shiftsError, basesError});
            return;
        }
        
        if (!personnel?.length || !shifts?.length || !bases?.length) {
            console.log('❌ No base data found. Creating sample data...');
            await createSampleData();
            return;
        }
        
        console.log('✅ Base data found:', {
            personnel: personnel.length,
            shifts: shifts.length, 
            bases: bases.length
        });
        
        // Test save operation similar to the app
        const testYear = '1403';
        const testMonth = '7';
        const testBaseId = bases[0].id;
        const key = `${testYear}-${testMonth}`;
        
        // Create test performance record
        const testRecords = [{
            id: crypto.randomUUID(),
            personnel_id: personnel[0].id,
            day: 1,
            shift_id: shifts[0].id,
            base_id: bases[0].id,
            submitting_base_id: testBaseId,
            year_month: key
        }];
        
        console.log('🔄 Testing delete old records...');
        const { error: deleteError } = await supabase
            .from('performance_records')
            .delete()
            .match({ year_month: key, submitting_base_id: testBaseId });
            
        if (deleteError) {
            console.log('❌ Delete error:', deleteError.message);
        } else {
            console.log('✅ Delete operation successful');
        }
        
        console.log('🔄 Testing insert new records...');
        const { data: insertData, error: insertError } = await supabase
            .from('performance_records')
            .insert(testRecords)
            .select();
            
        if (insertError) {
            console.log('❌ Insert error:', insertError.message);
            console.log('🔍 Insert error details:', {
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint
            });
        } else {
            console.log('✅ Insert operation successful');
            console.log('📊 Inserted records:', insertData);
        }
        
        console.log('🔄 Testing upsert submission status...');
        const { data: upsertData, error: upsertError } = await supabase
            .from('performance_submissions')
            .upsert(
                { year_month: key, base_id: testBaseId, status: 'draft' },
                { onConflict: 'year_month,base_id' }
            )
            .select();
            
        if (upsertError) {
            console.log('❌ Upsert error:', upsertError.message);
            console.log('🔍 Upsert error details:', {
                code: upsertError.code,
                details: upsertError.details,
                hint: upsertError.hint
            });
        } else {
            console.log('✅ Upsert operation successful');
            console.log('📊 Upserted submission:', upsertData);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

async function createSampleData() {
    console.log('🔧 Creating sample data...');
    
    try {
        // Create sample base
        const { data: baseData, error: baseError } = await supabase
            .from('bases')
            .upsert([{
                id: crypto.randomUUID(),
                name: 'مرکز اورژانس تهران',
                code: 'T001',
                address: 'تهران'
            }])
            .select();
            
        if (baseError) {
            console.log('❌ Base creation error:', baseError.message);
            return;
        }
        
        // Create sample shift
        const { data: shiftData, error: shiftError } = await supabase
            .from('shifts')
            .upsert([{
                id: crypto.randomUUID(),
                type: 'Regular',
                title: 'شیفت صبح',
                code: 'M',
                equivalent_hours: 8,
                holiday_hours: 0,
                effect: 'positive'
            }])
            .select();
            
        if (shiftError) {
            console.log('❌ Shift creation error:', shiftError.message);
            return;
        }
        
        // Create sample personnel
        const { data: personnelData, error: personnelError } = await supabase
            .from('personnel')
            .upsert([{
                id: crypto.randomUUID(),
                name: 'علی احمدی',
                national_id: '1234567890',
                employment_status: 'permanent',
                productivity_status: 'active',
                driver_status: 'licensed',
                base_id: baseData[0].id
            }])
            .select();
            
        if (personnelError) {
            console.log('❌ Personnel creation error:', personnelError.message);
            return;
        }
        
        console.log('✅ Sample data created successfully');
        
        // Now run the test again
        await testSaveOperation();
        
    } catch (error) {
        console.error('❌ Sample data creation failed:', error);
    }
}

testSaveOperation();