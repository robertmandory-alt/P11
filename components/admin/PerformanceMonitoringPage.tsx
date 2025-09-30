import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Personnel, PerformanceRecord, WorkShift, Base, PerformanceSubmission } from '../../types';
import { FileCsvIcon, FileSpreadsheetIcon, ImageIcon, PlusIcon, SortIcon } from '../shared/Icons';
import Modal from '../shared/Modal';

// Jalali month details
const JALALI_MONTHS = [
    { name: 'فروردین', value: 1, days: 31 }, { name: 'اردیبهشت', value: 2, days: 31 }, { name: 'خرداد', value: 3, days: 31 },
    { name: 'تیر', value: 4, days: 31 }, { name: 'مرداد', value: 5, days: 31 }, { name: 'شهریور', value: 6, days: 31 },
    { name: 'مهر', value: 7, days: 30 }, { name: 'آبان', value: 8, days: 30 }, { name: 'آذر', value: 9, days: 30 },
    { name: 'دی', value: 10, days: 30 }, { name: 'بهمن', value: 11, days: 30 }, { name: 'اسفند', value: 12, days: 29 }
];
const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const HOLIDAYS = [1, 12, 13]; // Example holidays

type SortConfig = { key: 'name'; direction: 'ascending' | 'descending' };

const PerformanceMonitoringPage: React.FC = () => {
    const { personnel, shifts, bases, loadPerformanceDataForMonth } = useAuth();
    
    const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
    const [filters, setFilters] = useState({ year: '1403', month: '6', employment: 'all', productivity: 'all' });
    const [gridData, setGridData] = useState<{ records: PerformanceRecord[], submissions: PerformanceSubmission[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
    
    // Modals state... (can be added back if editing is needed)
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setGridData(null); // Reset grid data on filter change
    };

    const handleApplyFilter = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await loadPerformanceDataForMonth(filters.year, filters.month);
            console.log('Loaded performance data:', data);
            
            // Only show records from bases that have submitted their data
            const submittedBaseIds = new Set(
                data.submissions
                    .filter(s => s.status === 'submitted')
                    .map(s => s.base_id)
            );
            
            console.log('Submitted base IDs:', Array.from(submittedBaseIds));
            
            const submittedRecords = data.records.filter(r => 
                submittedBaseIds.has(r.submitting_base_id)
            );
            
            console.log('Filtered submitted records:', submittedRecords);
        
            setGridData({ records: submittedRecords, submissions: data.submissions });
        } catch (error) {
            console.error('Error loading performance data:', error);
            alert('خطا در بارگذاری اطلاعات عملکرد');
        }
        setIsLoading(false);
    }, [filters.year, filters.month, loadPerformanceDataForMonth]);

    const selectedMonth = JALALI_MONTHS.find(m => m.value === parseInt(filters.month));
    const daysInMonth = Array.from({ length: selectedMonth?.days || 0 }, (_, i) => i + 1);

    const personnelInGrid = useMemo(() => {
        if (!gridData) return [];
        const personnelIdsWithData = [...new Set(gridData.records.map(r => r.personnel_id))];
        return personnel.filter(p => 
            personnelIdsWithData.includes(p.id) &&
            (filters.employment === 'all' || p.employment_status === filters.employment) &&
            (filters.productivity === 'all' || p.productivity_status === filters.productivity)
        );
    }, [personnel, gridData, filters.employment, filters.productivity]);

    const sortedPersonnel = useMemo(() => {
        let sortableItems = [...personnelInGrid];
        if (sortConfig.key === 'name') {
            sortableItems.sort((a, b) => {
                const nameA = a.name || '';
                const nameB = b.name || '';
                if (nameA.localeCompare(nameB, 'fa') < 0) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (nameA.localeCompare(nameB, 'fa') > 0) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [personnelInGrid, sortConfig]);

    const requestSort = (key: 'name') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getRecordsForCell = (personnelId: string, day: number) => {
        return gridData?.records.filter(r => r.personnel_id === personnelId && r.day === day) || [];
    };

    const handleSelectPersonnel = (id: string) => {
        setSelectedPersonnel(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPersonnel(e.target.checked ? sortedPersonnel.map(p => p.id) : []);
    };
    
    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">نظارت بر عملکرد</h1>
                    <p className="text-sm text-gray-500 mt-1">جدول جامع عملکرد پرسنل (بر اساس داده‌های نهایی شده پایگاه‌ها)</p>
                </div>
            </header>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <FilterSelect name="month" label="ماه" value={filters.month} onChange={handleFilterChange}>
                        {JALALI_MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                    </FilterSelect>
                    <FilterSelect name="year" label="سال" value={filters.year} onChange={handleFilterChange}>
                        <option value="1403">1403</option>
                        <option value="1404">1404</option>
                    </FilterSelect>
                    <FilterSelect name="employment" label="وضعیت استخدامی" value={filters.employment} onChange={handleFilterChange}>
                        <option value="all">همه</option>
                        <option value="Official">رسمی</option>
                        <option value="Contractual">طرحی</option>
                    </FilterSelect>
                    <FilterSelect name="productivity" label="وضعیت بهره‌وری" value={filters.productivity} onChange={handleFilterChange}>
                        <option value="all">همه</option>
                        <option value="Productive">بهره‌ور</option>
                        <option value="Non-Productive">غیر بهره‌ور</option>
                    </FilterSelect>
                     <button onClick={handleApplyFilter} disabled={isLoading} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors w-full disabled:bg-blue-300">
                        {isLoading ? 'در حال بارگذاری...' : 'اعمال فیلتر'}
                     </button>
                </div>
            </div>

            {gridData ? (
                <>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                         <button disabled={selectedPersonnel.length === 0} className="bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors flex items-center disabled:bg-gray-300">
                            <PlusIcon className="w-5 h-5 me-2" />
                            <span>تخصیص دسته جمعی ({selectedPersonnel.length})</span>
                        </button>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <table className="w-full text-xs text-center text-gray-600 border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="sticky right-0 bg-gray-50 p-2 border-l border-b w-48 min-w-[180px]">
                                        <label className="flex items-center justify-start px-2">
                                            <input type="checkbox" onChange={handleSelectAll} className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                            <button onClick={() => requestSort('name')} className="flex items-center me-3 font-bold">
                                                نام پرسنل <SortIcon className="w-4 h-4 ms-1" />
                                            </button>
                                        </label>
                                    </th>
                                    {daysInMonth.map(day => {
                                        const dayOfWeek = WEEKDAYS[(day + 4) % 7];
                                        const isHoliday = HOLIDAYS.includes(day);
                                        return (
                                            <th key={day} className={`p-2 border-b border-l ${isHoliday ? 'bg-red-50 text-red-700' : ''}`}>
                                                <div>{dayOfWeek}</div>
                                                <div>{day}</div>
                                            </th>
                                        );
                                    })}
                                    <th className="p-2 border-b border-l min-w-[100px]">جمع ساعات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPersonnel.map(p => {
                                    const personnelRecords = gridData.records.filter(r => r.personnel_id === p.id);
                                    const totalHours = personnelRecords.reduce((sum, r) => sum + (shifts.find(s => s.id === r.shift_id)?.equivalent_hours || 0), 0);
                                    
                                    return (
                                        <tr key={p.id} className="border-b hover:bg-gray-50">
                                            <td className="sticky right-0 bg-white hover:bg-gray-50 p-2 border-l text-right">
                                                 <label className="flex items-center px-2">
                                                    <input type="checkbox" checked={selectedPersonnel.includes(p.id)} onChange={() => handleSelectPersonnel(p.id)} className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                                    <span className="me-3 font-semibold text-gray-800">{p.name}</span>
                                                </label>
                                            </td>
                                            {daysInMonth.map(day => {
                                                const records = getRecordsForCell(p.id, day);
                                                const isHoliday = HOLIDAYS.includes(day);
                                                return (
                                                    <td key={day} className={`p-1 border-l cursor-pointer ${isHoliday ? 'bg-red-50' : ''} ${records.length > 1 ? 'space-y-1' : ''}`}>
                                                        {records.length > 0 ? records.map(record => {
                                                            const shift = shifts.find(s => s.id === record.shift_id);
                                                            const base = bases.find(b => b.id === record.submitting_base_id);
                                                            return (
                                                                <div key={`${record.id}`} className="text-[10px] leading-tight flex flex-col items-center justify-center h-full bg-blue-50 rounded-sm p-0.5">
                                                                    <span className="font-bold">{shift?.code}</span>
                                                                    <span className="text-gray-500">{base?.name}</span>
                                                                </div>
                                                            )
                                                        }) : <div className="h-full w-full"></div>}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-2 border-l font-bold text-blue-700">{totalHours}</td>
                                        </tr>
                                    );
                                })}
                                {sortedPersonnel.length === 0 && (
                                    <tr>
                                        <td colSpan={daysInMonth.length + 2} className="text-center p-4">
                                            داده‌ای برای نمایش با فیلترهای انتخاب شده وجود ندارد.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-500">لطفاً برای نمایش جدول عملکرد، ماه و سال مورد نظر را انتخاب و سپس روی دکمه "اعمال فیلتر" کلیک کنید.</p>
                </div>
            )}

        </div>
    );
};

const FilterSelect: React.FC<{name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({ name, label, value, onChange, children }) => (
    <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
        <select name={name} value={value} onChange={onChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
            {children}
        </select>
    </div>
);


export default PerformanceMonitoringPage;