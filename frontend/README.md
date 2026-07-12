# TransitOps Frontend

React + Vite + Tailwind frontend for the TransitOps hackathon problem statement — a
role-based fleet operations dashboard consuming the [TransitOps Backend](../Backend) API.

## Tech stack

- **React 18** + **Vite 5** — app shell and dev server
- **React Router 6** — routing, with a `ProtectedRoute` wrapper for auth + RBAC gating
- **Tailwind CSS 3** — utility-first styling, with a small custom design-token layer
  (`ink`/`amber`/`status` colors, `.card`/`.btn-*`/`.input` component classes) in
  `tailwind.config.js` / `src/index.css`
- **lucide-react** — icon set
- **framer-motion** + **clsx** — animation and conditional classNames for the
  responsive sidebar/dropdowns

No state management library — auth/session state lives in a small `AuthContext`,
everything else is local `useState`/`useEffect` per page, fetched straight from the API.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and point `VITE_API_URL` at your running backend
   (defaults to `http://localhost:3000/api`, matching the Backend's default `PORT`).
3. Make sure the [Backend](../Backend) is running and its `database/seed.sql` has been
   applied — this frontend has no mock data mode, every page hits the real API.
4. `npm run dev` → opens on `http://localhost:5173`.
5. Log in with any of the seeded demo accounts (password for all: `password123`):

   | Email | Role |
   |---|---|
   | `raj@fleetflow.com` | Fleet Manager |
   | `priya@fleetflow.com` | Driver |
   | `amit@fleetflow.com` | Safety Officer |
   | `neha@fleetflow.com` | Financial Analyst |

`npm run build` produces a production build in `dist/`; `npm run preview` serves it locally.

## Project structure

```
src/
  components/    Layout, Sidebar, Topbar, ProtectedRoute, KpiCard, StatusBadge
  context/       AuthContext — session state, login/logout
  lib/
    api.js       fetch wrapper (auth header injection, error unwrapping)
    roles.js     single source of truth for RBAC — nav visibility + canEdit() checks
  pages/         one file per route (Dashboard, VehicleRegistry, Drivers, Trips,
                 Maintenance, FuelExpenses, Analytics, Settings, Login)
```

## Role-based access control

`src/lib/roles.js` mirrors the backend's `authorizeRoles(...)` permission map so the UI
never shows an action a user isn't allowed to perform. It's intentionally kept as one
file so the two sides of the app (what the UI offers vs. what the API accepts) don't
drift apart:

- `navAccess(role)` — which sidebar items a role can see. Every read (`GET`) endpoint on
  the backend is open to all authenticated roles, so most pages are visible to everyone;
  `maintenance` and `settings` are restricted to `fleet_manager` since those are the
  only pages with write access gated end-to-end.
- `canEdit(role, "module.action")` — gates individual buttons (e.g. "+ Add Vehicle",
  "Suspend Driver") against the same role list the backend route enforces.

**This is UI convenience only, not the security boundary.** The backend independently
re-checks every role via `authorizeRoles(...)` on each route, so a user can't bypass
these checks by editing frontend state or calling the API directly.

## Pages → backend mapping

| Page | Route | Backend resource |
|---|---|---|
| Login | `/login` | `POST /api/auth/login` |
| Dashboard | `/` | `GET /api/dashboard` |
| Fleet | `/fleet` | `GET/POST/PUT /api/vehicles`, `PATCH /:id/retire` |
| Drivers | `/drivers` | `GET/POST/PUT /api/drivers`, `PATCH /:id/suspend` |
| Trips | `/trips` | `GET/POST /api/trips`, `PATCH /:id/dispatch|complete|cancel` |
| Maintenance | `/maintenance` | `GET/POST /api/maintenance`, `PATCH /:id/close` |
| Fuel & Expenses | `/fuel-expenses` | `GET/POST /api/fuel`, `GET/POST /api/expenses` |
| Analytics | `/analytics` | `GET /api/reports/fleet`, `/utilization`, `/fleet/export` (CSV) |
| Settings | `/settings` | Local only — no backend endpoint for org settings exists yet |

The RBAC matrix shown on the Settings page is generated live from `lib/roles.js`, not hand-typed, so it can never drift from what's actually enforced.

## Responsive behavior

The sidebar is a slideable drawer below the `lg` breakpoint (hamburger toggle in the
topbar, closes on navigation or backdrop tap) and a collapsible icon rail at `lg` and
above (toggle persisted to `localStorage`). Data tables scroll horizontally inside
their card on narrow viewports rather than breaking the page layout.

## Known gaps / not implemented

- No dark mode, no PDF export, no email reminders for expiring licenses — all listed
  as bonus features in the problem statement, not attempted in the 8-hour window.
- The Topbar search input is presentational only (not wired to any filtering yet).
- Settings page's "General" section (depot name, currency, distance unit) has no
  backend endpoint to persist to — documented inline in `Settings.jsx`.
