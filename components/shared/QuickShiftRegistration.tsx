import React, { useState, useEffect } from 'react';
import { Personnel, WorkShift, Base, PerformanceRecord } from '../../types';
import Modal from './Modal';
import { generateUUID } from '../../utils/uuid';

interface QuickShiftRegistrationProps {
    isOpen: boolean;
    onClose: () => void;
    personnel: Personnel[];
    shifts: WorkShift[];
    bases: Base[];
    year: string;
    month: string;
    onSave: (records: PerformanceRecord[]) => void;
}

// Utility function to get Jalali calendar days
const getJalaliMonthDays = (year: string, month: string): number => {
    const monthNum = parseInt(month);
    if (monthNum <= 6) return 31;
    if (monthNum <= 11) return 30;
    return parseInt(year) % 4 === 0 ? 30 : 29; // اسفند در سال کبیسه ۳۰ روز دارد
};

const QuickShiftRegistration: React.FC<QuickShiftRegistrationProps> = ({
    isOpen, onClose, personnel, shifts, bases, year, month, onSave
}) => {
    const [selectedPersonnel, setSelectedPersonnel] = useState<string>('');
    const [selectedShift, setSelectedShift] = useState<string>('');
    const [selectedBase, setSelectedBase] = useState<string>('');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [shiftType, setShiftType] = useState<string>('Work');
    const [searchTerm, setSearchTerm] = useState('');

    const daysInMonth = getJalaliMonthDays(year, month);
    const filteredShifts = shifts.filter(s => s.type === shiftType);
    const filteredPersonnel = personnel.filter(p => 
        searchTerm === '' || 
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Auto-select first available options
    useEffect(() => {
        if (filteredPersonnel.length > 0 && !selectedPersonnel) {
            setSelectedPersonnel(filteredPersonnel[0].id);
        }
    }, [filteredPersonnel, selectedPersonnel]);

    useEffect(() => {
        if (filteredShifts.length > 0 && !selectedShift) {
            setSelectedShift(filteredShifts[0].id);
        }
    }, [filteredShifts, selectedShift]);

    useEffect(() => {
        if (bases.length > 0 && !selectedBase) {
            setSelectedBase(bases[0].id);
        }
    }, [bases, selectedBase]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedDays([]);
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleDayToggle = (day: number) => {
        setSelectedDays(prev => 
            prev.includes(day) 
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        );
    };

    const handleSelectAllDays = () => {
        const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        setSelectedDays(allDays);
    };

    const handleClearDays = () => {
        setSelectedDays([]);
    };

    const handleQuickSelectPattern = (pattern: 'odds' | 'evens' | 'weekdays' | 'weekends') => {
        const days: number[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            switch (pattern) {
                case 'odds':
                    if (day % 2 === 1) days.push(day);
                    break;
                case 'evens':
                    if (day % 2 === 0) days.push(day);
                    break;
                case 'weekdays':
                    const dayOfWeek = (day + 4) % 7; // Assuming month starts on Saturday
                    if (dayOfWeek !== 4 && dayOfWeek !== 5) days.push(day); // Not Thursday or Friday
                    break;
                case 'weekends':
                    const weekendDay = (day + 4) % 7;
                    if (weekendDay === 4 || weekendDay === 5) days.push(day); // Thursday or Friday
                    break;
            }
        }
        
        setSelectedDays(days);
    };

    const handleSubmit = () => {
        if (!selectedPersonnel || !selectedShift || !selectedBase || selectedDays.length === 0) {
            alert('لطفاً تمام فیلدها را تکمیل کنید و حداقل یک روز انتخاب کنید');
            return;
        }

        const newRecords: PerformanceRecord[] = selectedDays.map(day => ({
            id: generateUUID(),
            personnel_id: selectedPersonnel,
            day,
            shift_id: selectedShift,
            base_id: selectedBase,
            submitting_base_id: selectedBase, // Can be modified based on user's base
            year_month: `${year}-${month}`
        }));

        onSave(newRecords);
        
        // Reset form
        setSelectedDays([]);
        onClose();
        
        // Show success message
        const selectedPerson = personnel.find(p => p.id === selectedPersonnel);
        const selectedShiftData = shifts.find(s => s.id === selectedShift);
        alert(`شیفت با موفقیت ثبت شد!\n` +
              `پرسنل: ${selectedPerson?.name || `${selectedPerson?.first_name} ${selectedPerson?.last_name}`}\n` +
              `شیفت: ${selectedShiftData?.title} (${selectedShiftData?.code})\n` +
              `تعداد روز: ${selectedDays.length}`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="ثبت سریع شیفت">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                
                {/* Personnel Selection */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">جستجو و انتخاب پرسنل</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="نام پرسنل را وارد کنید..."
                        className="mb-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    />
                    <select 
                        value={selectedPersonnel} 
                        onChange={(e) => setSelectedPersonnel(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        required
                    >
                        <option value="">انتخاب پرسنل</option>
                        {filteredPersonnel.map(person => (
                            <option key={person.id} value={person.id}>
                                {person.name || `${person.first_name} ${person.last_name}`} ({person.employment_status === 'Official' ? 'رسمی' : 'طرحی'})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Shift Type Selection */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">نوع شیفت</label>
                    <select 
                        value={shiftType} 
                        onChange={(e) => {
                            setShiftType(e.target.value);
                            setSelectedShift(''); // Reset shift selection when type changes
                        }}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    >
                        <option value="Work">شیفت کاری</option>
                        <option value="Leave">مرخصی</option>
                        <option value="Miscellaneous">متفرقه</option>
                    </select>
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
                        {filteredShifts.map(shift => (
                            <option key={shift.id} value={shift.id}>
                                {shift.title} ({shift.code}) - {shift.equivalent_hours} ساعت
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
                                {base.name} ({base.number})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Day Selection Controls */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">انتخاب روزها</label>
                    
                    {/* Quick Selection Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                            type="button"
                            onClick={handleSelectAllDays}
                            className="text-xs bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                        >
                            انتخاب همه روزها
                        </button>
                        <button
                            type="button"
                            onClick={handleClearDays}
                            className="text-xs bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                        >
                            پاک کردن همه
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickSelectPattern('odds')}
                            className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                        >
                            روزهای فرد
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickSelectPattern('evens')}
                            className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                        >
                            روزهای زوج
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickSelectPattern('weekdays')}
                            className="text-xs bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700"
                        >
                            روزهای کاری
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickSelectPattern('weekends')}
                            className="text-xs bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700"
                        >
                            روزهای تعطیل
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-3">
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const isSelected = selectedDays.includes(day);
                            const dayOfWeek = (day + 4) % 7; // Assuming month starts on Saturday
                            const isHoliday = dayOfWeek === 4 || dayOfWeek === 5; // Thursday or Friday
                            
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayToggle(day)}
                                    className={`
                                        text-xs p-2 rounded border
                                        ${isSelected 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }
                                        ${isHoliday ? 'border-orange-300 bg-orange-50' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected Days Summary */}
                    <div className="text-xs bg-gray-50 p-2 rounded">
                        <div className="font-medium mb-1">روزهای انتخاب شده ({selectedDays.length} روز):</div>
                        <div className="text-blue-600">
                            {selectedDays.length > 0 ? selectedDays.join(', ') : 'هیچ روزی انتخاب نشده'}
                        </div>
                        {selectedDays.length > 0 && (() => {
                            const selectedShiftData = shifts.find(s => s.id === selectedShift);
                            if (selectedShiftData) {
                                const totalHours = selectedShiftData.equivalent_hours * selectedDays.length;
                                return (
                                    <div className="mt-1 text-green-600">
                                        مجموع ساعات: {totalHours} ساعت
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
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
                        disabled={!selectedPersonnel || !selectedShift || !selectedBase || selectedDays.length === 0}
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-gray-300"
                    >
                        🚀 ثبت سریع شیفت
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default QuickShiftRegistration;