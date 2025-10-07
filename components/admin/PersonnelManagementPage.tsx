import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Personnel } from '../../types';
import Modal from '../shared/Modal';
import { EditIcon, DeleteIcon, PlusIcon } from '../shared/Icons';

const PersonnelManagementPage: React.FC = () => {
    const { personnel, addPersonnel, updatePersonnel, deletePersonnel } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPersonnel, setCurrentPersonnel] = useState<Personnel | null>(null);

    const handleEdit = (p: Personnel) => {
        setCurrentPersonnel(p);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setCurrentPersonnel(null);
        setIsModalOpen(true);
    };

    const handleSave = async (p: Personnel) => {
        try {
            let success = false;
            
            // Validate required fields
            if (!p.name || !p.national_id) {
                alert('لطفاً نام کامل و کد ملی را وارد کنید.');
                return;
            }
            
            if (currentPersonnel && p.id) {
                success = await updatePersonnel(p);
                if (!success) {
                    alert('خطا در ویرایش اطلاعات پرسنل.');
                    return;
                }
            } else {
                const personnelData = {
                    name: p.name,
                    national_id: p.national_id,
                    employment_status: p.employment_status,
                    productivity_status: p.productivity_status,
                    driver_status: p.driver_status
                };
                
                const newPersonnel = await addPersonnel(personnelData);
                if (!newPersonnel) {
                    // Error message is already shown by addPersonnel function
                    return;
                }
                success = true;
            }
            
            if (success) {
                setIsModalOpen(false);
            }
        } catch (error: any) {
            console.error('Unexpected error in handleSave:', error);
            alert('خطای غیرمنتظره در ذخیره سازی اطلاعات.');
        }
    };

    const handleDelete = async (personnelId: string) => {
        if (window.confirm('آیا از حذف این پرسنل اطمینان دارید؟')) {
            const result = await deletePersonnel(personnelId);
            if (!result.success) {
                 alert(result.error || 'خطا در حذف پرسنل.');
            }
        }
    };

    const statusMap = {
        'Official': 'رسمی',
        'Contractual': 'طرحی',
        'Productive': 'بهره‌ور',
        'Non-Productive': 'غیر بهره‌ور',
        'Driver': 'راننده',
        'Non-Driver': 'غیر راننده'
    }



    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت پرسنل</h1>
                    <p className="text-sm text-gray-500 mt-1">ایجاد، ویرایش و حذف اطلاعات پایه پرسنل</p>
                </div>
                <button onClick={handleAdd} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <PlusIcon className="w-5 h-5 me-2" />
                    <span>افزودن پرسنل جدید</span>
                </button>
            </header>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">نام کامل</th>
                                <th scope="col" className="px-6 py-3">کد ملی</th>
                                <th scope="col" className="px-6 py-3">وضعیت استخدامی</th>
                                <th scope="col" className="px-6 py-3">وضعیت بهره‌وری</th>
                                <th scope="col" className="px-6 py-3">وضعیت رانندگی</th>
                                <th scope="col" className="px-6 py-3">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personnel.map(p => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                                    <td className="px-6 py-4">{p.national_id}</td>
                                    <td className="px-6 py-4">{statusMap[p.employment_status]}</td>
                                    <td className="px-6 py-4">
                                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${p.productivity_status === 'Productive' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {statusMap[p.productivity_status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{statusMap[p.driver_status]}</td>
                                    <td className="px-6 py-4 flex space-x-2 space-x-reverse">
                                        <button type="button" onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5" /></button>
                                        <button type="button" onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PersonnelModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                personnel={currentPersonnel}
                onSave={handleSave}
            />
        </div>
    );
};

interface PersonnelModalProps {
    isOpen: boolean;
    onClose: () => void;
    personnel: Personnel | null;
    onSave: (personnel: Personnel) => void;
}

const PersonnelModal: React.FC<PersonnelModalProps> = ({ isOpen, onClose, personnel, onSave }) => {
    const [formData, setFormData] = useState<Partial<Personnel>>({});

    React.useEffect(() => {
        if (personnel) {
            setFormData(personnel);
        } else {
            setFormData({ 
                name: '', 
                national_id: '', 
                employment_status: 'Official', 
                productivity_status: 'Productive', 
                driver_status: 'Non-Driver'
            });
        }
    }, [personnel, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Personnel);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={personnel ? 'ویرایش پرسنل' : 'افزودن پرسنل'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">نام کامل</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="نام و نام خانوادگی" required />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">کد ملی</label>
                    <input type="text" name="national_id" value={formData.national_id || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">وضعیت استخدامی</label>
                    <select name="employment_status" value={formData.employment_status} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        <option value="Official">رسمی</option>
                        <option value="Contractual">طرحی</option>
                    </select>
                </div>
                 <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">وضعیت بهره‌وری</label>
                    <select name="productivity_status" value={formData.productivity_status} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        <option value="Productive">بهره‌ور</option>
                        <option value="Non-Productive">غیر بهره‌ور</option>
                    </select>
                </div>
                 <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">وضعیت رانندگی</label>
                    <select name="driver_status" value={formData.driver_status} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        <option value="Driver">راننده</option>
                        <option value="Non-Driver">غیر راننده</option>
                    </select>
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

export default PersonnelManagementPage;