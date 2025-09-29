import React, { useState, useEffect } from 'react';
import { UserProfile, Personnel, Base } from '../../types';
import Modal from '../shared/Modal';
import { EditIcon, DeleteIcon, PlusIcon } from '../shared/Icons';
import { useAuth } from '../../context/AuthContext';

const UserManagementPage: React.FC = () => {
    const { personnel, bases, fetchAllUsers, updateUser, deleteUser, deleteProfile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');

    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true);
            const allUsers = await fetchAllUsers();
            setUsers(allUsers);
            setLoading(false);
        };
        loadUsers();
    }, [fetchAllUsers]);

    const handleEdit = (user: UserProfile) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };
    
    const handleSave = async (userFormData: UserProfile) => {
       if (currentUser && userFormData.id) { // This is an UPDATE
           const { success, error } = await updateUser(userFormData.id, userFormData);
           if (success) {
               setUsers(prev => prev.map(u => u.id === userFormData.id ? {...u, ...userFormData} : u));
               setIsModalOpen(false);
           } else {
               alert(`خطا در بروزرسانی: ${error}`);
           }
       }
    };

    const handleApprove = async (userId: string) => {
        const { success } = await updateUser(userId, { status: 'active' });
        if (success) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
        } else {
            alert('خطا در تایید کاربر.');
        }
    };

    const handleReject = async (userId: string) => {
        if(window.confirm('آیا از رد کردن این کاربر و حذف پروفایل او اطمینان دارید؟ این عمل کاربر را از سیستم حذف می‌کند.')) {
            const result = await deleteProfile(userId);
            if(result.success) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                alert(result.error || 'خطا در رد کردن کاربر.');
            }
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        if(window.confirm('آیا از حذف پروفایل این کاربر اطمینان دارید؟\nاین عمل دسترسی کاربر به سیستم را قطع می‌کند اما هویت ورود او برای مراجعات بعدی باقی می‌ماند.')) {
            const result = await deleteUser(userId);
            if(result.success) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                alert(result.error || 'خطا در حذف پروفایل کاربر.');
            }
        }
    };
    
    const getPersonnelName = (personnelId: string) => {
        return personnel.find(p => p.id === personnelId)?.name || 'در انتظار تکمیل پروفایل';
    }

    const activeUsers = users.filter(u => u.status === 'active' && u.role === 'user');
    const adminUsers = users.filter(u => u.status === 'active' && u.role === 'admin');
    const pendingUsers = users.filter(u => u.status === 'pending');

    const renderUserTable = (userList: UserProfile[], isPending: boolean) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">نام و نام خانوادگی</th>
                        <th scope="col" className="px-6 py-3">نام کاربری</th>
                        <th scope="col" className="px-6 py-3">نقش</th>
                        <th scope="col" className="px-6 py-3">عملیات</th>
                    </tr>
                </thead>
                <tbody>
                    {userList.map(user => (
                        <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{getPersonnelName(user.personnel_id)}</td>
                            <td className="px-6 py-4">{user.username}</td>
                            <td className="px-6 py-4">{user.role === 'admin' ? 'مدیر' : 'سرپرست پایگاه'}</td>
                            <td className="px-6 py-4 flex space-x-2 space-x-reverse">
                                {isPending ? (
                                    <>
                                        <button onClick={() => handleApprove(user.id)} className="text-green-600 hover:text-green-800 font-semibold">تایید</button>
                                        <button onClick={() => handleReject(user.id)} className="text-red-600 hover:text-red-800 font-semibold">رد</button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800"><EditIcon className="w-5 h-5"/></button>
                                        {user.role !== 'admin' && <button type="button" onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800"><DeleteIcon className="w-5 h-5"/></button>}
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {userList.length === 0 && <p className="text-center p-4 text-gray-500">هیچ کاربری در این لیست وجود ندارد.</p>}
        </div>
    );

    if (loading) return <div>در حال بارگذاری کاربران...</div>

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">مدیریت کاربران</h1>
                <p className="text-sm text-gray-500 mt-1">تایید کاربران جدید و ویرایش نقش کاربران فعال</p>
            </header>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px" aria-label="Tabs">
                        <button onClick={() => setActiveTab('active')} className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            کاربران فعال ({activeUsers.length + adminUsers.length})
                        </button>
                        <button onClick={() => setActiveTab('pending')} className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm relative ${activeTab === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            در انتظار تایید ({pendingUsers.length})
                            {pendingUsers.length > 0 && <span className="absolute top-3 ms-2 w-2.5 h-2.5 bg-blue-600 rounded-full"></span>}
                        </button>
                    </nav>
                </div>

                {activeTab === 'active' ? (
                     <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">مدیران سیستم</h3>
                        {renderUserTable([...adminUsers], false)}
                        <h3 className="font-bold text-lg mt-6 mb-2">سرپرستان پایگاه</h3>
                        {renderUserTable([...activeUsers], false)}
                    </div>
                ) : (
                    <div className="p-4">{renderUserTable(pendingUsers, true)}</div>
                )}
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={currentUser}
                onSave={handleSave}
                personnelList={personnel}
                baseList={bases}
            />
        </div>
    );
};

interface UserModalProps {
    isOpen: boolean; onClose: () => void; user: UserProfile | null; onSave: (user: UserProfile) => void;
    personnelList: Personnel[]; baseList: Base[];
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, onSave, personnelList, baseList }) => {
    const [formData, setFormData] = useState<Partial<UserProfile>>({});

    React.useEffect(() => {
        setFormData(user || { role: 'user' });
    }, [user, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData as UserProfile); };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={'ویرایش کاربر'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">نام و نام خانوادگی</label>
                    <select name="personnel_id" value={formData.personnel_id || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                        <option value="" disabled>یک پرسنل را انتخاب کنید</option>
                        {personnelList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">نام کاربری</label>
                    <input type="text" name="username" value={formData.username || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required readOnly/>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">نقش</label>
                    <select name="role" value={formData.role || 'user'} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        <option value="user">سرپرست پایگاه</option>
                        <option value="admin">مدیر سیستم</option>
                    </select>
                </div>
                {formData.role === 'user' && (
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">تخصیص پایگاه</label>
                        <select name="base_id" value={formData.base_id || ''} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                            <option value="" disabled>یک پایگاه را انتخاب کنید</option>
                            {baseList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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

export default UserManagementPage;