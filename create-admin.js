// Create Admin User Script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
    console.log('👤 Creating admin user...');
    
    try {
        // First, try to sign up the admin user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: 'admin@example.com',
            password: 'admin1',
            options: {
                data: {
                    username: 'admin'
                }
            }
        });

        if (authError) {
            console.error('❌ Auth signup failed:', authError.message);
            
            // If user already exists, try to sign in and update profile
            if (authError.message.includes('User already registered')) {
                console.log('⚠️ User exists, trying to sign in and update profile...');
                
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: 'admin@example.com',
                    password: 'admin1'
                });
                
                if (signInError) {
                    console.error('❌ Sign in failed:', signInError.message);
                    return false;
                }
                
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
                
                console.log('✅ Admin user profile updated successfully!');
                return true;
            }
            return false;
        }

        if (authData.user) {
            // Wait a moment for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 2000));
            
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
                return false;
            }
            
            console.log('✅ Admin user created successfully!');
            console.log(`
👤 Admin User Details:
- Username: admin  
- Password: admin1
- Email: admin@example.com
- Role: admin
- Status: active

🔐 Login Instructions:
1. Use username: admin
2. Use password: admin1
3. Full admin access granted
            `);
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Admin creation failed:', error);
        return false;
    }
}

// Run the admin creation
createAdminUser()
    .then(success => {
        if (success) {
            console.log('🎉 Admin user setup completed!');
        } else {
            console.log('❌ Admin user setup failed!');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(console.error);