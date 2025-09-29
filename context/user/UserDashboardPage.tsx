import React from 'react';

const UserDashboardPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">خانه</h1>
                <p className="text-sm text-gray-500 mt-1">به پنل سرپرست پایگاه خوش آمدید.</p>
            </header>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-700">از طریق منوی سمت راست می‌توانید به بخش‌های مختلف مانند ثبت اطلاعات پایگاه، مدیریت اعضا و ثبت کارکرد ماهانه دسترسی داشته باشید.</p>
            </div>
        </div>
    );
};

export default UserDashboardPage;
