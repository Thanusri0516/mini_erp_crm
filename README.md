# Mini ERP + CRM Operations Portal

A premium, responsive full-stack operations portal designed for wholesale and distribution operations. It integrates a **Customer CRM**, **Warehouse Inventory tracker**, and **Sales Challan generator** with strict role-based access.

---

### 🌐 Live Deployment Links
* **Live Frontend URL**: [https://mini-erp-crm-tt5s.onrender.com](https://mini-erp-crm-tt5s.onrender.com)
* **Live Backend API URL**: [https://mini-erp-backend-ikrf.onrender.com/api](https://mini-erp-backend-ikrf.onrender.com/api)

---

## 🛠️ Required Tech Stack

- **Backend**: Node.js, TypeScript, Express.js, Prisma ORM, SQLite (local dev) / PostgreSQL (production), JWT Auth
- **Frontend**: React (Vite, TypeScript), Lucide Icons, jsPDF & jsPDF-AutoTable
- **Styling**: Premium custom CSS (Dark glassmorphism, responsive dashboard layout, micro-interactions)
- **DevOps**: Docker, Docker Compose

---

## 🔑 Role-Based Access Credentials

The database is pre-seeded with four default users representing each team role. You can log in instantly using the **Quick Preset buttons** on the sign-in screen or type the credentials:

| Role | Username | Password | Access Rights & Enforcements |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` (or `admin`) | `admin123` | Full access to CRM, Products, Adjusting Stock, Challans, and Logs. |
| **Sales** | `sales@example.com` (or `sales`) | `sales123` | Manage CRM, log follow-up notes, build and confirm Sales Challans. Read-only inventory catalog. |
| **Warehouse** | `warehouse@example.com` (or `warehouse`) | `warehouse123` | Full access to product catalog, manual stock adjustments (IN/OUT), and logs. View-only CRM & Challans. |
| **Accounts** | `accounts@example.com` (or `accounts`) | `accounts123` | Cancel confirmed challans, review invoices. View-only CRM & Product inventories. |

---

## 🏗️ Database Schema & Business Logic

We use **Prisma ORM** for clean typing and database transactions.

- **User**: ID, Username, Name, Password Hash, Role (`ADMIN` | `SALES` | `WAREHOUSE` | `ACCOUNTS`).
- **Customer**: Profile details, contact card, business type, active status, and scheduled follow-up dates.
- **FollowUpNote**: Timeline log entries mapping communication history between sales reps and customers.
- **Product**: Catalog records featuring SKU, price, categories, storage warehouse location, current stock, and min alert thresholds.
- **StockLog**: Chronological stock transaction ledger tracking quantity, movement types (`IN` | `OUT`), logger user, and details (e.g. Audit, Sales Challan generation, returns).
- **Challan & ChallanItem**:
  - Handles billing.
  - **Snapshotting**: Items are locked with a snapshot of description, SKU, and unit prices, guaranteeing historical receipt records are preserved even if the base product is subsequently modified or deleted.
  - **Atomic Deductions**: Challan confirmation performs atomic transactions verifying inventory thresholds, deducting stock, and recording stock logs. Insufficient inventory blocks generation.
  - **Restoration**: Cancelling a confirmed challan safely increments the items back to active stock.

---

## ⚙️ Environment Variables

An `.env` file should be placed in the `backend/` folder.

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-mini-erp-crm-key-2026"
```

*Note: For production environments, you can simply change `DATABASE_URL` to a PostgreSQL server link (e.g., Supabase, Neon) and update `provider = "postgresql"` in `backend/prisma/schema.prisma`.*

---

## 🚀 How to Run the Project Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Step 1: Clone the Repository & Configure Backend
Navigate to the `backend/` folder, install dependencies, run migrations, and start the development server:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
The server will boot up on `http://localhost:5000`.

### Step 2: Configure & Start Frontend
In a new terminal window, navigate to the `frontend/` folder, install dependencies, and start Vite:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will boot up on `http://localhost:5173`. Open this URL in your web browser.

---

## 🐳 Running with Docker (Compose)

We provide a multi-container Docker Orchestration setup to build and link both services.

1. Install and boot **Docker Desktop**.
2. Run the following command in the workspace root directory:
   ```bash
   docker-compose up --build
   ```
3. Access the frontend app at `http://localhost/` (Port 80). The backend will run on port `5000`.

---

## 🌐 Production Deployment Guide

To deploy this project to free hosting platforms:

### 1. Database (PostgreSQL)
1. Set up a free PostgreSQL database on **Neon.tech** or **Supabase**.
2. Copy the Connection String.
3. In `backend/prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

### 2. Backend (Render / Railway)
1. Push your project to GitHub.
2. Link your repository to **Render** or **Railway** as a Web Service.
3. Configure the build commands:
   ```bash
   cd backend && npm install && npx prisma generate && npm run build
   ```
4. Configure the start command:
   ```bash
   cd backend && npx prisma migrate deploy && npm start
   ```
5. Set environment variables:
   - `DATABASE_URL`: Your PostgreSQL link.
   - `JWT_SECRET`: Random secure string.
   - `PORT`: `5000`.

### 3. Frontend (Vercel / Netlify)
1. Deploy the `frontend` folder as a static site on **Vercel** or **Netlify**.
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Update `API_BASE_URL` in `frontend/src/api.ts` to match your deployed backend URL.

---

## 📡 REST API Documentation

All endpoints (except login) require a header: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication
- `POST /api/auth/login` - Login to account. Body: `{ username, password }`.

### Customer CRM
- `GET /api/customers` - List customers. Supports pagination, type/status filtering, and search.
- `POST /api/customers` - Add a customer profile. Role: `ADMIN` | `SALES`.
- `GET /api/customers/:id` - Fetch single customer detailed info with follow-up timeline notes.
- `PUT /api/customers/:id` - Edit customer fields. Role: `ADMIN` | `SALES`.
- `DELETE /api/customers/:id` - Delete customer. Role: `ADMIN` | `SALES`.
- `POST /api/customers/:id/notes` - Append follow-up communication timeline log. Role: `ADMIN` | `SALES`.

### Products & Inventory
- `GET /api/products` - List products. Supports search, category, and low stock filters.
- `POST /api/products` - Add product profile. Role: `ADMIN` | `WAREHOUSE`.
- `GET /api/products/:id` - Get product info.
- `PUT /api/products/:id` - Edit product details. Role: `ADMIN` | `WAREHOUSE`.
- `DELETE /api/products/:id` - Delete product. Role: `ADMIN` | `WAREHOUSE`.
- `POST /api/products/:id/adjust` - Adjust stock IN/OUT. Body: `{ quantityDelta, reason }`. Role: `ADMIN` | `WAREHOUSE`.
- `GET /api/products/:id/stock-movements` - Get stock movement log history for a single product.

### Sales Challans
- `GET /api/challans` - List challans. Supports search and status filters.
- `POST /api/challans` - Create draft or confirmed challan (locks snapshots and deducts stock if confirmed). Role: `ADMIN` | `SALES`.
- `GET /api/challans/:id` - Get challan details with snapshot items.
- `PUT /api/challans/:id/status` - Transition status. Role: `ADMIN` | `SALES` | `ACCOUNTS`.
- `PUT /api/challans/:id/confirm` - Confirm a draft challan. Role: `ADMIN` | `SALES` | `ACCOUNTS`.
- `PUT /api/challans/:id/cancel` - Cancel a confirmed challan (restores stock to inventory). Role: `ADMIN` | `SALES` | `ACCOUNTS`.

---

## 📌 Assumptions Made

1. **Local Disk Storage**: Product images are simulated via base64 fallback or default category icons to run 100% offline without requiring S3 tokens.
2. **Sales Tax / GST**: Tax calculation is simplified as direct line sub-totals. The GST registration number is tracked for active customers.
3. **Database Portability**: SQLite can be used for local dev to guarantee a zero-installation test run, but Prisma makes it completely compatible with PostgreSQL.
4. **Client-side PDF Generation**: PDF invoices are built inside the client browser to optimize server load and keep hosting costs at zero.

---

## 🏗️ Architectural Overview
The project is built as a decoupled Client-Server architecture:
* **Frontend**: A Single Page Application (SPA) built using **React 19, Vite, and TypeScript**. Styled with **Vanilla CSS** following custom design variables (Sage green and Warm ochre color tokens) for responsive grid alignments and interactive dashboard layouts.
* **Backend**: A RESTful API built on **Node.js, Express, and TypeScript**. It uses standard middleware for JWT authentication token validation, global error boundaries, and CORS configuration.
* **Database**: Managed via **Prisma ORM** connecting to **Supabase PostgreSQL** in production. It uses connection pooling (PgBouncer) for application query routines and direct connections for running database migrations.
* **DevOps**: Multi-container containerization managed through **Docker and Docker Compose** files.

---

## ⚠️ Known Limitations & Incomplete Parts
* **No Active Email Server**: Timeline notes and scheduled follow-ups are tracked internally in the CRM database rather than triggering external customer notification emails.
* **Static Image Assets**: Product files are represented via fallback icons rather than dynamic external file storage (like AWS S3).
* **No Token Revocation List**: JWT authentication handles sign-outs on the client side by discarding the local storage token. There is no active server-side token blacklisting (e.g. Redis) implemented in the current version.

