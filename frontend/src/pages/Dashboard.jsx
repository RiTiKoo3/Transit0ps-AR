import { useEffect, useState, useCallback } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import Layout from "../components/Layout";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";
import { dashboardApi, vehicleApi } from "../lib/api";

// Values are lowercase to match what's stored in vehicles.type (see database/seed.sql).
// The backend's dashboard filter does a strict `v.type = $1` match, so these must line
// up with the stored casing exactly.
const VEHICLE_TYPES = [
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
  { value: "pickup", label: "Pickup" },
  { value: "bus", label: "Bus" },
  { value: "mini", label: "Mini" },
];
const TRIP_STATUSES = ["draft", "dispatched", "completed", "cancelled"];

const KPI_META = [
  { key: "activeVehicles", label: "Active Vehicles", tone: "ontrip" },
  { key: "availableVehicles", label: "Available Vehicles", tone: "available" },
  { key: "vehiclesInMaintenance", label: "Vehicles In Maintenance", tone: "inshop" },
  { key: "activeTrips", label: "Active Trips", tone: "ontrip" },
  { key: "pendingTrips", label: "Pending Trips", tone: "draft" },
  { key: "driversOnDuty", label: "Drivers On Duty", tone: "offduty" },
  { key: "fleetUtilization", label: "Fleet Utilization", tone: "available", suffix: "%" },
];

export default function Dashboard() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardApi.get({ type, status, region });
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [type, status, region]);

  useEffect(() => {
    load();
  }, [load]);

  // The dashboard's trip rows don't carry a `region` field (it lives on vehicles, not
  // trips), so the region filter's option list has to come from the vehicle registry
  // instead — the `region` query param itself is still applied against v.region on the
  // backend and works fine once selected.
  useEffect(() => {
    vehicleApi
      .list({})
      .then((vehicles) => {
        setRegions([...new Set(vehicles.map((v) => v.region).filter(Boolean))].sort());
      })
      .catch(() => {});
  }, []);

  return (
    <Layout title="Dashboard">
      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <select className="input w-40" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Vehicle Type: All</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Trip Status: All</option>
          {TRIP_STATUSES.map((s) => (
            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select className="input w-32" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Region: All</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 size={20} className="mr-2 animate-spin" /> Loading dashboard…
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="mb-6 flex flex-wrap gap-3">
            {KPI_META.map((k) => (
              <KpiCard
                key={k.key}
                label={k.label}
                tone={k.tone}
                value={
                  data?.kpis?.[k.key] !== undefined
                    ? `${data.kpis[k.key]}${k.suffix || ""}`
                    : "—"
                }
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {/* Recent trips */}
            <div className="card xl:col-span-2">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-bold text-ink-900">Recent Trips</h3>
              </div>
              {data?.trips?.length ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="th">Trip</th>
                      <th className="th">Vehicle</th>
                      <th className="th">Driver</th>
                      <th className="th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trips.map((t) => (
                      <tr key={t.trip_id} className="border-b border-slate-50 last:border-0">
                        <td className="td font-medium">TR{String(t.trip_id).padStart(3, "0")}</td>
                        <td className="td text-slate-500">
                          {t.vehicle_name} <span className="text-slate-300">·</span> {t.registration_number}
                        </td>
                        <td className="td text-slate-500">{t.driver_name}</td>
                        <td className="td">
                          <StatusBadge status={t.trip_status} tone={t.trip_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  No trips match the current filters.
                </div>
              )}
            </div>

            {/* Utilization summary */}
            <div className="card p-5">
              <h3 className="mb-4 text-sm font-bold text-ink-900">Fleet Snapshot</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Available</span>
                  <span className="font-semibold text-ink-900">{data?.kpis?.availableVehicles ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">In Maintenance</span>
                  <span className="font-semibold text-ink-900">{data?.kpis?.vehiclesInMaintenance ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Active Trips</span>
                  <span className="font-semibold text-ink-900">{data?.kpis?.activeTrips ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fleet Utilization</span>
                  <span className="font-semibold text-ink-900">{data?.kpis?.fleetUtilization ?? "—"}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${data?.kpis?.fleetUtilization || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
