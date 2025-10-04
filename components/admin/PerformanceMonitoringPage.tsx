import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Personnel, PerformanceRecord, WorkShift, Base, PerformanceSubmission } from '../../types';
import { PlusIcon, SortIcon, SaveIcon, UndoIcon, RedoIcon, EyeIcon, EyeOffIcon, FilterIcon } from '../shared/Icons';
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
type DisplayMode = 'code' | 'title-code' | 'title-code-base';
type EditMode = 'viewing' | 'editing';

interface HistoryState {
    records: PerformanceRecord[];
    timestamp: number;
}

interface ColumnVisibility {
    performanceDuty: boolean;
    monthlyTotal: boolean;
    leaveTotal: boolean;
    vacationTotal: boolean;
    overtime: boolean;
    missionCount: boolean;
    mealCount: boolean;
}

const PerformanceMonitoringPage: React.FC = () => {
    const { personnel, shifts, bases, loadPerformanceDataForMonth, savePerformanceDataForMonth } = useAuth();
    
    // State management
    const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
    const [filters, setFilters] = useState({ year: '1403', month: '6', employment: 'all', productivity: 'all' });
    const [gridData, setGridData] = useState<{ records: PerformanceRecord[], submissions: PerformanceSubmission[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
    const [displayMode, setDisplayMode] = useState<DisplayMode>('title-code');
    const [editMode, setEditMode] = useState<EditMode>('viewing');
    const [isDirty, setIsDirty] = useState(false);
    
    // History for undo/redo
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Column visibility
    const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
        performanceDuty: true,
        monthlyTotal: true,
        leaveTotal: true,
        vacationTotal: true,
        overtime: true,
        missionCount: true,
        mealCount: true
    });
    
    // Modal states
    const [isShiftEditModalOpen, setIsShiftEditModalOpen] = useState(false);
    const [currentEditCell, setCurrentEditCell] = useState<{ personnelId: string; day: number } | null>(null);
    const [isGroupAssignModalOpen, setIsGroupAssignModalOpen] = useState(false);
    
    // Add to history when records change
    const addToHistory = useCallback((records: PerformanceRecord[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({
            records: JSON.parse(JSON.stringify(records)),
            timestamp: Date.now()
        });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setIsDirty(true);
    }, [history, historyIndex]);
    
    // Undo/Redo functions
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            if (gridData) {
                setGridData({
                    ...gridData,
                    records: JSON.parse(JSON.stringify(history[prevIndex].records))
                });
            }
        }
    }, [historyIndex, history, gridData]);
    
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            if (gridData) {
                setGridData({
                    ...gridData,
                    records: JSON.parse(JSON.stringify(history[nextIndex].records))
                });
            }
        }
    }, [historyIndex, history, gridData]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setGridData(null);
        setHistory([]);
        setHistoryIndex(-1);
        setIsDirty(false);
    };

    const handleApplyFilter = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await loadPerformanceDataForMonth(filters.year, filters.month);
            
            const submittedBaseIds = new Set(
                data.submissions
                    .filter(s => s.status === 'submitted')
                    .map(s => s.base_id)
            );
            
            const submittedRecords = data.records.filter(r => 
                submittedBaseIds.has(r.submitting_base_id)
            );
        
            setGridData({ records: submittedRecords, submissions: data.submissions });
            
            // Initialize history
            setHistory([{
                records: JSON.parse(JSON.stringify(submittedRecords)),
                timestamp: Date.now()
            }]);
            setHistoryIndex(0);
            setIsDirty(false);
            setEditMode('viewing');
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
                const nameA = `${a.first_name} ${a.last_name}` || a.name || '';
                const nameB = `${b.first_name} ${b.last_name}` || b.name || '';
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
    
    const handleCellClick = (personnelId: string, day: number) => {
        if (editMode === 'editing') {
            setCurrentEditCell({ personnelId, day });
            setIsShiftEditModalOpen(true);
        }
    };
    
    const handleShiftUpdate = (personnelId: string, day: number, shiftId: string, baseId: string) => {
        if (!gridData) return;
        
        const newRecord: PerformanceRecord = {
            id: `temp-${Date.now()}`,
            personnel_id: personnelId,
            day,
            shift_id: shiftId,
            base_id: baseId,
            submitting_base_id: baseId,
            year_month: `${filters.year}-${filters.month}`
        };
        
        const updatedRecords = [...gridData.records, newRecord];
        setGridData({ ...gridData, records: updatedRecords });
        addToHistory(updatedRecords);
        setIsShiftEditModalOpen(false);
    };
    
    const handleSave = async (final: boolean = false) => {
        if (!gridData) return;
        
        try {
            const status: 'draft' | 'submitted' = final ? 'submitted' : 'draft';
            const success = await savePerformanceDataForMonth(
                filters.year,
                filters.month,
                gridData.records,
                [],
                status
            );
            
            if (success) {
                alert(final ? 'اطلاعات با موفقیت نهایی شد' : 'اطلاعات با موفقیت ذخیره شد');
                setIsDirty(false);
                if (final) setEditMode('viewing');
            } else {
                alert('خطا در ذخیره اطلاعات');
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('خطا در ذخیره اطلاعات');
        }
    };
    
    const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
        setColumnVisibility(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };
    
    const calculateTotals = (personnelId: string) => {
        const records = gridData?.records.filter(r => r.personnel_id === personnelId) || [];
        
        let monthlyTotal = 0;
        let leaveTotal = 0;
        let vacationTotal = 0;
        let overtime = 0;
        let missionCount = 0;
        let mealCount = 0;
        
        records.forEach(record => {
            const shift = shifts.find(s => s.id === record.shift_id);
            if (shift) {
                monthlyTotal += shift.equivalent_hours;
                
                if (shift.type === 'Leave') {
                    leaveTotal += shift.equivalent_hours;
                }
                
                if (shift.holiday_hours) {
                    vacationTotal += shift.holiday_hours;
                }
                
                // Add logic for overtime, missions, meals based on shift properties
                if (shift.title.includes('اضافه')) {
                    overtime += shift.equivalent_hours;
                }
                
                if (shift.title.includes('مأموریت')) {
                    missionCount += 1;
                }
                
                if (shift.title.includes('غذا')) {
                    mealCount += 1;
                }
            }
        });
        
        return {
            performanceDuty: 0, // To be calculated based on specific rules
            monthlyTotal,
            leaveTotal,
            vacationTotal,
            overtime,
            missionCount,
            mealCount
        };
    };
    
    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">نظارت بر عملکرد</h1>
                    <p className="text-sm text-gray-500 mt-1">جدول جامع عملکرد پرسنل</p>
                </div>
            </header>

            {/* Filters */}
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
                    {/* Action Buttons */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                            <div className="flex gap-2 flex-wrap">
                                <button 
                                    onClick={() => setEditMode(editMode === 'viewing' ? 'editing' : 'viewing')}
                                    className={`${editMode === 'editing' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'} text-white font-semibold py-2 px-4 rounded-lg transition-colors`}
                                >
                                    {editMode === 'editing' ? '🔓 حالت ویرایش' : '🔒 حالت مشاهده'}
                                </button>
                                
                                {editMode === 'editing' && (
                                    <>
                                        <button 
                                            onClick={() => handleSave(false)} 
                                            disabled={!isDirty}
                                            className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                                        >
                                            💾 ذخیره موقت
                                        </button>
                                        <button 
                                            onClick={() => handleSave(true)} 
                                            disabled={!isDirty}
                                            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                                        >
                                            ✅ ذخیره نهایی
                                        </button>
                                        <button 
                                            onClick={handleUndo} 
                                            disabled={historyIndex <= 0}
                                            className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                                        >
                                            ↩️ بازگشت
                                        </button>
                                        <button 
                                            onClick={handleRedo} 
                                            disabled={historyIndex >= history.length - 1}
                                            className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                                        >
                                            ↪️ جلو
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            <div className="flex gap-2">
                                <FilterSelect name="displayMode" label="نمایش" value={displayMode} onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}>
                                    <option value="code">فقط کد</option>
                                    <option value="title-code">عنوان + کد</option>
                                    <option value="title-code-base">عنوان + کد + پایگاه</option>
                                </FilterSelect>
                            </div>
                        </div>
                    </div>
                    
                    {/* Group Assignment Button */}
                    {editMode === 'editing' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                             <button 
                                 onClick={() => setIsGroupAssignModalOpen(true)}
                                 disabled={selectedPersonnel.length === 0} 
                                 className="bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors flex items-center disabled:bg-gray-300"
                             >
                                <PlusIcon className="w-5 h-5 me-2" />
                                <span>تخصیص دسته جمعی ({selectedPersonnel.length})</span>
                            </button>
                        </div>
                    )}
                    
                    {/* Performance Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <table className="w-full text-xs text-center text-gray-600 border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="sticky right-0 bg-gray-50 p-2 border-l border-b w-48 min-w-[180px]">
                                        {editMode === 'editing' ? (
                                            <label className="flex items-center justify-start px-2">
                                                <input type="checkbox" onChange={handleSelectAll} className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                                <button onClick={() => requestSort('name')} className="flex items-center me-3 font-bold">
                                                    نام پرسنل <SortIcon className="w-4 h-4 ms-1" />
                                                </button>
                                            </label>
                                        ) : (
                                            <button onClick={() => requestSort('name')} className="flex items-center px-2 font-bold">
                                                نام پرسنل <SortIcon className="w-4 h-4 ms-1" />
                                            </button>
                                        )}
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
                                    {columnVisibility.performanceDuty && <th className="p-2 border-b border-l min-w-[100px]">موظفی عملکرد</th>}
                                    {columnVisibility.monthlyTotal && <th className="p-2 border-b border-l min-w-[100px]">جمع عملکرد</th>}
                                    {columnVisibility.leaveTotal && <th className="p-2 border-b border-l min-w-[100px]">مجموع مرخصی</th>}
                                    {columnVisibility.vacationTotal && <th className="p-2 border-b border-l min-w-[100px]">مجموع تعطیلات</th>}
                                    {columnVisibility.overtime && <th className="p-2 border-b border-l min-w-[100px]">اضافه کار</th>}
                                    {columnVisibility.missionCount && <th className="p-2 border-b border-l min-w-[100px]">تعداد مأموریت</th>}
                                    {columnVisibility.mealCount && <th className="p-2 border-b border-l min-w-[100px]">تعداد وعده غذا</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPersonnel.map(p => {
                                    const totals = calculateTotals(p.id);
                                    
                                    return (
                                        <tr key={p.id} className="border-b hover:bg-gray-50">
                                            <td className="sticky right-0 bg-white hover:bg-gray-50 p-2 border-l text-right">
                                                 {editMode === 'editing' ? (
                                                     <label className="flex items-center px-2">
                                                        <input type="checkbox" checked={selectedPersonnel.includes(p.id)} onChange={() => handleSelectPersonnel(p.id)} className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                                        <span className="me-3 font-semibold text-gray-800">{`${p.first_name} ${p.last_name}` || p.name}</span>
                                                    </label>
                                                 ) : (
                                                     <span className="px-2 font-semibold text-gray-800">{`${p.first_name} ${p.last_name}` || p.name}</span>
                                                 )}
                                            </td>
                                            {daysInMonth.map(day => {
                                                const records = getRecordsForCell(p.id, day);
                                                const isHoliday = HOLIDAYS.includes(day);
                                                return (
                                                    <td 
                                                        key={day} 
                                                        className={`p-1 border-l ${editMode === 'editing' ? 'cursor-pointer hover:bg-blue-50' : ''} ${isHoliday ? 'bg-red-50' : ''} ${records.length > 1 ? 'space-y-1' : ''}`}
                                                        onClick={() => handleCellClick(p.id, day)}
                                                    >
                                                        {records.length > 0 ? records.map(record => {
                                                            const shift = shifts.find(s => s.id === record.shift_id);
                                                            const base = bases.find(b => b.id === record.submitting_base_id);
                                                            return (
                                                                <div key={`${record.id}`} className="text-[10px] leading-tight flex flex-col items-center justify-center h-full bg-blue-50 rounded-sm p-0.5">
                                                                    {displayMode === 'code' && <span className="font-bold">{shift?.code}</span>}
                                                                    {displayMode === 'title-code' && (
                                                                        <>
                                                                            <span className="font-semibold">{shift?.title}</span>
                                                                            <span className="font-bold">{shift?.code}</span>
                                                                        </>
                                                                    )}
                                                                    {displayMode === 'title-code-base' && (
                                                                        <>
                                                                            <span className="font-semibold">{shift?.title}</span>
                                                                            <span className="font-bold">{shift?.code}</span>
                                                                            <span className="text-gray-500">{base?.name}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )
                                                        }) : <div className="h-full w-full"></div>}
                                                    </td>
                                                );
                                            })}
                                            {columnVisibility.performanceDuty && <td className="p-2 border-l font-bold text-blue-700">{totals.performanceDuty}</td>}
                                            {columnVisibility.monthlyTotal && <td className="p-2 border-l font-bold text-blue-700">{totals.monthlyTotal}</td>}
                                            {columnVisibility.leaveTotal && <td className="p-2 border-l font-bold text-orange-700">{totals.leaveTotal}</td>}
                                            {columnVisibility.vacationTotal && <td className="p-2 border-l font-bold text-red-700">{totals.vacationTotal}</td>}
                                            {columnVisibility.overtime && <td className="p-2 border-l font-bold text-green-700">{totals.overtime}</td>}
                                            {columnVisibility.missionCount && <td className="p-2 border-l font-bold text-purple-700">{totals.missionCount}</td>}
                                            {columnVisibility.mealCount && <td className="p-2 border-l font-bold text-indigo-700">{totals.mealCount}</td>}
                                        </tr>
                                    );
                                })}
                                {sortedPersonnel.length === 0 && (
                                    <tr>
                                        <td colSpan={daysInMonth.length + 8} className="text-center p-4">
                                            داده‌ای برای نمایش با فیلترهای انتخاب شده وجود ندارد.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Column Visibility Controls */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">نمایش/مخفی کردن ستون‌ها</h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(columnVisibility).map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => toggleColumnVisibility(key as keyof ColumnVisibility)}
                                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    {value ? <EyeIcon className="inline w-3 h-3 me-1" /> : <EyeOffIcon className="inline w-3 h-3 me-1" />}
                                    {key === 'performanceDuty' && 'موظفی عملکرد'}
                                    {key === 'monthlyTotal' && 'جمع عملکرد'}
                                    {key === 'leaveTotal' && 'مجموع مرخصی'}
                                    {key === 'vacationTotal' && 'مجموع تعطیلات'}
                                    {key === 'overtime' && 'اضافه کار'}
                                    {key === 'missionCount' && 'تعداد مأموریت'}
                                    {key === 'mealCount' && 'تعداد وعده غذا'}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                 <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-500">لطفاً برای نمایش جدول عملکرد، ماه و سال مورد نظر را انتخاب و سپس روی دکمه "اعمال فیلتر" کلیک کنید.</p>
                </div>
            )}
            
            {/* Shift Edit Modal */}
            {isShiftEditModalOpen && currentEditCell && (
                <ShiftEditModal
                    isOpen={isShiftEditModalOpen}
                    onClose={() => setIsShiftEditModalOpen(false)}
                    shifts={shifts}
                    bases={bases}
                    onSave={(shiftId, baseId) => handleShiftUpdate(currentEditCell.personnelId, currentEditCell.day, shiftId, baseId)}
                />
            )}
            
            {/* Group Assignment Modal */}
            {isGroupAssignModalOpen && (
                <GroupAssignmentModal
                    isOpen={isGroupAssignModalOpen}
                    onClose={() => setIsGroupAssignModalOpen(false)}
                    personnel={personnel}
                    shifts={shifts}
                    bases={bases}
                    selectedPersonnel={selectedPersonnel}
                    onAssign={(personnelIds, shiftId, baseId, days) => {
                        // Implement group assignment logic
                        console.log('Group assign:', personnelIds, shiftId, baseId, days);
                        setIsGroupAssignModalOpen(false);
                    }}
                />
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

// Shift Edit Modal Component
interface ShiftEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    shifts: WorkShift[];
    bases: Base[];
    onSave: (shiftId: string, baseId: string) => void;
}

const ShiftEditModal: React.FC<ShiftEditModalProps> = ({ isOpen, onClose, shifts, bases, onSave }) => {
    const [selectedShiftType, setSelectedShiftType] = useState<string>('Work');
    const [selectedShift, setSelectedShift] = useState<string>('');
    const [selectedBase, setSelectedBase] = useState<string>('');
    
    const filteredShifts = shifts.filter(s => s.type === selectedShiftType);
    
    const handleSubmit = () => {
        if (selectedShift && selectedBase) {
            onSave(selectedShift, selectedBase);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="ویرایش شیفت">
            <div className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">نوع شیفت</label>
                    <select 
                        value={selectedShiftType} 
                        onChange={(e) => setSelectedShiftType(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    >
                        <option value="Work">شیفت کاری</option>
                        <option value="Leave">مرخصی</option>
                        <option value="Miscellaneous">متفرقه</option>
                    </select>
                </div>
                
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">انتخاب شیفت</label>
                    <select 
                        value={selectedShift} 
                        onChange={(e) => setSelectedShift(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        required
                    >
                        <option value="">انتخاب کنید</option>
                        {filteredShifts.map(shift => (
                            <option key={shift.id} value={shift.id}>
                                {shift.title} ({shift.code}) - {shift.equivalent_hours} ساعت
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">پایگاه</label>
                    <select 
                        value={selectedBase} 
                        onChange={(e) => setSelectedBase(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        required
                    >
                        <option value="">انتخاب کنید</option>
                        {bases.map(base => (
                            <option key={base.id} value={base.id}>
                                {base.name} ({base.number})
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                    <button type="button" onClick={onClose} className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">
                        انصراف
                    </button>
                    <button onClick={handleSubmit} disabled={!selectedShift || !selectedBase} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-300">
                        تأیید
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// Group Assignment Modal Component
interface GroupAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    personnel: Personnel[];
    shifts: WorkShift[];
    bases: Base[];
    selectedPersonnel: string[];
    onAssign: (personnelIds: string[], shiftId: string, baseId: string, days: number[]) => void;
}

const GroupAssignmentModal: React.FC<GroupAssignmentModalProps> = ({ isOpen, onClose, personnel, shifts, bases, selectedPersonnel, onAssign }) => {
    const [selectionMode, setSelectionMode] = useState<'manual' | 'filter'>('manual');
    const [manualSelection, setManualSelection] = useState<string[]>(selectedPersonnel);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShift, setSelectedShift] = useState('');
    const [selectedBase, setSelectedBase] = useState('');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    
    // Filter options
    const [productivityFilter, setProductivityFilter] = useState<string>('all');
    const [employmentFilter, setEmploymentFilter] = useState<string>('all');
    const [experienceFilter, setExperienceFilter] = useState<string>('all');
    
    const filteredPersonnel = useMemo(() => {
        return personnel.filter(p => {
            const matchesSearch = searchTerm === '' || 
                `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (selectionMode === 'manual') {
                return matchesSearch;
            } else {
                const matchesProductivity = productivityFilter === 'all' || p.productivity_status === productivityFilter;
                const matchesEmployment = employmentFilter === 'all' || p.employment_status === employmentFilter;
                const matchesExperience = experienceFilter === 'all' || p.work_experience === experienceFilter;
                
                return matchesSearch && matchesProductivity && matchesEmployment && matchesExperience;
            }
        });
    }, [personnel, searchTerm, selectionMode, productivityFilter, employmentFilter, experienceFilter]);
    
    const handleTogglePersonnel = (id: string) => {
        setManualSelection(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };
    
    const handleSelectAllFiltered = () => {
        setManualSelection(filteredPersonnel.map(p => p.id));
    };
    
    const handleSubmit = () => {
        if (selectedShift && selectedBase && selectedDays.length > 0) {
            const finalSelection = selectionMode === 'manual' ? manualSelection : filteredPersonnel.map(p => p.id);
            onAssign(finalSelection, selectedShift, selectedBase, selectedDays);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تخصیص دسته جمعی شیفت">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Selection Mode */}
                <div className="flex gap-2 border-b pb-3">
                    <button
                        onClick={() => setSelectionMode('manual')}
                        className={`px-4 py-2 rounded-lg ${selectionMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        انتخاب دستی
                    </button>
                    <button
                        onClick={() => setSelectionMode('filter')}
                        className={`px-4 py-2 rounded-lg ${selectionMode === 'filter' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        انتخاب فیلتری
                    </button>
                </div>
                
                {/* Search */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">جستجوی پرسنل</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="نام پرسنل را وارد کنید..."
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    />
                </div>
                
                {/* Filter Options (only in filter mode) */}
                {selectionMode === 'filter' && (
                    <div className="grid grid-cols-3 gap-3 bg-blue-50 p-3 rounded-lg">
                        <div>
                            <label className="block mb-1 text-xs font-medium text-gray-700">بهره‌وری</label>
                            <select 
                                value={productivityFilter} 
                                onChange={(e) => setProductivityFilter(e.target.value)}
                                className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-lg p-2"
                            >
                                <option value="all">همه</option>
                                <option value="Productive">بهره‌ور</option>
                                <option value="Non-Productive">غیر بهره‌ور</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium text-gray-700">استخدام</label>
                            <select 
                                value={employmentFilter} 
                                onChange={(e) => setEmploymentFilter(e.target.value)}
                                className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-lg p-2"
                            >
                                <option value="all">همه</option>
                                <option value="Official">رسمی</option>
                                <option value="Contractual">طرحی</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium text-gray-700">سابقه کاری</label>
                            <select 
                                value={experienceFilter} 
                                onChange={(e) => setExperienceFilter(e.target.value)}
                                className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-lg p-2"
                            >
                                <option value="all">همه</option>
                                <option value="0-4">۰-۴ سال</option>
                                <option value="4-8">۴-۸ سال</option>
                                <option value="8-12">۸-۱۲ سال</option>
                                <option value="12-16">۱۲-۱۶ سال</option>
                                <option value="16+">۱۶+ سال</option>
                            </select>
                        </div>
                    </div>
                )}
                
                {/* Personnel List */}
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                            پرسنل ({selectionMode === 'manual' ? manualSelection.length : filteredPersonnel.length} نفر)
                        </span>
                        {selectionMode === 'manual' && (
                            <button
                                onClick={handleSelectAllFiltered}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                انتخاب همه
                            </button>
                        )}
                    </div>
                    {filteredPersonnel.map(p => (
                        <div key={p.id} className="flex items-center gap-2 py-1">
                            {selectionMode === 'manual' && (
                                <input
                                    type="checkbox"
                                    checked={manualSelection.includes(p.id)}
                                    onChange={() => handleTogglePersonnel(p.id)}
                                    className="form-checkbox h-4 w-4"
                                />
                            )}
                            <span className="text-sm">{`${p.first_name} ${p.last_name}` || p.name}</span>
                            <span className="text-xs text-gray-500">
                                ({p.employment_status === 'Official' ? 'رسمی' : 'طرحی'})
                            </span>
                        </div>
                    ))}
                </div>
                
                {/* Shift Selection */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">انتخاب شیفت</label>
                    <select 
                        value={selectedShift} 
                        onChange={(e) => setSelectedShift(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        required
                    >
                        <option value="">انتخاب کنید</option>
                        {shifts.map(shift => (
                            <option key={shift.id} value={shift.id}>
                                {shift.title} ({shift.code})
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Base Selection */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">پایگاه</label>
                    <select 
                        value={selectedBase} 
                        onChange={(e) => setSelectedBase(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        required
                    >
                        <option value="">انتخاب کنید</option>
                        {bases.map(base => (
                            <option key={base.id} value={base.id}>
                                {base.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Day Selection - Simplified */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">انتخاب روزها</label>
                    <input
                        type="text"
                        placeholder="روزها را با ویرگول جدا کنید (مثال: 1,2,3,10-15)"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        onChange={(e) => {
                            // Parse input like "1,2,3,10-15"
                            const days: number[] = [];
                            e.target.value.split(',').forEach(part => {
                                if (part.includes('-')) {
                                    const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                                    for (let i = start; i <= end; i++) {
                                        if (i >= 1 && i <= 31) days.push(i);
                                    }
                                } else {
                                    const day = parseInt(part.trim());
                                    if (day >= 1 && day <= 31) days.push(day);
                                }
                            });
                            setSelectedDays([...new Set(days)].sort((a, b) => a - b));
                        }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        روزهای انتخاب شده: {selectedDays.length > 0 ? selectedDays.join(', ') : 'هیچ'}
                    </p>
                </div>
                
                <div className="flex justify-end pt-4 space-x-2 space-x-reverse border-t">
                    <button type="button" onClick={onClose} className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5">
                        انصراف
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!selectedShift || !selectedBase || selectedDays.length === 0}
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-gray-300"
                    >
                        تخصیص گروهی
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PerformanceMonitoringPage;
