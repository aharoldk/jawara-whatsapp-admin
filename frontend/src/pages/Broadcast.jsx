import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Trash2, Users, Send } from 'lucide-react'
import { broadcastApi } from '../lib/api'
import { fmtDateTime } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { Btn, Input, Textarea, Select } from '../components/Form'
import { LoadingPane } from '../components/Spinner'

// ─── List form ───────────────────────────────────────────────────────────────
function ListForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues ?? { name: '', phones: '' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="List Name *"
        placeholder="e.g. VIP Customers"
        error={errors.name?.message}
        {...register('name', { required: 'Required' })}
      />
      <Textarea
        label="Phone Numbers (one per line)"
        placeholder={"628123456789\n628987654321"}
        rows={5}
        {...register('phones')}
      />
      <div className="flex justify-end pt-2">
        <Btn type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save List'}
        </Btn>
      </div>
    </form>
  )
}

// ─── Job form ────────────────────────────────────────────────────────────────
function JobForm({ lists, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { listId: '', message: '', scheduledAt: '' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Recipient List *"
        error={errors.listId?.message}
        {...register('listId', { required: 'Required' })}
      >
        <option value="">— Select list —</option>
        {lists.map((l) => (
          <option key={l._id} value={l._id}>
            {l.name} ({l.recipientPhones.length} recipients)
          </option>
        ))}
      </Select>
      <Textarea
        label="Message *"
        rows={4}
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
          {loading ? 'Scheduling…' : 'Schedule Broadcast'}
        </Btn>
      </div>
    </form>
  )
}

export default function Broadcast() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('lists')          // 'lists' | 'jobs'
  const [listModal, setListModal] = useState(false)
  const [editingList, setEditingList] = useState(null)
  const [jobModal, setJobModal] = useState(false)

  const { data: listsData, isLoading: listsLoading } = useQuery('broadcast-lists', () =>
    broadcastApi.getLists().then((r) => r.data),
  )

  const { data: historyData, isLoading: historyLoading } = useQuery('broadcast-history-page', () =>
    broadcastApi.getHistory({ limit: 50 }).then((r) => r.data),
  )

  const invalidateLists = () => qc.invalidateQueries('broadcast-lists')
  const invalidateHistory = () => qc.invalidateQueries('broadcast-history-page')

  const createListMut = useMutation(
    (d) =>
      broadcastApi.createList({
        name: d.name,
        recipientPhones: d.phones
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
      }),
    {
      onSuccess: () => { toast.success('List created'); setListModal(false); invalidateLists() },
      onError: () => toast.error('Failed'),
    },
  )

  const updateListMut = useMutation(
    ({ id, d }) =>
      broadcastApi.updateList(id, {
        name: d.name,
        recipientPhones: d.phones
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
      }),
    {
      onSuccess: () => { toast.success('List updated'); setEditingList(null); invalidateLists() },
      onError: () => toast.error('Failed'),
    },
  )

  const deleteListMut = useMutation((id) => broadcastApi.deleteList(id), {
    onSuccess: () => { toast.success('List deleted'); invalidateLists() },
    onError: () => toast.error('Failed'),
  })

  const createJobMut = useMutation(
    (d) =>
      broadcastApi.createJob({
        listId: d.listId,
        message: d.message,
        scheduledAt: new Date(d.scheduledAt).toISOString(),
      }),
    {
      onSuccess: () => { toast.success('Broadcast scheduled'); setJobModal(false); invalidateHistory() },
      onError: () => toast.error('Failed'),
    },
  )

  const lists = listsData?.data ?? []

  return (
    <div className="p-6">
      <PageHeader
        title="Broadcast"
        subtitle="Manage recipient lists and scheduled broadcasts"
        actions={
          tab === 'lists' ? (
            <Btn onClick={() => setListModal(true)}>
              <Plus size={16} /> New List
            </Btn>
          ) : (
            <Btn onClick={() => setJobModal(true)}>
              <Send size={16} /> Schedule Broadcast
            </Btn>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {[['lists', 'Recipient Lists'], ['jobs', 'Broadcast History']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Lists tab */}
      {tab === 'lists' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {listsLoading ? (
            <LoadingPane />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Recipients', 'Created', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lists.map((l) => (
                  <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {l.recipientPhones.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(l.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setEditingList({
                              ...l,
                              phones: l.recipientPhones.join('\n'),
                            })
                          }
                          className="px-2 py-1 text-xs text-brand-600 hover:bg-brand-50 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this list?')) deleteListMut.mutate(l._id)
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {lists.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      No lists yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Jobs / history tab */}
      {tab === 'jobs' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {historyLoading ? (
            <LoadingPane />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Message', 'Scheduled', 'Recipients', 'Sent', 'Failed', 'Status'].map(
                    (h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(historyData?.data ?? []).map((j) => (
                  <tr key={j._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{j.message}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDateTime(j.scheduledAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{j.totalRecipients}</td>
                    <td className="px-4 py-3 text-green-700">{j.sentCount}</td>
                    <td className="px-4 py-3 text-red-600">{j.failedCount}</td>
                    <td className="px-4 py-3">
                      <Badge status={j.status} />
                    </td>
                  </tr>
                ))}
                {(historyData?.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      No broadcast history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={listModal} onClose={() => setListModal(false)} title="New Recipient List">
        <ListForm onSubmit={(d) => createListMut.mutate(d)} loading={createListMut.isLoading} />
      </Modal>

      <Modal open={!!editingList} onClose={() => setEditingList(null)} title="Edit Recipient List">
        {editingList && (
          <ListForm
            defaultValues={{ name: editingList.name, phones: editingList.phones }}
            onSubmit={(d) => updateListMut.mutate({ id: editingList._id, d })}
            loading={updateListMut.isLoading}
          />
        )}
      </Modal>

      <Modal open={jobModal} onClose={() => setJobModal(false)} title="Schedule Broadcast">
        <JobForm
          lists={lists}
          onSubmit={(d) => createJobMut.mutate(d)}
          loading={createJobMut.isLoading}
        />
      </Modal>
    </div>
  )
}
