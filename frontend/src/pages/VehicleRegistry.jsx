import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, AlertTriangle, X } from "lucide-react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { vehicleApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { canEdit } from "../lib/roles";

// Values are lowercase to match what's actually stored in the DB (see database/seed.sql —
// 'van' | 'truck' | 'pickup' | 'bus'). The `type` column is free-text with no CHECK
// constraint, but the backend's type filter does a strict `=` match, so the filter
// dropdown's values must match the stored casing exactly or every filter silently
// returns zero rows. 'mini' is included as a creatable option per the mockup even
// though no seeded vehicle currently uses it.
const TYPES = [
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
  { value: "pickup", label: "Pickup" },
  { value: "bus", label: "Bus" },
  { value: "mini", label: "Mini" },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));
function typeLabel(t) {
  return TYPE_LABEL[t] || (t ? t[0].toUpperCase() + t.slice(1) : t);
}
const STATUSES = ["available", "on_trip", "in_shop", "retired"];
const STATUS_LABEL = { available: "Available", on_trip: "On Trip", in_shop: "In Shop", retired: "Retired" };

const EMPTY_FORM = {
  registration_number: "",
  name: "",
  model: "",
  type: "van",
  max_load_capacity: "",
  odometer: "0",
  acquisition_cost: "",
  region: "",
};

export default function VehicleRegistry() {
  const { role } = useAuth();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // vehicle object or null
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState("");

  const canCreate = canEdit(role, "vehicle.create");
  const canUpdate = canEdit(role, "vehicle.update");
  const canRetire = canEdit(role, "vehicle.retire");
  const canDelete = canEdit(role, "vehicle.delete");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vehicleApi.list({ type, status, region: undefined, search });
      setVehicles(res);
    } catch (err) {
      setError(err.message || "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  }, [type, status, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(v) {
    setEditing(v);
    setForm({
      registration_number: v.registration_number,
      name: v.name,
      model: v.model || "",
      type: v.type,
      max_load_capacity: v.max_load_capacity,
      odometer: v.odometer,
      acquisition_cost: v.acquisition_cost,
      region: v.region || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editing) {
        await vehicleApi.update(editing.id, form);
      } else {
        await vehicleApi.create(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message || "Failed to save vehicle.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRetire(v) {
    setRowError("");
    try {
      await vehicleApi.retire(v.id);
      await load();
    } catch (err) {
      setRowError(err.message || "Failed to retire vehicle.");
    }
  }

  async function handleDelete(v) {
    setRowError("");
    try {
      await vehicleApi.remove(v.id);
      await load();
    } catch (err) {
      setRowError(err.message || "Failed to delete vehicle.");
    }
  }

  return (
    <Layout title="Vehicle Registry">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select className="input w-32" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Type: All</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select className="input w-32" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status: All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <input
            className="input w-48"
            placeholder="Search reg. no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Vehicle
          </button>
        )}
      </div>

      {(error || rowError) && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
          <AlertTriangle size={16} className="shrink-0" />
          {error || rowError}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 size={20} className="mr-2 animate-spin" /> Loading vehicles…
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="th">Reg. No. (Unique)</th>
                <th className="th">Name / Model</th>
                <th className="th">Type</th>
                <th className="th">Capacity</th>
                <th className="th">Odometer</th>
                <th className="th">Acq. Cost</th>
                <th className="th">Status</th>
                {(canUpdate || canRetire || canDelete) && <th className="th">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="td font-medium">{v.registration_number}</td>
                  <td className="td">
                    {v.name}
                    {v.model ? <span className="text-slate-400"> · {v.model}</span> : null}
                  </td>
                  <td className="td text-slate-500">{typeLabel(v.type)}</td>
                  <td className="td text-slate-500">{v.max_load_capacity} kg</td>
                  <td className="td text-slate-500">{v.odometer}</td>
                  <td className="td text-slate-500">{v.acquisition_cost}</td>
                  <td className="td">
                    <StatusBadge status={STATUS_LABEL[v.status] || v.status} tone={v.status.replace("_", "")} />
                  </td>
                  {(canUpdate || canRetire || canDelete) && (
                    <td className="td">
                      <div className="flex flex-wrap gap-2">
                        {canUpdate && (
                          <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => openEdit(v)}>
                            Edit
                          </button>
                        )}
                        {canRetire && v.status !== "retired" && (
                          <button
                            className="btn-ghost !px-2 !py-1 text-xs text-amber-600"
                            onClick={() => handleRetire(v)}
                          >
                            Retire
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn-ghost !px-2 !py-1 text-xs text-red-500"
                            onClick={() => handleDelete(v)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={8} className="td text-center text-slate-400">
                    No vehicles match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs font-medium text-red-500">
        Rule: Registration No. must be unique · Retired / In Shop vehicles are hidden from Trip
        Dispatcher.
      </p>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">
                {editing ? "Edit Vehicle" : "Add Vehicle"}
              </h3>
              <button className="text-slate-400 hover:text-ink-900" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Registration No.</label>
                  <input
                    className="input"
                    required
                    disabled={!!editing}
                    value={form.registration_number}
                    onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select
                    className="input"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    className="input"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Model</label>
                  <input
                    className="input"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Max Load (kg)</label>
                  <input
                    type="number"
                    className="input"
                    required
                    value={form.max_load_capacity}
                    onChange={(e) => setForm({ ...form, max_load_capacity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Odometer</label>
                  <input
                    type="number"
                    className="input"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Acq. Cost</label>
                  <input
                    type="number"
                    className="input"
                    required
                    value={form.acquisition_cost}
                    onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Region</label>
                <input
                  className="input"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                />
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-200">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Vehicle"}
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
