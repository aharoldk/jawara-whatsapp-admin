import { useState } from 'react'
import { useQuery } from 'react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { calendarApi, remindersApi } from '../lib/api'
import { fmtDate } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { LoadingPane } from '../components/Spinner'

const STATUS_DOT = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-400',
  completed: 'bg-green-400',
  cancelled: 'bg-red-400',
}

export default function Calendar() {
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState(null)   // { date, orders, reminders }
  const monthKey = format(current, 'yyyy-MM')

  const { data: calData, isLoading: calLoading } = useQuery(
    ['calendar', monthKey],
    () => calendarApi.getMonth(monthKey).then((r) => r.data),
  )

  const { data: remData } = useQuery(
    ['reminders-calendar', monthKey],
    () => remindersApi.list({ limit: 200 }).then((r) => r.data),
  )

  // Group reminders by date key YYYY-MM-DD
  const remindersByDay = {}
  for (const rem of remData?.data ?? []) {
    const key = rem.scheduledAt.slice(0, 10)
    if (!remindersByDay[key]) remindersByDay[key] = []
    remindersByDay[key].push(rem)
  }

  const ordersByDay = calData?.days ?? {}
  const daysInMonth = getDaysInMonth(current)
  const firstDow = getDay(startOfMonth(current)) // 0=Sun

  function openDay(day) {
    const key = `${monthKey}-${String(day).padStart(2, '0')}`
    setSelected({
      date: key,
      orders: ordersByDay[key] ?? [],
      reminders: remindersByDay[key] ?? [],
    })
  }

  return (
    <div className="p-6">
      <PageHeader title="Calendar" subtitle="Orders and reminders by delivery date" />

      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setCurrent((d) => subMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-gray-900 w-40 text-center">
          {format(current, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrent((d) => addMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setCurrent(new Date())}
          className="ml-auto px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Today
        </button>
      </div>

      {calLoading ? (
        <LoadingPane />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-gray-100 bg-gray-50" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const key = `${monthKey}-${String(day).padStart(2, '0')}`
              const orders = ordersByDay[key] ?? []
              const reminders = remindersByDay[key] ?? []
              const isToday = key === format(new Date(), 'yyyy-MM-dd')

              return (
                <div
                  key={day}
                  onClick={() => openDay(day)}
                  className={`min-h-[80px] border-r border-b border-gray-100 p-2 cursor-pointer hover:bg-brand-50 transition-colors ${
                    isToday ? 'bg-brand-50' : ''
                  }`}
                >
                  <span
                    className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday ? 'bg-brand-600 text-white' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </span>

                  <div className="mt-1 space-y-0.5">
                    {orders.slice(0, 2).map((o) => (
                      <div
                        key={o._id}
                        className="flex items-center gap-1 text-xs text-gray-700 truncate"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[o.status]}`} />
                        {o.clientName || o.clientPhone}
                      </div>
                    ))}
                    {orders.length > 2 && (
                      <p className="text-xs text-gray-400">+{orders.length - 2} more</p>
                    )}
                    {reminders.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-purple-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                        {reminders.length} reminder{reminders.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        {Object.entries(STATUS_DOT).map(([s, cls]) => (
          <span key={s} className="flex items-center gap-1 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            {s}
          </span>
        ))}
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          reminder
        </span>
      </div>

      {/* Day detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? fmtDate(selected.date) : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            {/* Orders */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Orders ({selected.orders.length})
              </h3>
              {selected.orders.length === 0 ? (
                <p className="text-sm text-gray-400">No orders on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selected.orders.map((o) => (
                    <div key={o._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {o.clientName || o.clientPhone}
                        </p>
                        <p className="text-xs text-gray-500">
                          {o.items.map((it) => `${it.name} x${it.qty}`).join(', ')}
                        </p>
                      </div>
                      <Badge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Reminders ({selected.reminders.length})
              </h3>
              {selected.reminders.length === 0 ? (
                <p className="text-sm text-gray-400">No reminders on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selected.reminders.map((r) => (
                    <div key={r._id} className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{r.recipientPhone}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{r.message}</p>
                      <p className="text-xs text-purple-600 mt-1">
                        {r.sent ? '✓ Sent' : `⏰ ${new Date(r.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
