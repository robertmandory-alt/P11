
import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    Icon: React.FC<{ className?: string }>;
    iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, Icon, iconColor = 'text-gray-500' }) => {
    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between h-36">
            <div>
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <p className="text-4xl font-bold text-gray-800 mt-2">{value}</p>
            </div>
            <div className="text-start">
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
        </div>
    );
};

export default StatCard;
