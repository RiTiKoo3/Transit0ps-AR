import Layout from "../components/Layout";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";
import { kpis, recentTrips, vehicleStatusBreakdown } from "../data/mockData";

export default function Dashboard() {
  const totalVehicles = vehicleStatusBreakdown.reduce((sum, s) => sum + s.value, 0);

  return (
    <Layout title="Dashboard">
      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <select className="input w-40">
          <option>Vehicle Type: All</option>
          <option>Van</option>
          <option>Truck</option>
          <option>Mini</option>
        </select>
        <select className="input w-32">
          <option>Status: All</option>
          <option>Available</option>
          <option>On Trip</option>
          <option>In Shop</option>
          <option>Retired</option>
        </select>
        <select className="input w-32">
          <option>Region: All</option>
        </select>
      </div>

      {/* KPI row */}
      <div className="mb-6 flex flex-wrap gap-3">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Recent trips */}
        <div className="card xl:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Recent Trips</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Trip</th>
                <th className="th">Vehicle</th>
                <th className="th">Driver</th>
                <th className="th">Status</th>
                <th className="th">ETA</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="td font-medium">{t.id}</td>
                  <td className="td text-slate-500">{t.vehicle}</td>
                  <td className="td text-slate-500">{t.driver}</td>
                  <td className="td">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="td text-slate-500">{t.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vehicle status breakdown */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-ink-900">Vehicle Status</h3>
          <div className="space-y-4">
            {vehicleStatusBreakdown.map((s) => {
              const pct = Math.round((s.value / totalVehicles) * 100);
              const barColor =
                {
                  available: "bg-emerald-500",
                  ontrip: "bg-blue-500",
                  inshop: "bg-amber-500",
                  retired: "bg-red-500",
                }[s.tone] || "bg-slate-400";

              return (
                <div key={s.status}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-700">{s.status}</span>
                    <span className="text-slate-400">{s.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
