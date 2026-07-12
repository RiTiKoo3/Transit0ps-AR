const TONE_MAP = {
  available: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  ontrip: "bg-blue-50 text-blue-600 ring-blue-200",
  inshop: "bg-amber-50 text-amber-600 ring-amber-200",
  retired: "bg-red-50 text-red-600 ring-red-200",
  suspended: "bg-red-50 text-red-600 ring-red-200",
  draft: "bg-slate-100 text-slate-500 ring-slate-200",
  offduty: "bg-slate-100 text-slate-500 ring-slate-200",
  completed: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  dispatched: "bg-blue-50 text-blue-600 ring-blue-200",
  cancelled: "bg-red-50 text-red-600 ring-red-200",
};

// Maps a human-readable status string ("On Trip", "In Shop", …) to a tone key.
function toneFromLabel(label) {
  return label.toLowerCase().replace(/\s+/g, "");
}

export default function StatusBadge({ status, tone }) {
  const key = tone || toneFromLabel(status);
  const classes = TONE_MAP[key] || TONE_MAP.draft;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      {status}
    </span>
  );
}
