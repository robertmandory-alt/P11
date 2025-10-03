import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createCompleteAdminUser() {
    console.log('🚀 Complete Admin User Creation Process\n');
    
    const adminEmail = 'admin@company.com';
    const adminPassword = 'admin1';
    const adminUsername = 'admin';
    
    try {
        console.log('📧 Step 1: Creating authentication user...');
        
        // Try to create the auth user
        let authUser = null;
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword,
            options: {
                data: {
                    username: adminUsername
                }
            }
        });
        
        if (signUpError) {
            if (signUpError.message.includes('User already registered') || signUpError.message.includes('already exists')) {
                console.log('   ℹ️ User already exists, trying to sign in...');
                
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: adminEmail,
                    password: adminPassword
                });
                
                if (signInError) {
                    console.error('   ❌ Sign in failed:', signInError.message);
                    return false;
                }
                
                authUser = signInData.user;
                console.log('   ✅ Successfully signed in to existing user');
            } else {
                console.error('   ❌ Signup error:', signUpError.message);
                return false;
            }
        } else if (signUpData.user) {
            authUser = signUpData.user;
            console.log('   ✅ New user created successfully');
        } else {
            console.error('   ❌ No user data returned from signup');
            return false;
        }
        
        if (!authUser) {
            console.error('   ❌ No auth user available');
            return false;
        }
        
        console.log(`   👤 User ID: ${authUser.id}`);
        console.log(`   📧 Email: ${authUser.email}`);
        
        console.log('\n📋 Step 2: Creating/updating profile...');
        
        // Wait a moment for any database triggers
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if profile already exists
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
        
        if (checkError && !checkError.message.includes('PGRST116')) {
            console.log('   ⚠️ Error checking existing profile:', checkError.message);
        }
        
        let profile = null;
        
        if (existingProfile) {
            console.log('   ℹ️ Profile exists, updating...');
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({
                    username: adminUsername,
                    role: 'admin',
                    status: 'active',
                    profile_completed: true
                })
                .eq('id', authUser.id)
                .select()
                .single();
            
            if (updateError) {
                console.error('   ❌ Profile update failed:', updateError.message);
                return false;
            }
            
            profile = updatedProfile;
            console.log('   ✅ Profile updated successfully');
        } else {
            console.log('   ℹ️ No profile exists, creating new one...');
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([{
                    id: authUser.id,
                    username: adminUsername,
                    role: 'admin',
                    status: 'active',
                    profile_completed: true
                }])
                .select()
                .single();
            
            if (insertError) {
                console.error('   ❌ Profile creation failed:', insertError.message);
                return false;
            }
            
            profile = newProfile;
            console.log('   ✅ Profile created successfully');
        }
        
        console.log('\n✅ Profile Details:');
        console.log(`   - ID: ${profile.id}`);
        console.log(`   - Username: ${profile.username}`);
        console.log(`   - Role: ${profile.role}`);
        console.log(`   - Status: ${profile.status}`);
        console.log(`   - Profile Completed: ${profile.profile_completed}`);
        
        console.log('\n🔐 Step 3: Testing login functionality...');
        
        // Sign out first to test fresh login
        await supabase.auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test login with the exact method the app uses
        const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
            email: adminEmail, // This is what 'admin' username becomes in the app
            password: adminPassword
        });
        
        if (loginError) {
            console.error('   ❌ Login test failed:', loginError.message);
            return false;
        }
        
        console.log('   ✅ Login test successful!');
        
        // Verify profile access after login
        const { data: profileCheck, error: profileCheckError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', loginTest.user.id)
            .single();
        
        if (profileCheckError) {
            console.error('   ❌ Profile verification failed:', profileCheckError.message);
            return false;
        }
        
        if (profileCheck.role === 'admin' && profileCheck.status === 'active') {
            console.log('   ✅ Profile verification successful!');
            return true;
        } else {
            console.error('   ❌ Profile verification failed - incorrect role or status');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        return false;
    }
}

async function main() {
    const success = await createCompleteAdminUser();
    
    if (success) {
        console.log(`
🎉 ADMIN USER SETUP COMPLETE!

📱 Login Instructions:
1. Open the application: https://3000-imzyvtcds3oj7e6ycwfwi-6532622b.e2b.dev
2. In the username field, type: admin
3. In the password field, type: admin1  
4. Click the "ورود" (Login) button
5. You will have full administrative access to the system

✅ Technical Details:
- Authentication Email: admin@company.com
- Username for Login: admin
- Password: admin1
- Role: admin
- Status: active
- Profile: completed

🌟 The admin user is now ready for testing and use!
        `);
    } else {
        console.log(`
❌ ADMIN USER SETUP FAILED

🛠️ Troubleshooting Steps:
1. Check your Supabase dashboard Authentication settings
2. Ensure email confirmations are disabled for testing
3. Check the profiles table in Table Editor
4. Verify the database schema is properly created

🎯 Target Configuration:
- Email: admin@company.com
- Username: admin
- Password: admin1
- Role: admin
- Status: active
        `);
    }
}

main().catch(console.error);