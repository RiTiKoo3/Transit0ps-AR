import { useState } from "react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { liveBoard } from "../data/mockData";

const LIFECYCLE = ["Draft", "Dispatched", "Completed", "Cancelled"];

export default function Trips() {
  const [stage] = useState(1); // index into LIFECYCLE — Dispatched, per mockup
  const [cargoWeight] = useState(700);
  const capacity = 500;
  const overCapacity = cargoWeight > capacity;

  return (
    <Layout title="Trip Dispatcher">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Create trip form */}
        <div className="card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Trip Lifecycle
          </p>
          <div className="mb-6 flex items-center">
            {LIFECYCLE.map((step, i) => (
              <div key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      i <= stage ? "bg-blue-500" : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium ${
                      i === stage ? "text-ink-900" : "text-slate-400"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <div className={`mx-1 h-px flex-1 ${i < stage ? "bg-blue-500" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>

          <h3 className="mb-4 text-sm font-bold text-ink-900">Create Trip</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Source</label>
              <input className="input" defaultValue="Gandhinagar Depot" />
            </div>
            <div>
              <label className="label">Destination</label>
              <input className="input" defaultValue="Ahmedabad Hub" />
            </div>
            <div>
              <label className="label">Vehicle (Available only)</label>
              <select className="input">
                <option>VAN-05 · 500 kg capacity</option>
              </select>
            </div>
            <div>
              <label className="label">Driver (Available only)</label>
              <select className="input">
                <option>Alex</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Cargo Weight (kg)</label>
                <input className="input" defaultValue={cargoWeight} />
              </div>
              <div>
                <label className="label">Planned Distance (km)</label>
                <input className="input" defaultValue="38" />
              </div>
            </div>

            {overCapacity && (
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600 ring-1 ring-inset ring-red-200">
                <p>Vehicle Capacity: {capacity} kg</p>
                <p>Cargo Weight: {cargoWeight} kg</p>
                <p className="mt-1 font-semibold">
                  ✕ Capacity exceeded by {cargoWeight - capacity} kg → dispatch blocked
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50" disabled={overCapacity}>
                Dispatch (disabled)
              </button>
              <button className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>

        {/* Live board */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-ink-900">Live Board</h3>
          <div className="space-y-3">
            {liveBoard.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-100 p-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900">{t.id}</span>
                  <StatusBadge status={t.status} />
                </div>
                <p className="mb-2 text-sm text-slate-500">{t.route}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{t.vehicle}</span>
                  <span>{t.note}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs font-medium text-blue-500">
            On Complete: odometer + fuel log → expenses → Vehicle &amp; Driver set Available.
          </p>
        </div>
      </div>
    </Layout>
  );
}
