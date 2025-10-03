// Final Admin User Creation Script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
    console.log('👤 Creating admin user with proper credentials...');
    
    try {
        // Create admin user with company email format
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: 'admin@company.com',
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
                console.log('👤 User exists, attempting to update existing user...');
                
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: 'admin@company.com',
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
                return true;
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
                return true;
            }
            
            console.log('✅ Admin user created and profile updated successfully!');
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Admin creation failed:', error);
        return false;
    }
}

async function testLogin() {
    console.log('\n🔐 Testing admin login...');
    
    try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@company.com',
            password: 'admin1'
        });
        
        if (signInError) {
            console.error('❌ Login test failed:', signInError.message);
            return false;
        }
        
        if (signInData.user) {
            console.log('✅ Login test successful!');
            
            // Check profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', signInData.user.id)
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
                    console.log('🎉 Admin user is properly configured!');
                    return true;
                } else {
                    console.log('⚠️ Admin user needs configuration adjustment');
                    return false;
                }
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Login test failed:', error);
        return false;
    }
}

async function main() {
    console.log('🚀 Final Admin User Setup\n');
    
    const adminSuccess = await createAdminUser();
    
    if (adminSuccess) {
        const loginSuccess = await testLogin();
        
        if (loginSuccess) {
            console.log(`
🎉 Admin User Setup Complete!

📝 Login Credentials:
- Username: admin
- Password: admin1
- Email: admin@company.com

🔐 How to Login:
1. Open the application
2. Enter "admin" as username
3. Enter "admin1" as password  
4. You will have full administrative access

✅ Status: Ready for use!
            `);
        } else {
            console.log(`
⚠️ Admin user created but needs manual configuration.

📝 Manual Setup:
1. Go to Supabase dashboard
2. Open SQL Editor
3. Run: UPDATE public.profiles SET role='admin', status='active', profile_completed=true WHERE username='admin';

🔐 Login Credentials:
- Username: admin  
- Password: admin1
            `);
        }
    } else {
        console.log(`
❌ Admin user setup failed.

📝 Manual Setup Required:
1. Ensure database schema is created (see DATABASE_SETUP.md)
2. Run this script again after database setup
3. Or create admin user manually through the application

🔐 Target Credentials:
- Username: admin
- Password: admin1
        `);
    }
}

// Run the setup
main().catch(console.error);