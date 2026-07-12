import { useEffect, useState, useCallback } from "react";
import { ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { maintenanceApi, vehicleApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { canEdit } from "../lib/roles";

const EMPTY_FORM = { vehicle_id: "", service_type: "", cost: "", notes: "" };

export default function Maintenance() {
  const { role } = useAuth();
  const canCreate = canEdit(role, "maintenance.create");
  const canClose = canEdit(role, "maintenance.close");

  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]); // full list, used to resolve names for existing logs
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await maintenanceApi.list({ status: statusFilter });
      setLogs(res);
    } catch (err) {
      setError(err.message || "Failed to load maintenance logs.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadVehicles = useCallback(async () => {
    try {
      const res = await vehicleApi.list({});
      setVehicles(res);
    } catch {
      // Non-fatal: form dropdown will just be empty.
    }
  }, []);

  // Backend blocks creating a maintenance log for a retired OR on_trip vehicle
  // (vehicle.controller: "Cannot send vehicle to maintenance while on trip"). This is
  // a separate, narrower list just for the create-form dropdown — `vehicles` itself
  // stays unfiltered so existing logs against a since-retired/on_trip vehicle can
  // still resolve a name in the table below instead of falling back to "#id".
  const eligibleVehicles = vehicles.filter((v) => v.status !== "retired" && v.status !== "on_trip");

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  async function submitForm(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await maintenanceApi.create(form);
      setForm(EMPTY_FORM);
      await loadLogs();
      await loadVehicles();
    } catch (err) {
      setFormError(err.message || "Failed to log maintenance.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(log) {
    setActionError("");
    try {
      await maintenanceApi.close(log.id);
      await loadLogs();
      await loadVehicles();
    } catch (err) {
      setActionError(err.message || "Failed to close maintenance log.");
    }
  }

  const vehicleName = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.registration_number} · ${v.name}` : `#${id}`;
  };

  return (
    <Layout title="Maintenance">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Log service form */}
        {canCreate && (
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-bold text-ink-900">Log Service Record</h3>
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="label">Vehicle</label>
                <select
                  className="input"
                  required
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                >
                  <option value="">Select vehicle…</option>
                  {eligibleVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} · {v.name} ({v.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Service Type</label>
                <input
                  className="input"
                  required
                  value={form.service_type}
                  onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Cost</label>
                <input
                  type="number"
                  className="input"
                  required
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <input
                  className="input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-200">
                  {formError}
                </div>
              )}

              <button type="submit" className="btn-primary w-full !py-2.5" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </form>

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
        )}

        {/* Service log table */}
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Service Log</h3>
            <div className="flex gap-1.5">
              {["", "open", "closed"].map((s) => (
                <button
                  key={s || "all"}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    statusFilter === s
                      ? "bg-amber-500 text-ink-950"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {s ? s[0].toUpperCase() + s.slice(1) : "All"}
                </button>
              ))}
            </div>
          </div>

          {(error || actionError) && (
            <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
              <AlertTriangle size={16} className="shrink-0" />
              {error || actionError}
            </div>
          )}

          {loading ? (
            <div className="flex h-64 items-center justify-center text-slate-400">
              <Loader2 size={20} className="mr-2 animate-spin" /> Loading logs…
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="th">Vehicle</th>
                  <th className="th">Service</th>
                  <th className="th">Cost</th>
                  <th className="th">Status</th>
                  {canClose && <th className="th">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {logs.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0">
                    <td className="td font-medium">{vehicleName(m.vehicle_id)}</td>
                    <td className="td text-slate-500">{m.service_type}</td>
                    <td className="td text-slate-500">{m.cost}</td>
                    <td className="td">
                      <StatusBadge status={m.status === "open" ? "In Shop" : "Closed"} tone={m.status === "open" ? "inshop" : "available"} />
                    </td>
                    {canClose && (
                      <td className="td">
                        {m.status === "open" && (
                          <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => handleClose(m)}>
                            Close
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="td text-center text-slate-400">
                      No maintenance logs match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
