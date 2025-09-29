import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WorkShift } from '../../types';
import Modal from '../shared/Modal';
import { EditIcon, DeleteIcon, PlusIcon } from '../shared/Icons';

const ShiftManagementPage: React.FC = () => {
    const { shifts, addShift, updateShift, deleteShift } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentShift, setCurrentShift] = useState<WorkShift | null>(null);

    const handleEdit = (shift: WorkShift) => {
        setCurrentShift(shift);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setCurrentShift(null);
        setIsModalOpen(true);
    };

    const handleSave = async (shift: WorkShift) => {
        let success = false;
        if (currentShift && shift.id) {
            success = await updateShift(shift);
        } else {
            const newShift = await addShift({
                type: shift.type,
                title: shift.title,
                code: shift.code,
                equivalent_hours: shift.equivalent_hours,
                holiday_hours: shift.holiday_hours,
                effect: shift.effect
            });
            success = !!newShift;
        }
        if (success) {
            setIsModalOpen(false);
        } else {
            alert('خطا در ذخیره سازی شیفت.');
        }
    };

    const handleDelete = async (shiftId: string) => {
        if (window.confirm('آیا از حذف این شیفت اطمینان دارید؟')) {
            const result = await deleteShift(shiftId);
            if (!result.success) {
                alert(result.error || 'خطا در حذف شیفت.');
            }
        }
    };

    const typeMap = {
        'Work': 'شیفت کاری',
        'Leave': 'مرخصی',
        'Miscellaneous': 'متفرقه'
    };
    
    const effectMap = {
        'Incremental': 'افزایشی',
        'Decremental': 'کاهشی'
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت شیفت‌ها</h1>
                    <p className="text-sm text-gray-500 mt-1">ایجاد، ویرایش و حذف انواع شیفت کاری</p>
                </div>
                <button onClick={handleAdd} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <PlusIcon className="w-5 h-5 me-2" />
                    <span>افزودن شیفت جدید</span>
                </button>
            </header>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">نوع</th>
                                <th scope="col" className="px-6 py-3">عنوان</th>
                                <th scope="col" className="px-6 py-3">کد</th>
                                <th scope="col" className="px-6 py-3">ساعات معادل</th>
                                <th scope="col" className="px-6 py-3">ساعات تعطیلات</th>
                                <th scope="col" className="px-6 py-3">اثر</th>
                                <th scope="col" className="px-6 py-3">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.map(shift => (
                                <tr key={shift.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{typeMap[shift.type]}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{shift.title}</td>
                                    <td className="px-6 py-4">{shift.code}</td>
                                    <td className="px-6 py-4">{shift.equivalent_hours}</td>
                                    <td className="px-6 py-4">{shift.holiday_hours ?? '---'}</td>
                                    <td className="px-6 py-4">{shift.effect ? effectMap[shift.effect] : '---'}</td>
                                    <td className="px-6 py-4 flex space-x-2 space-x-reverse">
                                        <button onClick={() => handleEdit(shift)} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(shift.id)} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ShiftModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                shift={currentShift}
                onSave={handleSave}
            />
        </div>
    );
};

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    shift: WorkShift | null;
    onSave: (shift: WorkShift) => void;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, shift, onSave }) => {
    const [formData, setFormData] = useState<Partial<WorkShift>>({});

    React.useEffect(() => {
        setFormData(shift || { type: 'Work', title: '', code: '', equivalent_hours: 0, holiday_hours: 0, effect: 'Incremental' });
    }, [shift, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = name === 'equivalent_hours' || name === 'holiday_hours' ? parseInt(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as WorkShift);
    };

    const renderTitleLabel = () => {
        switch (formData.type) {
            case 'Work': return 'عنوان شیفت';
            case 'Leave': return 'عنوان مرخصی';
            case 'Miscellaneous': return 'عنوان';
            default: return 'عنوان';
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={shift ? 'ویرایش شیفت' : 'افزودن شیفت'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">نوع شیفت</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        <option value="Work">شیفت کاری</option>
                        <option value="Leave">مرخصی</option>
                        <option value="Miscellaneous">متفرقه</option>
                    </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">{renderTitleLabel()}</label>
                        <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">کد شیفت</label>
                        <input type="text" name="code" value={formData.code || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">ساعت معادل</label>
                        <input type="number" name="equivalent_hours" value={formData.equivalent_hours || 0} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                    {(formData.type === 'Work' || formData.type === 'Miscellaneous') && (
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900">ساعت تعطیلات</label>
                            <input type="number" name="holiday_hours" value={formData.holiday_hours || 0} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
                        </div>
                    )}
                </div>

                {formData.type === 'Miscellaneous' && (
                     <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">اثر</label>
                        <select name="effect" value={formData.effect} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                            <option value="Incremental">افزایشی</option>
                            <option value="Decremental">کاهشی</option>
                        </select>
                    </div>
                )}

                <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                    <button type="button" onClick={onClose} className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">
                        انصراف
                    </button>
                    <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                        ذخیره
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ShiftManagementPage;