import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { roles } from "../data/mockData";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Dispatcher");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Skeleton only — wire up to POST /api/auth/login later.
    navigate("/");
  };

  return (
    <div className="flex h-screen w-full bg-ink-950">
      {/* Left brand panel */}
      <div className="hidden w-[420px] shrink-0 flex-col justify-between p-10 lg:flex">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-amber-500" />
            <div>
              <p className="text-lg font-bold text-white">TransitOps</p>
              <p className="text-xs text-slate-500">Smart Transport Operations Platform</p>
            </div>
          </div>

          <p className="mb-3 text-sm font-semibold text-slate-300">One login, four roles:</p>
          <ul className="space-y-2 text-sm text-slate-400">
            {roles.map((r) => (
              <li key={r} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-600">
          TransitOps © 2026 · RBAC Enabled
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#F4F5F7] p-6">
        <div className="w-full max-w-sm">
          <h2 className="mb-1 text-2xl font-bold text-ink-900">Sign in to your account</h2>
          <p className="mb-8 text-sm text-slate-500">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" placeholder="raven.k@transitops.io" className="input" />
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" placeholder="••••••••" className="input" />
            </div>

            <div>
              <label className="label">Role (RBAC)</label>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1 text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                Remember me
              </label>
              <button type="button" className="font-medium text-amber-600 hover:underline">
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn-primary w-full !py-2.5">
              Sign In
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600 ring-1 ring-inset ring-red-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>Invalid credentials. Account locked after 5 failed attempts.</span>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-slate-400">
            Access is scoped by role after login — Fleet Manager → Fleet, Maintenance ·
            Dispatcher → Dashboard, Trips · Safety Officer → Drivers, Compliance ·
            Financial Analyst → Fuel &amp; Expenses, Analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
