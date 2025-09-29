import React, { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardPage from '../dashboard/DashboardPage';
import UserManagementPage from '../admin/UserManagementPage';
import PersonnelManagementPage from '../admin/PersonnelManagementPage';
import ShiftManagementPage from '../admin/ShiftManagementPage';
import BaseManagementPage from '../admin/BaseManagementPage'; // New import
import PerformanceMonitoringPage from '../admin/PerformanceMonitoringPage';
import { useAuth } from '../../context/AuthContext';
import { MenuIcon } from '../shared/Icons';

// User role pages
import UserDashboardPage from '../../context/user/UserDashboardPage';
import ProfileSetupPage from '../../context/user/ProfileSetupPage';
import PersonnelManageUserPage from '../../context/user/PersonnelManageUserPage';
import PerformanceSubmitPage from '../../context/user/PerformanceSubmitPage';
import ReportsPage from '../../context/user/ReportsPage';

const Layout: React.FC = () => {
    const { user, personnel } = useAuth();
    const defaultPage = user?.role === 'admin' ? 'dashboard' : 'home';
    const [activePage, setActivePage] = useState<string>(defaultPage);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const personnelName = user ? personnel.find(p => p.id === user.personnel_id)?.name : 'کاربر';
    const roleTitle = user?.role === 'admin' ? 'مدیر سیستم' : 'سرپرست پایگاه';

    const renderContent = () => {
        // Force profile setup page if user has not completed it yet.
        if (user && !user.profile_completed) {
            return <ProfileSetupPage />;
        }

        if (user?.role === 'admin') {
            switch (activePage) {
                case 'dashboard':
                    return <DashboardPage />;
                case 'user-management':
                    return <UserManagementPage />;
                case 'personnel-management':
                    return <PersonnelManagementPage />;
                case 'base-management': // New case
                    return <BaseManagementPage />;
                case 'shift-management':
                    return <ShiftManagementPage />;
                case 'performance-monitoring':
                    return <PerformanceMonitoringPage />;
                default:
                    return <DashboardPage />;
            }
        } else { // 'user' role
            // User pages are locked behind profile completion
            switch (activePage) {
                case 'home':
                    return <UserDashboardPage />;
                case 'base-info': // This is now the user's view of their info
                    return <ProfileSetupPage />; 
                case 'base-members':
                    return <PersonnelManageUserPage />;
                case 'performance-stats':
                    return <PerformanceSubmitPage />;
                case 'reports':
                    return <ReportsPage />;
                default:
                    return <UserDashboardPage />;
            }
        }
    };
    
    // Unified responsive layout for both admin and user roles
    return (
        <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="flex flex-col h-full lg:mr-72">
                <header className="bg-white shadow-sm p-4 flex items-center justify-between lg:hidden sticky top-0 z-30">
                     <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <div className="text-sm font-semibold">{`${personnelName} - ${roleTitle}`}</div>
                </header>
                 <main className="flex-1 p-4 md:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Layout;