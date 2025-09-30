# Emergency Personnel Performance Management System

## Overview
A web application for the centralized management, recording, and reporting of monthly performance statistics for emergency personnel, designed for administrators and base supervisors. The system is in Persian (Farsi) and uses the Shamsi calendar.

## Recent Changes (September 30, 2025)
- GitHub import successfully set up in Replit environment
- Fixed vite.config.ts for ES module compatibility (added fileURLToPath for __dirname)
- Installed all npm dependencies
- Configured Vite to run on port 5000 for Replit proxy compatibility
- **Fixed host blocking error**: Added `allowedHosts: true` to Vite config to allow Replit proxy
- **Fixed WebSocket errors**: Disabled HMR to eliminate WebSocket connection failures in Replit environment
- Set up development workflow for frontend
- Configured deployment settings (autoscale with build and preview)
- Application successfully running with login page displayed
- Supabase integration present with configured credentials

## Project Architecture
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (via CDN)
- **Database**: Supabase PostgreSQL
- **Fonts**: Vazirmatn (Persian font family)
- **Build Tool**: Vite 6.3.6
- **Port**: 5000 (configured for Replit environment)

## Key Features
- Persian RTL interface
- Emergency personnel performance tracking
- Role-based access (administrators and supervisors)
- Shamsi calendar integration
- Export functionality (Excel/PDF)
- Digital signature capabilities
- Responsive design

## Technology Stack
- React 19.1.1
- TypeScript 5.8.2
- Vite 6.2.0
- @supabase/supabase-js 2.58.0
- Tailwind CSS
- Vazirmatn font

## Environment Configuration
- Development server runs on 0.0.0.0:5000
- HMR configured for port 5000
- Supabase client configured with production credentials

## Current Status
Application is fully functional and running successfully in the Replit environment. Login page displays correctly with Persian RTL interface. Deployment is configured and ready to publish.