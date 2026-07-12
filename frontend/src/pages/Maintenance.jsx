import { ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { maintenanceLogs } from "../data/mockData";

export default function Maintenance() {
  return (
    <Layout title="Maintenance">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Log service form */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-ink-900">Log Service Record</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Vehicle</label>
              <select className="input">
                <option>VAN-05</option>
              </select>
            </div>
            <div>
              <label className="label">Service Type</label>
              <input className="input" defaultValue="Oil Change" />
            </div>
            <div>
              <label className="label">Cost</label>
              <input className="input" defaultValue="2,500" />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" defaultValue="07/07/2026" />
            </div>
            <div>
              <label className="label">Status</label>
              <input className="input" defaultValue="Active" disabled />
            </div>
            <button className="btn-primary w-full !py-2.5">Save</button>
          </div>

          <div className="mt-8 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <StatusBadge status="Available" tone="available" />
              <ArrowRight size={14} className="text-slate-300" />
              <StatusBadge status="In Shop" tone="inshop" />
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status="In Shop" tone="inshop" />
              <ArrowRight size={14} className="text-slate-300" />
              <StatusBadge status="Available" tone="available" />
            </div>
          </div>

          <p className="mt-5 text-xs font-medium text-red-500">
            Note: In Shop vehicles are removed from the dispatch pool.
          </p>
        </div>

        {/* Service log table */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Service Log</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Vehicle</th>
                <th className="th">Service</th>
                <th className="th">Cost</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.map((m, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="td font-medium">{m.vehicle}</td>
                  <td className="td text-slate-500">{m.service}</td>
                  <td className="td text-slate-500">{m.cost}</td>
                  <td className="td">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
