import { useQuery } from 'react-query'
import { ShoppingCart, Bell, Megaphone, Users, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { ordersApi, remindersApi, broadcastApi, wahaApi } from '../lib/api'
import { fmt } from '../lib/utils'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import { Btn } from '../components/Form'
import { LoadingPane } from '../components/Spinner'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { data: ordersData, isLoading: ordersLoading } = useQuery('orders-summary', () =>
    ordersApi.list({ limit: 5, page: 1 }).then((r) => r.data),
  )

  const { data: remindersData } = useQuery('reminders-pending-count', () =>
    remindersApi.list({ sent: false, limit: 1 }).then((r) => r.data),
  )

  const { data: broadcastData } = useQuery('broadcast-history', () =>
    broadcastApi.getHistory({ limit: 1 }).then((r) => r.data),
  )

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useQuery('waha-sessions', () => wahaApi.getSessions().then((r) => r.data), {
    retry: false,
    onError: () => {},
  })

  const sessions = Array.isArray(sessionsData) ? sessionsData : []
  const connectedSession = sessions.find((s) => s.status === 'WORKING')

  async function handleStart(name) {
    try {
      await wahaApi.startSession(name)
      toast.success(`Session "${name}" started`)
      refetchSessions()
    } catch {
      toast.error('Failed to start session')
    }
  }

  async function handleStop(name) {
    try {
      await wahaApi.stopSession(name)
      toast.success(`Session "${name}" stopped`)
      refetchSessions()
    } catch {
      toast.error('Failed to stop session')
    }
  }

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" subtitle="Overview of your WhatsApp automation" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<ShoppingCart size={20} />}
          label="Total Orders"
          value={ordersLoading ? '…' : ordersData?.total ?? 0}
          color="brand"
        />
        <StatCard
          icon={<Bell size={20} />}
          label="Pending Reminders"
          value={remindersData?.total ?? 0}
          color="yellow"
        />
        <StatCard
          icon={<Megaphone size={20} />}
          label="Broadcast Jobs"
          value={broadcastData?.total ?? 0}
          color="blue"
        />
        <StatCard
          icon={connectedSession ? <Wifi size={20} /> : <WifiOff size={20} />}
          label="WhatsApp"
          value={connectedSession ? 'Connected' : 'Disconnected'}
          color={connectedSession ? 'brand' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WAHA Sessions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">WhatsApp Sessions</h2>
            <Btn size="sm" variant="ghost" onClick={refetchSessions}>
              <RefreshCw size={14} /> Refresh
            </Btn>
          </div>
          {sessionsLoading ? (
            <LoadingPane />
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No sessions found. Make sure WAHA is reachable.
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {s.status !== 'WORKING' && (
                      <Btn size="sm" onClick={() => handleStart(s.name)}>
                        Start
                      </Btn>
                    )}
                    {s.status === 'WORKING' && (
                      <Btn size="sm" variant="danger" onClick={() => handleStop(s.name)}>
                        Stop
                      </Btn>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Orders</h2>
          {ordersLoading ? (
            <LoadingPane />
          ) : (
            <div className="space-y-2">
              {(ordersData?.data ?? []).map((o) => (
                <div
                  key={o._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {o.clientName || o.clientPhone}
                    </p>
                    <p className="text-xs text-gray-500">{o.clientPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{fmt(o.totalAmount)}</p>
                    <Badge status={o.status} />
                  </div>
                </div>
              ))}
              {(ordersData?.data ?? []).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">No orders yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
