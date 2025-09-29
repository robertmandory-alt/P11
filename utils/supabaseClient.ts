import { createClient } from '@supabase/supabase-js';

// --- مهم: این مقادیر را با اطلاعات پروژه Supabase خود جایگزین کنید ---
// می‌توانید این اطلاعات را از بخش API Settings در پنل Supabase خود پیدا کنید.
// FIX: Explicitly type supabaseUrl as string to avoid TypeScript error on comparison below.
const supabaseUrl: string = 'https://rjhobkhrmkhznstuxylf.supabase.co'; // مثال: https://xxxxxxxxxx.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaG9ia2hybWtoem5zdHV4eWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMjI5NzIsImV4cCI6MjA3NDY5ODk3Mn0.I6xrSPRrjTJjbjdh5il_hENYylf1s95L1df5DS1SuMo'; // کلید عمومی (anon key)
// --------------------------------------------------------------------


if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
    // Display a more user-friendly error on the page itself.
    const root = document.getElementById('root');
    if(root) {
        root.innerHTML = `
            <div style="font-family: 'Vazirmatn', sans-serif; direction: rtl; text-align: center; padding: 40px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 40px;">
                <h1 style="font-size: 24px; font-weight: bold; color: #b91c1c;">خطای پیکربندی Supabase</h1>
                <p style="font-size: 16px; color: #7f1d1d; margin-top: 16px;">
                    اتصال به دیتابیس برقرار نشد. لطفاً فایل 
                    <strong style="background-color: #fee2e2; padding: 2px 6px; border-radius: 4px;">utils/supabaseClient.ts</strong>
                    را باز کرده و مقادیر 
                    <code style="background-color: #fee2e2; padding: 2px 6px; border-radius: 4px;">supabaseUrl</code> و 
                    <code style="background-color: #fee2e2; padding: 2px 6px; border-radius: 4px;">supabaseAnonKey</code>
                    را با اطلاعات پروژه Supabase خود جایگزین کنید.
                </p>
            </div>
        `;
    }
    throw new Error("Supabase URL and Anon Key are required. Please update them in utils/supabaseClient.ts");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
