import React from 'react';

const Icon: React.FC<{ className?: string, children: React.ReactNode }> = ({ className, children }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        {children}
    </svg>
);

export const SystemIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
);

export const AdminIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </Icon>
);

export const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </Icon>
);

export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 1.002m-3-3.122a3 3 0 013.75 0" />
    </Icon>
);

export const ShiftsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </Icon>
);

export const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
);

export const ClipboardListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </Icon>
);

export const PersonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </Icon>
);

export const CityIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </Icon>
);

export const RoadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6.13a2.35 2.35 0 011.08-2.02l4.3-2.6A2 2 0 0117 3.3v10.4a2 2 0 01-1.62 1.95l-4.3 2.6A2.35 2.35 0 019 19zm0 0v1.5a2.5 2.5 0 002.5 2.5h1A2.5 2.5 0 0015 20.5V19m-6 0h6" />
    </Icon>
);

export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
);

export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </Icon>
);

export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </Icon>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </Icon>
);

export const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </Icon>
);

export const FileSpreadsheetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </Icon>
);

export const FileCsvIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </Icon>
);

export const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </Icon>
);

export const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
);

export const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </Icon>
);

export const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </Icon>
);

export const DocumentReportIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </Icon>
);

export const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.367a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </Icon>
);

export const SortIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m-5 4h13M20 4v12m0 0l-3-3m3 3l3-3" />
    </Icon>
);