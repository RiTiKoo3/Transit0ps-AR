import { Plus } from "lucide-react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { drivers } from "../data/mockData";

const TOGGLE_STATUSES = [
  { label: "Available", tone: "available" },
  { label: "On Trip", tone: "ontrip" },
  { label: "Off Duty", tone: "offduty" },
  { label: "Suspended", tone: "suspended" },
];

export default function Drivers() {
  return (
    <Layout title="Drivers & Safety Profiles">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input className="input w-64" placeholder="Search…" />
        <button className="btn-primary">
          <Plus size={16} /> Add Driver
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="th">Driver</th>
              <th className="th">License No.</th>
              <th className="th">Category</th>
              <th className="th">Expiry</th>
              <th className="th">Contact</th>
              <th className="th">Trip Compl.</th>
              <th className="th">Safety</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="td font-medium">{d.name}</td>
                <td className="td text-slate-500">{d.license}</td>
                <td className="td text-slate-500">{d.category}</td>
                <td className="td">
                  <span className={d.expired ? "font-semibold text-red-500" : "text-slate-500"}>
                    {d.expiry}
                    {d.expired ? " EXPIRED" : ""}
                  </span>
                </td>
                <td className="td text-slate-500">{d.contact}</td>
                <td className="td">
                  <StatusBadge status={d.compliance} tone={d.status === "Suspended" ? "suspended" : "available"} />
                </td>
                <td className="td">
                  <StatusBadge status={d.safety} tone={d.status === "Suspended" ? "suspended" : "available"} />
                </td>
                <td className="td">
                  <StatusBadge status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Toggle Status
        </p>
        <div className="flex flex-wrap gap-2">
          {TOGGLE_STATUSES.map((s) => (
            <StatusBadge key={s.label} status={s.label} tone={s.tone} />
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-red-500">
        Rule: Expired license or Suspended status → blocked from trip assignment.
      </p>
    </Layout>
  );
}
