import { useEffect, useState, useCallback } from "react";
import { Loader2, AlertTriangle, X } from "lucide-react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { tripApi, vehicleApi, driverApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { canEdit } from "../lib/roles";

const LIFECYCLE_LABEL = { draft: "Draft", dispatched: "Dispatched", completed: "Completed", cancelled: "Cancelled" };

// Compact per-trip lifecycle progress strip (Draft -> Dispatched -> Completed/Cancelled).
// Trips are rendered as a list rather than a single selected-trip detail view, so this
// replaces the old mock's full-width stepper with a small inline one per card instead.
// `hasStartTime` (trips.start_time is set the moment a trip is dispatched) lets a
// cancelled trip correctly show whether it was cancelled from Draft or from Dispatched.
function TripStepper({ status, hasStartTime }) {
  const reachedDispatch = hasStartTime || status === "dispatched" || status === "completed";
  const isCancelled = status === "cancelled";
  const steps = [
    { key: "draft", label: "Draft", done: true },
    { key: "dispatched", label: "Dispatched", done: reachedDispatch },
    { key: "final", label: isCancelled ? "Cancelled" : "Completed", done: status === "completed" || isCancelled, isCancelled },
  ];
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              s.done ? (s.isCancelled ? "bg-red-500" : "bg-emerald-500") : "bg-slate-200"
            }`}
          />
          <span
            className={`text-[10px] font-medium ${
              s.done ? (s.isCancelled ? "text-red-500" : "text-ink-700") : "text-slate-300"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="mx-0.5 h-px w-3 bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}
const STATUS_TABS = ["", "draft", "dispatched", "completed", "cancelled"];

const EMPTY_TRIP_FORM = {
  source: "",
  destination: "",
  vehicle_id: "",
  driver_id: "",
  cargo_weight: "",
  planned_distance: "",
};

const EMPTY_COMPLETE_FORM = {
  final_odometer: "",
  actual_distance: "",
  fuel_liters: "",
  fuel_cost: "",
  revenue: "",
};

export default function Trips() {
  const { role } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [dispatchableVehicles, setDispatchableVehicles] = useState([]);
  const [dispatchableDrivers, setDispatchableDrivers] = useState([]);

  const [form, setForm] = useState(EMPTY_TRIP_FORM);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const [completingTrip, setCompletingTrip] = useState(null);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE_FORM);
  const [completeError, setCompleteError] = useState("");
  const [completing, setCompleting] = useState(false);

  const canCreate = canEdit(role, "trip.create");
  const canDispatch = canEdit(role, "trip.dispatch");
  const canComplete = canEdit(role, "trip.complete");
  const canCancel = canEdit(role, "trip.cancel");

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await tripApi.list({ status: statusFilter });
      setTrips(res);
    } catch (err) {
      setError(err.message || "Failed to load trips.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadOptions = useCallback(async () => {
    try {
      const [v, d] = await Promise.all([vehicleApi.dispatchable(), driverApi.dispatchable()]);
      setDispatchableVehicles(v);
      setDispatchableDrivers(d);
    } catch {
      // Options failing to load shouldn't block viewing trips; the create form will just be empty.
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const selectedVehicle = dispatchableVehicles.find((v) => String(v.id) === String(form.vehicle_id));
  const cargoOverCapacity =
    selectedVehicle && form.cargo_weight
      ? Number(form.cargo_weight) > Number(selectedVehicle.max_load_capacity)
      : false;

  async function submitCreate(e) {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      await tripApi.create(form);
      setForm(EMPTY_TRIP_FORM);
      await loadTrips();
      await loadOptions();
    } catch (err) {
      setFormError(err.message || "Failed to create trip.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDispatch(trip) {
    setActionError("");
    try {
      await tripApi.dispatch(trip.id);
      await loadTrips();
      await loadOptions();
    } catch (err) {
      setActionError(err.message || "Failed to dispatch trip.");
    }
  }

  async function handleCancel(trip) {
    setActionError("");
    try {
      await tripApi.cancel(trip.id);
      await loadTrips();
      await loadOptions();
    } catch (err) {
      setActionError(err.message || "Failed to cancel trip.");
    }
  }

  function openComplete(trip) {
    setCompletingTrip(trip);
    setCompleteForm({
      final_odometer: "",
      actual_distance: trip.planned_distance || "",
      fuel_liters: "",
      fuel_cost: "",
      revenue: "",
    });
    setCompleteError("");
  }

  async function submitComplete(e) {
    e.preventDefault();
    setCompleteError("");
    setCompleting(true);
    try {
      await tripApi.complete(completingTrip.id, completeForm);
      setCompletingTrip(null);
      await loadTrips();
      await loadOptions();
    } catch (err) {
      setCompleteError(err.message || "Failed to complete trip.");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <Layout title="Trip Dispatcher">
      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
          <AlertTriangle size={16} className="shrink-0" />
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Create trip form */}
        {canCreate && (
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-bold text-ink-900">Create Trip</h3>
            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="label">Source</label>
                <input
                  className="input"
                  required
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Destination</label>
                <input
                  className="input"
                  required
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Vehicle (Available only)</label>
                <select
                  className="input"
                  required
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                >
                  <option value="">Select vehicle…</option>
                  {dispatchableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} · {v.name} · {v.max_load_capacity} kg capacity
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Driver (Available only)</label>
                <select
                  className="input"
                  required
                  value={form.driver_id}
                  onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                >
                  <option value="">Select driver…</option>
                  {dispatchableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    className="input"
                    required
                    value={form.cargo_weight}
                    onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Planned Distance (km)</label>
                  <input
                    type="number"
                    className="input"
                    required
                    value={form.planned_distance}
                    onChange={(e) => setForm({ ...form, planned_distance: e.target.value })}
                  />
                </div>
              </div>

              {cargoOverCapacity && (
                <div className="rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600 ring-1 ring-inset ring-red-200">
                  <p>Vehicle Capacity: {selectedVehicle.max_load_capacity} kg</p>
                  <p>Cargo Weight: {form.cargo_weight} kg</p>
                  <p className="mt-1 font-semibold">
                    ✕ Capacity exceeded by {form.cargo_weight - selectedVehicle.max_load_capacity} kg
                  </p>
                </div>
              )}

              {formError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-200">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                disabled={creating || cargoOverCapacity}
              >
                {creating ? "Creating…" : "Create Trip (as Draft)"}
              </button>
              <p className="text-xs text-slate-400">
                A vehicle/driver already On Trip can still be planned here for later — dispatch will
                reject it if they're still busy at that time.
              </p>
            </form>
          </div>
        )}

        {/* Trips list */}
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-ink-900">Trips</h3>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_TABS.map((s) => (
                <button
                  key={s || "all"}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    statusFilter === s
                      ? "bg-amber-500 text-ink-950"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {s ? LIFECYCLE_LABEL[s] : "All"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center text-slate-400">
              <Loader2 size={20} className="mr-2 animate-spin" /> Loading trips…
            </div>
          ) : (
            <div className="max-h-[600px] space-y-3 overflow-y-auto p-4">
              {trips.map((t) => (
                <div key={t.id} className="rounded-lg border border-slate-100 p-3.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-900">
                      TR{String(t.id).padStart(3, "0")}
                    </span>
                    <StatusBadge status={LIFECYCLE_LABEL[t.status]} tone={t.status} />
                  </div>
                  <TripStepper status={t.status} hasStartTime={!!t.start_time} />
                  <p className="mb-2 text-sm text-slate-500">
                    {t.source} → {t.destination}
                  </p>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{t.vehicle_name} · {t.registration_number}</span>
                    <span>{t.driver_name}</span>
                  </div>
                  {(canDispatch || canComplete || canCancel) && (
                    <div className="flex gap-2 pt-1">
                      {canDispatch && t.status === "draft" && (
                        <button className="btn-secondary !py-1 !px-2.5 text-xs" onClick={() => handleDispatch(t)}>
                          Dispatch
                        </button>
                      )}
                      {canComplete && t.status === "dispatched" && (
                        <button className="btn-secondary !py-1 !px-2.5 text-xs" onClick={() => openComplete(t)}>
                          Complete
                        </button>
                      )}
                      {canCancel && ["draft", "dispatched"].includes(t.status) && (
                        <button
                          className="btn-ghost !py-1 !px-2.5 text-xs text-red-500"
                          onClick={() => handleCancel(t)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {trips.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">
                  No trips match the current filter.
                </div>
              )}
            </div>
          )}

          <p className="border-t border-slate-100 px-5 py-3 text-xs font-medium text-blue-500">
            On Complete: odometer + fuel log → expenses → Vehicle &amp; Driver set Available.
          </p>
        </div>
      </div>

      {completingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">
                Complete TR{String(completingTrip.id).padStart(3, "0")}
              </h3>
              <button className="text-slate-400 hover:text-ink-900" onClick={() => setCompletingTrip(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitComplete} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Final Odometer</label>
                  <input
                    type="number"
                    className="input"
                    value={completeForm.final_odometer}
                    onChange={(e) => setCompleteForm({ ...completeForm, final_odometer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Actual Distance (km)</label>
                  <input
                    type="number"
                    className="input"
                    value={completeForm.actual_distance}
                    onChange={(e) => setCompleteForm({ ...completeForm, actual_distance: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fuel (Liters)</label>
                  <input
                    type="number"
                    className="input"
                    value={completeForm.fuel_liters}
                    onChange={(e) => setCompleteForm({ ...completeForm, fuel_liters: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Fuel Cost</label>
                  <input
                    type="number"
                    className="input"
                    value={completeForm.fuel_cost}
                    onChange={(e) => setCompleteForm({ ...completeForm, fuel_cost: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Revenue</label>
                <input
                  type="number"
                  className="input"
                  value={completeForm.revenue}
                  onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })}
                />
              </div>

              {completeError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-200">
                  {completeError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={completing}>
                  {completing ? "Saving…" : "Complete Trip"}
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setCompletingTrip(null)}
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
