import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createCorrectAdminUser() {
    console.log('👤 Creating admin user with correct email format (@company.com)...');
    
    try {
        // Create admin user with the email format expected by the application
        const adminEmail = 'admin@company.com';
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: adminEmail,
            password: 'admin1',
            options: {
                data: {
                    username: 'admin'
                }
            }
        });

        if (authError) {
            console.log('⚠️ Auth signup error:', authError.message);
            
            // If user already exists, try to sign in and update
            if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
                console.log('👤 User exists, trying to sign in and update...');
                
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: adminEmail,
                    password: 'admin1'
                });
                
                if (signInError) {
                    console.error('❌ Sign in failed:', signInError.message);
                    return false;
                }
                
                console.log('✅ Successfully signed in as existing user');
                
                // Update the profile to admin
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ 
                        role: 'admin', 
                        status: 'active',
                        profile_completed: true,
                        username: 'admin'
                    })
                    .eq('id', signInData.user.id);
                
                if (updateError) {
                    console.error('❌ Profile update failed:', updateError.message);
                    return false;
                }
                
                console.log('✅ Admin profile updated successfully!');
                return await testLogin(adminEmail);
            }
            
            return false;
        }

        if (authData.user) {
            console.log('✅ New admin user created, setting up profile...');
            
            // Wait for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Update the profile to make it admin and active
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    role: 'admin', 
                    status: 'active',
                    profile_completed: true,
                    username: 'admin'
                })
                .eq('id', authData.user.id);
            
            if (updateError) {
                console.error('❌ Profile update failed:', updateError.message);
                
                // Try to create the profile manually if it doesn't exist
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: authData.user.id,
                        username: 'admin',
                        role: 'admin',
                        status: 'active',
                        profile_completed: true
                    }]);
                
                if (insertError) {
                    console.error('❌ Profile creation failed:', insertError.message);
                    return false;
                }
                
                console.log('✅ Admin profile created manually!');
            } else {
                console.log('✅ Admin profile updated successfully!');
            }
            
            return await testLogin(adminEmail);
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Admin creation failed:', error);
        return false;
    }
}

async function testLogin(email) {
    console.log('\n🔐 Testing admin login with both methods...');
    
    // Test 1: Direct email login
    console.log('📧 Testing direct email login...');
    try {
        const { data: signInData1, error: signInError1 } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'admin1'
        });
        
        if (signInError1) {
            console.error('❌ Direct email login failed:', signInError1.message);
        } else {
            console.log('✅ Direct email login successful!');
        }
    } catch (error) {
        console.error('❌ Direct email login error:', error.message);
    }
    
    // Test 2: Username-based login (how the app actually works)
    console.log('👤 Testing username-based login (app method)...');
    try {
        // This simulates what the app does - converts 'admin' to 'admin@company.com'
        const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({
            email: 'admin@company.com', // This is what happens when user types 'admin'
            password: 'admin1'
        });
        
        if (signInError2) {
            console.error('❌ Username login failed:', signInError2.message);
            return false;
        }
        
        console.log('✅ Username login successful!');
        
        // Check profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData2.user.id)
            .single();
        
        if (profileError) {
            console.error('❌ Profile check failed:', profileError.message);
            return false;
        }
        
        if (profile) {
            console.log('👤 Profile details:');
            console.log(`   - Username: ${profile.username}`);
            console.log(`   - Role: ${profile.role}`);
            console.log(`   - Status: ${profile.status}`);
            console.log(`   - Profile Completed: ${profile.profile_completed}`);
            
            if (profile.role === 'admin' && profile.status === 'active') {
                console.log('🎉 Admin user is properly configured for the application!');
                return true;
            } else {
                console.log('⚠️ Admin user needs configuration adjustment');
                return false;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Username login test failed:', error);
        return false;
    }
}

async function main() {
    console.log('🚀 Creating Correct Admin User for Application\n');
    
    const success = await createCorrectAdminUser();
    
    if (success) {
        console.log(`
🎉 Admin User Setup Complete and Tested!

📝 Login Instructions:
1. Open the application at: https://3000-imzyvtcds3oj7e6ycwfwi-6532622b.e2b.dev
2. Enter "admin" in the username field (without quotes)
3. Enter "admin1" in the password field (without quotes)
4. Click "ورود" (Login) button
5. You will have full administrative access

✅ Email in database: admin@company.com
👤 Username for login: admin
🔑 Password for login: admin1
🔰 Role: admin
✅ Status: active

🌐 Application URL: https://3000-imzyvtcds3oj7e6ycwfwi-6532622b.e2b.dev
        `);
    } else {
        console.log(`
❌ Admin user setup failed.
        
📝 Manual Setup Required:
1. Check Supabase authentication settings
2. Ensure email confirmations are not blocking user creation  
3. Try creating admin user manually through Supabase dashboard

🔐 Target Credentials:
- Username: admin
- Password: admin1
        `);
    }
}

main().catch(console.error);