import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavItemType } from '../../types';
import {
    DashboardIcon,
    AdminIcon,
    UsersIcon,
    ShiftsIcon,
    ClipboardListIcon,
    LogoutIcon,
    SystemIcon,
    PersonIcon,
    CityIcon,
    ChartBarIcon,
    DocumentReportIcon,
    XIcon
} from '../shared/Icons';

interface SidebarProps {
    activePage: string;
    setActivePage: (pageId: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const adminNavItems: NavItemType[] = [
    { id: 'dashboard', label: 'داشبورد', subLabel: 'نمای کلی سیستم', icon: DashboardIcon },
    { id: 'performance-monitoring', label: 'نظارت عملکرد', subLabel: 'جدول جامع', icon: ClipboardListIcon },
    { id: 'user-management', label: 'مدیریت کاربران', subLabel: 'سطوح دسترسی', icon: AdminIcon },
    { id: 'personnel-management', label: 'مدیریت پرسنل', subLabel: 'داده‌های پایه', icon: UsersIcon },
    { id: 'base-management', label: 'مدیریت پایگاه‌ها', subLabel: 'داده‌های پایه', icon: CityIcon },
    { id: 'shift-management', label: 'مدیریت شیفت‌ها', subLabel: 'داده‌های پایه', icon: ShiftsIcon },
];

const userNavItems: NavItemType[] = [
    { id: 'home', label: 'خانه', subLabel: 'نمای کلی پایگاه', icon: DashboardIcon },
    { id: 'base-info', label: 'ثبت اطلاعات پایگاه', subLabel: 'تنظیمات پایگاه و امضا', icon: CityIcon },
    { id: 'base-members', label: 'ثبت اعضای پایگاه', subLabel: 'مدیریت اعضای ثابت', icon: UsersIcon },
    { id: 'performance-stats', label: 'ثبت آمار کارکرد', subLabel: 'ماموریت‌ها و وعده‌های غذایی', icon: ChartBarIcon },
    { id: 'reports', label: 'گزارشات', subLabel: 'گزارش‌های عملکرد', icon: DocumentReportIcon },
];


const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, onClose }) => {
    const { user, logout, personnel } = useAuth();
    const navItems = user?.role === 'user' ? userNavItems : adminNavItems;
    
    const personnelName = user ? personnel.find(p => p.id === user.personnel_id)?.name : 'کاربر';
    
    const handleNavItemClick = (pageId: string) => {
        setActivePage(pageId);
        if (onClose) {
            onClose();
        }
    };

    const sidebarContent = (
         <>
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-blue-600 rounded-lg p-3 text-white">
                        <SystemIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-gray-800">سیستم مدیریت</h1>
                        <p className="text-sm text-gray-500">اورژانس</p>
                    </div>
                </div>
                 <button onClick={onClose} className="text-gray-500 hover:text-gray-800 lg:hidden">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="px-4 py-4 border-b">
                 <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold text-gray-800">{personnelName}</p>
                    <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'مدیر سیستم' : 'سرپرست پایگاه'}</p>
                 </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleNavItemClick(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-colors text-right ${
                            activePage === item.id 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        <item.icon className={`w-6 h-6 me-4 ${activePage === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div>
                            <span>{item.label}</span>
                            <p className="text-xs font-normal text-gray-400">{item.subLabel}</p>
                        </div>
                    </button>
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-gray-200">
                <button
                    onClick={logout}
                    className="w-full flex items-center px-4 py-3 text-sm font-semibold rounded-lg text-red-600 hover:bg-red-50 transition-colors text-right"
                >
                    <LogoutIcon className="w-5 h-5 me-3" />
                    <span>خروج از سیستم</span>
                </button>
            </div>
        </>
    );

    // Universal responsive sidebar for all roles
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>
            <aside className={`fixed top-0 right-0 h-full w-80 bg-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:w-72 lg:translate-x-0 lg:border-l lg:border-gray-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {sidebarContent}
            </aside>
        </>
    );
};

export default Sidebar;