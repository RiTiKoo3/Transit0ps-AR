import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../lib/roles";

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
            {Object.values(ROLES).map((r) => (
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

            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5 disabled:opacity-60">
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
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600 ring-1 ring-inset ring-red-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="mt-6 text-xs leading-relaxed text-slate-400">
            Role is assigned by your account and returned by the server — no need to
            select it manually. Demo logins (password: <code>password123</code>):
            raj@fleetflow.com (Fleet Manager), priya@fleetflow.com (Driver),
            amit@fleetflow.com (Safety Officer), neha@fleetflow.com (Financial Analyst).
          </p>
        </div>
      </div>
    </div>
  );
}
