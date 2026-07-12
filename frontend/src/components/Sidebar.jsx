import { NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
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
  ChevronsLeft,
  X,
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

/**
 * Responsive sidebar:
 *  - < lg (mobile/tablet): fixed drawer, slides in/out via `mobileOpen`, with a
 *    backdrop that closes it on tap. Closes automatically after navigating.
 *  - >= lg (desktop): static column that can collapse to an icon-only rail via
 *    `collapsed` (persisted by the parent Layout).
 *
 * Purely presentational — all routing/RBAC logic is untouched from the original.
 */
export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }) {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const visibleKeys = navAccess(role);
  const items = NAV_ITEMS.filter((item) => visibleKeys.includes(item.key));

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleNavClick = () => {
    // On mobile the drawer should close as soon as a destination is picked.
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-[1px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col bg-ink-950 text-slate-300",
          "shadow-sidebar-edge transition-transform duration-300 ease-in-out will-change-transform",
          "lg:static lg:z-auto lg:shadow-none lg:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        animate={{ width: collapsed ? 76 : 240 }}
        initial={false}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ width: 240 }}
      >
        {/* Brand */}
        <div className={clsx("flex items-center gap-2.5 px-5 py-6", collapsed && "lg:justify-center lg:px-0")}>
          <div className="h-8 w-8 shrink-0 rounded-md bg-amber-500" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-white">TransitOps</p>
              <p className="truncate text-[10px] leading-tight text-slate-500">Smart Transport Ops</p>
            </div>
          )}
          <button
            onClick={onMobileClose}
            className="icon-btn ml-auto !h-8 !w-8 text-slate-400 hover:!bg-ink-800 hover:!text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={handleNavClick}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                clsx(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  collapsed && "lg:justify-center lg:px-0",
                  isActive
                    ? "bg-ink-800 text-white ring-1 ring-inset ring-amber-500/30"
                    : "text-slate-400 hover:bg-ink-900 hover:text-slate-200"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      collapsed && "lg:hidden",
                      isActive ? "bg-amber-500" : "bg-transparent"
                    )}
                  />
                  <Icon size={16} strokeWidth={2} className="shrink-0" />
                  <span className={clsx("truncate", collapsed && "lg:hidden")}>{label}</span>

                  {/* Tooltip shown only when the desktop rail is collapsed */}
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-popover ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100 lg:block">
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden px-3 pb-1 lg:block">
          <button
            onClick={onToggleCollapse}
            className={clsx(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-ink-900 hover:text-slate-200",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft
              size={16}
              strokeWidth={2}
              className={clsx("shrink-0 transition-transform duration-200", collapsed && "rotate-180")}
            />
            {!collapsed && "Collapse"}
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            onClick={handleLogout}
            title={collapsed ? "Log out" : undefined}
            className={clsx(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-ink-900 hover:text-red-400",
              collapsed && "lg:justify-center lg:px-0"
            )}
          >
            <LogOut size={16} strokeWidth={2} className="shrink-0" />
            {!collapsed && "Log out"}
          </button>
        </div>

        {!collapsed && (
          <div className="px-5 py-5 text-[10px] text-slate-600">
            TransitOps © 2026 · RBAC Enabled
          </div>
        )}
      </motion.aside>
    </>
  );
}
