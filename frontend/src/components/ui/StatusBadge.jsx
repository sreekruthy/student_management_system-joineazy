export default function StatusBadge({ status }) {
  const map = {
    CONFIRMED: { label: 'Submitted', cls: 'bg-blue-100 text-blue-700' },
    ACKNOWLEDGED: { label: 'Acknowledged', cls: 'bg-green-100 text-green-700' },
    PENDING: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
    OVERDUE: { label: 'Overdue', cls: 'bg-red-100 text-red-700' },
  };
  const { label, cls } = map[status] || map.PENDING;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}