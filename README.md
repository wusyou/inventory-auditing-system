# Inventory & Auditing System

A full-stack inventory management system with stock tracking, role-based access
control, and a complete audit trail. Built on the PERN stack (PostgreSQL,
Express, React, Node).

**Live demo:** https://inventory-auditing-system.vercel.app

## Features

- JWT authentication with access tokens and httpOnly refresh-token rotation
- Role-based access control (admin, staff, auditor) with route-level guards
- Products: full CRUD with SKU, category, unit, and live stock quantity
- Categories management
- Stock movements: stock in, stock out, and adjustments with atomic, race-safe
  stock updates
- Audit logs: automatic change tracking for products and stock movements
- User management: create, activate/deactivate, reset passwords, and change
  roles, with a guard against removing the last active admin
- Account security: self-service change password and log out from all devices
- Login monitoring: admin view of login attempts with email, status, and date
  filtering
- IP-based login rate limiting
- Dark mode, server-side filtering, sortable tables, and CSV export

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Prisma ORM, bcrypt, jsonwebtoken,
express-rate-limit

**Frontend:** React, Vite, React Router, lucide-react

## Project Structure

```
inventory-auditing-system/
├── src/                            # Backend (Express API)
│   ├── middleware/                 # verifyToken, requireRole, validate, rate limiter
│   ├── routes/                     # auth, products, categories, stock movements, users...
│   ├── validators/                 # request validation
│   ├── db.js                       # Prisma client
│   ├── seed.js                     # database seeder
│   └── server.js                   # app entry point
├── prisma/                         # schema and migrations
└── inventory-auditing-frontend/    # Frontend (React + Vite)
    └── src/
        ├── components/
        ├── context/                # Auth, Theme, Toast, Confirm
        ├── hooks/
        └── pages/
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A PostgreSQL database (local, or a hosted one such as Neon)

### Backend setup

From the project root:

```bash
npm install
```

Create a `.env` file in the project root:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME?schema=public"
JWT_SECRET="your_jwt_secret_here"
```

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run the migrations and seed the database:

```bash
npx prisma migrate dev
node src/seed.js
```

Start the server:

```bash
node src/server.js
```

The API runs on http://localhost:3000.

### Frontend setup

```bash
cd inventory-auditing-frontend
npm install
```

Create a `.env` file in the frontend folder:

```
VITE_API_URL="http://localhost:3000"
```

Start the dev server:

```bash
npm run dev
```

The app runs on http://localhost:5173.

### Demo accounts

The seeder creates these accounts (password `password123` for all). Change or
remove them before using in production.

| Role    | Email             |
| ------- | ----------------- |
| Admin   | admin@example.com |
| Staff   | juan@example.com  |
| Auditor | maria@example.com |

## Deployment

The project is deployed with:

- **Database:** Neon (serverless PostgreSQL)
- **Backend:** Render (Web Service)
- **Frontend:** Vercel

### Backend (Render)

- Root directory: repo root
- Build command: `npm install && npx prisma generate`
- Start command: `node src/server.js`
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`
  (the deployed frontend URL, used for CORS)

Run the migrations against the production database once:

```bash
npx prisma migrate deploy
```

### Frontend (Vercel)

- Root directory: `inventory-auditing-frontend`
- Framework preset: Vite
- Environment variable: `VITE_API_URL` (the deployed backend URL)
