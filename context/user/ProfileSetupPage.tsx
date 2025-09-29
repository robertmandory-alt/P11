import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ProfileSetupPage: React.FC = () => {
    const { user, updateUser, personnel, bases, logout } = useAuth();
    const [formData, setFormData] = useState({
        personnel_id: '',
        base_id: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Show unassigned personnel at the top of the list for easier selection.
    const sortedPersonnel = [...personnel].sort((a, b) => {
        if (!a.base_id && b.base_id) return -1;
        if (a.base_id && !b.base_id) return 1;
        return a.name.localeCompare(b.name, 'fa');
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!user || !formData.personnel_id || !formData.base_id) {
            setError('لطفاً هم پرسنل و هم پایگاه را انتخاب کنید.');
            return;
        }

        setLoading(true);
        const { success } = await updateUser(user.id, {
            personnel_id: formData.personnel_id,
            base_id: formData.base_id,
            profile_completed: true,
        });

        if (!success) {
            setError('خطا در ذخیره سازی اطلاعات. لطفاً دوباره تلاش کنید.');
        }
        // On success, the AuthContext state will update, and the Layout component
        // will automatically render the correct user dashboard.
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">تکمیل اطلاعات کاربری</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        خوش آمدید! برای استفاده از سامانه، لطفاً اطلاعات زیر را تکمیل کنید.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="personnel_id" className="block mb-2 text-sm font-medium text-gray-900">
                            انتخاب پرسنل
                        </label>
                        <select 
                            id="personnel_id" 
                            name="personnel_id" 
                            value={formData.personnel_id}
                            onChange={handleChange}
                            required
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        >
                            <option value="" disabled>نام خود را از لیست انتخاب کنید...</option>
                            {sortedPersonnel.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {!p.base_id && "(تخصیص نیافته)"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="base_id" className="block mb-2 text-sm font-medium text-gray-900">
                            انتخاب پایگاه
                        </label>
                        <select 
                            id="base_id" 
                            name="base_id" 
                            value={formData.base_id}
                            onChange={handleChange}
                            required
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        >
                            <option value="" disabled>پایگاه خود را انتخاب کنید...</option>
                            {bases.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="text-sm text-center text-red-500">{error}</p>}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative flex justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                            {loading ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
                        </button>
                    </div>
                </form>

                 <div className="text-xs text-center text-gray-500 pt-2">
                    <p>پس از تکمیل این فرم به داشبورد خود منتقل خواهید شد. در صورت نیاز به خروج می‌توانید از منوی اصلی اقدام کنید.</p>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetupPage;