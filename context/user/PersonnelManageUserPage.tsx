import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Personnel, Base } from '../../types';
import Modal from '../../components/shared/Modal';
import { PlusIcon, DeleteIcon } from '../../components/shared/Icons';

const PersonnelManageUserPage: React.FC = () => {
    const { user, personnel, bases, updatePersonnel } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const supervisorBaseId = user?.base_id;
    
    const basePersonnel = useMemo(() => {
        return personnel.filter(p => p.base_id === supervisorBaseId);
    }, [personnel, supervisorBaseId]);

    const availableForAddingPersonnel = useMemo(() => {
        return personnel.filter(p => p.base_id !== supervisorBaseId);
    }, [personnel, supervisorBaseId]);
    
    const handleProductivityChange = async (personnelId: string, newStatus: 'Productive' | 'Non-Productive') => {
        const personToUpdate = personnel.find(p => p.id === personnelId);
        if(personToUpdate) {
            await updatePersonnel({ ...personToUpdate, productivity_status: newStatus });
        }
    };

    const handleAddPersonnel = (selectedIds: string[]) => {
        selectedIds.forEach(async id => {
            const personToUpdate = personnel.find(p => p.id === id);
            if (personToUpdate) {
                await updatePersonnel({ ...personToUpdate, base_id: supervisorBaseId });
            }
        });
        setIsModalOpen(false);
    };

    const handleRemovePersonnel = async (personnelId: string) => {
        if (window.confirm('آیا از حذف این پرسنل از پایگاه خود اطمینان دارید؟')) {
            const personToUpdate = personnel.find(p => p.id === personnelId);
            if (personToUpdate) {
                await updatePersonnel({ ...personToUpdate, base_id: undefined });
            }
        }
    };
    
    const statusMap = {
        'Official': 'رسمی', 'Contractual': 'طرحی',
        'Productive': 'بهره‌ور', 'Non-Productive': 'غیر بهره‌ور',
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">اعضای پایگاه</h1>
                    <p className="text-sm text-gray-500 mt-1">افزودن، حذف و ویرایش وضعیت بهره‌وری پرسنل پایگاه</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <PlusIcon className="w-5 h-5 me-2" />
                    <span>افزودن پرسنل</span>
                </button>
            </header>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">نام</th>
                                <th scope="col" className="px-6 py-3">کد ملی</th>
                                <th scope="col" className="px-6 py-3">وضعیت استخدامی</th>
                                <th scope="col" className="px-6 py-3">وضعیت بهره‌وری</th>
                                <th scope="col" className="px-6 py-3">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {basePersonnel.map(p => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                                    <td className="px-6 py-4">{p.national_id}</td>
                                    <td className="px-6 py-4">{statusMap[p.employment_status]}</td>
                                    <td className="px-6 py-4">
                                       <select 
                                            value={p.productivity_status} 
                                            onChange={(e) => handleProductivityChange(p.id, e.target.value as 'Productive' | 'Non-Productive')}
                                            className={`w-full p-1 text-xs rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${p.productivity_status === 'Productive' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                                        >
                                            <option value="Productive">بهره‌ور</option>
                                            <option value="Non-Productive">غیر بهره‌ور</option>
                                       </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleRemovePersonnel(p.id)} className="text-red-600 hover:text-red-800">
                                            <DeleteIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {basePersonnel.length === 0 && <p className="text-center p-4 text-gray-500">هیچ پرسنلی به این پایگاه اختصاص داده نشده است.</p>}
                </div>
            </div>

            <AddPersonnelModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddPersonnel}
                availablePersonnel={availableForAddingPersonnel}
                allBases={bases}
            />
        </div>
    );
};


interface AddPersonnelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (selectedIds: string[]) => void;
    availablePersonnel: Personnel[];
    allBases: Base[];
}
const AddPersonnelModal: React.FC<AddPersonnelModalProps> = ({ isOpen, onClose, onAdd, availablePersonnel, allBases }) => {
    const [selected, setSelected] = useState<string[]>([]);

    const handleSelect = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    }
    const handleSubmit = () => { onAdd(selected); onClose(); };
    
    useEffect(() => { 
        if(isOpen) {
            setSelected([]) 
        }
    }, [isOpen]);

    const getBaseName = (baseId?: string) => {
        if (!baseId) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">آزاد</span>;
        const base = allBases.find(b => b.id === baseId);
        return base ? <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">{`در: ${base.name}`}</span> : null;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="افزودن پرسنل به پایگاه">
            <div className="space-y-2 max-h-96 overflow-y-auto p-2">
                {availablePersonnel.map(p => (
                    <label key={p.id} className="flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                        <div className="flex items-center">
                            <input type="checkbox" checked={selected.includes(p.id)} onChange={() => handleSelect(p.id)} className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            <div className="me-4">
                                <span className="text-gray-800 font-medium">{p.name}</span>
                                <p className="text-sm text-gray-500">{p.national_id}</p>
                            </div>
                        </div>
                        {getBaseName(p.base_id)}
                    </label>
                ))}
                {availablePersonnel.length === 0 && <p className="text-center text-gray-500 p-4">پرسنل دیگری برای افزودن وجود ندارد.</p>}
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t space-x-2 space-x-reverse">
                <button type="button" onClick={onClose} className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5">انصراف</button>
                <button onClick={handleSubmit} disabled={selected.length === 0} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-gray-400">
                    افزودن ({selected.length})
                </button>
            </div>
        </Modal>
    )
}

export default PersonnelManageUserPage;