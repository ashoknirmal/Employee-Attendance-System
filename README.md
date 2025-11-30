## Name           : ASHOKNIRMAL P S
## College Name   : KONGU ENGINEERING COLLEGE 
## Contact Number : +91 6383297756

# Employee Attendance System

A full-stack role-based **Employee Attendance System** built using React, TypeScript, Vite, Tailwind CSS, shadcn/ui, and Supabase.  
Employees can check in/out, view attendance history, and track monthly stats. Managers can monitor team attendance, view reports, and export data.

---

## 🚀 Project Overview

This system provides:

- Secure authentication with role-based access (Employee/Manager)
- Attendance tracking with check-in/check-out flow
- Calendar-based attendance history
- Manager dashboards with analytics and charts
- CSV export functionality for reports
- Fully responsive UI built with a modern component library

---

## 📌 Features

### 👨‍💼 Employee Features
- Check-In & Check-Out  
- View attendance calendar  
- Monthly attendance summary  
- View working hours  

### 👩‍💼 Manager Features
- View all employees  
- Daily attendance overview  
- Weekly & monthly charts  
- Filter by date, status, or employee  
- Export reports to CSV  
- View today's absent employees  

### 🔐 Security
- Supabase Authentication  
- Row Level Security (RLS)  
- Automatic profile creation using triggers  

---

## 🛠 How to Edit or Work on This Project

You can work on this project using your preferred local development environment.

---

### **1️⃣ Clone and Run Locally**

> **Prerequisite:**  
> Install Node.js & npm (recommended via nvm):  
> https://github.com/nvm-sh/nvm#installing-and-updating

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate into project
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev

-----
⚙️ Environment Variables:

-VITE_SUPABASE_PROJECT_ID="tbazxjithcgwlcovffrf"
-VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiYXp4aml0aGNnd2xjb3ZmZnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTYzMDQsImV4cCI6MjA4MDAzMjMwNH0.fH64gNMWRnaqmYU1_WDSQTy8ElynnHPmCE4dgdNKjtE"
-VITE_SUPABASE_URL="https://tbazxjithcgwlcovffrf.supabase.co"

----
🗂 Project Structure:
-src/
- ├── components/       # Reusable UI components
- ├── pages/            # Dashboard, Reports, Login, etc.
- ├── context/          # Auth context
- ├── hooks/            # Custom hooks
- ├── lib/              # Supabase client & utilities
- ├── routes/           # Protected & Role-based routing
- ├── styles/           # Tailwind styles
- └── App.tsx           # Main app file


📸 Screenshots:

-Employee Dashboard:-
<img width="1890" height="934" alt="image" src="https://github.com/public/employee-dashboard.png" />

-Attendance Calendar
<img width="1890" height="934" alt="image" src="https://github.com/public/attendance-calendar.png" />

-Manager Team Dashboard
<img width="1890" height="934" alt="image" src="https://github.com/public/manager-dashboard.png" />

-Reports Page
<img width="1890" height="934" alt="image" src="https://github.com/public/attendance-report.png" />

