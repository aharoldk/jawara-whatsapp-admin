import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { remindersApi } from '../lib/api'
import { fmtDateTime, toInputDatetime } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { Btn, Input, Textarea } from '../components/Form'
import { LoadingPane } from '../components/Spinner'

function ReminderForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { recipientPhone: '', message: '', scheduledAt: '' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Recipient Phone *"
        placeholder="628123456789"
        error={errors.recipientPhone?.message}
        {...register('recipientPhone', { required: 'Required' })}
      />
      <Textarea
        label="Message *"
        placeholder="Reminder message…"
        rows={3}
        error={errors.message?.message}
        {...register('message', { required: 'Required' })}
      />
      <Input
        label="Scheduled At *"
        type="datetime-local"
        error={errors.scheduledAt?.message}
        {...register('scheduledAt', { required: 'Required' })}
      />
      <div className="flex justify-end pt-2">
        <Btn type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Create Reminder'}
        </Btn>
      </div>
    </form>
  )
}

export default function Reminders() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [sentFilter, setSentFilter] = useState('')

  const { data, isLoading } = useQuery(
    ['reminders', sentFilter],
    () =>
      remindersApi
        .list({ ...(sentFilter !== '' ? { sent: sentFilter === 'true' } : {}), limit: 50 })
        .then((r) => r.data),
  )

  const invalidate = () => qc.invalidateQueries('reminders')

  const createMut = useMutation((d) => remindersApi.create(d), {
    onSuccess: () => { toast.success('Reminder created'); setModalOpen(false); invalidate() },
    onError: () => toast.error('Failed to create reminder'),
  })

  const deleteMut = useMutation((id) => remindersApi.remove(id), {
    onSuccess: () => { toast.success('Reminder deleted'); invalidate() },
    onError: () => toast.error('Failed to delete reminder'),
  })

  return (
    <div className="p-6">
      <PageHeader
        title="Reminders"
        subtitle={`${data?.total ?? 0} reminders`}
        actions={
          <Btn onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Reminder
          </Btn>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[['', 'All'], ['false', 'Pending'], ['true', 'Sent']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setSentFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              sentFilter === val
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingPane />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Recipient', 'Message', 'Scheduled', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.data ?? []).map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.recipientPhone}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.message}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDateTime(r.scheduledAt)}</td>
                  <td className="px-4 py-3">
                    <Badge status={r.sent ? 'sent' : 'unsent'} label={r.sent ? 'Sent' : 'Pending'} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm('Delete this reminder?')) deleteMut.mutate(r._id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {(data?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    No reminders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Reminder">
        <ReminderForm
          onSubmit={(d) => createMut.mutate({ ...d, scheduledAt: new Date(d.scheduledAt).toISOString() })}
          loading={createMut.isLoading}
        />
      </Modal>
    </div>
  )
}
