import { Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title }) {
  const { user, roleLabel } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
      <h1 className="text-base font-bold text-ink-900">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search…"
            className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-800">{user?.name}</span>
          <span className="flex h-7 items-center rounded-full bg-blue-50 px-2.5 text-xs font-semibold text-blue-600 ring-1 ring-inset ring-blue-200">
            {roleLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
