import React from 'react';

const ReportsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">گزارشات</h1>
                <p className="text-sm text-gray-500 mt-1">گزارش‌های عملکرد</p>
            </header>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center min-h-[200px]">
                <p className="text-gray-500">این بخش در حال حاضر در دست ساخت است.</p>
            </div>
        </div>
    );
};

export default ReportsPage;
