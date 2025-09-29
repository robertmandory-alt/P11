import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Base } from '../../types';
import Modal from '../shared/Modal';
import { EditIcon, DeleteIcon, PlusIcon } from '../shared/Icons';

const BaseManagementPage: React.FC = () => {
    const { bases, addBase, updateBase, deleteBase } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBase, setCurrentBase] = useState<Base | null>(null);

    const handleEdit = (base: Base) => {
        setCurrentBase(base);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setCurrentBase(null);
        setIsModalOpen(true);
    };

    const handleSave = async (base: Base) => {
        let success = false;
        if (currentBase && base.id) {
            success = await updateBase(base);
        } else {
            const newBase = await addBase({
                name: base.name,
                number: base.number,
                type: base.type,
                description: base.description
            });
            success = !!newBase;
        }
        if (success) {
            setIsModalOpen(false);
        } else {
            alert('خطا در ذخیره سازی پایگاه.');
        }
    };

    const handleDelete = async (baseId: string) => {
        if (window.confirm('آیا از حذف این پایگاه اطمینان دارید؟')) {
            const result = await deleteBase(baseId);
            if (!result.success) {
                alert(result.error || 'خطا در حذف پایگاه.');
            }
        }
    };

    const typeMap = {
        'Urban': 'شهری',
        'Road': 'جاده‌ای',
        'Bus': 'اتوبوس آمبولانس',
        'Headquarters': 'ستاد',
        'Support': 'پشتیبانی'
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت پایگاه‌ها</h1>
                    <p className="text-sm text-gray-500 mt-1">ایجاد، ویرایش و حذف اطلاعات پایگاه‌ها</p>
                </div>
                <button onClick={handleAdd} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <PlusIcon className="w-5 h-5 me-2" />
                    <span>افزودن پایگاه جدید</span>
                </button>
            </header>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">نام پایگاه</th>
                                <th scope="col" className="px-6 py-3">نوع</th>
                                <th scope="col" className="px-6 py-3">شماره</th>
                                <th scope="col" className="px-6 py-3">توضیحات</th>
                                <th scope="col" className="px-6 py-3">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bases.map(base => (
                                <tr key={base.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{base.name}</td>
                                    <td className="px-6 py-4">{typeMap[base.type]}</td>
                                    <td className="px-6 py-4">{base.number}</td>
                                    <td className="px-6 py-4 max-w-xs truncate">{base.description || '---'}</td>
                                    <td className="px-6 py-4 flex space-x-2 space-x-reverse">
                                        <button type="button" onClick={() => handleEdit(base)} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5" /></button>
                                        <button type="button" onClick={() => handleDelete(base.id)} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <BaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                base={currentBase}
                onSave={handleSave}
            />
        </div>
    );
};

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    base: Base | null;
    onSave: (base: Base) => void;
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, base, onSave }) => {
    const [formData, setFormData] = useState<Partial<Base>>({});

    React.useEffect(() => {
        setFormData(base || { name: '', number: '', type: 'Urban', description: '' });
    }, [base, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Base);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={base ? 'ویرایش پایگاه' : 'افزودن پایگاه'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">نام پایگاه</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">شماره پایگاه</label>
                        <input type="text" name="number" value={formData.number || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">نوع پایگاه</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        <option value="Urban">شهری</option>
                        <option value="Road">جاده‌ای</option>
                        <option value="Bus">اتوبوس آمبولانس</option>
                        <option value="Headquarters">ستاد</option>
                        <option value="Support">پشتیبانی</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">توضیحات</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></textarea>
                </div>
                
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

export default BaseManagementPage;