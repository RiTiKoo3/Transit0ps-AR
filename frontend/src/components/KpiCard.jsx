const DOT_TONE = {
  available: "bg-emerald-500",
  ontrip: "bg-blue-500",
  inshop: "bg-amber-500",
  retired: "bg-red-500",
  draft: "bg-slate-400",
  offduty: "bg-slate-400",
};

export default function KpiCard({ label, value, tone = "available" }) {
  return (
    <div className="card flex flex-1 min-w-[140px] flex-col gap-2 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${DOT_TONE[tone] || DOT_TONE.available}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold text-ink-900">{value}</span>
    </div>
  );
}
