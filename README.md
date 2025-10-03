# Emergency Personnel Performance Management System

## Project Overview

- **Name**: Emergency Personnel Performance Management System
- **Goal**: Comprehensive system for tracking and managing emergency personnel performance and shifts
- **Technology**: React + TypeScript + Supabase + Vite
- **Status**: ✅ Active and Deployed

## 🔗 URLs

- **Current Development**: https://3000-imzyvtcds3oj7e6ycwfwi-6532622b.e2b.dev
- **Source Repository**: https://github.com/robertmandory-alt/P22.git
- **Target Repository**: https://github.com/robertmandory-alt/P3.git
- **Supabase Database**: https://frcrtkfyuejqgclrlpna.supabase.co

## 🎯 Currently Completed Features

### ✅ Authentication System
- User registration and login
- Role-based access control (admin/user)
- Profile management with approval workflow
- Secure authentication via Supabase Auth

### ✅ Base Management
- Create, edit, delete organizational bases
- Support for multiple base types (Urban, Road, Bus, Headquarters, Support)
- Base assignment to personnel and supervisors

### ✅ Personnel Management
- Complete personnel records management
- Employment status tracking (Official/Contractual)
- Productivity status (Productive/Non-Productive)
- Driver status classification
- Base assignment for personnel

### ✅ Shift Management
- Work shift type definitions
- Shift codes and equivalent hours
- Holiday hours and incremental/decremental effects
- Support for Work, Leave, and Miscellaneous shift types

### ✅ Performance Tracking
- Monthly performance record submission
- Day-by-day shift assignment tracking
- Submission status management (draft/submitted)
- Base-specific performance reporting

### ✅ Admin Dashboard
- Complete administrative interface
- User management and approval
- Data management for all entities
- Performance monitoring across all bases

## 📊 Data Architecture

### Database Tables (Supabase)
- **`profiles`** - User accounts linked to auth.users
- **`bases`** - Organizational units/stations
- **`personnel`** - Staff member records
- **`shifts`** - Work shift type definitions
- **`performance_records`** - Daily performance tracking
- **`performance_submissions`** - Monthly submission status

### Storage Services
- **Primary Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password
- **Real-time**: Supabase real-time subscriptions for live updates

### Data Flow
1. **Authentication**: Users log in via Supabase Auth
2. **Profile Check**: System verifies user profile and permissions
3. **Data Access**: RLS policies control data visibility based on roles
4. **Performance Entry**: Users enter daily performance data
5. **Submission**: Monthly data submitted for review
6. **Reporting**: Admins can view all submitted performance data

## 🔐 Admin Login Credentials

- **Username**: `admin`
- **Password**: `admin1`
- **Email**: `admin@company.com`

✅ **Status**: Admin user successfully created and tested
🌐 **Login URL**: https://3000-imzyvtcds3oj7e6ycwfwi-6532622b.e2b.dev

## 👥 User Guide

### For Regular Users:
1. **Registration**: Sign up with username and password
2. **Approval**: Wait for admin approval (status changes from 'pending' to 'active')
3. **Login**: Use username/password to access the system
4. **Performance Entry**: Enter daily shift performance data
5. **Monthly Submission**: Submit completed monthly performance reports

### For Administrators:
1. **Login**: Use admin credentials above
2. **User Management**: Approve new users and manage existing accounts
3. **Data Management**: Add/edit bases, personnel, and shift types
4. **Performance Monitoring**: View submitted performance reports
5. **System Administration**: Full access to all system functions

### Navigation:
- **Performance Entry**: Main dashboard for data entry
- **Personnel Management**: Staff records management
- **Shift Management**: Work shift definitions
- **Base Management**: Organizational unit management
- **User Management**: Account and permission management

## 🚀 Deployment

- **Platform**: Vite Development Server
- **Status**: ✅ Active
- **Tech Stack**: React + TypeScript + Supabase + TailwindCSS
- **Last Updated**: 2025-10-03
- **Admin Setup**: ✅ Completed successfully
- **Database Connection**: ✅ Active and configured
- **Login Testing**: ✅ Verified working

## ⚙️ Setup Instructions

### Prerequisites
1. **Database Setup**: Follow instructions in `DATABASE_SETUP.md`
2. **Admin User**: Run `node create-admin-final.js` after database setup

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or use PM2 for daemon mode
pm2 start ecosystem.config.cjs
```

### Database Configuration
The application is configured to connect to:
- **URL**: https://frcrtkfyuejqgclrlpna.supabase.co
- **API Key**: Pre-configured in `utils/supabaseClient.ts`

## 🔧 Technical Features

### Security
- Row Level Security (RLS) policies for data protection
- Role-based access control
- Secure authentication with Supabase Auth
- Input validation and sanitization

### Performance
- Optimized database queries with proper indexing
- Real-time updates via Supabase subscriptions
- Efficient state management with React Context
- Responsive design for all device sizes

### User Experience
- Persian/Farsi language support
- Intuitive interface with clear navigation
- Loading states and error handling
- Form validation with helpful feedback

## 📝 Features Not Yet Implemented

### Potential Enhancements
- [ ] Advanced reporting and analytics
- [ ] Export functionality (PDF/Excel)
- [ ] Email notifications for submissions
- [ ] Mobile application
- [ ] Audit trail and change logging
- [ ] Bulk data import/export
- [ ] Advanced user permissions (beyond admin/user)
- [ ] Dashboard analytics and charts

## 🔄 Recommended Next Steps

1. **Complete Database Setup**: Follow `DATABASE_SETUP.md` to create all required tables
2. **Create Admin User**: Run the admin creation script
3. **Test Full Workflow**: Register a user, approve them, and test performance entry
4. **Add Sample Data**: Create additional bases, personnel, and shifts for testing
5. **User Training**: Provide training materials for end users
6. **Production Deployment**: Consider deploying to a production environment
7. **Backup Strategy**: Implement regular database backups
8. **Monitoring**: Set up system monitoring and error tracking

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection**: Ensure Supabase database schema is created
2. **Authentication**: Verify admin user exists and has correct permissions
3. **RLS Policies**: Check that Row Level Security policies are properly configured
4. **User Approval**: New users need admin approval before accessing the system

### Support
- Check the `DATABASE_SETUP.md` file for detailed setup instructions
- Review Supabase dashboard for authentication and database issues
- Use browser developer tools to check for JavaScript errors

---

**Last Updated**: October 3, 2025  
**Version**: 1.0.0  
**Maintainer**: Emergency Management System Team