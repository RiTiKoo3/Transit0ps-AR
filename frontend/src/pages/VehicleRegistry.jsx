import { Plus } from "lucide-react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { vehicles } from "../data/mockData";

export default function VehicleRegistry() {
  return (
    <Layout title="Vehicle Registry">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select className="input w-32">
            <option>Type: All</option>
            <option>Van</option>
            <option>Truck</option>
            <option>Mini</option>
          </select>
          <select className="input w-32">
            <option>Status: All</option>
            <option>Available</option>
            <option>On Trip</option>
            <option>In Shop</option>
            <option>Retired</option>
          </select>
          <input className="input w-48" placeholder="Search reg. no…" />
        </div>
        <button className="btn-primary">
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.reg} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="td font-medium">{v.reg}</td>
                <td className="td">{v.name}</td>
                <td className="td text-slate-500">{v.type}</td>
                <td className="td text-slate-500">{v.capacity}</td>
                <td className="td text-slate-500">{v.odometer}</td>
                <td className="td text-slate-500">{v.acqCost}</td>
                <td className="td">
                  <StatusBadge status={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs font-medium text-red-500">
        Rule: Registration No. must be unique · Retired / In Shop vehicles are hidden from Trip
        Dispatcher.
      </p>
    </Layout>
  );
}
