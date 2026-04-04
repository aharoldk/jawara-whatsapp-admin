import { useState } from 'react'
import { useQuery } from 'react-query'
import { ShoppingCart, Bell, Megaphone, Users, Wifi, WifiOff, RefreshCw, QrCode, Trash2, Plus } from 'lucide-react'
import { ordersApi, remindersApi, broadcastApi, wahaApi } from '../lib/api'
import { fmt } from '../lib/utils'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import { Btn } from '../components/Form'
import { LoadingPane } from '../components/Spinner'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [qrSession, setQrSession] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [addingSession, setAddingSession] = useState(false)
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
      if (qrSession === name) setQrSession(null)
      refetchSessions()
    } catch {
      toast.error('Failed to stop session')
    }
  }

  async function handleAddSession() {
    setAddingSession(true)
    try {
      await wahaApi.createSession('default')
      toast.success('Session created')
      refetchSessions()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create session'
      toast.error(msg)
    } finally {
      setAddingSession(false)
    }
  }

  async function handleReset(name) {
    if (!window.confirm(`Hard reset "${name}"? This will delete the stored auth — you will need to scan a new QR code.`)) return
    try {
      await wahaApi.resetSession(name)
      toast.success(`Session "${name}" reset — scan the QR code`)
      refetchSessions()
    } catch {
      toast.error('Failed to reset session')
      refetchSessions()
    }
  }

  async function handleShowQR(name) {
    setQrLoading(true)
    setQrSession(name)
    if (qrData && qrData.startsWith('blob:')) URL.revokeObjectURL(qrData)
    setQrData(null)
    try {
      const res = await wahaApi.getQR(name)
      // Backend returns { value: 'data:image/png;base64,...' }
      const value = res.data?.value ?? res.data
      if (!value) throw new Error('No QR value returned')
      setQrData(typeof value === 'string' ? value : JSON.stringify(value))
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch QR code'
      toast.error(msg)
      setQrSession(null)
    } finally {
      setQrLoading(false)
    }
  }

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" subtitle="Overview of your WhatsApp automation" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WAHA Sessions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">WhatsApp Sessions</h2>
            <div className="flex gap-2">
              <Btn size="sm" variant="ghost" onClick={refetchSessions}>
                <RefreshCw size={14} /> Refresh
              </Btn>
              {sessions.length === 0 && (
                <Btn size="sm" onClick={handleAddSession} disabled={addingSession}>
                  <Plus size={14} />
                  {addingSession ? 'Creating…' : 'Add Session'}
                </Btn>
              )}
            </div>
          </div>
        {sessionsLoading ? (
            <LoadingPane />
          ) : sessions.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-gray-500">No sessions found.</p>
              <Btn size="sm" onClick={handleAddSession} disabled={addingSession}>
                <Plus size={14} />
                {addingSession ? 'Creating…' : 'Add Default Session'}
              </Btn>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.status}</p>
                    </div>
                    <div className="flex gap-2">
                      {s.status === 'FAILED' && (
                        <Btn size="sm" variant="danger" onClick={() => handleReset(s.name)}>
                          <Trash2 size={14} /> Reset
                        </Btn>
                      )}
                      {s.status !== 'WORKING' && s.status !== 'FAILED' && s.status !== 'SCAN_QR_CODE' && s.status !== 'STARTING' && (
                        <Btn size="sm" onClick={() => handleStart(s.name)}>
                          Start
                        </Btn>
                      )}
                      {(s.status === 'SCAN_QR_CODE' || s.status === 'STARTING') && (
                        <Btn size="sm" variant="ghost" onClick={() => handleShowQR(s.name)}>
                          <QrCode size={14} /> QR Code
                        </Btn>
                      )}
                      {s.status === 'WORKING' && (
                        <Btn size="sm" variant="danger" onClick={() => handleStop(s.name)}>
                          Stop
                        </Btn>
                      )}
                    </div>
                  </div>
                  {/* QR Panel */}
                  {qrSession === s.name && (
                    <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-3">
                        Scan this QR code with WhatsApp on your phone
                      </p>
                      {qrLoading ? (
                        <p className="text-sm text-gray-400 py-4">Loading QR…</p>
                      ) : qrData ? (
                        <img
                          src={qrData}
                          alt="WhatsApp QR Code"
                          className="mx-auto w-48 h-48 rounded"
                        />
                      ) : (
                        <p className="text-sm text-red-400 py-4">QR not available yet. Start the session first.</p>
                      )}
                      <Btn size="sm" variant="ghost" className="mt-3" onClick={() => handleShowQR(s.name)}>
                        <RefreshCw size={14} /> Refresh QR
                      </Btn>
                    </div>
                  )}
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
