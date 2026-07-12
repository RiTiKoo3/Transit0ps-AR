import { useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { ROLES, getPermissions } from "../lib/roles";

// Groups the flat "module.action" PERMISSIONS map into one row per module,
// deriving each role's access from the actual allowed-roles list rather than
// a hand-maintained matrix, so this view can never drift from what's enforced.
function buildMatrix() {
  const permissions = getPermissions();
  const roles = Object.keys(ROLES);
  const modules = {};

  Object.entries(permissions).forEach(([key, allowedRoles]) => {
    const [module] = key.split(".");
    if (!modules[module]) modules[module] = new Set();
    allowedRoles.forEach((r) => modules[module].add(r));
  });

  const moduleNames = Object.keys(modules);
  const grid = {};
  roles.forEach((role) => {
    grid[role] = moduleNames.map((m) => (modules[m].has(role) ? "✓" : "—"));
  });

  return { modules: moduleNames, roles, grid };
}

function cellTone(value) {
  if (value === "✓") return "text-emerald-600 font-semibold";
  return "text-slate-300";
}

export default function Settings() {
  const { roleLabel } = useAuth();
  const matrix = buildMatrix();

  const [depotName, setDepotName] = useState("Gandhinagar Depot");
  const [currency, setCurrency] = useState("INR (₹)");
  const [distanceUnit, setDistanceUnit] = useState("Kilometers");

  return (
    <Layout title="Settings & RBAC">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
        {/* General settings — no backend endpoint exists for org-wide settings, kept local */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-ink-900">General</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Depot Name</label>
              <input className="input" value={depotName} onChange={(e) => setDepotName(e.target.value)} />
            </div>
            <div>
              <label className="label">Currency</label>
              <input className="input" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <div>
              <label className="label">Distance Unit</label>
              <input className="input" value={distanceUnit} onChange={(e) => setDistanceUnit(e.target.value)} />
            </div>
            <p className="text-xs text-slate-400">
              Signed in as <span className="font-semibold text-ink-700">{roleLabel}</span>. These
              fields are illustrative — there's no backend endpoint for org-wide settings yet.
            </p>
            <button className="btn-primary w-full !py-2.5">Save Changes</button>
          </div>
        </div>

        {/* RBAC matrix — generated live from src/lib/roles.js PERMISSIONS map */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Role-Based Access Control (RBAC)</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Role</th>
                {matrix.modules.map((m) => (
                  <th key={m} className="th text-center capitalize">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.roles.map((role) => (
                <tr key={role} className="border-b border-slate-50 last:border-0">
                  <td className="td font-medium">{ROLES[role]}</td>
                  {matrix.grid[role].map((v, i) => (
                    <td key={i} className={`td text-center ${cellTone(v)}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
