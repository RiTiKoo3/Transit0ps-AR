import { useEffect, useState, useCallback } from "react";
import { Download, Loader2, AlertTriangle } from "lucide-react";
import Layout from "../components/Layout";
import KpiCard from "../components/KpiCard";
import { reportsApi, getToken } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { canEdit } from "../lib/roles";

const BAR_TONE = { available: "bg-emerald-500", ontrip: "bg-blue-500", inshop: "bg-amber-500", retired: "bg-red-500" };

export default function Analytics() {
  const { role } = useAuth();
  const canViewFleetReport = canEdit(role, "reports.fleet");

  const [fleetRows, setFleetRows] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requests = [reportsApi.utilization()];
      if (canViewFleetReport) requests.push(reportsApi.fleet());
      const results = await Promise.all(requests);
      setUtilization(results[0]);
      if (canViewFleetReport) setFleetRows(results[1]);
    } catch (err) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [canViewFleetReport]);

  useEffect(() => {
    load();
  }, [load]);

  const topCostliest = [...fleetRows]
    .sort((a, b) => b.operational_cost - a.operational_cost)
    .slice(0, 5);
  const maxCost = Math.max(1, ...topCostliest.map((v) => v.operational_cost));

  const avgFuelEfficiency = fleetRows.length
    ? (fleetRows.reduce((s, v) => s + v.fuel_efficiency, 0) / fleetRows.length).toFixed(1)
    : "—";
  const totalOperationalCost = fleetRows.reduce((s, v) => s + v.operational_cost, 0);
  const avgRoi = fleetRows.length
    ? ((fleetRows.reduce((s, v) => s + v.roi, 0) / fleetRows.length) * 100).toFixed(1)
    : "—";

  const kpis = [
    { label: "Fuel Efficiency", value: avgFuelEfficiency === "—" ? "—" : `${avgFuelEfficiency} km/l`, tone: "available" },
    { label: "Fleet Utilization", value: utilization ? `${utilization.fleet_utilization_percent}%` : "—", tone: "ontrip" },
    { label: "Operational Cost", value: fleetRows.length ? totalOperationalCost.toLocaleString() : "—", tone: "inshop" },
    { label: "Avg. Vehicle ROI", value: avgRoi === "—" ? "—" : `${avgRoi}%`, tone: "available" },
  ];

  async function handleExport() {
    setExportError("");
    setExporting(true);
    try {
      const res = await fetch(reportsApi.exportCsvUrl(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Export failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transitops_fleet_report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message || "Failed to export CSV.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Layout title="Reports & Analytics">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div />
        {canViewFleetReport && (
          <button className="btn-secondary" onClick={handleExport} disabled={exporting}>
            <Download size={15} /> {exporting ? "Exporting…" : "Export CSV"}
          </button>
        )}
      </div>

      {(error || exportError) && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
          <AlertTriangle size={16} className="shrink-0" />
          {error || exportError}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 size={20} className="mr-2 animate-spin" /> Loading reports…
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            {kpis.map((k) => (
              <KpiCard key={k.label} {...k} />
            ))}
          </div>

          <p className="mb-5 text-xs font-medium text-slate-400">
            ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
          </p>

          {canViewFleetReport ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {/* Fleet metrics table */}
              <div className="card overflow-hidden xl:col-span-2">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-sm font-bold text-ink-900">Per-Vehicle Metrics</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="th">Vehicle</th>
                      <th className="th">Distance</th>
                      <th className="th">Fuel Eff.</th>
                      <th className="th">Op. Cost</th>
                      <th className="th">Revenue</th>
                      <th className="th">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleetRows.map((r) => (
                      <tr key={r.vehicle_id} className="border-b border-slate-50 last:border-0">
                        <td className="td font-medium">{r.registration_number} · {r.name}</td>
                        <td className="td text-slate-500">{r.total_distance} km</td>
                        <td className="td text-slate-500">{r.fuel_efficiency} km/l</td>
                        <td className="td text-slate-500">{r.operational_cost}</td>
                        <td className="td text-slate-500">{r.total_revenue}</td>
                        <td className={`td font-semibold ${r.roi >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {(r.roi * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    {fleetRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="td text-center text-slate-400">No vehicle data yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Top costliest vehicles */}
              <div className="card p-5 xl:col-span-2">
                <h3 className="mb-5 text-sm font-bold text-ink-900">Top Costliest Vehicles</h3>
                <div className="space-y-4">
                  {topCostliest.map((v) => (
                    <div key={v.vehicle_id}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-ink-700">{v.registration_number} · {v.name}</span>
                        <span className="text-slate-400">{v.operational_cost}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${BAR_TONE[v.status.replace("_", "")] || "bg-blue-500"}`}
                          style={{ width: `${(v.operational_cost / maxCost) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {topCostliest.length === 0 && (
                    <p className="text-sm text-slate-400">No cost data yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Detailed per-vehicle fleet metrics are visible to Fleet Managers and Financial Analysts.
            </p>
          )}
        </>
      )}
    </Layout>
  );
}
