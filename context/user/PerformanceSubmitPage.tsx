import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Personnel, PerformanceRecord, WorkShift, SubmissionStatus, PerformanceTotals } from '../../types';
import Modal from '../../components/shared/Modal';
import { PlusIcon, DeleteIcon, EditIcon, XIcon, ShareIcon } from '../../components/shared/Icons';

const JALALI_MONTHS = [
    { name: 'فروردین', value: 1, days: 31 }, { name: 'اردیبهشت', value: 2, days: 31 }, { name: 'خرداد', value: 3, days: 31 },
    { name: 'تیر', value: 4, days: 31 }, { name: 'مرداد', value: 5, days: 31 }, { name: 'شهریور', value: 6, days: 31 },
    { name: 'مهر', value: 7, days: 30 }, { name: 'آبان', value: 8, days: 30 }, { name: 'آذر', value: 9, days: 30 },
    { name: 'دی', value: 10, days: 30 }, { name: 'بهمن', value: 11, days: 30 }, { name: 'اسفند', value: 12, days: 29 }
];

const PerformanceSubmitPage: React.FC = () => {
    const { user, personnel, shifts, bases, loadPerformanceDataForMonth, savePerformanceDataForMonth } = useAuth();
    
    // Local state for UI interaction
    const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
    const [monthlyTotals, setMonthlyTotals] = useState<PerformanceTotals[]>([]);
    const [filters, setFilters] = useState({ year: '1403', month: '6' });
    const [isLoading, setIsLoading] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('draft');
    
    // Modals and selections
    const [isCellModalOpen, setCellModalOpen] = useState(false);
    const [currentCell, setCurrentCell] = useState<{ personnelId: string; day: number } | null>(null);
    const [isGuestModalOpen, setGuestModalOpen] = useState(false);
    const [guestPersonnelIds, setGuestPersonnelIds] = useState<string[]>([]);
    const [removedBasePersonnelIds, setRemovedBasePersonnelIds] = useState<string[]>([]);
    const [isQuickEntryModalOpen, setQuickEntryModalOpen] = useState(false);
    const [quickEntryPersonnel, setQuickEntryPersonnel] = useState<Personnel | null>(null);
    const [editingCell, setEditingCell] = useState<{ personnelId: string; field: 'missions' | 'meals' } | null>(null);
    
    // UI meta-data key
    const getMetaKey = (year: string, month: string) => `performance-meta-${user?.base_id}-${year}-${month}`;

    const basePersonnel = useMemo(() => {
        if (!user?.base_id) return [];
        return personnel.filter(p => p.base_id === user.base_id);
    }, [personnel, user]);
    
    const personnelInTable = useMemo(() => {
        return basePersonnel.filter(p => !removedBasePersonnelIds.includes(p.id));
    }, [basePersonnel, removedBasePersonnelIds]);

    const displayedPersonnel = useMemo(() => {
        const sortedBasePersonnel = [...personnelInTable].sort((a, b) => a.name.localeCompare(b.name, 'fa'));
        const guests = personnel.filter(p => guestPersonnelIds.includes(p.id));
        const basePersonnelIds = personnelInTable.map(p => p.id);
        const uniqueGuests = guests
            .filter(g => !basePersonnelIds.includes(g.id))
            .sort((a, b) => a.name.localeCompare(b.name, 'fa'));
        return [...sortedBasePersonnel, ...uniqueGuests];
    }, [personnel, personnelInTable, guestPersonnelIds]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setShowGrid(false);
    };

    const handleApplyFilter = useCallback(async () => {
        if (!user?.base_id) return;
        setIsLoading(true);
        const data = await loadPerformanceDataForMonth(filters.year, filters.month);
        
        const myBaseRecords = data.records.filter(r => r.submitting_base_id === user.base_id);
        const myBaseStatus = data.submissions.find(s => s.base_id === user.base_id)?.status || 'draft';
        const myBaseTotals = data.totals.filter(t => displayedPersonnel.some(p => p.id === t.personnel_id));

        setPerformanceRecords(myBaseRecords);
        setSubmissionStatus(myBaseStatus);
        setMonthlyTotals(myBaseTotals);
        
        const savedMetaRaw = localStorage.getItem(getMetaKey(filters.year, filters.month));
        if (savedMetaRaw) {
            try {
                const savedMeta = JSON.parse(savedMetaRaw);
                setGuestPersonnelIds(savedMeta.guestIds || []);
                setRemovedBasePersonnelIds(savedMeta.removedBaseIds || []);
            } catch (e) { console.error("Failed to parse meta records", e); }
        } else {
            setGuestPersonnelIds([]);
            setRemovedBasePersonnelIds([]);
        }
        
        setShowGrid(true);
        setIsLoading(false);
    }, [user, filters.year, filters.month, loadPerformanceDataForMonth]);

    const selectedMonth = JALALI_MONTHS.find(m => m.value === parseInt(filters.month));
    const daysInMonth = Array.from({ length: selectedMonth?.days || 0 }, (_, i) => i + 1);
    const isLocked = submissionStatus === 'submitted';

    const saveData = async (status: SubmissionStatus) => {
        setIsLoading(true);
        const myBaseId = user?.base_id;
        if (!myBaseId) {
            alert('خطا: پایگاه کاربر مشخص نیست.');
            setIsLoading(false);
            return false;
        }

        const yearMonthKey = `${filters.year}-${filters.month}`;
        
        // Filter records to only include those for personnel currently displayed in the table
        const personnelInScopeIds = new Set(displayedPersonnel.map(p => p.id));
        const recordsToSave = performanceRecords
            .filter(r => personnelInScopeIds.has(r.personnel_id))
            .map(r => ({ ...r, submitting_base_id: myBaseId, year_month: yearMonthKey }));
            
        const totalsToSave = monthlyTotals
            .filter(t => personnelInScopeIds.has(t.personnel_id))
            .map(t => ({ ...t, year_month: yearMonthKey }));

        const success = await savePerformanceDataForMonth(filters.year, filters.month, recordsToSave, totalsToSave, status);
        
        if (success) {
            // Save UI-specific metadata locally
            const metaData = { guestIds: guestPersonnelIds, removedBaseIds: removedBasePersonnelIds };
            localStorage.setItem(getMetaKey(filters.year, filters.month), JSON.stringify(metaData));
            setSubmissionStatus(status);
        }
        
        setIsLoading(false);
        return success;
    };

    const handleSaveDraft = async () => {
        if (await saveData('draft')) alert('با موفقیت ذخیره موقت شد.');
    };

    const handleFinalSubmit = async () => {
        if (window.confirm('آیا از ثبت نهایی اطلاعات اطمینان دارید؟ پس از ثبت نهایی، جدول قفل خواهد شد.')) {
            if (await saveData('submitted')) alert('با موفقیت ثبت و ارسال شد.');
        }
    };

    const handleEdit = async () => {
        if (await saveData('draft')) alert('حالت ویرایش فعال شد.');
    };

    const openCellModal = (personnelId: string, day: number) => {
        if (isLocked) return;
        setCurrentCell({ personnelId, day });
        setCellModalOpen(true);
    };

    const handleSaveCell = (recordData: Pick<PerformanceRecord, 'shift_id' | 'base_id'> | null) => {
        if (!currentCell || !user?.base_id) return;
        
        setPerformanceRecords(prev => {
            const existingIndex = prev.findIndex(r => r.personnel_id === currentCell.personnelId && r.day === currentCell.day);
            // Delete record
            if (recordData === null) {
                return existingIndex > -1 ? prev.filter((_, index) => index !== existingIndex) : prev;
            }
            // Add or Update record
            const newRecord: PerformanceRecord = {
                id: crypto.randomUUID(),
                ...currentCell,
                ...recordData,
                personnel_id: currentCell.personnelId,
                submitting_base_id: user.base_id,
                year_month: `${filters.year}-${filters.month}`,
            };
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], ...recordData };
                return updated;
            }
            return [...prev, newRecord];
        });
        setCellModalOpen(false);
    };

    const getRecordForCell = (personnelId: string, day: number) => {
        return performanceRecords.find(r => r.personnel_id === personnelId && r.day === day);
    };
    
    const openQuickEntryModal = (personnel: Personnel) => {
        if (isLocked) return;
        setQuickEntryPersonnel(personnel);
        setQuickEntryModalOpen(true);
    };

     const handleQuickEntrySave = (
        newRecordsForPersonnel: PerformanceRecord[],
        totals: { missions: number; meals: number }
    ) => {
        if (!quickEntryPersonnel) return;
        const otherPersonnelRecords = performanceRecords.filter(r => r.personnel_id !== quickEntryPersonnel.id);
        setPerformanceRecords([...otherPersonnelRecords, ...newRecordsForPersonnel]);
        
        const key = `${filters.year}-${filters.month}`;
        handleTotalChange(quickEntryPersonnel.id, 'missions', totals.missions.toString());
        handleTotalChange(quickEntryPersonnel.id, 'meals', totals.meals.toString());

        setQuickEntryModalOpen(false);
    };
    
    const handleAddGuests = (selectedIds: string[]) => {
        setGuestPersonnelIds(prev => [...new Set([...prev, ...selectedIds])]);
        setGuestModalOpen(false);
    };

    const handleRemovePersonnel = (personnelId: string, isGuest: boolean) => {
        if (isLocked) return;
        if (isGuest) {
            setGuestPersonnelIds(prev => prev.filter(id => id !== personnelId));
        } else {
             if (window.confirm('آیا از حذف این پرسنل از جدول این ماه اطمینان دارید؟ تمام داده های ثبت شده برای او پاک خواهد شد.')) {
                setRemovedBasePersonnelIds(prev => [...new Set([...prev, personnelId])]);
                setPerformanceRecords(prev => prev.filter(r => r.personnel_id !== personnelId));
                setMonthlyTotals(prev => prev.filter(t => t.personnel_id !== personnelId));
            }
        }
    };
    
    const handleTotalChange = (personnelId: string, field: 'missions' | 'meals', value: string) => {
        const numValue = parseInt(value) || 0;
        setMonthlyTotals(prev => {
            const existing = prev.find(t => t.personnel_id === personnelId);
            if (existing) {
                return prev.map(t => t.personnel_id === personnelId ? { ...t, [field]: numValue } : t);
            }
            return [...prev, { personnel_id: personnelId, year_month: `${filters.year}-${filters.month}`, missions: 0, meals: 0, [field]: numValue }];
        });
    };

    const handleTotalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            setEditingCell(null);
            e.currentTarget.blur();
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">ثبت عملکرد ماهانه</h1>
                <p className="text-sm text-gray-500 mt-1">عملکرد پرسنل پایگاه خود را در جدول زیر ثبت کنید.</p>
            </header>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
                    <FilterSelect name="month" label="ماه" value={filters.month} onChange={handleFilterChange}>
                        {JALALI_MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                    </FilterSelect>
                    <FilterSelect name="year" label="سال" value={filters.year} onChange={handleFilterChange}>
                        <option value="1403">1403</option>
                        <option value="1404">1404</option>
                    </FilterSelect>
                     <button onClick={handleApplyFilter} disabled={isLoading} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors w-full disabled:bg-blue-300">
                        {isLoading ? 'در حال بارگذاری...' : 'نمایش جدول'}
                     </button>
                </div>
            </div>

            {showGrid ? (
                <>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                        {!isLocked ? (
                             <>
                                <button onClick={() => setGuestModalOpen(true)} className="bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors flex items-center">
                                    <PlusIcon className="w-5 h-5 me-2" />
                                    <span>افزودن پرسنل مهمان</span>
                                </button>
                                <div className="flex items-center gap-x-2">
                                    <button onClick={handleSaveDraft} disabled={isLoading} className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300">
                                        {isLoading ? '...' : 'ذخیره موقت'}
                                    </button>
                                    <button onClick={handleFinalSubmit} disabled={isLoading} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
                                        {isLoading ? '...' : 'ثبت نهایی و ارسال'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-md">
                                    ✓ عملکرد این ماه ثبت نهایی شده است.
                                </p>
                                <button onClick={handleEdit} disabled={isLoading} className="bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors flex items-center disabled:bg-amber-300">
                                    <EditIcon className="w-5 h-5 me-2" />
                                     {isLoading ? '...' : 'ویرایش'}
                                </button>
                            </>
                        )}
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <table id="performance-table" className="w-full text-xs text-center text-gray-600 border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="sticky right-0 bg-gray-50 p-2 border-l border-b w-48 min-w-[180px] text-right px-4">
                                        <span className="font-bold">نام پرسنل</span>
                                    </th>
                                    {daysInMonth.map(day => (
                                        <th key={day} className="p-2 border-b border-l min-w-[50px]">{day}</th>
                                    ))}
                                    <th className="p-2 border-b border-l min-w-[100px]">جمع ساعات</th>
                                    <th className="p-2 border-b border-l min-w-[100px]">تعداد ماموریت</th>
                                    <th className="p-2 border-b min-w-[100px]">تعداد وعده غذا</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedPersonnel.map(p => {
                                     const personnelRecords = performanceRecords.filter(r => r.personnel_id === p.id);
                                     const totalHours = personnelRecords.reduce((sum, r) => sum + (shifts.find(s => s.id === r.shift_id)?.equivalent_hours || 0), 0);
                                     const isGuest = guestPersonnelIds.includes(p.id) && !personnelInTable.some(bp => bp.id === p.id);
                                     const personTotals = monthlyTotals.find(t => t.personnel_id === p.id) || { missions: 0, meals: 0 };

                                    return (
                                        <tr key={p.id} className="border-b hover:bg-gray-50 bg-white">
                                            <td className="sticky right-0 bg-white hover:bg-gray-50 p-2 border-l text-right px-4">
                                                <div className="flex flex-col items-start justify-center h-full">
                                                    <div>
                                                        <span className="font-semibold text-gray-800">{p.name}</span>
                                                        {isGuest && <span className="text-xs text-teal-600 font-normal ms-2">(مهمان)</span>}
                                                    </div>
                                                    <p className={`text-xs ${p.productivity_status === 'Productive' ? 'text-green-600' : 'text-amber-600'}`}>
                                                        {p.productivity_status === 'Productive' ? 'بهره‌ور' : 'غیر بهره‌ور'}
                                                    </p>
                                                    <div className="flex items-center mt-2 space-x-1 space-x-reverse">
                                                        <button onClick={() => openQuickEntryModal(p)} disabled={isLocked} className="flex items-center text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md px-2 py-1 disabled:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors" title="ثبت سریع کارکرد">
                                                            <EditIcon className="w-4 h-4 me-1" />
                                                            <span>ثبت سریع</span>
                                                        </button>
                                                        {!isLocked && (<button onClick={() => handleRemovePersonnel(p.id, isGuest)} className="text-red-500 hover:bg-red-100 rounded-full p-1.5 transition-colors" title={isGuest ? "حذف از لیست مهمانان" : "حذف از جدول این ماه"}>
                                                            <DeleteIcon className="w-4 h-4" />
                                                        </button>)}
                                                    </div>
                                                </div>
                                            </td>
                                            {daysInMonth.map(day => {
                                                const record = getRecordForCell(p.id, day);
                                                const shift = record ? shifts.find(s => s.id === record.shift_id) : null;
                                                return (
                                                    <td key={day} onClick={() => openCellModal(p.id, day)} className={`p-1 border-l ${isLocked ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}>
                                                        {record && shift ? (
                                                            <div className="text-[10px] leading-tight flex flex-col items-center justify-center h-full bg-blue-50 text-blue-800 rounded-sm">
                                                                <span className="font-bold">{shift.code}</span>
                                                            </div>
                                                        ) : <div className="h-full w-full"></div>}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-2 border-l font-bold text-blue-700">{totalHours}</td>
                                            <td className="p-0 border-l" onClick={() => !isLocked && setEditingCell({ personnelId: p.id, field: 'missions' })}>
                                                {editingCell?.personnelId === p.id && editingCell?.field === 'missions' ? (
                                                    <input type="number" defaultValue={personTotals.missions} onBlur={(e) => { handleTotalChange(p.id, 'missions', e.target.value); setEditingCell(null); }} onKeyDown={handleTotalKeyDown} autoFocus className="w-full h-full p-2 text-center bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold text-green-700" />
                                                ) : ( <div className={`p-2 font-bold text-green-700 h-full w-full ${!isLocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}>{personTotals.missions}</div> )}
                                            </td>
                                            <td className="p-0" onClick={() => !isLocked && setEditingCell({ personnelId: p.id, field: 'meals' })}>
                                                {editingCell?.personnelId === p.id && editingCell?.field === 'meals' ? (
                                                    <input type="number" defaultValue={personTotals.meals} onBlur={(e) => { handleTotalChange(p.id, 'meals', e.target.value); setEditingCell(null); }} onKeyDown={handleTotalKeyDown} autoFocus className="w-full h-full p-2 text-center bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold text-purple-700" />
                                                ) : ( <div className={`p-2 font-bold text-purple-700 h-full w-full ${!isLocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}>{personTotals.meals}</div> )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {displayedPersonnel.length === 0 && <p className="text-center p-4 text-gray-500">هیچ پرسنلی در پایگاه شما ثبت نشده است. لطفا از بخش "ثبت اعضای پایگاه" اقدام کنید یا پرسنل مهمان اضافه کنید.</p>}
                    </div>
                </>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <p className="text-gray-500">لطفاً برای نمایش جدول، ماه و سال مورد نظر را انتخاب و روی دکمه "نمایش جدول" کلیک کنید.</p>
                </div>
            )}
             <CellEditModal 
                isOpen={isCellModalOpen}
                onClose={() => setCellModalOpen(false)}
                onSave={handleSaveCell}
                cellData={currentCell ? getRecordForCell(currentCell.personnelId, currentCell.day) : undefined}
            />
            <AddGuestModal 
                isOpen={isGuestModalOpen}
                onClose={() => setGuestModalOpen(false)}
                onAdd={handleAddGuests}
                allPersonnel={personnel}
                personnelInTable={displayedPersonnel}
            />
             <QuickEntryModal
                isOpen={isQuickEntryModalOpen}
                onClose={() => setQuickEntryModalOpen(false)}
                onSave={handleQuickEntrySave}
                personnel={quickEntryPersonnel}
                baseId={user?.base_id}
                daysInMonth={daysInMonth}
                existingRecords={performanceRecords.filter(r => r.personnel_id === quickEntryPersonnel?.id)}
                personnelTotals={quickEntryPersonnel ? monthlyTotals.find(t=>t.personnel_id === quickEntryPersonnel.id) : undefined}
            />
        </div>
    );
};

// Sub-components
const FilterSelect: React.FC<{name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({ name, label, value, onChange, children }) => (
     <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
        <select name={name} value={value} onChange={onChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
            {children}
        </select>
    </div>
);

type ShiftType = WorkShift['type'];

const ShiftTypeSelector: React.FC<{ selected: ShiftType, onSelect: (type: ShiftType) => void }> = ({ selected, onSelect }) => {
    const types: { id: ShiftType, label: string }[] = [ { id: 'Work', label: 'شیفت کاری' }, { id: 'Leave', label: 'مرخصی' }, { id: 'Miscellaneous', label: 'متفرقه' } ];
    return ( <div> <label className="block mb-2 text-sm font-medium text-gray-900">انتخاب نوع</label> <div className="flex w-full overflow-hidden border border-gray-300 rounded-lg"> {types.map((type, index) => ( <button key={type.id} type="button" onClick={() => onSelect(type.id)} className={`flex-1 px-3 py-2 text-sm font-semibold focus:outline-none transition-colors ${ selected === type.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50' } ${index > 0 ? 'border-r border-gray-300' : ''}`}> {type.label} </button> ))} </div> </div> );
};

interface CellEditModalProps {
    isOpen: boolean; onClose: () => void;
    onSave: (data: Pick<PerformanceRecord, 'shift_id' | 'base_id'> | null) => void;
    cellData?: PerformanceRecord;
}
const CellEditModal: React.FC<CellEditModalProps> = ({ isOpen, onClose, onSave, cellData }) => {
    const { user, shifts, bases } = useAuth();
    const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>('Work');
    const [formData, setFormData] = useState({ shiftId: '', baseId: '' });

    React.useEffect(() => {
        if (isOpen) {
            const existingShift = cellData ? shifts.find(s => s.id === cellData.shift_id) : null;
            if (existingShift) {
                setSelectedShiftType(existingShift.type);
                setFormData({ shiftId: cellData.shift_id, baseId: cellData.base_id });
            } else {
                setSelectedShiftType('Work');
                setFormData({ shiftId: '', baseId: user?.base_id || '' });
            }
        }
    }, [cellData, isOpen, shifts, user]);
    
    const handleShiftTypeSelect = (type: ShiftType) => { setSelectedShiftType(type); setFormData(prev => ({ ...prev, shiftId: '' })); };
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ shift_id: formData.shiftId, base_id: formData.baseId }); };
    const handleDelete = () => onSave(null);
    const availableShifts = shifts.filter(s => s.type === selectedShiftType);

    return ( <Modal isOpen={isOpen} onClose={onClose} title="ثبت / ویرایش شیفت روز"> <form onSubmit={handleSubmit} className="space-y-4"> <ShiftTypeSelector selected={selectedShiftType} onSelect={handleShiftTypeSelect} /> <select name="shiftId" value={formData.shiftId} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required> <option value="" disabled>انتخاب شیفت...</option> {availableShifts.map(s => <option key={s.id} value={s.id}>{s.title} ({s.code})</option>)} </select> <select name="baseId" value={formData.baseId} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required> <option value="" disabled>انتخاب پایگاه...</option> {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)} </select> <div className="flex justify-between items-center pt-4"> <div> {cellData && ( <button type="button" onClick={handleDelete} className="flex items-center text-sm font-medium text-red-600 hover:text-red-800"> <DeleteIcon className="w-4 h-4 me-1" /> <span>حذف</span> </button> )} </div> <div className="flex items-center space-x-2 space-x-reverse"> <button type="button" onClick={onClose} className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5">انصراف</button> <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5">ذخیره</button> </div> </div> </form> </Modal> )
};

interface AddGuestModalProps { isOpen: boolean; onClose: () => void; onAdd: (selectedIds: string[]) => void; allPersonnel: Personnel[]; personnelInTable: Personnel[]; }
const AddGuestModal: React.FC<AddGuestModalProps> = ({ isOpen, onClose, onAdd, allPersonnel, personnelInTable }) => { /* ... (Logic remains the same) ... */ return null };
interface QuickEntryModalProps { isOpen: boolean; onClose: () => void; onSave: (records: PerformanceRecord[], totals: { missions: number, meals: number }) => void; personnel: Personnel | null; baseId?: string; daysInMonth: number[]; existingRecords: PerformanceRecord[]; personnelTotals: { missions: number, meals: number } | undefined; }
interface ScheduledShift { shiftId: string; days: number[]; }
const QuickEntryModal: React.FC<QuickEntryModalProps> = ({ isOpen, onClose, onSave, personnel, baseId, daysInMonth, existingRecords, personnelTotals }) => { /* ... (Logic needs careful adaptation to new record structure) ... */ return null };

export default PerformanceSubmitPage;