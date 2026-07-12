# TransitOps

**Smart Transport Operations Platform** — a hackathon build (8-hour timebox) that digitizes
vehicle, driver, dispatch, maintenance, and expense management for a logistics fleet, with
role-based access control enforced end-to-end.

Built to the TransitOps problem statement: replace spreadsheets/logbooks with a single
platform covering the full vehicle lifecycle — registration → dispatch → maintenance →
cost tracking → analytics — with real business-rule enforcement (not just UI validation).

## Repo structure

```
TransitOps-AR/
  Backend/     Node.js + Express + PostgreSQL API — RBAC, business rules, reports
  frontend/    React + Vite + Tailwind dashboard — consumes the Backend API
```

Each folder has its own detailed `README.md` (setup steps, endpoint list, structure,
documented assumptions). This file is the map — start here, then drill into whichever
side you need.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3, framer-motion, lucide-react |
| Backend | Node.js, Express, PostgreSQL 17 |
| Auth | JWT + bcrypt password hashing |
| Reports | Server-computed Fuel Efficiency / Operational Cost / ROI, CSV export |

## Quick start (both sides, from scratch)

1. **Database** — create a PostgreSQL 17 database (e.g. `transitops_db`), then run
   `Backend/database/schema.sql` followed by `Backend/database/seed.sql` in pgAdmin's
   Query Tool. Seed gives you 4 demo users, one vehicle, and one driver.
2. **Backend**
   ```bash
   cd Backend
   npm install
   cp .env.example .env   # fill in your Postgres password/port + JWT_SECRET
   npm run dev             # http://localhost:3000
   ```
3. **Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env   # VITE_API_URL, defaults to http://localhost:3000/api
   npm run dev             # http://localhost:5173
   ```
4. Log in with any seeded demo account (password for all: `password123`):

   | Email | Role |
   |---|---|
   | `raj@fleetflow.com` | Fleet Manager |
   | `priya@fleetflow.com` | Driver |
   | `amit@fleetflow.com` | Safety Officer |
   | `neha@fleetflow.com` | Financial Analyst |

Full endpoint list, RBAC matrix, and page-by-page details live in
[`Backend/README.md`](./Backend/README.md) and [`frontend/README.md`](./frontend/README.md).

## Roles (RBAC)

Enforced both server-side (`authorizeRoles(...)` middleware on every route — the actual
security boundary) and mirrored client-side (`frontend/src/lib/roles.js` — for UI
convenience, hiding actions a role can't perform).

| Role | Owns |
|---|---|
| Fleet Manager | Fleet assets, maintenance, vehicle lifecycle, settings |
| Driver | Trip creation/dispatch, fuel & expense logging |
| Safety Officer | Driver records, license compliance, suspensions |
| Financial Analyst | Reports, fuel/maintenance cost visibility |

## Core workflow (matches the problem statement's worked example)

Register vehicle (≤ capacity) → register driver (valid license) → create trip (draft) →
dispatch (cargo weight validated, vehicle + driver → `on_trip`) → complete (odometer +
fuel logged, both reset to `available`) → maintenance record (vehicle → `in_shop`,
removed from dispatch pool until closed) → reports recompute Fuel Efficiency, Operational
Cost, and ROI live from the underlying trip/fuel/maintenance data.

## What's implemented vs. bonus scope

**Implemented:** auth + RBAC, full CRUD on vehicles/drivers, trip lifecycle with all
mandatory business rules (cargo ≤ capacity, no double-booking, expired/suspended driver
blocking, automatic status transitions), maintenance workflow, fuel & expense tracking,
dashboard KPIs with filters, analytics (fuel efficiency / utilization / operational cost
/ ROI), CSV export, responsive UI with a slideable/collapsible sidebar.

**Not attempted (explicitly listed as bonus in the problem statement):** dark mode, PDF
export, email reminders for expiring licenses, vehicle document management.

See each subfolder's README for the full, honest list of assumptions and known gaps —
we'd rather document a tradeoff than hide it.
