# BAHub Demo Guide

## Overview
This guide explains how to run the comprehensive demo script that showcases all key features of the BAHub business analysis platform.

## Prerequisites
- Backend server running on `http://127.0.0.1:8000`
- Frontend server running on `http://localhost:5173`
- PowerShell (Windows) or PowerShell Core (cross-platform)

## Running the Demo

### Basic Demo
```powershell
.\demo_script.ps1
```

### Custom Configuration
```powershell
.\demo_script.ps1 -BaseUrl "http://your-api-url" -FrontendUrl "http://your-frontend-url"
```

### Skip Setup (if servers already running)
```powershell
.\demo_script.ps1 -SkipSetup
```

## Demo Features

The script demonstrates the following features in order:

### 1. Authentication & User Management
- Registers a demo user
- Logs in with credentials
- Fetches user profile

### 2. Organization Management
- Fetches organization details
- Displays plan tier information

### 3. Project Management
- Creates a demo project ("E-Commerce Platform Redesign")
- Fetches project details
- Shows project status and metadata

### 4. Stakeholder Management
- Adds 3 demo stakeholders (Product Manager, CTO, UX Designer)
- Fetches all stakeholders with power/interest analysis
- Displays stakeholder matrix information

### 5. Requirements Management
- Creates 3 demo requirements (Functional, Non-Functional, UI)
- Fetches all requirements with priority/status
- Shows requirement IDs and categorization

### 6. User Stories Management
- Creates a user story from a requirement
- Demonstrates traceability between requirements and stories

### 7. Strategic Analysis
- Creates SWOT analysis with strengths, weaknesses, opportunities, threats
- Creates Gap analysis comparing current vs future state

### 8. Risk Management
- Creates risk assessment with probability/impact analysis
- Includes mitigation strategies

### 9. Document Management
- Creates BRD document with structured content
- Demonstrates document versioning capabilities

### 10. AI-Powered Features
- Triggers AI analysis on requirements
- Shows asynchronous job processing

### 11. Billing & Subscription
- Fetches subscription details
- Shows plan information and billing dates
- Displays invoice history

### 12. Team Management
- Fetches team members
- Shows roles and permissions

### 13. Project Reporting
- Generates comprehensive project report
- Shows statistics (requirements, stakeholders, risks)

### 14. Growth Features
- Generates referral code
- Shows public template gallery

## Demo Data

### Demo User
- Email: `demo@bahub.com`
- Password: `DemoPassword123!`
- Role: Business Analyst

### Demo Project
- Name: "E-Commerce Platform Redesign"
- Description: Complete redesign with modern UX and improved performance

### Demo Stakeholders
1. Sarah Johnson (Product Manager) - High Power/Interest
2. Michael Chen (CTO) - High Power/Interest  
3. Emily Davis (UX Designer) - Medium Power/High Interest

### Demo Requirements
1. User Authentication with OAuth 2.0 (Functional, High Priority)
2. Page Load Time < 2 Seconds (Non-Functional, High Priority)
3. Mobile-First Responsive Design (UI, Medium Priority)

## Post-Demo Exploration

After running the script, you can:

1. **Open the Frontend**: Navigate to `http://localhost:5173`
2. **Login**: Use the demo credentials
3. **Explore Dashboard**: See all created data in the UI
4. **Try Additional Features**:
   - Create diagrams
   - Schedule meetings
   - Configure integrations
   - Run UAT tests
   - Manage audit logs

## Cleanup

To remove demo data:
```powershell
# Delete the demo project (this will cascade delete related data)
# Or manually delete through the UI
```

## Troubleshooting

### Server Not Running
```
Error: Backend server is not accessible
Solution: Start backend with: cd backend && python manage.py runserver
```

### Authentication Failed
```
Error: Login failed
Solution: Check that the demo user doesn't already exist, or use existing credentials
```

### API Errors
```
Error: API call failed
Solution: Check backend logs for detailed error messages
```

## Customization

You can modify the demo script to:
- Add more stakeholders/requirements
- Change project details
- Test different user roles
- Add custom business logic
- Test specific features in isolation

## Production Demo

For production demos:
1. Change `$BaseUrl` to production API URL
2. Use production credentials
3. Adjust demo data for production context
4. Consider using a dedicated demo organization

## Support

For issues or questions:
- Check backend logs: `backend/` directory
- Check frontend console: Browser DevTools
- Review API documentation: `/api/v1/docs/` (if available)
