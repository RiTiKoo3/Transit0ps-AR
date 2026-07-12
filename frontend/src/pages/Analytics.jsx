import { Download } from "lucide-react";
import Layout from "../components/Layout";
import KpiCard from "../components/KpiCard";
import { analyticsKpis, monthlyRevenue, costliestVehicles } from "../data/mockData";

const BAR_TONE = {
  available: "bg-emerald-500",
  inshop: "bg-amber-500",
  retired: "bg-red-500",
};

export default function Analytics() {
  const maxRevenue = Math.max(...monthlyRevenue);

  return (
    <Layout title="Reports & Analytics">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input className="input w-64" placeholder="Search…" />
        <button className="btn-secondary">
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {analyticsKpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <p className="mb-5 text-xs font-medium text-slate-400">
        ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
      </p>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Monthly revenue */}
        <div className="card p-5">
          <h3 className="mb-5 text-sm font-bold text-ink-900">Monthly Revenue</h3>
          <div className="flex h-40 items-end gap-3">
            {monthlyRevenue.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-blue-500/80"
                style={{ height: `${(v / maxRevenue) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Top costliest vehicles */}
        <div className="card p-5">
          <h3 className="mb-5 text-sm font-bold text-ink-900">Top Costliest Vehicles</h3>
          <div className="space-y-4">
            {costliestVehicles.map((v) => (
              <div key={v.name}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-700">{v.name}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${BAR_TONE[v.tone] || "bg-slate-400"}`}
                    style={{ width: `${v.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
