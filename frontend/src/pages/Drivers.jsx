import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, AlertTriangle, X } from "lucide-react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { driverApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { canEdit } from "../lib/roles";

const STATUS_LABEL = { available: "Available", on_trip: "On Trip", off_duty: "Off Duty", suspended: "Suspended" };
const LICENSE_CATEGORIES = ["LMV", "HMV", "MC"];

const EMPTY_FORM = {
  name: "",
  license_number: "",
  license_category: "LMV",
  license_expiry: "",
  contact_number: "",
  safety_score: "100",
};

function formatExpiry(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function Drivers() {
  const { role } = useAuth();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rowError, setRowError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const canCreate = canEdit(role, "driver.create");
  const canUpdate = canEdit(role, "driver.update");
  const canSuspend = canEdit(role, "driver.suspend");
  const canDelete = canEdit(role, "driver.delete");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await driverApi.list({ status, search });
      setDrivers(res);
    } catch (err) {
      setError(err.message || "Failed to load drivers.");
    } finally {
      setLoading(false);
    }
  }, [status, search]);

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

  function openEdit(d) {
    setEditing(d);
    setForm({
      name: d.name,
      license_number: d.license_number,
      license_category: d.license_category,
      license_expiry: d.license_expiry ? d.license_expiry.slice(0, 10) : "",
      contact_number: d.contact_number || "",
      safety_score: d.safety_score,
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
        await driverApi.update(editing.id, form);
      } else {
        await driverApi.create(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message || "Failed to save driver.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspend(d) {
    setRowError("");
    try {
      await driverApi.suspend(d.id);
      await load();
    } catch (err) {
      setRowError(err.message || "Failed to suspend driver.");
    }
  }

  async function handleDelete(d) {
    setRowError("");
    try {
      await driverApi.remove(d.id);
      await load();
    } catch (err) {
      setRowError(err.message || "Failed to delete driver.");
    }
  }

  return (
    <Layout title="Drivers & Safety Profiles">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <input className="input w-64" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status: All</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Driver
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
          <Loader2 size={20} className="mr-2 animate-spin" /> Loading drivers…
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="th">Driver</th>
                <th className="th">License No.</th>
                <th className="th">Category</th>
                <th className="th">Expiry</th>
                <th className="th">Contact</th>
                <th className="th">Safety</th>
                <th className="th">Status</th>
                {(canUpdate || canSuspend || canDelete) && <th className="th">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="td font-medium">{d.name}</td>
                  <td className="td text-slate-500">{d.license_number}</td>
                  <td className="td text-slate-500">{d.license_category}</td>
                  <td className="td">
                    <span className={d.license_status === "expired" ? "font-semibold text-red-500" : "text-slate-500"}>
                      {formatExpiry(d.license_expiry)}
                      {d.license_status === "expired" ? " EXPIRED" : ""}
                    </span>
                  </td>
                  <td className="td text-slate-500">{d.contact_number || "—"}</td>
                  <td className="td text-slate-500">{d.safety_score}%</td>
                  <td className="td">
                    <StatusBadge status={STATUS_LABEL[d.status] || d.status} tone={d.status.replace("_", "")} />
                  </td>
                  {(canUpdate || canSuspend || canDelete) && (
                    <td className="td">
                      <div className="flex flex-wrap gap-2">
                        {canUpdate && (
                          <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => openEdit(d)}>
                            Edit
                          </button>
                        )}
                        {canSuspend && d.status !== "suspended" && (
                          <button
                            className="btn-ghost !px-2 !py-1 text-xs text-red-500"
                            onClick={() => handleSuspend(d)}
                          >
                            Suspend
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn-ghost !px-2 !py-1 text-xs text-red-500"
                            onClick={() => handleDelete(d)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={8} className="td text-center text-slate-400">
                    No drivers match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs font-medium text-red-500">
        Rule: Expired license or Suspended status → blocked from trip assignment.
      </p>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">{editing ? "Edit Driver" : "Add Driver"}</h3>
              <button className="text-slate-400 hover:text-ink-900" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitForm} className="space-y-4">
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
                  <label className="label">License No.</label>
                  <input
                    className="input"
                    required
                    disabled={!!editing}
                    value={form.license_number}
                    onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={form.license_category}
                    onChange={(e) => setForm({ ...form, license_category: e.target.value })}
                  >
                    {LICENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">License Expiry</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={form.license_expiry}
                    onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact</label>
                  <input
                    className="input"
                    value={form.contact_number}
                    onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Safety Score</label>
                  <input
                    type="number"
                    className="input"
                    value={form.safety_score}
                    onChange={(e) => setForm({ ...form, safety_score: e.target.value })}
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-200">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Driver"}
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>
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
