# Emergency Personnel Performance Management System

## Project Overview
- **Name**: Emergency Personnel Performance Management System
- **Goal**: Comprehensive management system for tracking emergency personnel performance, scheduling, and administrative tasks
- **Platform**: React + TypeScript + Supabase
- **Target Users**: Emergency service administrators and personnel

## 🌐 Live Application
- **Application URL**: https://3000-igk3zxc9pn8j5y4e8y0qq-6532622b.e2b.dev
- **GitHub Repository**: https://github.com/robertmandory-alt/P22

## 🔐 Admin Login Credentials
- **Username**: admin
- **Password**: admin1
- **Email**: admin@gmail.com (for direct email login)

## 📊 Current Features

### ✅ Completed Features
1. **Authentication System**
   - User registration and login
   - Admin/user role-based access control
   - Profile management with approval workflow
   
2. **User Management**
   - Admin panel for user approval/rejection
   - Profile editing and status management
   - Role assignment (admin/user)

3. **Personnel Management**
   - Add, edit, delete personnel records
   - Employment status tracking (Official/Contractual)
   - Productivity status (Productive/Non-Productive)
   - Driver status classification
   - Base assignment

4. **Base Management**
   - Organizational unit management
   - Base types: Urban, Road, Bus, Headquarters, Support
   - Hierarchical organization structure

5. **Shift Management**
   - Work shift definition and management
   - Shift types: Work, Leave, Miscellaneous
   - Hour calculation and holiday compensation
   - Performance effect tracking (Incremental/Decremental)

6. **Performance Tracking**
   - Daily performance record entry
   - Monthly performance submissions
   - Base-specific performance management
   - Draft/submitted status tracking

### 🚀 Key Functional URIs

#### Authentication
- `POST /auth/login` - User login with username/email and password
- `POST /auth/signup` - New user registration
- `POST /auth/logout` - User logout

#### Admin Panel
- `GET /admin/users` - List all users (admin only)
- `PUT /admin/users/:id/approve` - Approve pending users
- `DELETE /admin/users/:id` - Delete user accounts

#### Personnel Management
- `GET /api/personnel` - List all personnel
- `POST /api/personnel` - Create new personnel record
- `PUT /api/personnel/:id` - Update personnel information
- `DELETE /api/personnel/:id` - Remove personnel record

#### Performance Management
- `GET /api/performance/:year/:month` - Get monthly performance data
- `POST /api/performance/submit` - Submit monthly performance records
- `PUT /api/performance/draft` - Save draft performance data

## 🗄️ Data Architecture

### Database Schema (Supabase)
```sql
- profiles: User accounts linked to auth.users
- bases: Organizational units/departments
- personnel: Staff member records
- shifts: Work shift types and definitions
- performance_records: Daily performance tracking
- performance_submissions: Monthly submission status
```

### Data Models
- **UserProfile**: User authentication and role management
- **Personnel**: Staff member information and classifications
- **Base**: Organizational units with type categorization
- **WorkShift**: Shift definitions with time and effect calculations
- **PerformanceRecord**: Daily performance tracking per personnel
- **PerformanceSubmission**: Monthly submission workflow management

### Storage Services
- **Supabase Auth**: User authentication and session management
- **Supabase Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time Sync**: Live updates for collaborative management

## 🏗️ Database Setup

### Critical Setup Required
**The database schema must be created manually in Supabase before the application will function properly.**

#### Step-by-step Setup:
1. Open your Supabase dashboard: https://frcrtkfyuejqgclrlpna.supabase.co
2. Navigate to SQL Editor
3. Execute the SQL schema from `DATABASE_SETUP.md`
4. Create admin user through the application signup
5. Update admin profile: `UPDATE profiles SET role='admin', status='active' WHERE username='admin'`

### Sample Data Included:
- Headquarters base (HQ-001)
- Sample personnel records
- Standard work shifts (8-hour work, daily leave, night shift)
- Performance tracking templates

## 🎯 User Guide

### For Administrators:
1. **Login** with admin credentials
2. **Approve Users** in the admin panel
3. **Manage Personnel** - add staff, assign bases, update statuses
4. **Define Shifts** - create shift types, set hours and effects  
5. **Monitor Performance** - review submissions, track productivity
6. **System Management** - user roles, base configuration

### For Regular Users:
1. **Register** and wait for admin approval
2. **View Personnel** assigned to your base
3. **Enter Performance Data** daily for assigned staff
4. **Submit Monthly Reports** when complete
5. **Track Submissions** and status updates

## 🚀 Deployment

### Current Deployment Status
- ✅ **Active** - Development server running
- ✅ **Supabase Integration** - Database connected
- ⚠️ **Database Setup** - Requires manual schema creation (see DATABASE_SETUP.md)

### Technology Stack
- **Frontend**: React 19+ with TypeScript
- **Styling**: TailwindCSS for responsive design
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Build Tool**: Vite for fast development and building
- **Deployment**: Ready for Vercel, Netlify, or similar platforms

### Environment Configuration
```env
SUPABASE_URL=https://frcrtkfyuejqgclrlpna.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Next Development Steps

### High Priority
1. **Database Schema Creation** - Execute SQL setup in Supabase
2. **Admin User Setup** - Create and configure admin account
3. **Performance Testing** - Verify all CRUD operations
4. **Production Deployment** - Deploy to production environment

### Medium Priority
1. **Email Notifications** - Setup for user approvals and submissions
2. **Data Export** - Excel/PDF report generation
3. **Advanced Filtering** - Enhanced search and filter options
4. **Audit Logging** - Track all administrative actions

### Future Enhancements
1. **Mobile App** - React Native companion app
2. **Advanced Analytics** - Performance trend analysis
3. **Integration APIs** - Connect with external HR systems
4. **Multi-language Support** - English interface option

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Create admin user (after database setup)
node create-admin-simple.js
```

## 📚 Documentation Files
- `DATABASE_SETUP.md` - Complete database schema setup guide
- `schema.sql` - Database schema for manual import
- `types.ts` - TypeScript type definitions
- `create-admin-simple.js` - Admin user creation script

## 🔍 Troubleshooting

### Common Issues
1. **Login Failed**: Ensure database tables exist, check user role/status
2. **Database Errors**: Verify Supabase connection and RLS policies
3. **Admin Access**: Confirm admin role is set in profiles table

### Support
- Check Supabase logs for detailed error messages
- Verify network connectivity to Supabase instance
- Ensure all environment variables are properly configured

---

**Last Updated**: 2024-10-03
**Status**: ✅ Integration Complete - Ready for Database Setup