import Layout from "../components/Layout";
import { rbacMatrix, currentUser } from "../data/mockData";

function cellTone(value) {
  if (value === "✓") return "text-emerald-600 font-semibold";
  if (value === "View") return "text-blue-500 font-medium";
  return "text-slate-300";
}

export default function Settings() {
  return (
    <Layout title="Settings & RBAC">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
        {/* General settings */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-ink-900">General</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Depot Name</label>
              <input className="input" defaultValue={currentUser.depot} />
            </div>
            <div>
              <label className="label">Currency</label>
              <input className="input" defaultValue="INR (₹)" />
            </div>
            <div>
              <label className="label">Distance Unit</label>
              <input className="input" defaultValue="Kilometers" />
            </div>
            <button className="btn-primary w-full !py-2.5">Save Changes</button>
          </div>
        </div>

        {/* RBAC matrix */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Role-Based Access Control (RBAC)</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Role</th>
                {rbacMatrix.modules.map((m) => (
                  <th key={m} className="th text-center">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rbacMatrix.roles.map((role) => (
                <tr key={role} className="border-b border-slate-50 last:border-0">
                  <td className="td font-medium">{role}</td>
                  {rbacMatrix.grid[role].map((v, i) => (
                    <td key={i} className={`td text-center ${cellTone(v)}`}>
                      {v}
                    </td>
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
