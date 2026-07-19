# TransitOps Backend API

> **Enterprise-Grade REST API** for the TransitOps Smart Transport Operations Platform

[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-brightgreen)](https://prisma.io)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com)

---

## Architecture

```
Clean Architecture + Domain-Driven Design + Repository Pattern
┌─────────────────────────────────────────────────┐
│  Presentation Layer  │  Routes + Controllers     │
├─────────────────────────────────────────────────┤
│  Service Layer       │  Business Logic            │
├─────────────────────────────────────────────────┤
│  Data Layer          │  Prisma ORM + PostgreSQL   │
└─────────────────────────────────────────────────┘
```

## Features

| Feature | Details |
|---|---|
| **Auth** | JWT Access (15m) + Refresh (7d) tokens, httpOnly cookies, token rotation |
| **RBAC** | 4 roles, 20+ granular permissions, enforced per-route |
| **Security** | Helmet, CORS, rate limiting, HPP, bcrypt, audit logs |
| **Validation** | Zod schemas on every request body & query |
| **Business Rules** | Cargo weight, odometer, status transitions enforced in Prisma transactions |
| **Logging** | Pino structured logging; pretty-print in dev, JSON in prod |
| **Docs** | Swagger UI at `/api/docs` |
| **Jobs** | Daily cron at 08:00 — license expiry notifications |
| **Monitoring** | `/health`, `/ready` endpoints |

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm / pnpm

### Installation

```bash
# 1. Clone and install
cd d:\TransitOps-backend
npm install

# 2. Configure environment
copy .env.example .env
# Edit .env — set DATABASE_URL and JWT secrets

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Generate Prisma client
npx prisma generate

# 5. Seed the database
npx prisma db seed

# 6. Start the development server
npm run dev
```

Server runs at **http://localhost:4000**

---

## Environment Variables

```bash
# App
NODE_ENV=development
PORT=4000
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:3000

# PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/transitops_db?schema=public"

# JWT (MUST be at least 32 chars each)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX=100             # global
AUTH_RATE_LIMIT_MAX=10         # /auth/login

# Misc
COOKIE_SECRET=your-cookie-secret-min-16-chars
LOG_LEVEL=info
LICENSE_EXPIRY_WARNING_DAYS=30
```

---

## API Documentation

Interactive Swagger UI: **http://localhost:4000/api/docs**

OpenAPI JSON: **http://localhost:4000/api/docs.json**

---

## Demo Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleet@transitops.com | Transit@123 |
| Dispatcher | dispatch@transitops.com | Transit@123 |
| Safety Officer | safety@transitops.com | Transit@123 |
| Financial Analyst | finance@transitops.com | Transit@123 |

---

## API Routes Reference

### Auth
```
POST   /api/v1/auth/login         # Login (rate limited: 10/15min)
POST   /api/v1/auth/refresh       # Refresh access token
POST   /api/v1/auth/logout        # Logout + revoke refresh token
GET    /api/v1/auth/me            # Get current user
```

### Vehicles
```
GET    /api/v1/vehicles           # List (paginated, filtered, sorted)
POST   /api/v1/vehicles           # Create
GET    /api/v1/vehicles/available # List available vehicles
GET    /api/v1/vehicles/:id       # Get by ID
PUT    /api/v1/vehicles/:id       # Update
DELETE /api/v1/vehicles/:id       # Delete
```

### Drivers
```
GET    /api/v1/drivers                    # List
POST   /api/v1/drivers                    # Create
GET    /api/v1/drivers/expiring-licenses  # Expiring within 30 days
GET    /api/v1/drivers/available          # Available drivers
GET    /api/v1/drivers/:id                # Get by ID
PUT    /api/v1/drivers/:id                # Update
DELETE /api/v1/drivers/:id                # Delete
```

### Trips
```
GET    /api/v1/trips                  # List
POST   /api/v1/trips                  # Create (draft)
GET    /api/v1/trips/:id              # Get by ID
PATCH  /api/v1/trips/:id/dispatch     # Dispatch (sets vehicle/driver on_trip)
PATCH  /api/v1/trips/:id/complete     # Complete (auto fuel log + expense)
PATCH  /api/v1/trips/:id/cancel       # Cancel (restores vehicle/driver)
DELETE /api/v1/trips/:id              # Delete (draft/cancelled only)
```

### Maintenance
```
GET    /api/v1/maintenance           # List
POST   /api/v1/maintenance           # Schedule (sets vehicle in_shop)
GET    /api/v1/maintenance/:id       # Get by ID
PATCH  /api/v1/maintenance/:id/close # Close (restores vehicle to available)
DELETE /api/v1/maintenance/:id       # Delete
```

### Fuel Logs
```
GET    /api/v1/fuel-logs             # List
POST   /api/v1/fuel-logs             # Create
DELETE /api/v1/fuel-logs/:id         # Delete
```

### Expenses
```
GET    /api/v1/expenses                    # List
POST   /api/v1/expenses                    # Create
GET    /api/v1/expenses/cost-breakdowns    # Per-vehicle cost breakdown
DELETE /api/v1/expenses/:id               # Delete
```

### Notifications
```
GET    /api/v1/notifications              # List (user-scoped)
PATCH  /api/v1/notifications/read-all     # Mark all as read
PATCH  /api/v1/notifications/:id/read     # Mark one as read
DELETE /api/v1/notifications              # Clear all
```

### Dashboard
```
GET    /api/v1/dashboard/stats            # KPIs and counts
GET    /api/v1/dashboard/recent-activity  # Recent trips + maintenance
GET    /api/v1/dashboard/fleet-health     # Expiring licenses + active maintenance
```

### Analytics
```
GET    /api/v1/analytics/monthly-trends      # Monthly trips/revenue/fuel (6m)
GET    /api/v1/analytics/vehicle-performance # Per-vehicle metrics
GET    /api/v1/analytics/driver-performance  # Per-driver metrics
GET    /api/v1/analytics/top-costly-vehicles # Sorted by total cost
GET    /api/v1/analytics/maintenance-costs   # Grouped by service type
GET    /api/v1/analytics/monthly-fuel        # Monthly fuel consumption
GET    /api/v1/analytics/monthly-expenses    # Monthly expense breakdown
GET    /api/v1/analytics/export/csv          # Download vehicle performance CSV
```

### Settings
```
GET    /api/v1/settings    # Get user settings
PUT    /api/v1/settings    # Update user settings
```

### System
```
GET    /health    # {"status":"ok"}
GET    /ready     # DB connection check
GET    /api/docs  # Swagger UI
```

---

## Business Rules Enforced

| Rule | Enforcement |
|---|---|
| Same source/destination | Zod schema refinement |
| Cargo weight ≤ max capacity | Trip service, throws 422 |
| Vehicle must be `available` to dispatch | Prisma transaction |
| Driver must have valid (non-expired) license | Trip service |
| Final odometer ≥ current odometer | Complete trip service |
| Cannot suspend driver on active trip | Driver service |
| Cannot schedule maintenance for `on_trip` vehicle | Maintenance service |
| Cannot delete vehicle with active maintenance | Vehicle service |
| Auto fuel log + expense on trip completion | Prisma transaction |
| Status restoration on trip cancellation | Prisma transaction |

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test file
npx jest tests/trips.test.ts --verbose
```

> **Note**: Tests require a running PostgreSQL instance configured in `.env.test`.
> Create the test DB: `createdb transitops_test`

### Test Coverage
| Suite | What's Tested |
|---|---|
| `auth.test.ts` | Login, token, me, logout |
| `vehicles.test.ts` | CRUD, validation, pagination |
| `trips.test.ts` | Create, dispatch, complete (transactional), cancel |
| `maintenance.test.ts` | Schedule, close, status changes |
| `rbac.test.ts` | Role-based access for each module |
| `analytics.test.ts` | All analytics endpoints + CSV export |

---

## Production Deployment

```bash
# Build
npm run build

# Start production server
NODE_ENV=production npm start
```

### Docker (optional)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

---

## Project Structure

```
d:\TransitOps-backend\
├── prisma/
│   ├── schema.prisma        # 12 models, 10 enums
│   └── seed.ts              # Demo data seeder
├── src/
│   ├── app.ts               # Express factory with all middleware
│   ├── server.ts            # Graceful startup + shutdown
│   ├── config/              # Zod env, Prisma, logger, RBAC matrix
│   ├── middleware/          # Auth, RBAC, validation, error handler, request logger
│   ├── modules/             # Feature modules (auth, vehicles, drivers, trips, ...)
│   ├── routes/index.ts      # Module router mounting
│   ├── jobs/                # node-cron scheduled jobs
│   ├── docs/swagger.ts      # OpenAPI / Swagger setup
│   ├── utils/               # JWT, password, apiResponse, pagination
│   └── types/               # Express.d.ts augmentation, DTOs
├── tests/                   # Jest + Supertest integration tests
├── .env.example
├── .env.test
├── jest.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## License

MIT © TransitOps Team
