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
        let success = false;
        if (currentPersonnel && p.id) {
            success = await updatePersonnel(p);
        } else {
            const newPersonnel = await addPersonnel({
                name: `${p.first_name} ${p.last_name}`.trim(),
                first_name: p.first_name,
                last_name: p.last_name,
                national_id: p.national_id,
                employment_status: p.employment_status,
                productivity_status: p.productivity_status,
                driver_status: p.driver_status,
                work_experience: p.work_experience
            });
            success = !!newPersonnel;
        }
        if (success) {
            setIsModalOpen(false);
        } else {
            alert('خطا در ذخیره سازی اطلاعات پرسنل.');
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

    const workExperienceMap: Record<string, string> = {
        '0-4': '۰ تا ۴ سال',
        '4-8': '۴ تا ۸ سال',
        '8-12': '۸ تا ۱۲ سال',
        '12-16': '۱۲ تا ۱۶ سال',
        '16+': '۱۶ سال به بالا'
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
                                <th scope="col" className="px-6 py-3">نام</th>
                                <th scope="col" className="px-6 py-3">نام خانوادگی</th>
                                <th scope="col" className="px-6 py-3">کد ملی</th>
                                <th scope="col" className="px-6 py-3">سابقه کاری</th>
                                <th scope="col" className="px-6 py-3">وضعیت استخدامی</th>
                                <th scope="col" className="px-6 py-3">وضعیت بهره‌وری</th>
                                <th scope="col" className="px-6 py-3">وضعیت رانندگی</th>
                                <th scope="col" className="px-6 py-3">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personnel.map(p => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.first_name || p.name?.split(' ')[0] || ''}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.last_name || p.name?.split(' ').slice(1).join(' ') || ''}</td>
                                    <td className="px-6 py-4">{p.national_id}</td>
                                    <td className="px-6 py-4">{p.work_experience ? workExperienceMap[p.work_experience] : '-'}</td>
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
            setFormData({
                ...personnel,
                first_name: personnel.first_name || personnel.name?.split(' ')[0] || '',
                last_name: personnel.last_name || personnel.name?.split(' ').slice(1).join(' ') || ''
            });
        } else {
            setFormData({ 
                name: '', 
                first_name: '', 
                last_name: '', 
                national_id: '', 
                employment_status: 'Official', 
                productivity_status: 'Productive', 
                driver_status: 'Non-Driver',
                work_experience: undefined
            });
        }
    }, [personnel, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ensure name field is populated from first_name and last_name
        const dataToSave = {
            ...formData,
            name: `${formData.first_name || ''} ${formData.last_name || ''}`.trim()
        };
        onSave(dataToSave as Personnel);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={personnel ? 'ویرایش پرسنل' : 'افزودن پرسنل'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">نام</label>
                        <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">نام خانوادگی</label>
                        <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
                    </div>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">کد ملی</label>
                    <input type="text" name="national_id" value={formData.national_id || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">سابقه کاری</label>
                    <select name="work_experience" value={formData.work_experience || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        <option value="">انتخاب کنید</option>
                        <option value="0-4">۰ تا ۴ سال</option>
                        <option value="4-8">۴ تا ۸ سال</option>
                        <option value="8-12">۸ تا ۱۲ سال</option>
                        <option value="12-16">۱۲ تا ۱۶ سال</option>
                        <option value="16+">۱۶ سال به بالا</option>
                    </select>
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