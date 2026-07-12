import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Menu, ChevronDown, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";
}

export default function Topbar({ title, onOpenMobileMenu }) {
  const { user, roleLabel, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the account dropdown on outside click.
  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onOpenMobileMenu}
          className="icon-btn -ml-1 shrink-0 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="truncate text-base font-bold text-ink-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden sm:block">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search…"
            className="w-40 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 md:w-56"
          />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-slate-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-white">
              {initials(user?.name)}
            </span>
            <span className="hidden text-sm font-medium text-ink-800 md:inline">{user?.name}</span>
            <span className="hidden h-7 items-center rounded-full bg-blue-50 px-2.5 text-xs font-semibold text-blue-600 ring-1 ring-inset ring-blue-200 lg:flex">
              {roleLabel}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-slate-400 transition-transform duration-150 ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.12 }}
                className="popover absolute right-0 top-[calc(100%+8px)] z-50 w-56 origin-top-right"
              >
                <div className="border-b border-slate-100 px-3.5 py-2.5">
                  <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  <span className="mt-1.5 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 ring-1 ring-inset ring-blue-200">
                    {roleLabel}
                  </span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-ink-700 transition hover:bg-slate-50"
                >
                  <UserRound size={15} className="text-slate-400" />
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={15} />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
