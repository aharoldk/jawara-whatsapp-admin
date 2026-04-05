import { useState } from 'react'
import { useQuery } from 'react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, addMonths, subMonths, addDays,
  getDaysInMonth, startOfMonth, startOfWeek, getDay,
} from 'date-fns'
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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TODAY = format(new Date(), 'yyyy-MM-dd')

export default function Calendar() {
  const [view, setView] = useState('month') // 'month' | 'week'
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState(null) // { date, orders, reminders }

  const monthKey = format(current, 'yyyy-MM')

  // Week boundaries
  const weekStart = startOfWeek(current, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekStartMonthKey = format(weekStart, 'yyyy-MM')
  const weekEndMonthKey = format(addDays(weekStart, 6), 'yyyy-MM')
  // Adjacent month needed when the week straddles a month boundary
  const adjWeekMonthKey =
    weekStartMonthKey !== weekEndMonthKey
      ? weekStartMonthKey === monthKey
        ? weekEndMonthKey
        : weekStartMonthKey
      : null

  // Primary month fetch (drives month view + one side of week view)
  const { data: calData, isLoading: calLoading } = useQuery(
    ['calendar', monthKey],
    () => calendarApi.getMonth(monthKey).then((r) => r.data),
  )

  // Adjacent month fetch (week view only, when week spans two months)
  const { data: adjCalData } = useQuery(
    ['calendar', adjWeekMonthKey ?? '_none'],
    () => calendarApi.getMonth(adjWeekMonthKey).then((r) => r.data),
    { enabled: view === 'week' && !!adjWeekMonthKey },
  )

  const { data: remData } = useQuery(
    ['reminders-calendar', monthKey],
    () => remindersApi.list({ limit: 200 }).then((r) => r.data),
  )

  // Group reminders by YYYY-MM-DD
  const remindersByDay = {}
  for (const rem of remData?.data ?? []) {
    const key = rem.scheduledAt.slice(0, 10)
    if (!remindersByDay[key]) remindersByDay[key] = []
    remindersByDay[key].push(rem)
  }

  // Merged orders (adjacent data applied first so primary overwrites on conflict)
  const ordersByDay = {
    ...(adjCalData?.days ?? {}),
    ...(calData?.days ?? {}),
  }

  const daysInMonth = getDaysInMonth(current)
  const firstDow = getDay(startOfMonth(current))

  function openDay(dateStr) {
    setSelected({
      date: dateStr,
      orders: ordersByDay[dateStr] ?? [],
      reminders: remindersByDay[dateStr] ?? [],
    })
  }

  function prevPeriod() {
    if (view === 'month') setCurrent((d) => subMonths(d, 1))
    else setCurrent((d) => addDays(d, -7))
  }

  function nextPeriod() {
    if (view === 'month') setCurrent((d) => addMonths(d, 1))
    else setCurrent((d) => addDays(d, 7))
  }

  const periodLabel =
    view === 'month'
      ? format(current, 'MMMM yyyy')
      : weekStartMonthKey === weekEndMonthKey
        ? `${format(weekStart, 'd')} – ${format(addDays(weekStart, 6), 'd MMM yyyy')}`
        : `${format(weekStart, 'd MMM')} – ${format(addDays(weekStart, 6), 'd MMM yyyy')}`

  return (
    <div className="p-6">
      <PageHeader title="Calendar" subtitle="Orders and reminders by delivery date" />

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={prevPeriod} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-gray-900 w-52 text-center">
          {periodLabel}
        </h2>
        <button onClick={nextPeriod} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setCurrent(new Date())}
          className="ml-auto px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Today
        </button>
        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {['month', 'week'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 capitalize border-l first:border-l-0 border-gray-300 ${
                view === v
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {calLoading ? (
        <LoadingPane />
      ) : view === 'month' ? (
        /* ── Month view ── */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-gray-100 bg-gray-50" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const key = `${monthKey}-${String(day).padStart(2, '0')}`
              const orders = ordersByDay[key] ?? []
              const reminders = remindersByDay[key] ?? []
              const isToday = key === TODAY

              return (
                <div
                  key={day}
                  onClick={() => openDay(key)}
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
                      <div key={o._id} className="flex items-center gap-1 text-xs text-gray-700 truncate">
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
      ) : (
        /* ── Week view ── */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-200">
            {weekDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const orders = ordersByDay[key] ?? []
              const reminders = remindersByDay[key] ?? []
              const isToday = key === TODAY

              return (
                <div key={key} className="flex flex-col min-h-[520px]">
                  {/* Column header */}
                  <div
                    onClick={() => openDay(key)}
                    className={`border-b border-gray-200 p-3 text-center cursor-pointer hover:bg-brand-50 transition-colors ${
                      isToday ? 'bg-brand-50' : 'bg-gray-50'
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {DAY_NAMES[day.getDay()]}
                    </p>
                    <span
                      className={`mt-1 text-sm font-bold inline-flex items-center justify-center w-8 h-8 rounded-full mx-auto ${
                        isToday ? 'bg-brand-600 text-white' : 'text-gray-900'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {day.getDate() === 1 && (
                      <p className="text-xs text-gray-400 -mt-0.5">{format(day, 'MMM')}</p>
                    )}
                  </div>

                  {/* Events */}
                  <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                    {orders.map((o) => (
                      <div
                        key={o._id}
                        onClick={() => openDay(key)}
                        className="rounded-md p-2 bg-gray-50 border border-gray-100 cursor-pointer hover:bg-brand-50 hover:border-brand-200 transition-colors"
                      >
                        <Badge status={o.status} />
                        <p className="text-xs font-medium text-gray-900 truncate mt-1">
                          {o.clientName || o.clientPhone}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {o.items?.map((it) => `${it.name} ×${it.qty}`).join(', ')}
                        </p>
                      </div>
                    ))}

                    {reminders.map((r) => (
                      <div
                        key={r._id}
                        onClick={() => openDay(key)}
                        className="rounded-md p-2 bg-purple-50 border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
                      >
                        <p className="text-xs font-medium text-purple-900 truncate">{r.recipientPhone}</p>
                        <p className="text-xs text-purple-700 mt-0.5 line-clamp-2">{r.message}</p>
                        <p className="text-xs text-purple-500 mt-1">
                          {r.sent
                            ? '✓ Sent'
                            : `⏰ ${new Date(r.scheduledAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`}
                        </p>
                      </div>
                    ))}

                    {orders.length === 0 && reminders.length === 0 && (
                      <p className="text-xs text-gray-300 text-center pt-6">—</p>
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
                        {r.sent
                          ? '✓ Sent'
                          : `⏰ ${new Date(r.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
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
