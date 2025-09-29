import React from 'react';

// Represents the public.profiles table, linked to auth.users
export interface UserProfile {
    id: string; // This is the UUID from auth.users
    username: string;
    personnel_id: string; // Linked personnel
    role: 'admin' | 'user';
    base_id?: string; // For supervisors
    profile_completed: boolean;
    status: 'pending' | 'active'; // For admin approval workflow
}

export interface Personnel {
    id: string;
    name: string;
    national_id: string;
    employment_status: 'Official' | 'Contractual'; // رسمی | طرحی
    productivity_status: 'Productive' | 'Non-Productive'; // بهره‌ور | غیر بهره‌ور
    driver_status: 'Driver' | 'Non-Driver'; // راننده | غیر راننده
    base_id?: string; // ID of the base they are assigned to
}

export interface WorkShift {
    id: string;
    type: 'Work' | 'Leave' | 'Miscellaneous'; // نوع شیفت
    title: string;
    code: string;
    equivalent_hours: number;
    holiday_hours?: number; // ساعت تعطیلات
    effect?: 'Incremental' | 'Decremental'; // افزایشی | کاهشی
}

export interface Base {
    id: string;
    name: string;
    number: string;
    type: 'Urban' | 'Road' | 'Bus' | 'Headquarters' | 'Support'; // شهری | جاده‌ای | اتوبوس | ستاد | پشتیبانی
    description?: string;
}

export interface PerformanceRecord {
    id?: string;
    personnel_id: string;
    day: number; // Day of the month
    shift_id: string;
    base_id: string; // The base where the shift was performed
    submitting_base_id: string; // The base of the supervisor who submitted the record
    year_month: string; // e.g., "1403-6"
}

// UI-only type for totals, not stored in DB
export interface PerformanceTotals {
    personnel_id: string;
    year_month: string;
    missions: number;
    meals: number;
}


export interface NavItemType {
    id: string;
    label: string;
    subLabel: string;
    icon: React.FC<{ className?: string }>;
}

export type SubmissionStatus = 'draft' | 'submitted';

export interface PerformanceSubmission {
    year_month: string;
    base_id: string;
    status: SubmissionStatus;
}


export interface MonthPerformanceData {
    records: PerformanceRecord[];
    submissions: PerformanceSubmission[];
    totals: PerformanceTotals[]; // UI state, loaded from local storage
}

export interface AuthContextType {
    user: UserProfile | null;
    personnel: Personnel[];
    shifts: WorkShift[];
    bases: Base[];
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    signUp: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    
    // Admin functions
    fetchAllUsers: () => Promise<UserProfile[]>;
    addUser: (profile: UserProfile) => Promise<{ success: boolean, error?: string, data?: UserProfile }>;
    updateUser: (userId: string, updates: Partial<UserProfile>) => Promise<{ success: boolean, error?: string }>;
    deleteUser: (userId: string) => Promise<{ success: boolean; error?: string; }>;
    deleteProfile: (userId: string) => Promise<{ success: boolean; error?: string; }>;

    addPersonnel: (p: Omit<Personnel, 'id'>) => Promise<Personnel | null>;
    updatePersonnel: (p: Personnel) => Promise<boolean>;
    deletePersonnel: (id: string) => Promise<{ success: boolean; error?: string; }>;
    
    addShift: (s: Omit<WorkShift, 'id'>) => Promise<WorkShift | null>;
    updateShift: (s: WorkShift) => Promise<boolean>;
    deleteShift: (id: string) => Promise<{ success: boolean; error?: string; }>;
    
    addBase: (b: Omit<Base, 'id'>) => Promise<Base | null>;
    updateBase: (b: Base) => Promise<boolean>;
    deleteBase: (id: string) => Promise<{ success: boolean; error?: string; }>;

    // Performance Data
    loadPerformanceDataForMonth: (year: string, month: string) => Promise<MonthPerformanceData>;
    savePerformanceDataForMonth: (year: string, month: string, records: PerformanceRecord[], totals: PerformanceTotals[], status: SubmissionStatus) => Promise<boolean>;
}