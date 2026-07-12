import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Loader2,
  Truck,
  Route,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/roles";

const DEMO_ACCOUNTS = [
  { role: "Fleet Manager", email: "raj@fleetflow.com", icon: Truck },
  { role: "Driver", email: "priya@fleetflow.com", icon: Route },
  { role: "Safety Officer", email: "amit@fleetflow.com", icon: ShieldCheck },
  { role: "Financial Analyst", email: "neha@fleetflow.com", icon: Wallet },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Quality-of-life for demo/judging: tapping a demo account fills the form
  // instead of making someone type it out. Doesn't touch the actual login logic.
  const fillDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-950">
      {/* Left brand panel */}
      <div className="relative hidden w-[440px] shrink-0 flex-col justify-between overflow-hidden p-10 lg:flex">
        {/* Decorative glow + grid, purely visual */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500 shadow-lg shadow-amber-500/20">
              <Truck size={20} className="text-ink-950" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">TransitOps</p>
              <p className="text-xs text-slate-500">
                Smart Transport Operations Platform
              </p>
            </div>
          </div>

          <p className="mb-3 text-sm font-semibold text-slate-300">
            One login, four roles:
          </p>
          <ul className="space-y-2.5 text-sm text-slate-400">
            {Object.values(ROLES).map((r) => (
              <li key={r} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {r}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative text-[11px] leading-relaxed text-slate-600">
          TransitOps © 2026 · RBAC Enabled
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-[#F4F5F7] p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <h2 className="mb-1 text-2xl font-bold text-ink-900">
            Sign in to your account
          </h2>
          <p className="mb-8 text-sm text-slate-500">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                placeholder="raj@fleetflow.com"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-2.5 shadow-lg shadow-amber-500/20 disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600 ring-1 ring-inset ring-red-200"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Reference only — deliberately quiet so it never competes with the form above */}
          <div className="mt-8 border-t border-slate-200 pt-5">
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Demo access · password{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-500">
                password123
              </code>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map(({ role, email: demoEmail, icon: Icon }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => fillDemoAccount(demoEmail)}
                  title={demoEmail}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                >
                  <Icon size={12} className="text-slate-400" />
                  {role}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}