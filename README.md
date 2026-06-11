# AttendERP – Employee Attendance Tracking System

A full-stack web application for managing employee attendance records with dynamic status calculation, CSV uploads, and rich reporting.

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router DOM, Axios, Chart.js |
| Backend   | Node.js, Express.js, JWT, Multer, csv-parser, bcrypt |
| Database  | MySQL 8+                                        |

---

## Quick Start

### 1. Setup MySQL Database

```sql
-- In MySQL client:
SOURCE backend/config/schema.sql;
SOURCE backend/config/seed.sql;
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set your MySQL credentials
```

`.env` defaults:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=erp_attendance
JWT_SECRET=erp_attendance_jwt_secret_2024_change_in_production
JWT_EXPIRES_IN=7d
PORT=5000
```

### 3. Start Backend

```bash
cd backend
npm run dev      # Development with nodemon
# or
npm start        # Production
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## Default Admin Credentials

| Field    | Value                |
|----------|----------------------|
| Email    | admin@example.com    |
| Password | password123          |

---

## Attendance Business Logic

| Condition                                 | Status     | Day Count |
|-------------------------------------------|------------|-----------|
| punch_in ≤ office_start + grace_period    | Present    | 1.0       |
| punch_in > deadline AND late_count ≤ 2   | Late Free  | 1.0       |
| punch_in > deadline AND late_count > 2   | Half Day   | 0.5       |
| No attendance record                      | Absent     | 0.0       |

> **Status is always computed dynamically – never stored in the database.**

---

## CSV Upload Format

```csv
employee_code,date,punch_in,punch_out
EMP001,2026-06-01,09:05:00,18:00:00
EMP002,2026-06-01,09:40:00,18:10:00
```

Download [sample_attendance.csv](./sample_attendance.csv) to get started.

---

## API Endpoints

### Auth
| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| POST   | /api/auth/login   | Admin login        |
| POST   | /api/auth/logout  | Logout             |
| GET    | /api/auth/me      | Current admin info |

### Employees
| Method | Endpoint              | Description                      |
|--------|-----------------------|----------------------------------|
| GET    | /api/employees        | List with search & pagination    |
| GET    | /api/employees/:id    | Get one employee                 |
| POST   | /api/employees        | Create employee                  |
| PUT    | /api/employees/:id    | Update employee                  |
| DELETE | /api/employees/:id    | Delete employee                  |

### Attendance
| Method | Endpoint                   | Description       |
|--------|----------------------------|-------------------|
| POST   | /api/attendance/upload     | Upload CSV file   |

### Dashboard
| Method | Endpoint                   | Description            |
|--------|----------------------------|------------------------|
| GET    | /api/dashboard?month=YYYY-MM | Monthly statistics   |

### Reports
| Method | Endpoint                             | Description                  |
|--------|--------------------------------------|------------------------------|
| GET    | /api/reports?month=YYYY-MM           | All employees monthly report |
| GET    | /api/reports/:id?month=YYYY-MM       | Single employee report       |
| GET    | /api/reports/:id?month=YYYY-MM&export=csv | CSV download           |

---

## Project Structure

```
erp/
├── backend/
│   ├── config/          # DB config, schema, seed SQL
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling, file upload
│   ├── models/          # Database query classes
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic (attendance, CSV, reports)
│   ├── utils/           # Time utilities
│   ├── uploads/         # Temp CSV uploads (auto-cleaned)
│   └── server.js        # Entry point
└── frontend/
    ├── src/
    │   ├── api/         # Axios API layer
    │   ├── components/  # Reusable UI components
    │   ├── context/     # AuthContext
    │   └── pages/       # Login, Dashboard, Employees, Upload, Reports
    └── index.html
```
