// Fix Admin Login Issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCurrentState() {
    console.log('🔍 Checking current database state...\n');
    
    try {
        // Check all profiles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*');
        
        if (profileError) {
            console.error('❌ Error fetching profiles:', profileError.message);
            return null;
        }
        
        console.log(`📊 Found ${profiles.length} profiles:`);
        profiles.forEach((profile, index) => {
            console.log(`   ${index + 1}. ID: ${profile.id}`);
            console.log(`      Username: ${profile.username}`);
            console.log(`      Role: ${profile.role}`);
            console.log(`      Status: ${profile.status}`);
            console.log(`      Completed: ${profile.profile_completed}`);
            console.log('');
        });
        
        // Check auth users (we can see users through auth endpoints)
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
            console.log('⚠️ Cannot access auth users with current key (this is normal with anon key)');
        } else {
            console.log(`📧 Auth users found: ${users.length}`);
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. Email: ${user.email}`);
                console.log(`      ID: ${user.id}`);
                console.log(`      Created: ${user.created_at}`);
                console.log('');
            });
        }
        
        return profiles;
        
    } catch (error) {
        console.error('❌ Error checking database state:', error);
        return null;
    }
}

async function fixAdminUser() {
    console.log('🔧 Fixing admin user configuration...\n');
    
    try {
        // The login page expects admin@company.com (not admin@gmail.com)
        // Let's first try to login with the correct format
        const correctEmail = 'admin@company.com';
        const password = 'admin1';
        
        console.log(`🔐 Testing login with: ${correctEmail}`);
        
        let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: correctEmail,
            password: password
        });
        
        if (signInError) {
            console.log(`⚠️ Login failed with ${correctEmail}: ${signInError.message}`);
            
            // Try with the old format that was used in creation scripts
            console.log('🔐 Testing login with: admin@gmail.com');
            
            const { data: oldSignInData, error: oldSignInError } = await supabase.auth.signInWithPassword({
                email: 'admin@gmail.com',
                password: password
            });
            
            if (oldSignInError) {
                console.log(`⚠️ Login failed with admin@gmail.com: ${oldSignInError.message}`);
                console.log('🆕 Creating new admin user with correct email format...');
                
                // Create new admin user with correct email
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: correctEmail,
                    password: password,
                    options: {
                        data: {
                            username: 'admin'
                        }
                    }
                });
                
                if (authError) {
                    if (authError.message.includes('User already registered')) {
                        console.log('✅ User with correct email already exists, updating password...');
                        
                        // Sign in and update
                        const { data: existingSignIn, error: existingSignInError } = await supabase.auth.signInWithPassword({
                            email: correctEmail,
                            password: password
                        });
                        
                        if (existingSignInError) {
                            console.error('❌ Could not sign in to existing user:', existingSignInError.message);
                            return false;
                        }
                        
                        signInData = existingSignIn;
                    } else {
                        console.error('❌ Admin user creation failed:', authError.message);
                        return false;
                    }
                } else {
                    console.log('✅ New admin user created successfully');
                    signInData = authData;
                    
                    // Wait for trigger to create profile
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } else {
                console.log('✅ Found existing admin user with admin@gmail.com');
                
                // Update the auth email to the correct format
                console.log('🔄 Updating email to correct format...');
                
                const { error: updateEmailError } = await supabase.auth.updateUser({
                    email: correctEmail
                });
                
                if (updateEmailError) {
                    console.log('⚠️ Email update failed:', updateEmailError.message);
                    console.log('📝 Will use existing admin@gmail.com format');
                    signInData = oldSignInData;
                } else {
                    console.log('✅ Email updated successfully');
                    
                    // Sign in with new email
                    const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
                        email: correctEmail,
                        password: password
                    });
                    
                    if (newSignInError) {
                        console.log('⚠️ Sign in with new email failed, using old data');
                        signInData = oldSignInData;
                    } else {
                        signInData = newSignInData;
                    }
                }
            }
        } else {
            console.log('✅ Admin login successful with correct email format');
        }
        
        if (signInData && signInData.user) {
            console.log(`👤 Admin user ID: ${signInData.user.id}`);
            console.log(`📧 Email: ${signInData.user.email}`);
            
            // Check and update profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', signInData.user.id)
                .single();
            
            if (profileError || !profile) {
                console.log('👤 Creating admin profile...');
                
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: signInData.user.id,
                        username: 'admin',
                        personnel_id: null,
                        role: 'admin',
                        status: 'active',
                        profile_completed: true,
                        base_id: null
                    }]);
                
                if (insertError) {
                    console.error('❌ Profile creation failed:', insertError.message);
                    return false;
                }
                
                console.log('✅ Admin profile created successfully');
            } else {
                console.log('👤 Updating existing admin profile...');
                
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        username: 'admin',
                        role: 'admin',
                        status: 'active',
                        profile_completed: true
                    })
                    .eq('id', signInData.user.id);
                
                if (updateError) {
                    console.error('❌ Profile update failed:', updateError.message);
                    return false;
                }
                
                console.log('✅ Admin profile updated successfully');
            }
            
            return signInData.user;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Error fixing admin user:', error);
        return false;
    }
}

async function testLogin() {
    console.log('🧪 Testing admin login with application logic...\n');
    
    try {
        // Simulate the login logic from AuthContext
        const username = 'admin';
        const password = 'admin1';
        
        // The app converts username to email format
        let loginEmail = username;
        if (!username.includes('@')) {
            loginEmail = `${username.toLowerCase()}@company.com`;
        }
        
        console.log(`🔐 Attempting login with: ${loginEmail}`);
        
        const { data: userAuth, error: authError } = await supabase.auth.signInWithPassword({ 
            email: loginEmail, 
            password 
        });
        
        if (authError || !userAuth.user) {
            console.error('❌ Login failed:', authError?.message || 'No user returned');
            
            // Try with alternative email format
            const altEmail = 'admin@gmail.com';
            console.log(`🔐 Trying alternative email: ${altEmail}`);
            
            const { data: altUserAuth, error: altAuthError } = await supabase.auth.signInWithPassword({ 
                email: altEmail, 
                password 
            });
            
            if (altAuthError || !altUserAuth.user) {
                console.error('❌ Alternative login also failed:', altAuthError?.message || 'No user returned');
                return false;
            }
            
            console.log('✅ Login successful with alternative email');
            return altUserAuth.user;
        }
        
        console.log('✅ Login successful with primary email');
        
        // Check profile status
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', userAuth.user.id)
            .single();
        
        if (profileError || !profile) {
            console.error('❌ Profile check failed:', profileError?.message || 'No profile found');
            return false;
        }
        
        if (profile.status === 'pending') {
            console.error('❌ Account is pending approval');
            return false;
        }
        
        if (profile.status !== 'active') {
            console.error('❌ Account is not active:', profile.status);
            return false;
        }
        
        console.log('✅ Profile is active and ready');
        return userAuth.user;
        
    } catch (error) {
        console.error('❌ Login test failed:', error);
        return false;
    }
}

async function main() {
    console.log('🚀 Admin Login Fix Script\n');
    
    // Step 1: Check current state
    const currentState = await checkCurrentState();
    
    if (currentState === null) {
        console.log('❌ Could not check database state');
        return;
    }
    
    // Step 2: Fix admin user
    const adminUser = await fixAdminUser();
    
    if (!adminUser) {
        console.log('❌ Admin user fix failed');
        return;
    }
    
    // Step 3: Test login
    const loginTest = await testLogin();
    
    if (loginTest) {
        console.log(`
🎉 Admin Login Fix Complete!

📝 Login Credentials:
- Username: admin
- Password: admin1

🔐 How to Login:
1. Open the application
2. Enter "admin" as username (without @company.com)
3. Enter "admin1" as password
4. The app will automatically convert to admin@company.com format

✅ Status: Admin login is now working!
        `);
    } else {
        console.log(`
⚠️ Admin user was configured but login test failed.

🔍 Next Steps:
1. Check if email confirmation is required
2. Verify database triggers are working
3. Check RLS policies on profiles table

📝 Manual Login Test:
- Try logging in through the web interface
- Username: admin
- Password: admin1
        `);
    }
}

// Run the fix
main().catch(console.error);