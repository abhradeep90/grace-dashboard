# Grace Music Academy Dashboard - PRD

## Original Problem Statement
Create an internal dashboard for Grace Music Academy (piano music institute) to manage students' schedules, their fees (paid/unpaid status), and next fee schedule.

## User Personas
- **Admin/Staff**: Single instructor managing all students, schedules, and fees

## Core Requirements (Static)
- Student management (add/edit/delete, basic info, notes)
- Weekly lesson scheduling with reschedule support
- Fee tracking (paid/unpaid status, due dates)
- Light theme, easy to use
- INR currency
- Financial analytics with profit/loss tracking

## What's Been Implemented (December 29, 2025)
- [x] User authentication (login/register with JWT)
- [x] Dashboard with stats overview (students, lessons, fees)
- [x] Student CRUD (name, email, phone, age, skill level, notes)
- [x] Student detail view with lessons, fees, notes tabs
- [x] Weekly schedule management (day/time/duration/topics)
- [x] Week view and calendar view for schedule
- [x] Fee management with paid/unpaid tracking
- [x] Mark fees as paid functionality
- [x] Student notes system
- [x] INR (₹) currency support
- [x] Responsive design with mobile menu
- [x] **Finances Tab with:**
  - Total Income, Pending Income, Total Expenses, Net Profit cards
  - Monthly Overview bar chart (Income vs Expenses)
  - Expense Breakdown pie chart by category
  - Profit Trend area chart
  - Fixed expenses management (recurring & one-time)
- [x] **NEW: Attendance Tab with:**
  - Mark lessons as completed (date, duration, topics)
  - View completed lessons by student and month
  - Monthly summary report generation
  - WhatsApp-ready shareable message with lesson dates
  - Copy to clipboard & direct WhatsApp share buttons

## Tech Stack
- Backend: FastAPI + MongoDB
- Frontend: React + Tailwind CSS + Shadcn UI + Recharts
- Auth: JWT tokens

## Access URL
https://pianopulse.preview.emergentagent.com

## Default Credentials
- Email: admin@gracemusic.com
- Password: admin123

## Prioritized Backlog
### P0 (Critical) - None remaining
### P1 (High Priority)
- SMS/Email reminders for upcoming lessons
- Fee receipt generation/PDF export
- Bulk fee creation for all students
### P2 (Nice to Have)
- Student progress tracking over time
- Payment history reports
- Parent contact info and communication log
- Multiple instructor support
- Export financial reports to Excel/PDF
