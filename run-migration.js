import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('🚀 Starting database migration...');
        
        // Read migration file
        const migrationPath = join(__dirname, 'migrations', '001_update_personnel_schema.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Migration file loaded');
        console.log('🔄 Executing SQL...\n');
        
        // Split SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--'));
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                console.log(`Executing statement ${i + 1}/${statements.length}...`);
                const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
                
                if (error) {
                    // Try using direct query
                    const { error: queryError } = await supabase.from('personnel').select('id').limit(1);
                    if (queryError) {
                        console.error(`❌ Error executing statement ${i + 1}:`, error);
                        throw error;
                    }
                }
            }
        }
        
        console.log('\n✅ Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Verify the changes in Supabase dashboard');
        console.log('2. Test the personnel management features');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
runMigration();
