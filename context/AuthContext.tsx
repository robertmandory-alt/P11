import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { AuthContextType, UserProfile, Personnel, WorkShift, Base, PerformanceRecord, PerformanceTotals, SubmissionStatus, MonthPerformanceData } from '../types';
import { supabase } from '../utils/supabaseClient';
import { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [bases, setBases] = useState<Base[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkInitialSession = async () => {
            setLoading(true);
            try {
                // Explicitly get the session to make the initial load logic more robust
                // than relying solely on onAuthStateChange's initial fire.
                const { data: { session } } = await supabase.auth.getSession();
                await handleAuthStateChange(session);
            } catch (error) {
                console.error("Error during initial session check:", error);
                // Ensure a clean, logged-out state if the initial check fails.
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                // This is critical to prevent the app from getting stuck on the loading screen.
                setLoading(false);
            }
        };

        checkInitialSession();

        // Set up the listener for subsequent auth changes (e.g., login, logout).
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            // We don't need to manage the global loading state here, just update the auth state.
            handleAuthStateChange(session);
        });

        // Cleanup subscription on component unmount.
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleAuthStateChange = async (session: Session | null) => {
        try {
            if (session) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                // If profile exists and is active, fetch all initial data.
                if (profile && profile.status === 'active') {
                    setUser(profile);
                    setIsAuthenticated(true);
                    await fetchAllInitialData();
                } else {
                    // This handles pending users, users with no profile yet, or other statuses.
                    // They are not considered authenticated in our app's logic.
                    if (error) console.error('Error fetching profile:', error.message);
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                // No session means the user is logged out.
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error("Error during authentication state change:", error);
            // On any critical error, ensure user is in a logged-out state.
            setUser(null);
            setIsAuthenticated(false);
        }
    };
    
    const fetchAllInitialData = async () => {
        try {
            const [personnelRes, shiftsRes, basesRes] = await Promise.all([
                supabase.from('personnel').select('*'),
                supabase.from('shifts').select('*'),
                supabase.from('bases').select('*')
            ]);
    
            if (personnelRes.error) throw personnelRes.error;
            if (shiftsRes.error) throw shiftsRes.error;
            if (basesRes.error) throw basesRes.error;
    
            // Filter out the placeholder personnel from the main list
            if (personnelRes.data) setPersonnel(personnelRes.data.filter(p => p.id !== '00000000-0000-0000-0000-000000000000'));
            if (shiftsRes.data) setShifts(shiftsRes.data as WorkShift[]);
            if (basesRes.data) setBases(basesRes.data);
        } catch (error: any) {
            console.error("Error fetching initial data:", error.message);
            // The error will be caught by the handleAuthStateChange's catch block.
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        const { data: userAuth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError || !userAuth.user) {
            return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
        }
    
        // This check provides immediate feedback on the login page.
        // The main check is still handled by the auth state listener.
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', userAuth.user.id)
            .single();
    
        if (profileError || !profile) {
            await supabase.auth.signOut();
            return { success: false, error: 'پروفایل کاربری یافت نشد. ممکن است حساب شما حذف شده باشد.' };
        }
    
        if (profile.status === 'pending') {
            await supabase.auth.signOut();
            return { success: false, error: 'حساب کاربری شما در انتظار تایید مدیر است.' };
        }

        // The onAuthStateChange listener will handle setting the user state and loading screen.
        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthenticated(false);
    };

    const signUp = async (username: string, password: string) => {
        const email = `${username.toLowerCase()}@example.com`;
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) {
            return { success: false, error: 'خطا در ایجاد کاربر: ' + error.message };
        }
        if (data.user) {
            // The database trigger will automatically create a 'pending' profile.
            return { success: true };
        }
        return { success: false, error: 'خطای ناشناخته در ثبت نام.' };
    };
    
    // --- ADMIN CRUD FUNCTIONS ---
    const fetchAllUsers = async (): Promise<UserProfile[]> => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) { console.error("Error fetching users:", error.message); return []; }
        return data || [];
    }

    const addUser = async (profile: UserProfile): Promise<{ success: boolean, error?: string, data?: UserProfile }> => {
        const { data, error } = await supabase.from('profiles').insert(profile).select().single();
        if (error) {
            console.error("Error creating profile for user:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true, data };
    }

    const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
        const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
        if (error) { console.error("Update user error:", error.message); return { success: false, error: error.message }; }
        // If the current user is updated, update the local state as well
        if (user?.id === userId) {
            setUser(prevUser => prevUser ? { ...prevUser, ...data } : data);
        }
        return { success: true };
    };

    const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string; }> => {
        if (user?.id === userId) {
            const error = "شما نمی‌توانید حساب کاربری خود را حذف کنید.";
            alert(error);
            return { success: false, error };
        }
        return await deleteProfile(userId);
    };
    
    const deleteProfile = async (userId: string): Promise<{ success: boolean; error?: string; }> => {
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error("Error deleting profile:", error.message);
            return { success: false, error: 'خطا در حذف پروفایل کاربر.' };
        }
    };

    const addPersonnel = async (p: Omit<Personnel, 'id'>) => {
        const { data, error } = await supabase.from('personnel').insert(p).select().single();
        if (data) { setPersonnel(prev => [...prev, data]); return data; }
        return null;
    }
    const updatePersonnel = async (p: Personnel) => {
        const { error } = await supabase.from('personnel').update({ ...p }).eq('id', p.id);
        if (!error) setPersonnel(prev => prev.map(item => item.id === p.id ? p : item));
        return !error;
    }
    const deletePersonnel = async (id: string): Promise<{ success: boolean; error?: string; }> => {
        try {
            const { error } = await supabase.from('personnel').delete().eq('id', id);
            if (error) throw error;
            
            setPersonnel(prev => prev.filter(item => item.id !== id));
            return { success: true };
        } catch (error: any) {
            console.error("Error deleting personnel:", error.message);
            let userMessage = 'خطا در حذف پرسنل.';
            if (error.message.includes('performance_records_personnel_id_fkey')) {
                userMessage = 'امکان حذف وجود ندارد. این پرسنل دارای سوابق عملکرد ثبت شده است.';
            } else if (error.message.includes('profiles_personnel_id_fkey')) {
                userMessage = 'امکان حذف وجود ندارد. این پرسنل به یک حساب کاربری متصل است.';
            }
            return { success: false, error: userMessage };
        }
    }

    const addShift = async (s: Omit<WorkShift, 'id'>) => {
        const { data, error } = await supabase.from('shifts').insert(s).select().single();
        if (data) { setShifts(prev => [...prev, data as WorkShift]); return data as WorkShift; }
        return null;
    }
    const updateShift = async (s: WorkShift) => {
        const { error } = await supabase.from('shifts').update({ ...s }).eq('id', s.id);
        if (!error) setShifts(prev => prev.map(item => item.id === s.id ? s : item));
        return !error;
    }
    const deleteShift = async (id: string): Promise<{ success: boolean; error?: string; }> => {
         try {
            const { error } = await supabase.from('shifts').delete().eq('id', id);
            if (error) throw error;

            setShifts(prev => prev.filter(item => item.id !== id));
            return { success: true };
        } catch (error: any) {
            console.error("Error deleting shift:", error.message);
            let userMessage = 'خطا در حذف شیفت.';
             if (error.message.includes('performance_records_shift_id_fkey')) {
                userMessage = 'امکان حذف وجود ندارد. این شیفت در سوابق عملکرد پرسنل استفاده شده است.';
            }
            return { success: false, error: userMessage };
        }
    }

    const addBase = async (b: Omit<Base, 'id'>) => {
        const { data, error } = await supabase.from('bases').insert(b).select().single();
        if (data) { setBases(prev => [...prev, data]); return data; }
        return null;
    }
    const updateBase = async (b: Base) => {
        const { error } = await supabase.from('bases').update({ ...b }).eq('id', b.id);
        if (!error) setBases(prev => prev.map(item => item.id === b.id ? b : item));
        return !error;
    }
    const deleteBase = async (id: string): Promise<{ success: boolean; error?: string; }> => {
        try {
            const { error } = await supabase.from('bases').delete().eq('id', id);
            if (error) throw error;

            setBases(prev => prev.filter(item => item.id !== id));
            return { success: true };
        } catch (error: any) {
            console.error("Error deleting base:", error.message);
            let userMessage = 'خطا در حذف پایگاه.';
            if (error.message.includes('personnel_base_id_fkey')) {
                userMessage = 'امکان حذف وجود ندارد. این پایگاه به یک یا چند پرسنل تخصیص داده شده است.';
            } else if (error.message.includes('profiles_base_id_fkey')) {
                 userMessage = 'امکان حذف وجود ندارد. این پایگاه به یک یا چند کاربر (سرپرست) تخصیص داده شده است.';
            } else if (error.message.includes('performance_records_base_id_fkey') || error.message.includes('performance_records_submitting_base_id_fkey')) {
                userMessage = 'امکان حذف وجود ندارد. برای این پایگاه سوابق عملکرد ثبت شده است.';
            }
            return { success: false, error: userMessage };
        }
    }

    // --- PERFORMANCE DATA ---
    const loadPerformanceDataForMonth = async (year: string, month: string): Promise<MonthPerformanceData> => {
        const key = `${year}-${month}`;
        const [recordsRes, submissionsRes] = await Promise.all([
            supabase.from('performance_records').select('*').eq('year_month', key),
            supabase.from('performance_submissions').select('*').eq('year_month', key)
        ]);

        const totals = JSON.parse(localStorage.getItem(`totals-${key}`) || '[]');

        return {
            records: recordsRes.data || [],
            submissions: submissionsRes.data || [],
            totals
        };
    };

    const savePerformanceDataForMonth = async (year: string, month: string, records: PerformanceRecord[], totals: PerformanceTotals[], status: SubmissionStatus): Promise<boolean> => {
        const myBaseId = user?.base_id;
        if (!myBaseId) return false;
        
        const key = `${year}-${month}`;

        try {
            // 1. Delete old records for this base and month
            const { error: deleteError } = await supabase
                .from('performance_records')
                .delete()
                .match({ year_month: key, submitting_base_id: myBaseId });
            
            if (deleteError) {
                console.error("Error deleting old records:", deleteError.message);
                return false;
            }
            
            // 2. Insert new records with proper IDs
            const recordsWithIds = records.map(record => ({
                ...record,
                id: record.id || crypto.randomUUID(),
                year_month: key,
                submitting_base_id: myBaseId
            }));
            
        if (records.length > 0) {
                const { error: insertError } = await supabase
                .from('performance_records')
                    .insert(recordsWithIds);
                
                if (insertError) {
                    console.error("Error inserting records:", insertError.message);
                    alert('خطا در ذخیره رکوردها: ' + insertError.message);
                return false; 
                }
        }

            // 3. Upsert submission status
            const { error: upsertStatusError } = await supabase
            .from('performance_submissions')
            .upsert(
                { year_month: key, base_id: myBaseId, status: status },
                { onConflict: 'year_month,base_id' }
            );
            
            if (upsertStatusError) {
                console.error("Error upserting status:", upsertStatusError.message);
                return false;
            }

            // 4. Save totals to localStorage (as it's UI state)
            localStorage.setItem(`totals-${key}`, JSON.stringify(totals));

            return true;
        } catch (error: any) {
            console.error("Error saving performance data:", error.message);
            alert('خطا در ذخیره اطلاعات: ' + error.message);
            return false;
        }
    };

    const contextValue = {
        user, personnel, shifts, bases, isAuthenticated, loading,
        login, logout, signUp,
        fetchAllUsers, addUser, updateUser, deleteUser, deleteProfile,
        addPersonnel, updatePersonnel, deletePersonnel,
        addShift, updateShift, deleteShift,
        addBase, updateBase, deleteBase,
        loadPerformanceDataForMonth, savePerformanceDataForMonth
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};