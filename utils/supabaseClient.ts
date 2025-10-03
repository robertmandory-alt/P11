import { createClient } from '@supabase/supabase-js';

// --- Supabase Configuration ---
// Updated with new database credentials
const supabaseUrl: string = 'https://frcrtkfyuejqgclrlpna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3J0a2Z5dWVqcWdjbHJscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMjgsImV4cCI6MjA3NDk5NzIyOH0.aeUln_V6snpVxAxNy_Uu0Nb1jl-Qpowplkpk6hBA_-o';
// --------------------------------------------------------------------


// Configuration validation
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase configuration is missing");
    throw new Error("Supabase URL and Anon Key are required");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
