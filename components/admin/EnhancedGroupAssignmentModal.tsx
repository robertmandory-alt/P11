import React, { useState, useMemo } from 'react';
import { Personnel, WorkShift, Base, PerformanceRecord } from '../../types';
import Modal from '../shared/Modal';

interface EnhancedGroupAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    personnel: Personnel[];
    shifts: WorkShift[];
    bases: Base[];
    selectedPersonnel: string[];
    performanceRecords: PerformanceRecord[];
    year: string;
    month: string;
    onAssign: (personnelIds: string[], assignments: ShiftAssignment[]) => void;
}

interface ShiftAssignment {
    shiftId: string;
    baseId: string;
    days: number[];
    count: number;
}

interface AdvancedFilter {
    type: 'shift_count' | 'total_hours' | 'leave_days' | 'overtime_hours';
    operator: 'less_than' | 'greater_than' | 'equal_to' | 'between';
    value1: number;
    value2?: number;
}

// Utility function to get Jalali calendar days
const getJalaliMonthDays = (year: string, month: string): number => {
    const monthNum = parseInt(month);
    if (monthNum <= 6) return 31;
    if (monthNum <= 11) return 30;
    return parseInt(year) % 4 === 0 ? 30 : 29; // اسفند در سال کبیسه ۳۰ روز دارد
};

const EnhancedGroupAssignmentModal: React.FC<EnhancedGroupAssignmentModalProps> = ({
    isOpen, onClose, personnel, shifts, bases, selectedPersonnel, performanceRecords, year, month, onAssign
}) => {
    const [selectionMode, setSelectionMode] = useState<'manual' | 'filter' | 'advanced'>('manual');
    const [manualSelection, setManualSelection] = useState<string[]>(selectedPersonnel);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Basic filters
    const [productivityFilter, setProductivityFilter] = useState<string>('all');
    const [employmentFilter, setEmploymentFilter] = useState<string>('all');
    const [experienceFilter, setExperienceFilter] = useState<string>('all');
    
    // Advanced filters
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilter[]>([]);
    
    // Day selection mode
    const [daySelectionMode, setDaySelectionMode] = useState<'grid' | 'quick'>('grid');
    
    // Shift assignments
    const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([{
        shiftId: '',
        baseId: '',
        days: [],
        count: 1
    }]);
    
    const daysInMonth = getJalaliMonthDays(year, month);
    
    // Calculate personnel statistics for advanced filtering
    const personnelStats = useMemo(() => {
        return personnel.reduce((stats, p) => {
            const records = performanceRecords.filter(r => r.personnel_id === p.id);
            
            let totalHours = 0;
            let leaveDays = 0;
            let overtimeHours = 0;
            let shiftCounts: Record<string, number> = {};
            
            records.forEach(record => {
                const shift = shifts.find(s => s.id === record.shift_id);
                if (shift) {
                    totalHours += shift.equivalent_hours;
                    
                    if (shift.type === 'Leave') {
                        leaveDays += 1;
                    }
                    
                    if (shift.title.includes('اضافه')) {
                        overtimeHours += shift.equivalent_hours;
                    }
                    
                    shiftCounts[shift.id] = (shiftCounts[shift.id] || 0) + 1;
                }
            });
            
            stats[p.id] = {
                totalHours,
                leaveDays,
                overtimeHours,
                shiftCounts,
                totalShifts: records.length,
                personnelData: p
            };
            
            return stats;
        }, {} as Record<string, any>);
    }, [personnel, performanceRecords, shifts]);
    
    // Get personnel occupied days
    const getPersonnelOccupiedDays = (personnelId: string): number[] => {
        return performanceRecords
            .filter(r => r.personnel_id === personnelId)
            .map(r => r.day);
    };
    
    // Apply advanced filters
    const applyAdvancedFilters = (p: Personnel): boolean => {
        const stats = personnelStats[p.id];
        if (!stats) return true;
        
        return advancedFilters.every(filter => {
            let value: number = 0;
            
            switch (filter.type) {
                case 'total_hours':
                    value = stats.totalHours;
                    break;
                case 'leave_days':
                    value = stats.leaveDays;
                    break;
                case 'overtime_hours':
                    value = stats.overtimeHours;
                    break;
                case 'shift_count':
                    value = stats.totalShifts;
                    break;
            }
            
            switch (filter.operator) {
                case 'less_than':
                    return value < filter.value1;
                case 'greater_than':
                    return value > filter.value1;
                case 'equal_to':
                    return value === filter.value1;
                case 'between':
                    return value >= filter.value1 && value <= (filter.value2 || filter.value1);
                default:
                    return true;
            }
        });
    };
    
    const filteredPersonnel = useMemo(() => {
        return personnel.filter(p => {
            const matchesSearch = searchTerm === '' || 
                `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (selectionMode === 'manual') {
                return matchesSearch;
            }
            
            const matchesProductivity = productivityFilter === 'all' || p.productivity_status === productivityFilter;
            const matchesEmployment = employmentFilter === 'all' || p.employment_status === employmentFilter;
            const matchesExperience = experienceFilter === 'all' || p.work_experience === experienceFilter;
            
            const matchesBasicFilters = matchesSearch && matchesProductivity && matchesEmployment && matchesExperience;
            
            if (selectionMode === 'advanced') {
                return matchesBasicFilters && applyAdvancedFilters(p);
            }
            
            return matchesBasicFilters;
        });
    }, [personnel, searchTerm, selectionMode, productivityFilter, employmentFilter, experienceFilter, advancedFilters]);
    
    const handleTogglePersonnel = (id: string) => {
        setManualSelection(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };
    
    const handleSelectAllFiltered = () => {
        setManualSelection(filteredPersonnel.map(p => p.id));
    };
    
    const addAdvancedFilter = () => {
        setAdvancedFilters(prev => [...prev, {
            type: 'shift_count',
            operator: 'less_than',
            value1: 0
        }]);
    };
    
    const updateAdvancedFilter = (index: number, updates: Partial<AdvancedFilter>) => {
        setAdvancedFilters(prev => prev.map((filter, i) => 
            i === index ? { ...filter, ...updates } : filter
        ));
    };
    
    const removeAdvancedFilter = (index: number) => {
        setAdvancedFilters(prev => prev.filter((_, i) => i !== index));
    };
    
    const addShiftAssignment = () => {
        setShiftAssignments(prev => [...prev, {
            shiftId: '',
            baseId: '',
            days: [],
            count: 1
        }]);
    };
    
    const updateShiftAssignment = (index: number, updates: Partial<ShiftAssignment>) => {
        setShiftAssignments(prev => prev.map((assignment, i) => 
            i === index ? { ...assignment, ...updates } : assignment
        ));
    };
    
    const removeShiftAssignment = (index: number) => {
        setShiftAssignments(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleDayToggle = (assignmentIndex: number, day: number) => {
        updateShiftAssignment(assignmentIndex, {
            days: shiftAssignments[assignmentIndex].days.includes(day)
                ? shiftAssignments[assignmentIndex].days.filter(d => d !== day)
                : [...shiftAssignments[assignmentIndex].days, day].sort((a, b) => a - b)
        });
    };
    
    const handleQuickSelectEmptyDays = (assignmentIndex: number) => {
        const finalSelection = selectionMode === 'manual' ? manualSelection : filteredPersonnel.map(p => p.id);
        
        // Find common empty days across all selected personnel
        const commonEmptyDays: number[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const isDayEmptyForAll = finalSelection.every(personnelId => {
                const occupiedDays = getPersonnelOccupiedDays(personnelId);
                return !occupiedDays.includes(day);
            });
            
            if (isDayEmptyForAll) {
                commonEmptyDays.push(day);
            }
        }
        
        updateShiftAssignment(assignmentIndex, { days: commonEmptyDays });
    };
    
    const handleSubmit = () => {
        const validAssignments = shiftAssignments.filter(a => 
            a.shiftId && a.baseId && a.days.length > 0
        );
        
        if (validAssignments.length === 0) {
            alert('لطفاً حداقل یک تخصیص معتبر ایجاد کنید');
            return;
        }
        
        const finalSelection = selectionMode === 'manual' ? manualSelection : filteredPersonnel.map(p => p.id);
        
        if (finalSelection.length === 0) {
            alert('لطفاً حداقل یک پرسنل انتخاب کنید');
            return;
        }
        
        onAssign(finalSelection, validAssignments);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تخصیص ویژه و سریع شیفت">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Selection Mode */}
                <div className="flex gap-2 border-b pb-3">
                    <button
                        onClick={() => setSelectionMode('manual')}
                        className={`px-4 py-2 rounded-lg text-sm ${selectionMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        انتخاب دستی
                    </button>
                    <button
                        onClick={() => setSelectionMode('filter')}
                        className={`px-4 py-2 rounded-lg text-sm ${selectionMode === 'filter' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        انتخاب فیلتری
                    </button>
                    <button
                        onClick={() => setSelectionMode('advanced')}
                        className={`px-4 py-2 rounded-lg text-sm ${selectionMode === 'advanced' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                    >
                        فیلتر پیشرفته
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
                
                {/* Basic Filter Options */}
                {(selectionMode === 'filter' || selectionMode === 'advanced') && (
                    <div className="grid grid-cols-3 gap-3 bg-blue-50 p-3 rounded-lg">
                        <div>
                            <label className="block mb-1 text-xs font-medium text-gray-700">بهره‌وری</label>
                            <select 
                                value={productivityFilter} 
                                onChange={(e) => setProductivityFilter(e.target.value)}
                                className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-lg p-2"
                            >
                                <option value="all">همه</option>
                                <option value="active">فعال</option>
                                <option value="inactive">غیرفعال</option>
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
                                <option value="permanent">رسمی</option>
                                <option value="contract">طرحی</option>
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
                
                {/* Advanced Filters */}
                {selectionMode === 'advanced' && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">فیلترهای پیشرفته</span>
                            <button
                                onClick={addAdvancedFilter}
                                className="text-xs bg-purple-600 text-white px-2 py-1 rounded"
                            >
                                + افزودن فیلتر
                            </button>
                        </div>
                        
                        {advancedFilters.map((filter, index) => (
                            <div key={index} className="grid grid-cols-5 gap-2 mb-2 p-2 bg-white rounded">
                                <select
                                    value={filter.type}
                                    onChange={(e) => updateAdvancedFilter(index, { type: e.target.value as any })}
                                    className="text-xs border rounded p-1"
                                >
                                    <option value="shift_count">تعداد شیفت</option>
                                    <option value="total_hours">مجموع ساعات</option>
                                    <option value="leave_days">روزهای مرخصی</option>
                                    <option value="overtime_hours">اضافه کار</option>
                                </select>
                                
                                <select
                                    value={filter.operator}
                                    onChange={(e) => updateAdvancedFilter(index, { operator: e.target.value as any })}
                                    className="text-xs border rounded p-1"
                                >
                                    <option value="less_than">کمتر از</option>
                                    <option value="greater_than">بیشتر از</option>
                                    <option value="equal_to">برابر با</option>
                                    <option value="between">بین</option>
                                </select>
                                
                                <input
                                    type="number"
                                    value={filter.value1}
                                    onChange={(e) => updateAdvancedFilter(index, { value1: parseInt(e.target.value) || 0 })}
                                    className="text-xs border rounded p-1"
                                    placeholder="مقدار"
                                />
                                
                                {filter.operator === 'between' && (
                                    <input
                                        type="number"
                                        value={filter.value2 || ''}
                                        onChange={(e) => updateAdvancedFilter(index, { value2: parseInt(e.target.value) || undefined })}
                                        className="text-xs border rounded p-1"
                                        placeholder="تا"
                                    />
                                )}
                                
                                <button
                                    onClick={() => removeAdvancedFilter(index)}
                                    className="text-xs bg-red-500 text-white px-2 rounded"
                                >
                                    حذف
                                </button>
                            </div>
                        ))}
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
                            <span className="text-sm">{`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name}</span>
                            <span className="text-xs text-gray-500">
                                ({p.employment_status === 'permanent' ? 'رسمی' : 'طرحی'})
                            </span>
                            {selectionMode === 'advanced' && personnelStats[p.id] && (
                                <span className="text-xs text-purple-600">
                                    ({personnelStats[p.id].totalShifts} شیفت، {personnelStats[p.id].totalHours}س)
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Shift Assignments */}
                <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-medium">تخصیص شیفت‌ها</span>
                        <button
                            onClick={addShiftAssignment}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                        >
                            + افزودن شیفت
                        </button>
                    </div>
                    
                    {shiftAssignments.map((assignment, index) => (
                        <div key={index} className="border rounded p-3 mb-3 bg-gray-50">
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">شیفت</label>
                                    <select
                                        value={assignment.shiftId}
                                        onChange={(e) => updateShiftAssignment(index, { shiftId: e.target.value })}
                                        className="w-full text-xs border rounded p-1"
                                    >
                                        <option value="">انتخاب کنید</option>
                                        {shifts.map(shift => (
                                            <option key={shift.id} value={shift.id}>
                                                {shift.title} ({shift.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium mb-1">پایگاه</label>
                                    <select
                                        value={assignment.baseId}
                                        onChange={(e) => updateShiftAssignment(index, { baseId: e.target.value })}
                                        className="w-full text-xs border rounded p-1"
                                    >
                                        <option value="">انتخاب کنید</option>
                                        {bases.map(base => (
                                            <option key={base.id} value={base.id}>
                                                {base.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium mb-1">تعداد</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={assignment.count}
                                        onChange={(e) => updateShiftAssignment(index, { count: parseInt(e.target.value) || 1 })}
                                        className="w-full text-xs border rounded p-1"
                                    />
                                </div>
                                
                                <div className="flex items-end">
                                    <button
                                        onClick={() => removeShiftAssignment(index)}
                                        className="text-xs bg-red-500 text-white px-2 py-1 rounded w-full"
                                    >
                                        حذف
                                    </button>
                                </div>
                            </div>
                            
                            {/* Day Selection Mode */}
                            <div className="mb-2">
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setDaySelectionMode('grid')}
                                        className={`text-xs px-2 py-1 rounded ${daySelectionMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                    >
                                        انتخاب روز
                                    </button>
                                    <button
                                        onClick={() => setDaySelectionMode('quick')}
                                        className={`text-xs px-2 py-1 rounded ${daySelectionMode === 'quick' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                    >
                                        انتخاب سریع روز
                                    </button>
                                </div>
                                
                                {daySelectionMode === 'grid' ? (
                                    <div>
                                        <div className="grid grid-cols-7 gap-1 mb-2">
                                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                                const isSelected = assignment.days.includes(day);
                                                const isHoliday = day % 7 === 5 || day % 7 === 6; // تعطیلات هفته
                                                
                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => handleDayToggle(index, day)}
                                                        className={`
                                                            text-xs p-1 rounded border
                                                            ${isSelected ? 'bg-blue-600 text-white' : 'bg-white'}
                                                            ${isHoliday ? 'border-red-300 text-red-600' : 'border-gray-300'}
                                                        `}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            روزهای انتخاب شده: {assignment.days.length > 0 ? assignment.days.join(', ') : 'هیچ'}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <button
                                            onClick={() => handleQuickSelectEmptyDays(index)}
                                            className="text-xs bg-green-600 text-white px-3 py-1 rounded mb-2"
                                        >
                                            تخصیص به روزهای خالی
                                        </button>
                                        <p className="text-xs text-gray-500">
                                            روزهای انتخاب شده: {assignment.days.length > 0 ? assignment.days.join(', ') : 'هیچ'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end pt-4 space-x-2 space-x-reverse border-t">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5"
                    >
                        انصراف
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
                    >
                        تایید و اعمال تغییرات
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EnhancedGroupAssignmentModal;