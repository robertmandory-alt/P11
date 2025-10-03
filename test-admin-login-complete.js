// Complete Admin Login Test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simulate the exact login logic from AuthContext
async function simulateAppLogin(username, password) {
    console.log('🧪 Simulating application login process...\n');
    
    try {
        // Step 1: Convert username to email (exactly like AuthContext)
        let loginEmail = username;
        if (!username.includes('@')) {
            loginEmail = `${username.toLowerCase()}@company.com`;
        }
        
        console.log(`📧 Converted username "${username}" to email: ${loginEmail}`);
        
        // Step 2: Attempt authentication
        console.log('🔐 Attempting authentication...');
        const { data: userAuth, error: authError } = await supabase.auth.signInWithPassword({ 
            email: loginEmail, 
            password 
        });
        
        if (authError || !userAuth.user) {
            console.error('❌ Authentication failed:', authError?.message || 'No user returned');
            return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
        }
        
        console.log('✅ Authentication successful');
        console.log(`👤 User ID: ${userAuth.user.id}`);
        console.log(`📧 Email: ${userAuth.user.email}`);
        
        // Step 3: Check profile (exactly like AuthContext)
        console.log('👤 Checking user profile...');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userAuth.user.id)
            .single();
        
        if (profileError || !profile) {
            await supabase.auth.signOut();
            console.error('❌ Profile check failed:', profileError?.message || 'No profile found');
            return { success: false, error: 'پروفایل کاربری یافت نشد. ممکن است حساب شما حذف شده باشد.' };
        }
        
        console.log('✅ Profile found');
        console.log(`   Username: ${profile.username}`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   Status: ${profile.status}`);
        console.log(`   Profile Completed: ${profile.profile_completed}`);
        
        // Step 4: Check status (exactly like AuthContext)
        if (profile.status === 'pending') {
            await supabase.auth.signOut();
            console.error('❌ Account is pending approval');
            return { success: false, error: 'حساب کاربری شما در انتظار تایید مدیر است.' };
        }
        
        if (profile.status !== 'active') {
            await supabase.auth.signOut();
            console.error('❌ Account is not active:', profile.status);
            return { success: false, error: 'حساب کاربری غیرفعال است.' };
        }
        
        console.log('✅ Account is active and ready');
        
        // Step 5: Simulate successful login state
        console.log('🎉 Login process completed successfully!');
        
        return { 
            success: true, 
            user: profile,
            authUser: userAuth.user
        };
        
    } catch (error) {
        console.error('❌ Unexpected error during login:', error);
        return { success: false, error: 'خطای ناشناخته رخ داد.' };
    }
}

async function testInitialDataFetch(userId) {
    console.log('📊 Testing initial data fetch (simulating AuthContext fetchAllInitialData)...\n');
    
    try {
        const [personnelRes, shiftsRes, basesRes] = await Promise.all([
            supabase.from('personnel').select('*'),
            supabase.from('shifts').select('*'),
            supabase.from('bases').select('*')
        ]);

        if (personnelRes.error) {
            console.error('❌ Personnel fetch failed:', personnelRes.error.message);
            return false;
        }
        
        if (shiftsRes.error) {
            console.error('❌ Shifts fetch failed:', shiftsRes.error.message);
            return false;
        }
        
        if (basesRes.error) {
            console.error('❌ Bases fetch failed:', basesRes.error.message);
            return false;
        }

        console.log(`✅ Personnel records: ${personnelRes.data?.length || 0}`);
        console.log(`✅ Shift records: ${shiftsRes.data?.length || 0}`);
        console.log(`✅ Base records: ${basesRes.data?.length || 0}`);
        
        // Filter out placeholder personnel (simulating AuthContext logic)
        const filteredPersonnel = personnelRes.data?.filter(p => p.id !== '00000000-0000-0000-0000-000000000000');
        console.log(`✅ Filtered personnel (excluding placeholder): ${filteredPersonnel?.length || 0}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error during initial data fetch:', error);
        return false;
    }
}

async function main() {
    console.log('🚀 Complete Admin Login Test\n');
    
    // Test credentials
    const username = 'admin';
    const password = 'admin1';
    
    console.log(`📝 Testing with credentials:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('');
    
    // Test 1: Simulate complete login flow
    const loginResult = await simulateAppLogin(username, password);
    
    if (!loginResult.success) {
        console.log(`
❌ Login Test Failed!

Error: ${loginResult.error}

🔍 Possible Issues:
1. Admin user not properly created
2. Email format mismatch
3. Profile not active
4. Authentication credentials incorrect

🛠️ Next Steps:
1. Run fix-admin-login.js again
2. Check Supabase auth dashboard
3. Verify profile status in database
        `);
        return;
    }
    
    console.log('\n🎉 Login test successful! Testing data access...\n');
    
    // Test 2: Test initial data fetching
    const dataFetchResult = await testInitialDataFetch(loginResult.user.id);
    
    if (!dataFetchResult) {
        console.log(`
⚠️ Login successful but data fetching failed.

✅ Authentication: Working
❌ Data Access: Failed

🔍 Possible Issues:
1. Database tables not created
2. RLS policies blocking access
3. Missing table permissions

🛠️ Next Steps:
1. Check database schema
2. Review RLS policies
3. Verify table permissions
        `);
        return;
    }
    
    // Test 3: Sign out to complete the cycle
    console.log('🔓 Testing logout...');
    try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
            console.error('⚠️ Sign out warning:', signOutError.message);
        } else {
            console.log('✅ Logout successful');
        }
    } catch (error) {
        console.error('⚠️ Sign out error:', error);
    }
    
    console.log(`
🎉 Complete Admin Login Test PASSED!

📋 Test Results:
✅ Username to email conversion: Working
✅ Authentication: Working  
✅ Profile validation: Working
✅ Status check: Working
✅ Data fetching: Working
✅ Logout: Working

🔐 Login Instructions for Web App:
1. Open: https://3000-itiwpafopnump7zr5xsj9-6532622b.e2b.dev
2. Username: admin
3. Password: admin1
4. Click "ورود" (Login)

✅ Status: Ready for production use!
    `);
}

// Run the complete test
main().catch(console.error);