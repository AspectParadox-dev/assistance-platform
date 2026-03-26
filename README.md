# Assistance Management Platform

A web-based platform to manage the full lifecycle of assistance requests — from public applicant intake through case management, compliance review, presidential approval, and treasurer disbursement.

---

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6 + Recharts
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT (bcrypt password hashing)
- **File Storage**: Local disk (multer) — ready to swap for S3

---

## Project Structure

```
assistance-platform/
├── backend/         Express API
└── frontend/        React app
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed with sample data and default users
npm run db:seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to the backend.

---

## Default Credentials (after seeding)

| Role               | Email                     | Password          |
|--------------------|---------------------------|-------------------|
| Admin              | admin@example.com         | Admin123!         |
| Case Manager       | cm@example.com            | CaseManager123!   |
| Compliance Officer | compliance@example.com    | Compliance123!    |
| President          | president@example.com     | President123!     |
| Treasurer          | treasurer@example.com     | Treasurer123!     |

---

## Application Workflow

```
Public Submission
      ↓
Case Manager Review (assigns case, adds notes/docs)
      ↓
Compliance Review (checklist validation)
      ↓
President Decision (Approve / Reject / Request Info)
      ↓
Treasurer Disbursement (schedule + mark paid)
      ↓
Completed
```

---

## Key Features

- **Public intake form** — multi-step, no login required
- **Role-based dashboards** — each role sees their relevant queue
- **Case management** — notes, document upload, status tracking
- **Compliance checklist** — 8-item verification checklist with progress tracking
- **President decisions** — approve/reject/request-info with rationale logging
- **Disbursement tracking** — schedule payments, mark as paid
- **Donation tracking** — manual entry + CSV bulk import
- **Financial reconciliation** — donations vs disbursements with running balance
- **Reports** — application stats by status, financial summary, bar chart
- **User management** — admin can create/deactivate staff accounts

---

## API Routes

```
POST   /api/auth/login
GET    /api/auth/me

POST   /api/applications                    (public)
GET    /api/applications
GET    /api/applications/:id
PATCH  /api/applications/:id/status
PATCH  /api/applications/:id/assign
PATCH  /api/applications/:id/compliance

GET/POST  /api/applications/:id/notes
GET/POST/GET/DELETE  /api/applications/:id/documents/:docId
GET/POST  /api/applications/:id/decisions
POST      /api/applications/:id/disbursements

GET/PATCH  /api/disbursements
GET/POST/POST/PATCH/DELETE  /api/donations

GET/POST/PATCH/PATCH  /api/users

GET  /api/reports/summary
GET  /api/reports/reconciliation
GET  /api/reports/applications
```

---

## CSV Donation Import Format

```csv
donorName,amount,method,receivedDate,donorEmail,referenceNumber,notes
Community Fund,5000,CHECK,2026-03-01,,CHK-001,Annual donation
Anonymous,250,ZELLE,2026-03-15,,,
```

Required columns: `donorName`, `amount`, `method`, `receivedDate`
Valid methods: `CHECK`, `ZELLE`, `ACH`, `CASH`, `ONLINE`, `OTHER`

---

## Phase 2 / Future Work

- S3 document storage (set `STORAGE_BACKEND=s3` — foundation already in place)
- Multi-tenant support
