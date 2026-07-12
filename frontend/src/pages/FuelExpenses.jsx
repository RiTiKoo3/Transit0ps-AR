import { Plus } from "lucide-react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { fuelLogs, otherExpenses } from "../data/mockData";

export default function FuelExpenses() {
  return (
    <Layout title="Fuel & Expense Management">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input className="input w-64" placeholder="Search…" />
        <div className="flex gap-2">
          <button className="btn-primary">
            <Plus size={16} /> Log Fuel
          </button>
          <button className="btn-primary">
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Fuel logs */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Fuel Logs</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Vehicle</th>
                <th className="th">Date</th>
                <th className="th">Liters</th>
                <th className="th">Cost</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((f, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="td font-medium">{f.vehicle}</td>
                  <td className="td text-slate-500">{f.date}</td>
                  <td className="td text-slate-500">{f.liters}</td>
                  <td className="td text-slate-500">{f.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Other expenses */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Other Expenses (Toll / Misc)</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Trip</th>
                <th className="th">Vehicle</th>
                <th className="th">Toll</th>
                <th className="th">Other</th>
                <th className="th">Maint. (Linked)</th>
                <th className="th">Total</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {otherExpenses.map((e, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="td font-medium">{e.trip}</td>
                  <td className="td text-slate-500">{e.vehicle}</td>
                  <td className="td text-slate-500">{e.toll}</td>
                  <td className="td text-slate-500">{e.other}</td>
                  <td className="td text-slate-500">{e.maint}</td>
                  <td className="td font-semibold">{e.total}</td>
                  <td className="td">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total Operational Cost (Auto) = Fuel + Maintenance
            </span>
            <span className="text-lg font-bold text-amber-600">34,070</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
