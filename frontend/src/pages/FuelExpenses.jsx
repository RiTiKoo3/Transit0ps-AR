import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, AlertTriangle, X } from "lucide-react";
import Layout from "../components/Layout";
import { fuelApi, expenseApi, vehicleApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { canEdit } from "../lib/roles";

const EMPTY_FUEL_FORM = { vehicle_id: "", trip_id: "", liters: "", cost: "", log_date: "" };
const EMPTY_EXPENSE_FORM = { vehicle_id: "", trip_id: "", type: "", amount: "", expense_date: "" };

export default function FuelExpenses() {
  const { role } = useAuth();
  const canLogFuel = canEdit(role, "fuel.create");
  const canLogExpense = canEdit(role, "expense.create");

  const [vehicles, setVehicles] = useState([]);
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL_FORM);
  const [fuelError, setFuelError] = useState("");
  const [savingFuel, setSavingFuel] = useState(false);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM);
  const [expenseError, setExpenseError] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [f, e] = await Promise.all([
        fuelApi.list(vehicleFilter || undefined),
        expenseApi.list(vehicleFilter || undefined),
      ]);
      setFuelLogs(f);
      setExpenses(e);
    } catch (err) {
      setError(err.message || "Failed to load fuel & expense data.");
    } finally {
      setLoading(false);
    }
  }, [vehicleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    vehicleApi.list({}).then(setVehicles).catch(() => {});
  }, []);

  const vehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? v.registration_number : `#${id}`;
  };

  const [costSummary, setCostSummary] = useState(null);
  useEffect(() => {
    if (vehicleFilter) {
      vehicleApi.costSummary(vehicleFilter).then(setCostSummary).catch(() => setCostSummary(null));
    } else {
      setCostSummary(null);
    }
  }, [vehicleFilter]);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  async function submitFuel(e) {
    e.preventDefault();
    setFuelError("");
    setSavingFuel(true);
    try {
      await fuelApi.create({
        ...fuelForm,
        trip_id: fuelForm.trip_id || undefined,
        log_date: fuelForm.log_date || undefined,
      });
      setFuelModalOpen(false);
      setFuelForm(EMPTY_FUEL_FORM);
      await load();
    } catch (err) {
      setFuelError(err.message || "Failed to log fuel.");
    } finally {
      setSavingFuel(false);
    }
  }

  async function submitExpense(e) {
    e.preventDefault();
    setExpenseError("");
    setSavingExpense(true);
    try {
      await expenseApi.create({
        ...expenseForm,
        trip_id: expenseForm.trip_id || undefined,
        expense_date: expenseForm.expense_date || undefined,
      });
      setExpenseModalOpen(false);
      setExpenseForm(EMPTY_EXPENSE_FORM);
      await load();
    } catch (err) {
      setExpenseError(err.message || "Failed to record expense.");
    } finally {
      setSavingExpense(false);
    }
  }

  return (
    <Layout title="Fuel & Expense Management">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <select className="input w-56" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
          <option value="">All Vehicles</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.registration_number} · {v.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          {canLogFuel && (
            <button className="btn-primary" onClick={() => setFuelModalOpen(true)}>
              <Plus size={16} /> Log Fuel
            </button>
          )}
          {canLogExpense && (
            <button className="btn-primary" onClick={() => setExpenseModalOpen(true)}>
              <Plus size={16} /> Add Expense
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 size={20} className="mr-2 animate-spin" /> Loading…
        </div>
      ) : (
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
                {fuelLogs.map((f) => (
                  <tr key={f.id} className="border-b border-slate-50 last:border-0">
                    <td className="td font-medium">{vehicleLabel(f.vehicle_id)}</td>
                    <td className="td text-slate-500">{f.log_date ? f.log_date.slice(0, 10) : "—"}</td>
                    <td className="td text-slate-500">{f.liters} L</td>
                    <td className="td text-slate-500">{f.cost}</td>
                  </tr>
                ))}
                {fuelLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="td text-center text-slate-400">No fuel logs yet.</td>
                  </tr>
                )}
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
                  <th className="th">Vehicle</th>
                  <th className="th">Type</th>
                  <th className="th">Date</th>
                  <th className="th">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0">
                    <td className="td font-medium">{vehicleLabel(e.vehicle_id)}</td>
                    <td className="td text-slate-500">{e.type}</td>
                    <td className="td text-slate-500">{e.expense_date ? e.expense_date.slice(0, 10) : "—"}</td>
                    <td className="td font-semibold">{e.amount}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="td text-center text-slate-400">No expenses yet.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {costSummary
                  ? "Total Operational Cost (Fuel + Maintenance)"
                  : "Total Other Expenses (select a vehicle for Fuel + Maintenance)"}
              </span>
              <span className="text-lg font-bold text-amber-600">
                {costSummary ? costSummary.total_operational_cost : totalExpenseAmount}
              </span>
            </div>
          </div>
        </div>
      )}

      {fuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">Log Fuel</h3>
              <button className="text-slate-400 hover:text-ink-900" onClick={() => setFuelModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitFuel} className="space-y-4">
              <div>
                <label className="label">Vehicle</label>
                <select
                  className="input"
                  required
                  value={fuelForm.vehicle_id}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
                >
                  <option value="">Select vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registration_number} · {v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Liters</label>
                  <input
                    type="number"
                    className="input"
                    required
                    value={fuelForm.liters}
                    onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Cost</label>
                  <input
                    type="number"
                    className="input"
                    required
                    value={fuelForm.cost}
                    onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={fuelForm.log_date}
                  onChange={(e) => setFuelForm({ ...fuelForm, log_date: e.target.value })}
                />
              </div>

              {fuelError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-200">
                  {fuelError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={savingFuel}>
                  {savingFuel ? "Saving…" : "Log Fuel"}
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setFuelModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">Add Expense</h3>
              <button className="text-slate-400 hover:text-ink-900" onClick={() => setExpenseModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitExpense} className="space-y-4">
              <div>
                <label className="label">Vehicle</label>
                <select
                  className="input"
                  required
                  value={expenseForm.vehicle_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
                >
                  <option value="">Select vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registration_number} · {v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <input
                    className="input"
                    required
                    placeholder="Toll, Parking…"
                    value={expenseForm.type}
                    onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Amount</label>
                  <input
                    type="number"
                    className="input"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                />
              </div>

              {expenseError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-200">
                  {expenseError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={savingExpense}>
                  {savingExpense ? "Saving…" : "Add Expense"}
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setExpenseModalOpen(false)}>
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
