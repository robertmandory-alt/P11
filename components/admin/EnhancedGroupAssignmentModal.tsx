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
    type: 'shift_count' | 'total_hours' | 'leave_days' | 'overtime_hours' | 'specific_shift_count';
    operator: 'less_than' | 'greater_than' | 'equal_to' | 'between';
    value1: number;
    value2?: number;
    shiftId?: string; // For specific shift type filtering
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
    const [currentPersonnelIndex, setCurrentPersonnelIndex] = useState<number>(0);
    
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
            let shiftTypeCounts: Record<string, number> = {};
            
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
                    
                    // Count specific shifts
                    shiftCounts[shift.id] = (shiftCounts[shift.id] || 0) + 1;
                    
                    // Count by shift type
                    shiftTypeCounts[shift.type] = (shiftTypeCounts[shift.type] || 0) + 1;
                }
            });
            
            stats[p.id] = {
                totalHours,
                leaveDays,
                overtimeHours,
                shiftCounts,
                shiftTypeCounts,
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
                case 'specific_shift_count':
                    // Count specific shift type occurrences
                    if (filter.shiftId) {
                        value = stats.shiftCounts[filter.shiftId] || 0;
                    } else {
                        value = 0;
                    }
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
            value1: 0,
            shiftId: undefined
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
    
    // Function to automatically assign base for personnel
    const getAutoAssignedBase = (personnelId: string): string => {
        const person = personnel.find(p => p.id === personnelId);
        if (!person) return bases[0]?.id || '';
        
        // 1. If personnel has a fixed base assignment, use it
        if (person.base_id) {
            return person.base_id;
        }
        
        // 2. Find the base where they worked most hours/shifts
        const personnelRecords = performanceRecords.filter(r => r.personnel_id === personnelId);
        if (personnelRecords.length > 0) {
            const baseWorkCount: Record<string, number> = {};
            
            personnelRecords.forEach(record => {
                const shift = shifts.find(s => s.id === record.shift_id);
                if (shift && record.base_id) {
                    baseWorkCount[record.base_id] = (baseWorkCount[record.base_id] || 0) + shift.equivalent_hours;
                }
            });
            
            // Return the base with most hours worked
            const mostWorkedBase = Object.entries(baseWorkCount)
                .sort(([,a], [,b]) => b - a)[0];
            
            if (mostWorkedBase) {
                return mostWorkedBase[0];
            }
        }
        
        // 3. Default to first available base
        return bases[0]?.id || '';
    };

    const handleSubmit = () => {
        // Process assignments and apply automatic base assignment
        const processedAssignments = shiftAssignments
            .filter(a => a.shiftId && a.days.length > 0)
            .map(assignment => ({
                ...assignment,
                baseId: assignment.baseId || getAutoAssignedBase(
                    (selectionMode === 'manual' ? manualSelection : filteredPersonnel.map(p => p.id))[0]
                )
            }));
        
        if (processedAssignments.length === 0) {
            alert('لطفاً حداقل یک تخصیص معتبر ایجاد کنید (شیفت و روز باید انتخاب شود)');
            return;
        }
        
        const finalSelection = selectionMode === 'manual' ? manualSelection : filteredPersonnel.map(p => p.id);
        
        if (finalSelection.length === 0) {
            alert('لطفاً حداقل یک پرسنل انتخاب کنید');
            return;
        }
        
        // Apply automatic base assignment for each personnel
        const finalAssignments = processedAssignments.map(assignment => {
            if (!assignment.baseId) {
                // If still no base, assign based on first selected personnel
                assignment.baseId = getAutoAssignedBase(finalSelection[0]);
            }
            return assignment;
        });
        
        onAssign(finalSelection, finalAssignments);
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
                            <div key={index} className="grid gap-2 mb-2 p-2 bg-white rounded" style={{ gridTemplateColumns: filter.type === 'specific_shift_count' ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)' }}>
                                <select
                                    value={filter.type}
                                    onChange={(e) => updateAdvancedFilter(index, { type: e.target.value as any, shiftId: undefined })}
                                    className="text-xs border rounded p-1"
                                >
                                    <option value="shift_count">تعداد شیفت</option>
                                    <option value="total_hours">مجموع ساعات</option>
                                    <option value="leave_days">روزهای مرخصی</option>
                                    <option value="overtime_hours">اضافه کار</option>
                                    <option value="specific_shift_count">نوع شیفت خاص</option>
                                </select>
                                
                                {filter.type === 'specific_shift_count' && (
                                    <select
                                        value={filter.shiftId || ''}
                                        onChange={(e) => updateAdvancedFilter(index, { shiftId: e.target.value })}
                                        className="text-xs border rounded p-1"
                                    >
                                        <option value="">انتخاب شیفت</option>
                                        {shifts.map(shift => (
                                            <option key={shift.id} value={shift.id}>
                                                {shift.title} ({shift.code})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                
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
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name}</span>
                                    <span className="text-xs text-gray-500">
                                        ({p.employment_status === 'Official' ? 'رسمی' : 'طرحی'})
                                    </span>
                                </div>
                                
                                {/* Always show performance summary */}
                                {personnelStats[p.id] && (
                                    <div className="text-xs text-blue-600 mt-1">
                                        <span className="inline-block mr-2">
                                            📊 {personnelStats[p.id].totalShifts} شیفت
                                        </span>
                                        <span className="inline-block mr-2">
                                            ⏱️ {personnelStats[p.id].totalHours}س کار
                                        </span>
                                        {personnelStats[p.id].overtimeHours > 0 && (
                                            <span className="inline-block mr-2 text-orange-600">
                                                ⏰ {personnelStats[p.id].overtimeHours}س اضافه‌کار
                                            </span>
                                        )}
                                        {personnelStats[p.id].leaveDays > 0 && (
                                            <span className="inline-block mr-2 text-green-600">
                                                🏖️ {personnelStats[p.id].leaveDays} مرخصی
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {/* Show shift type breakdown in advanced mode */}
                                {selectionMode === 'advanced' && personnelStats[p.id] && Object.entries(personnelStats[p.id].shiftCounts).length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        انواع شیفت: {Object.entries(personnelStats[p.id].shiftCounts).map(([shiftId, count]) => {
                                            const shift = shifts.find(s => s.id === shiftId);
                                            return shift ? `${shift.code}:${count}` : null;
                                        }).filter(Boolean).join(', ')}
                                    </div>
                                )}
                            </div>
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
                                    <label className="block text-xs font-medium mb-1">پایگاه (اختیاری)</label>
                                    <select
                                        value={assignment.baseId}
                                        onChange={(e) => updateShiftAssignment(index, { baseId: e.target.value })}
                                        className="w-full text-xs border rounded p-1"
                                    >
                                        <option value="">تخصیص خودکار</option>
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
                                        min="0"
                                        value={assignment.count}
                                        onChange={(e) => updateShiftAssignment(index, { count: parseInt(e.target.value) || 0 })}
                                        className="w-full text-xs border rounded p-1"
                                        placeholder="تعداد شیفت"
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
                                        انتخاب روز به روز (تقویمی)
                                    </button>
                                    <button
                                        onClick={() => setDaySelectionMode('quick')}
                                        className={`text-xs px-2 py-1 rounded ${daySelectionMode === 'quick' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                    >
                                        پیدا کردن روزهای خالی
                                    </button>
                                </div>
                                
                                {daySelectionMode === 'grid' ? (
                                    <div>
                                        {/* Personnel Navigation for Individual Calendar View */}
                                        {(() => {
                                            const selectedPersonnel = selectionMode === 'manual' ? 
                                                personnel.filter(p => manualSelection.includes(p.id)) : 
                                                filteredPersonnel;
                                            
                                            if (selectedPersonnel.length === 0) {
                                                return <div className="text-xs text-gray-500 p-2">لطفاً ابتدا پرسنل مورد نظر را انتخاب کنید</div>;
                                            }
                                            
                                            const currentPersonnel = selectedPersonnel[currentPersonnelIndex] || selectedPersonnel[0];
                                            const currentPersonnelOccupiedDays = getPersonnelOccupiedDays(currentPersonnel.id);
                                            
                                            return (
                                                <div>
                                                    {/* Personnel Navigator */}
                                                    <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded">
                                                        <button
                                                            onClick={() => setCurrentPersonnelIndex(Math.max(0, currentPersonnelIndex - 1))}
                                                            disabled={currentPersonnelIndex === 0}
                                                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
                                                        >
                                                            ← قبلی
                                                        </button>
                                                        <div className="text-sm font-medium text-center">
                                                            {currentPersonnel.name}
                                                            <div className="text-xs text-gray-600">
                                                                ({currentPersonnelIndex + 1} از {selectedPersonnel.length})
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setCurrentPersonnelIndex(Math.min(selectedPersonnel.length - 1, currentPersonnelIndex + 1))}
                                                            disabled={currentPersonnelIndex === selectedPersonnel.length - 1}
                                                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
                                                        >
                                                            بعدی →
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Calendar Grid for Current Personnel */}
                                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                                            const isSelected = assignment.days.includes(day);
                                                            const isOccupied = currentPersonnelOccupiedDays.includes(day);
                                                            const isHoliday = day % 7 === 5 || day % 7 === 6;
                                                            
                                                            return (
                                                                <button
                                                                    key={day}
                                                                    onClick={() => handleDayToggle(index, day)}
                                                                    className={`
                                                                        text-xs p-1 rounded border relative
                                                                        ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 
                                                                          isOccupied ? 'bg-red-100 text-red-800 border-red-300' :
                                                                          'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                                                                        ${isHoliday ? 'border-orange-300' : ''}
                                                                    `}
                                                                    title={isOccupied ? 'این روز قبلاً شیفت دارد' : 'روز خالی'}
                                                                >
                                                                    {day}
                                                                    {isOccupied && <div className="absolute top-0 right-0 w-1 h-1 bg-red-600 rounded-full"></div>}
                                                                    {isHoliday && <div className="absolute bottom-0 left-0 w-1 h-1 bg-orange-500 rounded-full"></div>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    
                                                    {/* Legend */}
                                                    <div className="flex gap-2 text-xs mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-3 h-3 bg-blue-600 rounded"></div>
                                                            انتخاب شده
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                                                            دارای شیفت
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-3 h-3 bg-white border border-orange-300 rounded"></div>
                                                            تعطیل
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Summary section */}
                                                    <div className="text-xs bg-gray-50 p-2 rounded mt-2">
                                                        <div className="font-medium mb-1">خلاصه انتخاب:</div>
                                                        <div>روزهای انتخاب شده: {assignment.days.length > 0 ? assignment.days.join(', ') : 'هیچ'}</div>
                                                        {(() => {
                                                            const selectedShift = shifts.find(s => s.id === assignment.shiftId);
                                                            if (selectedShift && assignment.days.length > 0) {
                                                                const totalHours = selectedShift.equivalent_hours * assignment.days.length * assignment.count;
                                                                const overtimeHours = selectedShift.title.includes('اضافه') ? totalHours : 0;
                                                                
                                                                return (
                                                                    <div className="mt-1 text-blue-600">
                                                                        <div>مجموع کارکرد: {totalHours} ساعت</div>
                                                                        {overtimeHours > 0 && <div>اضافه کار: {overtimeHours} ساعت</div>}
                                                                        <div>تعداد {selectedShift.title}: {assignment.days.length * assignment.count}</div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div>
                                        {/* Quick Selection with Empty Days Display */}
                                        {(() => {
                                            const selectedPersonnel = selectionMode === 'manual' ? 
                                                personnel.filter(p => manualSelection.includes(p.id)) : 
                                                filteredPersonnel;
                                                
                                            if (selectedPersonnel.length === 0) {
                                                return <div className="text-xs text-gray-500 p-2">لطفاً ابتدا پرسنل مورد نظر را انتخاب کنید</div>;
                                            }
                                            
                                            // Find common empty days for all selected personnel
                                            const commonEmptyDays: number[] = [];
                                            for (let day = 1; day <= daysInMonth; day++) {
                                                const isEmptyForAll = selectedPersonnel.every(person => {
                                                    const occupiedDays = getPersonnelOccupiedDays(person.id);
                                                    return !occupiedDays.includes(day);
                                                });
                                                if (isEmptyForAll) {
                                                    commonEmptyDays.push(day);
                                                }
                                            }
                                            
                                            return (
                                                <div>
                                                    <div className="mb-3">
                                                        <button
                                                            onClick={() => handleQuickSelectEmptyDays(index)}
                                                            className="text-xs bg-green-600 text-white px-3 py-1 rounded mb-2 w-full"
                                                        >
                                                            🔍 پیدا کردن روزهای خالی مشترک
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Show individual personnel empty days */}
                                                    <div className="max-h-32 overflow-y-auto mb-2">
                                                        {selectedPersonnel.map(person => {
                                                            const personalEmptyDays = [];
                                                            for (let day = 1; day <= daysInMonth; day++) {
                                                                const occupiedDays = getPersonnelOccupiedDays(person.id);
                                                                if (!occupiedDays.includes(day)) {
                                                                    personalEmptyDays.push(day);
                                                                }
                                                            }
                                                            
                                                            return (
                                                                <div key={person.id} className="text-xs border-b pb-1 mb-1">
                                                                    <div className="font-medium text-gray-700">{person.name}:</div>
                                                                    <div className="text-blue-600">
                                                                        روزهای خالی: {personalEmptyDays.length > 0 ? 
                                                                            personalEmptyDays.slice(0, 10).join(', ') + 
                                                                            (personalEmptyDays.length > 10 ? ` و ${personalEmptyDays.length - 10} روز دیگر` : '') : 
                                                                            'هیچ روز خالی'}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    
                                                    {/* Common empty days */}
                                                    <div className="text-xs bg-green-50 p-2 rounded mb-2">
                                                        <div className="font-medium text-green-800">روزهای خالی مشترک:</div>
                                                        <div className="text-green-600">
                                                            {commonEmptyDays.length > 0 ? 
                                                                commonEmptyDays.join(', ') : 
                                                                'هیچ روز خالی مشترک وجود ندارد'}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Summary for quick selection */}
                                                    <div className="text-xs bg-gray-50 p-2 rounded mt-2">
                                                        <div className="font-medium mb-1">خلاصه انتخاب:</div>
                                                        <div>روزهای انتخاب شده: {assignment.days.length > 0 ? assignment.days.join(', ') : 'هیچ'}</div>
                                                        {(() => {
                                                            const selectedShift = shifts.find(s => s.id === assignment.shiftId);
                                                            if (selectedShift && assignment.days.length > 0) {
                                                                const totalHours = selectedShift.equivalent_hours * assignment.days.length * assignment.count;
                                                                const overtimeHours = selectedShift.title.includes('اضافه') ? totalHours : 0;
                                                                
                                                                return (
                                                                    <div className="mt-1 text-blue-600">
                                                                        <div>مجموع کارکرد: {totalHours} ساعت</div>
                                                                        {overtimeHours > 0 && <div>اضافه کار: {overtimeHours} ساعت</div>}
                                                                        <div>تعداد {selectedShift.title}: {assignment.days.length * assignment.count}</div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </div>
                                            );
                                        })()}
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