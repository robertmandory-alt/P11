import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllProfiles() {
    console.log('👥 Checking all profiles in database...\n');
    
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (error) {
            console.log('❌ Error fetching profiles:', error.message);
            return null;
        }
        
        if (profiles && profiles.length > 0) {
            console.log(`📊 Found ${profiles.length} profile(s):`);
            profiles.forEach((profile, index) => {
                console.log(`   ${index + 1}. ID: ${profile.id}`);
                console.log(`      Username: ${profile.username}`);
                console.log(`      Role: ${profile.role}`);
                console.log(`      Status: ${profile.status}`);
                console.log(`      Created: ${profile.created_at}`);
                console.log('');
            });
            
            return profiles;
        } else {
            console.log('📊 No profiles found.');
            return [];
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        return null;
    }
}

async function fixAdminProfile() {
    console.log('🔧 Attempting to fix admin profile...\n');
    
    try {
        // Get all admin profiles
        const { data: adminProfiles, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', 'admin');
            
        if (fetchError) {
            console.log('❌ Error fetching admin profiles:', fetchError.message);
            return false;
        }
        
        if (!adminProfiles || adminProfiles.length === 0) {
            console.log('❌ No admin profile found.');
            return false;
        }
        
        console.log(`📊 Found ${adminProfiles.length} admin profile(s)`);
        
        if (adminProfiles.length > 1) {
            console.log('⚠️ Multiple admin profiles detected. Keeping the most recent one...');
            
            // Sort by created_at and keep the newest
            const sortedProfiles = adminProfiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const keepProfile = sortedProfiles[0];
            const deleteProfiles = sortedProfiles.slice(1);
            
            console.log(`✅ Keeping profile: ${keepProfile.id}`);
            
            // Delete duplicate profiles
            for (const profile of deleteProfiles) {
                console.log(`🗑️ Deleting duplicate profile: ${profile.id}`);
                const { error: deleteError } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', profile.id);
                    
                if (deleteError) {
                    console.log(`   ❌ Error deleting duplicate: ${deleteError.message}`);
                } else {
                    console.log(`   ✅ Deleted duplicate successfully`);
                }
            }
        }
        
        // Get the remaining admin profile
        const { data: finalAdminProfile, error: finalFetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', 'admin')
            .single();
            
        if (finalFetchError) {
            console.log('❌ Error getting final admin profile:', finalFetchError.message);
            return false;
        }
        
        console.log('\n📋 Final admin profile:');
        console.log(`   ID: ${finalAdminProfile.id}`);
        console.log(`   Username: ${finalAdminProfile.username}`);
        console.log(`   Role: ${finalAdminProfile.role}`);
        console.log(`   Status: ${finalAdminProfile.status}`);
        
        // Ensure it has correct admin settings
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                role: 'admin', 
                status: 'active',
                profile_completed: true,
                username: 'admin'
            })
            .eq('id', finalAdminProfile.id);
        
        if (updateError) {
            console.error('❌ Profile update failed:', updateError.message);
            return false;
        }
        
        console.log('✅ Admin profile updated successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Fix admin profile error:', error.message);
        return false;
    }
}

async function testFinalLogin() {
    console.log('\n🔐 Testing final login...');
    
    try {
        // Test the exact login method used by the application
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'admin@company.com', // This is what the app creates from username 'admin'
            password: 'admin1'
        });
        
        if (signInError) {
            console.error('❌ Login failed:', signInError.message);
            return false;
        }
        
        console.log('✅ Login successful!');
        
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
            console.log('👤 Profile verification:');
            console.log(`   - Username: ${profile.username}`);
            console.log(`   - Role: ${profile.role}`);
            console.log(`   - Status: ${profile.status}`);
            console.log(`   - Profile Completed: ${profile.profile_completed}`);
            
            if (profile.role === 'admin' && profile.status === 'active') {
                console.log('\n🎉 Perfect! Admin login is working correctly!');
                return true;
            } else {
                console.log('\n⚠️ Profile needs adjustment');
                return false;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Login test failed:', error);
        return false;
    }
}

async function main() {
    console.log('🔍 Profile Check and Fix Utility\n');
    
    // Step 1: Check all profiles
    const profiles = await checkAllProfiles();
    
    if (profiles === null) {
        console.log('❌ Cannot proceed - error checking profiles');
        return;
    }
    
    // Step 2: Fix admin profile if needed
    const fixSuccess = await fixAdminProfile();
    
    if (!fixSuccess) {
        console.log('❌ Cannot proceed - error fixing admin profile');
        return;
    }
    
    // Step 3: Test final login
    const loginSuccess = await testFinalLogin();
    
    if (loginSuccess) {
        console.log(`
🎉 SUCCESS! Admin User is Ready!

📱 How to Login to the Application:
1. Open: https://3000-imzyvtcds3oj7e6ycwfwi-6532622b.e2b.dev
2. Username: admin
3. Password: admin1
4. Click "ورود" (Login)

✅ The admin user is now properly configured and ready to use!
        `);
    } else {
        console.log(`
❌ Login test failed. Manual intervention may be required.

🔧 Manual Steps:
1. Go to Supabase dashboard
2. Check Authentication > Users 
3. Ensure admin@company.com user exists
4. Check Table Editor > profiles
5. Ensure admin profile has role='admin' and status='active'
        `);
    }
}

main().catch(console.error);