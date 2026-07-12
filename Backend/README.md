# TransitOps Backend

Node.js + Express + PostgreSQL backend for the TransitOps hackathon problem statement.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your real PostgreSQL 17 password/port (check pgAdmin → right-click PostgreSQL 17 → Properties → Connection).
3. In pgAdmin, open a Query Tool on your `transitops_db` database and run `database/schema.sql`.
4. (Optional but recommended) Run `database/seed.sql` in the same Query Tool to get 4 test users, one vehicle, and one driver matching the PDF's own worked example.
5. `npm run dev` to start the server with nodemon.
6. Test login: `POST /api/auth/login` with `{ "email": "raj@fleetflow.com", "password": "password123" }`.

## Role model

The PDF names four target users (section 2). The `users.role` column enforces exactly these four values:

| Role value | PDF description |
|---|---|
| `fleet_manager` | Oversees fleet assets, maintenance, vehicle lifecycle |
| `driver` | Creates trips, assigns vehicles and drivers, monitors deliveries |
| `safety_officer` | Ensures driver compliance, license validity, safety scores |
| `financial_analyst` | Reviews expenses, fuel, maintenance costs, profitability |

Route-level role assignments are a judgment call where the PDF doesn't explicitly say who can do what — documented inline as comments in each `*.routes.js` file. If your team wants different permissions, they're all one-line changes in `authorizeRoles(...)`.

## Endpoints

### Auth (`/api/auth`)
- `POST /register` — create a user (name, email, password, role)
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`

### Vehicles (`/api/vehicles`) — requires auth
- `POST /` — create (fleet_manager)
- `GET /?type=&status=&search=` — list, with filters
- `GET /dispatchable` — only vehicles with status = available
- `GET /:id/cost-summary` — total fuel + maintenance cost for one vehicle
- `PUT /:id` — update (fleet_manager)
- `PATCH /:id/retire` — retire (fleet_manager)

### Drivers (`/api/drivers`) — requires auth
- `POST /` — create (safety_officer, fleet_manager)
- `GET /?status=&search=` — list, includes computed `license_status`
- `GET /dispatchable` — only status=available AND license not expired
- `PUT /:id` — update (safety_officer, fleet_manager)
- `PATCH /:id/suspend` — (safety_officer)

### Trips (`/api/trips`) — requires auth
Lifecycle: **Draft → Dispatched → Completed / Cancelled**
- `POST /` — create as draft (driver, fleet_manager). Validates cargo ≤ vehicle capacity.
- `PATCH /:id/dispatch` — draft → dispatched. Re-validates vehicle/driver availability + license expiry, flips both to `on_trip`.
- `PATCH /:id/complete` — dispatched → completed. Accepts `final_odometer`, `actual_distance`, `fuel_liters`, `fuel_cost`, `revenue`. Resets vehicle/driver to `available`.
- `PATCH /:id/cancel` — draft or dispatched → cancelled. Restores vehicle/driver to `available` if it was dispatched.
- `GET /?status=` — list with vehicle/driver names joined in.

### Maintenance (`/api/maintenance`) — requires auth
- `POST /` — create log, auto-flips vehicle to `in_shop` (fleet_manager)
- `PATCH /:id/close` — closes log, restores vehicle to `available` unless retired (fleet_manager)
- `GET /?status=&vehicle_id=`

### Fuel (`/api/fuel`) — requires auth
- `POST /` — log fuel (driver, fleet_manager)
- `GET /?vehicle_id=`

### Expenses (`/api/expenses`) — requires auth
- `POST /` — log expense (driver, fleet_manager)
- `GET /?vehicle_id=`

### Dashboard (`/api/dashboard`) — requires auth (previously did NOT — this was a bug, now fixed)
- `GET /?type=&status=` — all 7 required KPIs + a filtered trip table

### Reports (`/api/reports`) — requires auth
- `GET /fleet` — per-vehicle Fuel Efficiency, Operational Cost, ROI (financial_analyst, fleet_manager)
- `GET /utilization` — fleet-wide utilization %
- `GET /fleet/export` — same as `/fleet` but returned as a downloadable CSV file

## Assumptions worth double-checking against your judges

- **`revenue` lives on `trips`.** The PDF's ROI formula needs a revenue figure but never says where it's entered — putting it on the trip (added at completion time) was the most natural fit.
- **Fuel Efficiency and ROI only count `completed` trips.** Draft/cancelled trips have no real distance/revenue, so they're excluded from the aggregates.
- **"Drivers On Duty" (dashboard KPI)** is interpreted as `status IN ('available', 'on_trip')` — i.e. anyone not off-duty or suspended. Not explicit in the PDF; easy to change in `dashboard.controller.js` if your team means something narrower.
- **Not built (documented gaps, not silently skipped):** PDF export, email reminders for expiring licenses, vehicle document management — all listed as bonus features (PDF section 8), left for after the mandatory deliverables if time allows.
