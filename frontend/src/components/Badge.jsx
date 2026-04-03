export default function Badge({ status, label }) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    sending: 'bg-purple-100 text-purple-800',
    failed: 'bg-red-100 text-red-800',
    sent: 'bg-green-100 text-green-800',
    unsent: 'bg-gray-100 text-gray-700',
  }
  const cls = map[status] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label ?? status}
    </span>
  )
}
