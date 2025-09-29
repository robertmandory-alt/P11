import React from 'react';
import StatCard from './StatCard';
import { PersonIcon, CityIcon, RoadIcon, ClockIcon, ChevronDownIcon, PlusIcon } from '../shared/Icons';

const DashboardPage: React.FC = () => {
    const today = new Date();
    // A more robust Jalali conversion would use a library like `jalali-moment`.
    // For now, `toLocaleDateString` is a good approximation.
    const shamsiDate = today.toLocaleDateString('fa-IR-u-nu-latn', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const weekday = today.toLocaleDateString('fa-IR', { weekday: 'long' });

    const stats = [
        { title: "کل پرسنل", value: "۴", icon: PersonIcon, color: "text-blue-500" },
        { title: "ماموریت‌های شهری", value: "۰", icon: CityIcon, color: "text-green-500" },
        { title: "ماموریت‌های جاده‌ای", value: "۰", icon: RoadIcon, color: "text-orange-500" },
        { title: "کل ساعات کار", value: "۰", icon: ClockIcon, color: "text-purple-500" },
    ];

    const SelectInput: React.FC<{ children: React.ReactNode; defaultValue: string }> = ({ children, defaultValue }) => (
        <div className="relative w-full">
            <select
                defaultValue={defaultValue}
                className="w-full appearance-none bg-white border border-gray-300 rounded-md py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:border-blue-500"
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
                <ChevronDownIcon className="w-5 h-5"/>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">داشبورد مدیریتی</h1>
                <p className="text-sm text-gray-500 mt-1">{`${weekday}، ${shamsiDate}`}</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(stat => (
                    <StatCard key={stat.title} title={stat.title} value={stat.value} Icon={stat.icon} iconColor={stat.color} />
                ))}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="w-full">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">نام پایگاه</label>
                        <SelectInput defaultValue="">
                            <option value="" disabled>انتخاب کنید</option>
                            <option value="base1">پایگاه ۱</option>
                            <option value="base2">پایگاه ۲</option>
                        </SelectInput>
                    </div>
                    <div className="w-full">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">ماه</label>
                        <SelectInput defaultValue="shahrivar">
                             <option value="farvardin">فروردین</option>
                             <option value="ordibehesht">اردیبهشت</option>
                             <option value="khordad">خرداد</option>
                             <option value="tir">تیر</option>
                             <option value="mordad">مرداد</option>
                             <option value="shahrivar">شهریور</option>
                             <option value="mehr">مهر</option>
                             <option value="aban">آبان</option>
                             <option value="azar">آذر</option>
                             <option value="dey">دی</option>
                             <option value="bahman">بهمن</option>
                             <option value="esfand">اسفند</option>
                        </SelectInput>
                    </div>
                     <div className="w-full">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">سال</label>
                        <SelectInput defaultValue="1404">
                             <option value="1404">۱۴۰۴</option>
                             <option value="1403">۱۴۰۳</option>
                        </SelectInput>
                    </div>
                     <div className="w-full md:col-span-1">
                         <button className="bg-teal-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center w-full">
                            <PlusIcon className="w-5 h-5 me-2"/>
                            <span>تخصیص دسته شیفت</span>
                        </button>
                    </div>
                </div>
                <div className="mt-6 border-t border-gray-200 pt-4">
                     <p className="text-sm text-gray-500">۰ نفر انتخاب شده</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
