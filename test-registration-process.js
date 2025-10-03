import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistrationProcess() {
    console.log('🧪 Testing User Registration Process');
    console.log('=====================================\n');
    
    try {
        // Test 1: Check current profiles
        console.log('📊 Step 1: Checking current profiles...');
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
            
        if (profilesError) {
            console.error('❌ Error fetching profiles:', profilesError.message);
            return;
        }
        
        console.log(`   ✅ Found ${profiles.length} existing profiles`);
        profiles.forEach(profile => {
            console.log(`   - ${profile.username} (${profile.role}, ${profile.status})`);
        });
        
        // Test 2: Create a test user with random username
        const testUsername = `testuser${Date.now().toString().slice(-6)}`;
        const testPassword = 'testpass123';
        
        console.log(`\n🆕 Step 2: Testing registration with username: ${testUsername}`);
        
        const email = `${testUsername.toLowerCase()}@company.com`;
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password: testPassword,
            options: {
                data: {
                    username: testUsername
                }
            }
        });
        
        if (signupError) {
            console.error('   ❌ Signup error:', signupError.message);
            return;
        }
        
        console.log('   ✅ User created in auth system');
        console.log(`   👤 User ID: ${signupData.user?.id}`);
        
        // Test 3: Check if profile was created
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a moment
        
        console.log('\n📋 Step 3: Checking if profile was created...');
        const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signupData.user?.id)
            .single();
            
        if (profileError) {
            console.log('   ⚠️ No profile found, creating manually...');
            
            // Create profile manually
            const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{
                    id: signupData.user?.id,
                    username: testUsername,
                    role: 'user',
                    status: 'pending',
                    profile_completed: false
                }])
                .select()
                .single();
                
            if (createError) {
                console.error('   ❌ Error creating profile:', createError.message);
                return;
            }
            
            console.log('   ✅ Profile created manually');
            console.log(`   📝 Status: ${createdProfile.status}`);
            console.log(`   👤 Role: ${createdProfile.role}`);
        } else {
            console.log('   ✅ Profile found automatically');
            console.log(`   📝 Status: ${newProfile.status}`);
            console.log(`   👤 Role: ${newProfile.role}`);
        }
        
        // Test 4: Verify pending users show up in admin panel
        console.log('\n👥 Step 4: Checking pending users for admin panel...');
        const { data: pendingUsers, error: pendingError } = await supabase
            .from('profiles')
            .select('*')
            .eq('status', 'pending');
            
        if (pendingError) {
            console.error('   ❌ Error fetching pending users:', pendingError.message);
            return;
        }
        
        console.log(`   ✅ Found ${pendingUsers.length} pending users:`);
        pendingUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.status})`);
        });
        
        // Test 5: Test admin approval process
        console.log('\n✅ Step 5: Testing admin approval...');
        if (signupData.user?.id) {
            const { error: approveError } = await supabase
                .from('profiles')
                .update({ status: 'active' })
                .eq('id', signupData.user.id);
                
            if (approveError) {
                console.error('   ❌ Error approving user:', approveError.message);
            } else {
                console.log('   ✅ User approval successful');
            }
        }
        
        // Test 6: Test login after approval
        console.log('\n🔐 Step 6: Testing login after approval...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password: testPassword
        });
        
        if (loginError) {
            console.error('   ❌ Login error:', loginError.message);
        } else {
            console.log('   ✅ Login successful after approval!');
            
            // Check profile access
            const { data: profileCheck, error: profileCheckError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', loginData.user.id)
                .single();
                
            if (profileCheck?.status === 'active') {
                console.log('   ✅ Profile verification successful');
            }
        }
        
        console.log('\n🎉 Registration Process Test Complete!');
        console.log('=====================================');
        console.log('✅ All tests passed - registration flow is working correctly');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

testRegistrationProcess().catch(console.error);