# TransitOps — Frontend Skeleton

React + Vite + Tailwind skeleton for all 9 screens from the wireframe. Every
page renders with static mock data (see `src/data/mockData.js`) — no API
calls are wired up yet. Swap the mock data for `fetch`/`axios` calls to your
Express backend when you're ready.

## Screens included

| Route | Screen |
|---|---|
| `/login` | 0. Authentication (RBAC) |
| `/` | 1. Dashboard |
| `/fleet` | 2. Vehicle Registry |
| `/drivers` | 3. Drivers & Safety Profiles |
| `/trips` | 4. Trip Dispatcher |
| `/maintenance` | 5. Maintenance |
| `/fuel-expenses` | 6. Fuel & Expense Management |
| `/analytics` | 7. Reports & Analytics |
| `/settings` | 8. Settings & RBAC |

## Run it

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. `/login` isn't linked from the sidebar
(it's a standalone entry point) — visit it directly.

## Structure

```
src/
  components/    Sidebar, Topbar, Layout, StatusBadge, KpiCard
  pages/         One file per screen
  data/          mockData.js — single source of truth for placeholder data
```

## Next steps to wire up the backend

- Replace `mockData.js` reads with real API calls (React Query or plain
  `fetch` in `useEffect` both work fine for this scale).
- Add an auth context that stores the JWT from `/api/auth/login` and gates
  routes based on `req.user.role`.
- The RBAC matrix on `/settings` is currently just a display — hook it up
  to real role checks once the backend's role names are finalized.
