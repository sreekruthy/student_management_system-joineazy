export default function ProgressBar({ value, max, label, color = 'indigo', showBadge = false }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const colors = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    red: 'bg-red-500',
  };
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>{label}</span>
          <span className="font-medium">{value}/{max} ({pct}%)</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${colors[color]} h-3 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showBadge && pct === 100 && (
        <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-700 font-semibold">
            Complete
        </span>
      )}
    </div>
  );
}