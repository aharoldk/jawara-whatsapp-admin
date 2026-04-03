import { useQuery } from 'react-query'
import { ordersApi } from '../lib/api'
import { fmtDate } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import { LoadingPane } from '../components/Spinner'
import { useState } from 'react'
import { Input } from '../components/Form'
import { Search } from 'lucide-react'

export default function Customers() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery(['customers'], () =>
    ordersApi.list({ limit: 100 }).then((r) => r.data),
  )

  // Derive unique customers from orders
  const customers = Object.values(
    (data?.data ?? []).reduce((acc, o) => {
      const phone = o.clientPhone
      if (!acc[phone]) {
        acc[phone] = {
          phone,
          name: o.clientName || '—',
          totalOrders: 0,
          totalSpend: 0,
          lastOrder: o.deliveryDate,
          lastStatus: o.status,
        }
      }
      acc[phone].totalOrders++
      acc[phone].totalSpend += o.totalAmount
      if (new Date(o.deliveryDate) > new Date(acc[phone].lastOrder)) {
        acc[phone].lastOrder = o.deliveryDate
        acc[phone].lastStatus = o.status
      }
      return acc
    }, {}),
  )

  const filtered = customers.filter(
    (c) =>
      c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Customers"
        subtitle="Unique customers derived from order history"
      />

      <div className="mb-4 relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Search phone or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingPane />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Phone', 'Total Orders', 'Total Spend', 'Last Order', 'Status'].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.phone} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(c.totalSpend)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(c.lastOrder)}</td>
                  <td className="px-4 py-3">
                    <Badge status={c.lastStatus} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
