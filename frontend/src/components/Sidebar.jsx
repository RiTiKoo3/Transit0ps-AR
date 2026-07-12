import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/fleet", label: "Fleet", icon: Truck },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/trips", label: "Trips", icon: Route },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/fuel-expenses", label: "Fuel & Expenses", icon: Fuel },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-ink-950 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="h-8 w-8 rounded-md bg-amber-500" />
        <div>
          <p className="text-sm font-bold leading-tight text-white">TransitOps</p>
          <p className="text-[10px] leading-tight text-slate-500">Smart Transport Ops</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-ink-800 text-white ring-1 ring-inset ring-amber-500/30"
                  : "text-slate-400 hover:bg-ink-900 hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isActive ? "bg-amber-500" : "bg-transparent"
                  }`}
                />
                <Icon size={16} strokeWidth={2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-5 text-[10px] text-slate-600">
        TransitOps © 2026 · RBAC Enabled
      </div>
    </aside>
  );
}
