# TransitOps Backend

Smart Transport Operations Platform Backend built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (Locally installed, no Docker)

## Installation & Setup

1. **Install PostgreSQL** (if not already installed)
   - **macOS:** `brew install postgresql`
   - **Linux/WSL:** `sudo apt install postgresql`
   - **Windows:** Download the native installer from [postgresql.org](https://www.postgresql.org/download/)

2. **Start the Postgres Service**
   - Ensure the service is running. On Windows, it usually runs automatically after installation.

3. **Create the Database**
   - Open `psql` or pgAdmin and run:
     ```sql
     CREATE DATABASE transitops;
     ```

4. **Environment Variables**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update `DATABASE_URL` in `.env` with your Postgres credentials. Ensure any special characters (like `@`) in your password are URL-encoded (e.g., `%40`).
     ```
     DATABASE_URL="postgresql://<user>:<password>@127.0.0.1:5432/transitops?schema=public"
     ```

5. **Install Dependencies**
   ```bash
   npm install
   ```

6. **Database Migration & Seeding**
   - Push the schema to the database:
     ```bash
     npm run prisma:push
     ```
   - Seed the database with demo data:
     ```bash
     npm run prisma:seed
     ```

## Running the Application

- **Development Server:**
  ```bash
  npm run dev
  ```
- **Production Build:**
  ```bash
  npm run build
  npm start
  ```

## API Documentation
Once the server is running, visit the Swagger UI at:
http://localhost:5000/api/docs

## Running Tests
Tests are written with Jest and Supertest.
```bash
npm test
```

## Demo Credentials
The `prisma:seed` command creates the following users (Password for all: `password123`):
- Fleet Manager: `fleetmanager@transitops.in`
- Dispatcher: `dispatcher@transitops.in`
- Safety Officer: `safety@transitops.in`
- Financial Analyst: `finance@transitops.in`

## Notes on Assumptions
- **Monthly Revenue Time Series:** The monthly revenue calculation in `/api/analytics/monthly-revenue` assumes revenue is derived from completed trips by multiplying the trip's `plannedDistanceKm` by a configurable `ratePerKm` setting (default: 10 INR/km).
- **Vehicle ROI:** Vehicle ROI is calculated as `(revenue - operationalCost) / acquisitionCost`. `revenue` uses the static `Vehicle.revenue` field which can be updated externally.
