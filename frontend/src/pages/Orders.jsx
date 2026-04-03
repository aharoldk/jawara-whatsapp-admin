import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, PlusCircle, MinusCircle } from 'lucide-react'
import { ordersApi } from '../lib/api'
import { fmt, fmtDate, toInputDate } from '../lib/utils'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { Btn, Input, Textarea, Select } from '../components/Form'
import { LoadingPane } from '../components/Spinner'

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

function OrderForm({ defaultValues, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues ?? {
      clientPhone: '',
      clientName: '',
      deliveryDate: '',
      status: 'pending',
      notes: '',
      items: [{ name: '', qty: 1, price: 0 }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Phone *"
          placeholder="628123456789"
          error={errors.clientPhone?.message}
          {...register('clientPhone', { required: 'Required' })}
        />
        <Input label="Name" placeholder="Customer name" {...register('clientName')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Delivery Date *"
          type="date"
          error={errors.deliveryDate?.message}
          {...register('deliveryDate', { required: 'Required' })}
        />
        <Select label="Status" {...register('status')}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700">Items</label>
          <button
            type="button"
            onClick={() => append({ name: '', qty: 1, price: 0 })}
            className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-xs"
          >
            <PlusCircle size={14} /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="col-span-5 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Item name"
                {...register(`items.${i}.name`, { required: true })}
              />
              <input
                type="number"
                min={1}
                className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Qty"
                {...register(`items.${i}.qty`, { valueAsNumber: true, min: 1 })}
              />
              <input
                type="number"
                min={0}
                className="col-span-4 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Price"
                {...register(`items.${i}.price`, { valueAsNumber: true, min: 0 })}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="col-span-1 text-red-400 hover:text-red-600"
              >
                <MinusCircle size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Textarea label="Notes" placeholder="Optional notes…" rows={2} {...register('notes')} />

      <div className="flex justify-end gap-2 pt-2">
        <Btn type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save Order'}
        </Btn>
      </div>
    </form>
  )
}

export default function Orders() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useQuery(
    ['orders', statusFilter, page],
    () =>
      ordersApi
        .list({ ...(statusFilter ? { status: statusFilter } : {}), page, limit })
        .then((r) => r.data),
    { keepPreviousData: true },
  )

  const invalidate = () => qc.invalidateQueries('orders')

  const createMut = useMutation((d) => ordersApi.create(d), {
    onSuccess: () => { toast.success('Order created'); setModalOpen(false); invalidate() },
    onError: () => toast.error('Failed to create order'),
  })

  const updateMut = useMutation(({ id, data }) => ordersApi.update(id, data), {
    onSuccess: () => { toast.success('Order updated'); setEditing(null); invalidate() },
    onError: () => toast.error('Failed to update order'),
  })

  const deleteMut = useMutation((id) => ordersApi.remove(id), {
    onSuccess: () => { toast.success('Order deleted'); setDeleteTarget(null); invalidate() },
    onError: () => toast.error('Failed to delete order'),
  })

  function prepareDefaultValues(o) {
    return {
      clientPhone: o.clientPhone,
      clientName: o.clientName,
      deliveryDate: toInputDate(o.deliveryDate),
      status: o.status,
      notes: o.notes || '',
      items: o.items.length ? o.items : [{ name: '', qty: 1, price: 0 }],
    }
  }

  const totalPages = Math.ceil((data?.total ?? 0) / limit)

  return (
    <div className="p-6">
      <PageHeader
        title="Orders"
        subtitle={`${data?.total ?? 0} orders`}
        actions={
          <Btn onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Order
          </Btn>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              statusFilter === s
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingPane />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Customer', 'Items', 'Amount', 'Delivery', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.data ?? []).map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.clientName || '—'}</p>
                      <p className="text-xs text-gray-500">{o.clientPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {o.items.map((it) => `${it.name} x${it.qty}`).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(o.deliveryDate)}</td>
                    <td className="px-4 py-3">
                      <Badge status={o.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditing(o)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 rounded hover:bg-gray-100"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(o)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(data?.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Btn size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Btn>
                  <Btn size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Order" size="lg">
        <OrderForm
          onSubmit={(d) => {
            const items = d.items.filter((it) => it.name)
            const total = items.reduce((s, it) => s + it.qty * it.price, 0)
            createMut.mutate({ ...d, items, totalAmount: total })
          }}
          loading={createMut.isLoading}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Order" size="lg">
        {editing && (
          <OrderForm
            defaultValues={prepareDefaultValues(editing)}
            onSubmit={(d) => {
              const items = d.items.filter((it) => it.name)
              const total = items.reduce((s, it) => s + it.qty * it.price, 0)
              updateMut.mutate({ id: editing._id, data: { ...d, items, totalAmount: total } })
            }}
            loading={updateMut.isLoading}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Order" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Delete order for <strong>{deleteTarget?.clientName || deleteTarget?.clientPhone}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Btn>
          <Btn variant="danger" onClick={() => deleteMut.mutate(deleteTarget._id)} disabled={deleteMut.isLoading}>
            {deleteMut.isLoading ? 'Deleting…' : 'Delete'}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
