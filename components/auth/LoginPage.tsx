import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemIcon } from '../shared/Icons';

const LoginPage: React.FC = () => {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signUp } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);
        const result = await login(username, password);
        if (!result.success) {
            setError(result.error || 'خطای ناشناخته رخ داد.');
        }
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('رمزهای عبور با یکدیگر مطابقت ندارند.');
            return;
        }
        setError('');
        setSuccessMessage('');
        setLoading(true);
        const result = await signUp(username, password);
        if (!result.success) {
            setError(result.error || 'خطای ناشناخته در ثبت نام.');
        } else {
            setIsSigningUp(false);
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setSuccessMessage("ثبت نام موفق بود! لطفاً ایمیل خود را برای تایید حساب کاربری چک کنید. پس از تایید، حساب شما باید توسط مدیر سیستم فعال شود.");
        }
        setLoading(false);
    };

    const toggleForm = () => {
        setIsSigningUp(!isSigningUp);
        setError('');
        setSuccessMessage('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                     <div className="flex justify-center mb-4">
                        <div className="bg-sky-400 rounded-lg p-3 text-white">
                           <SystemIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{isSigningUp ? 'ثبت نام کاربر جدید' : 'ورود به سیستم'}</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        سیستم مدیریت عملکرد پرسنل اورژانس
                    </p>
                </div>
                
                {successMessage && <p className="text-sm text-center text-green-600 bg-green-50 p-3 rounded-md">{successMessage}</p>}
                
                <form className="mt-8 space-y-6" onSubmit={isSigningUp ? handleSignUp : handleLogin}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="username-input" className="sr-only">نام کاربری</label>
                            <input
                                id="username-input"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-sky-400 focus:border-sky-400 focus:z-10 sm:text-sm"
                                placeholder="نام کاربری (فقط حروف و اعداد انگلیسی)"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">رمز عبور</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-sky-400 focus:border-sky-400 focus:z-10 sm:text-sm"
                                placeholder="رمز عبور"
                            />
                        </div>
                         {isSigningUp && (
                            <div>
                                <label htmlFor="confirm-password-input" className="sr-only">تکرار رمز عبور</label>
                                <input
                                    id="confirm-password-input"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-sky-400 focus:border-sky-400 focus:z-10 sm:text-sm"
                                    placeholder="تکرار رمز عبور"
                                />
                            </div>
                        )}
                    </div>

                    {error && <p className="text-sm text-center text-red-500">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-sky-500 border border-transparent rounded-md group hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 disabled:bg-sky-300 disabled:cursor-not-allowed"
                        >
                            {loading ? 'در حال پردازش...' : (isSigningUp ? 'ثبت نام' : 'ورود')}
                        </button>
                    </div>
                </form>

                <div className="text-sm text-center">
                    <button onClick={toggleForm} className="font-medium text-sky-500 hover:text-sky-400">
                        {isSigningUp ? 'حساب کاربری دارید؟ وارد شوید' : 'حساب کاربری ندارید؟ ثبت نام کنید'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;