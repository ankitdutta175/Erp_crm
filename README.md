# Mini ERP + CRM Operations Portal

A modern, full-stack **Mini ERP & CRM Operations Portal** built for wholesale and distribution companies. This portal handles role-based access control, customer relationship management (CRM follow-ups & lead tracking), inventory stock control with minimum stock alerts, sales challan generation with snapshot data preservation, negative stock prevention logic, and commercial invoice PDF generation.

---

## 🚀 Live Demo & Repository Info

- **Repository**: [Mini ERP + CRM Portal GitHub](https://github.com/example/mini-erp-crm)
- **Tech Stack**: Node.js, TypeScript, Express.js, Prisma ORM, SQLite/PostgreSQL, React, Vite, Lucide Icons, Docker.

---

## 🔐 Test Login Credentials (All 4 Roles)

You can use the **Quick Demo Role Autofill** buttons on the login screen or enter the following credentials:

| Role | Email | Password | Allowed System Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `Admin@123` | Full access to all modules, customers, stock, challans, user management. |
| **Sales** | `sales@company.com` | `Sales@123` | Create & edit customers, add follow-up notes, create & draft/confirm sales challans. |
| **Warehouse** | `warehouse@company.com` | `Warehouse@123` | Manage inventory SKUs, adjust stock levels (IN/OUT), view stock audit logs, confirm challan dispatches. |
| **Accounts** | `accounts@company.com` | `Accounts@123` | View revenue analytics, customer CRM notes, inspect invoices, cancel/refund challans. |

---

## 🛠 Tech Stack & Architecture

```
                      +-----------------------------+
                      | React + TS Frontend (Vite)  |
                      |   Modern Glassmorphism UI   |
                      +--------------+--------------+
                                     |
                         REST APIs / JSON / JWT Auth
                                     v
                      +-----------------------------+
                      | Express + TS Backend API    |
                      |   Zod Validation & Auth Middleware |
                      +--------------+--------------+
                                     |
                                 Prisma ORM
                                     v
                      +-----------------------------+
                      |  SQLite / PostgreSQL Database|
                      +-----------------------------+
```

### Architecture Highlights:
1. **Product Snapshot Preservation**: When a Sales Challan is created, product name, SKU, and unit price at that moment are snapshot into `SalesChallanItem`. Future price edits to the product master will not alter historical invoices.
2. **Negative Stock Prevention & Business Logic**:
   - Confirming a challan validates available stock for every line item.
   - If stock is insufficient, the API halts execution and returns a structured `HTTP 400 Bad Request` with exact stock deficit details.
   - On confirmation, stock is automatically decremented and an `OUT` movement log is recorded in `StockLog`.
3. **Role-Based Access Control (RBAC)**: Enforced at both backend API middleware level (`requireRoles(['ADMIN', 'SALES'])`) and frontend UI component level.

---

## 📦 Local Installation & Setup Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Step 1: Clone Repository
```bash
git clone https://github.com/example/mini-erp-crm.git
cd mini-erp-crm
```

### Step 2: Setup & Run Backend API
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```
The backend API server will run at: **`http://localhost:5000`**

### Step 3: Setup & Run Frontend Application
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The React frontend application will open at: **`http://localhost:3000`**

---

## 🐳 Docker Setup (Bonus Point)

Run the entire stack (Database, Backend API, Frontend Web App) via Docker Compose:

```bash
docker-compose up --build
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

---

## 🌐 Live Cloud Deployment Guide (100% Free Hosting)

### 1. Database Deployment (Neon.tech / Render Postgres / Supabase)
1. Sign up on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) (100% Free Tier).
2. Create a new PostgreSQL Database project.
3. Copy your PostgreSQL Connection String (`DATABASE_URL`), e.g.:
   `postgresql://username:password@ep-cool-db.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Update `backend/prisma/schema.prisma`:
   Change `provider = "sqlite"` to `provider = "postgresql"`.

### 2. Backend API Deployment (Render.com / Railway.app)
1. Push your project to GitHub.
2. Sign up on [Render.com](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository and specify the **Root Directory**: `backend`
4. Configure settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run seed && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `DATABASE_URL` = *(Your Neon / Supabase Postgres Connection String)*
   - `JWT_SECRET` = `mini_erp_crm_super_secret_jwt_key_2026`
   - `NODE_ENV` = `production`
6. Click **Create Web Service**. Your backend API will be deployed at e.g. `https://mini-erp-api.onrender.com`.

### 3. Frontend Web App Deployment (Vercel / Netlify)
1. Sign up on [Vercel.com](https://vercel.com).
2. Click **Add New > Project** and import your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://mini-erp-api.onrender.com/api` *(Your Render Backend URL)*
5. Click **Deploy**. Vercel will build and provide a live frontend URL (e.g. `https://mini-erp-portal.vercel.app`).

---

## 📄 Postman Collection & API Documentation

A pre-configured Postman Collection is included in the project root:
- **File**: `postman_collection.json`

### Core API Endpoints:
- `POST /api/auth/login` - Authenticate user & get JWT token
- `GET /api/auth/me` - Get logged in profile
- `GET /api/customers` - List customers (supports search, filter & pagination)
- `POST /api/customers` - Create customer
- `POST /api/customers/:id/notes` - Add CRM follow-up note
- `GET /api/products` - List products (supports low stock filter)
- `POST /api/products` - Add product SKU
- `POST /api/products/:id/stock` - Adjust stock (IN/OUT with reason)
- `GET /api/challans` - List sales challans
- `POST /api/challans` - Create sales challan (validates & reduces stock if confirmed)
- `PUT /api/challans/:id/status` - Update status (`CONFIRMED`, `CANCELLED`)
- `GET /api/dashboard/stats` - Live executive summary analytics

---

## 🌟 Key Bonus Features Implemented

1. **Docker & Docker Compose Containerization**: Ready-to-deploy containers for production hosting.
2. **Commercial Invoice PDF Export**: Printable, formatted commercial invoice preview with print/PDF save support.
3. **Low Stock Reorder Alert System**: Visual warning badges and filtered dashboard alerts when current stock falls below minimum alert threshold.
4. **Audit Log Trail**: Every manual or automated stock movement (`IN`/`OUT`) records quantity changed, reason, operator name, and timestamp.
5. **Postman Collection Export**: Included `postman_collection.json` for rapid API testing.

---

## 💡 Assumptions & Known Limitations

- **Database**: SQLite is used out-of-the-box for zero-config local evaluation (`file:./dev.db`), but Prisma schema can connect to PostgreSQL on Supabase/Neon simply by setting `provider = "postgresql"` in `schema.prisma` and updating `DATABASE_URL`.
- **Media Upload**: Product image URL input is supported. Integration with AWS S3 can be enabled by setting AWS credentials in `.env`.
