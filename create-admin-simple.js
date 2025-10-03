// Simple Admin User Creation Script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
    console.log('🚀 Creating admin user for Emergency Personnel Management System...\n');
    
    try {
        // Try to create admin user
        console.log('📝 Attempting to create admin user...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: 'admin@gmail.com',
            password: 'admin1',
            options: {
                data: {
                    username: 'admin'
                }
            }
        });

        if (authError) {
            console.log('⚠️ Signup error (may be expected if user exists):', authError.message);
            
            // If user already exists, try to sign in and check profile
            console.log('🔐 Attempting to sign in with existing credentials...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: 'admin@gmail.com',
                password: 'admin1'
            });
            
            if (signInError) {
                console.error('❌ Sign in failed:', signInError.message);
                console.log('\n📋 Manual Setup Required:');
                console.log('1. Use the application signup form with:');
                console.log('   - Email: admin@company.com');
                console.log('   - Password: admin1');
                console.log('   - Username: admin');
                console.log('2. After signup, update the profile in Supabase dashboard:');
                console.log('   UPDATE public.profiles SET role = \'admin\', status = \'active\' WHERE username = \'admin\';');
                return false;
            }
            
            console.log('✅ Successfully signed in with existing admin credentials');
            console.log('👤 User ID:', signInData.user.id);
            
            return true;
        }

        if (authData.user) {
            console.log('✅ Admin user created successfully!');
            console.log('👤 User ID:', authData.user.id);
            console.log('📧 Email:', authData.user.email);
            
            // Note about profile setup
            console.log('\n⚠️ Important: After database tables are created, update the user profile:');
            console.log(`UPDATE public.profiles SET role = 'admin', status = 'active' WHERE id = '${authData.user.id}';`);
            
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
            email: 'admin@gmail.com',
            password: 'admin1'
        });
        
        if (signInError) {
            console.log('❌ Login test failed:', signInError.message);
            return false;
        }
        
        console.log('✅ Login test successful!');
        console.log('👤 Logged in as:', signInData.user.email);
        
        // Try to check if profile exists (will fail if tables don't exist yet)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single();
            
        if (profileError) {
            console.log('⚠️ Profile check (expected if tables not created):', profileError.message);
            console.log('📋 Remember to create database tables first using DATABASE_SETUP.md');
        } else {
            console.log('✅ Profile found:', profile);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Login test failed:', error);
        return false;
    }
}

async function main() {
    console.log('🏥 Emergency Personnel Performance Management System');
    console.log('🔧 Admin User Setup\n');
    
    const userCreated = await createAdminUser();
    
    if (userCreated) {
        await testLogin();
        
        console.log(`
🎉 Admin User Setup Complete!

📝 Login Credentials:
- Username: admin
- Password: admin1  
- Email: admin@company.com

🔧 Next Steps:
1. Create database tables using the SQL in DATABASE_SETUP.md
2. Run the application and login with the credentials above
3. The application will automatically create the profile, or you can update it manually

⚠️ If login doesn't work immediately:
- Make sure database tables exist
- Check that the profile has role='admin' and status='active'
- Use the email admin@company.com (not just 'admin') for login
        `);
    }
}

main().catch(console.error);