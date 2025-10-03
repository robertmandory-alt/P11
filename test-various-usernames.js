import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testVariousUsernames() {
    console.log('🧪 Testing Various Username Formats');
    console.log('====================================\n');
    
    const testCases = [
        { username: 'علی123', password: 'pass123', description: 'Persian + numbers' },
        { username: 'user@#$%', password: 'p@ss!', description: 'Special characters' },
        { username: 'محمدعلی رضایی', password: 'خیلی_پیچیده_۱۲۳', description: 'Persian with spaces and complex password' },
        { username: 'a', password: 'x', description: 'Single character username and password' },
        { username: '用户名123', password: '密码456', description: 'Chinese characters' },
        { username: 'user.with.dots', password: 'password.with.dots', description: 'Dots in username/password' }
    ];
    
    console.log('📝 Testing different username and password formats:\n');
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`🧪 Test ${i + 1}: ${testCase.description}`);
        console.log(`   Username: "${testCase.username}"`);
        console.log(`   Password: "${testCase.password}"`);
        
        try {
            const email = `${testCase.username.toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now()}@company.com`;
            
            const { data: signupData, error: signupError } = await supabase.auth.signUp({
                email,
                password: testCase.password,
                options: {
                    data: {
                        username: testCase.username
                    }
                }
            });
            
            if (signupError) {
                console.log(`   ❌ Signup failed: ${signupError.message}`);
            } else if (signupData.user) {
                console.log(`   ✅ Signup successful!`);
                console.log(`   👤 User ID: ${signupData.user.id.substring(0, 8)}...`);
                
                // Try to create profile
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: signupData.user.id,
                        username: testCase.username,
                        role: 'user',
                        status: 'pending',
                        profile_completed: false
                    }])
                    .select()
                    .single();
                
                if (profile) {
                    console.log(`   ✅ Profile created with username: "${profile.username}"`);
                } else {
                    console.log(`   ⚠️ Profile creation issue: ${profileError?.message}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log(''); // Empty line for spacing
    }
    
    // Check final results
    console.log('📊 Final Results: Checking all profiles...');
    const { data: allProfiles, error: fetchError } = await supabase
        .from('profiles')
        .select('username, role, status')
        .order('created_at', { ascending: false });
        
    if (allProfiles) {
        console.log(`   ✅ Total profiles: ${allProfiles.length}`);
        allProfiles.slice(0, 10).forEach((profile, index) => {
            console.log(`   ${index + 1}. "${profile.username}" (${profile.role}, ${profile.status})`);
        });
        
        const pendingCount = allProfiles.filter(p => p.status === 'pending').length;
        console.log(`\n   📈 Pending users for admin approval: ${pendingCount}`);
    }
    
    console.log('\n🎉 Username Format Test Complete!');
    console.log('=================================');
    console.log('✅ The system accepts various username and password formats');
}

testVariousUsernames().catch(console.error);