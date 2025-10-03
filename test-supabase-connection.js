import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('🔗 Testing Supabase connection...');
    
    try {
        // Test basic connection by checking auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.log('⚠️ Session check error:', sessionError.message);
        } else {
            console.log('✅ Supabase connection successful!');
            console.log('📊 Session:', session ? 'Active' : 'No active session');
        }
        
        // Test database connection by trying to query profiles table
        const { data: profiles, error: dbError } = await supabase
            .from('profiles')
            .select('count', { count: 'exact' });
            
        if (dbError) {
            console.log('❌ Database error:', dbError.message);
            console.log('💡 This might indicate the database schema is not set up.');
        } else {
            console.log('✅ Database connection successful!');
            console.log('📊 Profiles count:', profiles);
        }
        
        // Try a simple signup test with a unique email
        const testEmail = `test${Date.now()}@test.com`;
        console.log(`\n🧪 Testing signup with email: ${testEmail}`);
        
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: testEmail,
            password: 'testpass123',
            options: {
                data: {
                    username: 'testuser'
                }
            }
        });
        
        if (signupError) {
            console.log('❌ Signup test error:', signupError.message);
            console.log('📝 Error details:', signupError);
        } else {
            console.log('✅ Signup test successful!');
            console.log('👤 User created:', signupData.user ? 'Yes' : 'No');
            
            // If user was created, try to delete it
            if (signupData.user) {
                console.log('🗑️ Cleaning up test user...');
                // Note: Admin API required to delete users, so this might fail
            }
        }
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
    }
}

testConnection().catch(console.error);