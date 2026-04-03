import { useState } from 'react'
import { useQuery } from 'react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { reportsApi } from '../lib/api'
import { fmt } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { LoadingPane } from '../components/Spinner'
import { ShoppingCart, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

const TYPE_OPTIONS = ['daily', 'weekly', 'monthly']

const PIE_COLORS = {
  pending: '#facc15',
  confirmed: '#60a5fa',
  completed: '#4ade80',
  cancelled: '#f87171',
}

const IDR_FORMATTER = (v) =>
  new Intl.NumberFormat('id-ID', { notation: 'compact', currency: 'IDR' }).format(v)

export default function Reports() {
  const [type, setType] = useState('monthly')

  const { data, isLoading } = useQuery(['reports', type], () =>
    reportsApi.get({ type }).then((r) => r.data),
  )

  const pieData = data
    ? Object.entries(data.statusBreakdown).map(([name, value]) => ({ name, value }))
    : []

  const topItems = data?.topItems ?? []

  return (
    <div className="p-6">
      <PageHeader title="Reports" subtitle="Sales performance overview" />

      {/* Type selector */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              type === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingPane />
      ) : (
        <>
          {/* Date range */}
          <p className="text-xs text-gray-500 mb-4">
            {new Date(data.from).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}{' '}
            —{' '}
            {new Date(data.to).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<ShoppingCart size={20} />}
              label="Total Orders"
              value={data.totalOrders}
              color="brand"
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="Revenue"
              value={fmt(data.totalRevenue)}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle size={20} />}
              label="Completed"
              value={data.statusBreakdown.completed}
              color="brand"
            />
            <StatCard
              icon={<XCircle size={20} />}
              label="Cancelled"
              value={data.statusBreakdown.cancelled}
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status breakdown pie */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top items bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Items by Qty</h3>
              {topItems.length === 0 ? (
                <p className="text-sm text-gray-400 py-10 text-center">No items data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topItems} layout="vertical" margin={{ left: 8, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={IDR_FORMATTER} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(v, n) => [n === 'revenue' ? fmt(v) : v, n]} />
                    <Bar dataKey="qty" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top items table */}
          {topItems.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Top Items Detail</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['#', 'Item', 'Qty Sold', 'Revenue'].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topItems.map((item, i) => (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-5 py-3 text-gray-600">{item.qty}</td>
                      <td className="px-5 py-3 text-gray-900 font-semibold">{fmt(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
