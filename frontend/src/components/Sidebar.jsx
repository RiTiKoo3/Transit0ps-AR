import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { navAccess } from "../lib/roles";

const NAV_ITEMS = [
  { key: "dashboard", to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { key: "fleet", to: "/fleet", label: "Fleet", icon: Truck },
  { key: "drivers", to: "/drivers", label: "Drivers", icon: Users },
  { key: "trips", to: "/trips", label: "Trips", icon: Route },
  { key: "maintenance", to: "/maintenance", label: "Maintenance", icon: Wrench },
  { key: "fuel-expenses", to: "/fuel-expenses", label: "Fuel & Expenses", icon: Fuel },
  { key: "analytics", to: "/analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const visibleKeys = navAccess(role);
  const items = NAV_ITEMS.filter((item) => visibleKeys.includes(item.key));

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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
        {items.map(({ to, label, icon: Icon, end }) => (
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

      <div className="px-3 pb-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-ink-900 hover:text-red-400"
        >
          <LogOut size={16} strokeWidth={2} />
          Log out
        </button>
      </div>

      <div className="px-5 py-5 text-[10px] text-slate-600">
        TransitOps © 2026 · RBAC Enabled
      </div>
    </aside>
  );
}
