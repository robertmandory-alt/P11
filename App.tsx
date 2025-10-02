import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import Layout from './components/layout/Layout';
import { SystemIcon } from './components/shared/Icons';

const AppContent: React.FC = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100">
                <div className="flex flex-col items-center space-y-4">
                    <SystemIcon className="w-12 h-12 text-sky-500 animate-spin" />
                    <p className="text-lg font-semibold text-gray-700">در حال بارگذاری اطلاعات...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated || !user) {
        return <LoginPage />;
    }

    return <Layout />;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <div className="bg-slate-100 min-h-screen text-gray-800">
                <AppContent />
            </div>
        </AuthProvider>
    );
};

export default App;