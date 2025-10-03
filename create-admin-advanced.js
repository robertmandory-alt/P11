import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Try multiple email formats to find one that works
const emailFormats = [
    'admin@system.local',
    'admin.user@company.org',
    'administrator@domain.com',
    'admin123@test.io',
    'systemadmin@platform.net'
];

async function createAdminUserWithDifferentEmails() {
    console.log('🔍 Trying different email formats for admin user creation...\n');
    
    for (let i = 0; i < emailFormats.length; i++) {
        const email = emailFormats[i];
        console.log(`📧 Attempt ${i + 1}: Testing email format: ${email}`);
        
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: 'admin1',
                options: {
                    data: {
                        username: 'admin'
                    }
                }
            });

            if (authError) {
                console.log(`   ❌ Failed: ${authError.message}`);
                
                // If user already exists, try to sign in
                if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
                    console.log('   🔄 User exists, trying to sign in and update...');
                    
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: email,
                        password: 'admin1'
                    });
                    
                    if (!signInError && signInData.user) {
                        console.log('   ✅ Signed in successfully, updating profile...');
                        return await updateUserProfile(signInData.user.id, email);
                    }
                }
                continue;
            }

            if (authData.user) {
                console.log(`   ✅ Success! User created with email: ${email}`);
                
                // Wait for profile creation trigger
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                return await updateUserProfile(authData.user.id, email);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            continue;
        }
    }
    
    console.log('\n❌ All email formats failed. The Supabase instance might have very strict email validation.');
    console.log('📝 Manual steps required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Authentication > Settings');
    console.log('3. Check "Enable email confirmations" setting');
    console.log('4. Try disabling email confirmations temporarily');
    console.log('5. Or create user manually in the dashboard');
    
    return false;
}

async function updateUserProfile(userId, email) {
    try {
        console.log('   📝 Updating profile to admin role...');
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                role: 'admin', 
                status: 'active',
                profile_completed: true,
                username: 'admin'
            })
            .eq('id', userId);
        
        if (updateError) {
            console.log('   ⚠️ Profile update failed, trying manual insert...');
            
            // Try to create the profile manually if it doesn't exist
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([{
                    id: userId,
                    username: 'admin',
                    role: 'admin',
                    status: 'active',
                    profile_completed: true
                }]);
            
            if (insertError) {
                console.log('   ❌ Profile creation failed:', insertError.message);
                return false;
            }
            
            console.log('   ✅ Admin profile created manually!');
        } else {
            console.log('   ✅ Admin profile updated successfully!');
        }
        
        // Test login
        console.log('   🔐 Testing login...');
        const { data: testLogin, error: loginError } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'admin1'
        });
        
        if (loginError) {
            console.log('   ❌ Login test failed:', loginError.message);
            return false;
        }
        
        console.log('   ✅ Login test successful!');
        console.log('\n🎉 Admin User Setup Complete!');
        console.log(`📧 Email: ${email}`);
        console.log('👤 Username: admin');
        console.log('🔑 Password: admin1');
        console.log('🔰 Role: admin');
        console.log('✅ Status: active');
        
        return true;
        
    } catch (error) {
        console.log('   ❌ Profile update error:', error.message);
        return false;
    }
}

async function checkExistingUsers() {
    console.log('👥 Checking existing users...\n');
    
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');
            
        if (error) {
            console.log('❌ Error checking profiles:', error.message);
            return;
        }
        
        if (profiles && profiles.length > 0) {
            console.log(`📊 Found ${profiles.length} existing user(s):`);
            profiles.forEach((profile, index) => {
                console.log(`   ${index + 1}. Username: ${profile.username}, Role: ${profile.role}, Status: ${profile.status}`);
            });
            
            // Check if admin already exists
            const adminUser = profiles.find(p => p.username === 'admin' && p.role === 'admin');
            if (adminUser) {
                console.log('\n✅ Admin user already exists!');
                console.log('👤 Username: admin');
                console.log('🔑 Password: admin1 (if previously set)');
                console.log('🔰 Role: admin');
                console.log(`✅ Status: ${adminUser.status}`);
                
                if (adminUser.status === 'active') {
                    console.log('\n🎉 Admin user is ready to use!');
                    return true;
                }
            }
        } else {
            console.log('📊 No existing users found.');
        }
        
        return false;
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Advanced Admin User Setup\n');
    
    // First check if admin user already exists
    const adminExists = await checkExistingUsers();
    
    if (adminExists) {
        console.log('\nℹ️ Admin user already configured. No further action needed.');
        return;
    }
    
    console.log('\n🔧 Creating new admin user...');
    const success = await createAdminUserWithDifferentEmails();
    
    if (!success) {
        console.log('\n🛠️ Alternative Setup Options:');
        console.log('\n1. Manual Supabase Dashboard Setup:');
        console.log('   - Go to Authentication > Users in your Supabase dashboard');
        console.log('   - Click "Add user"');
        console.log('   - Email: admin@yourdomain.com');
        console.log('   - Password: admin1');
        console.log('   - Auto Confirm: Yes');
        
        console.log('\n2. Manual Profile Creation:');
        console.log('   - Go to Table Editor > profiles');
        console.log('   - Add new row with:');
        console.log('     * id: [user_id_from_auth_users]');
        console.log('     * username: admin');
        console.log('     * role: admin');
        console.log('     * status: active');
        console.log('     * profile_completed: true');
        
        console.log('\n3. SQL Script (Supabase SQL Editor):');
        console.log(`   INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
   VALUES (
     '00000000-0000-0000-0000-000000000000',
     uuid_generate_v4(),
     'authenticated',
     'authenticated',
     'admin@system.local',
     crypt('admin1', gen_salt('bf')),
     now(),
     '',
     now(),
     '',
     null,
     '',
     '',
     null,
     null,
     '{"provider":"email","providers":["email"]}',
     '{"username":"admin"}',
     false,
     now(),
     now()
   ) RETURNING id;`);
    }
}

main().catch(console.error);