import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { productGroupsApi, productsApi } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { Btn, Input, Textarea, Select } from '../components/Form'
import { LoadingPane } from '../components/Spinner'

// ─── Product Form ─────────────────────────────────────────────────────────────
function ProductForm({ defaultValues, groups, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues ?? {
      name: '', groupId: '', price: '', unit: 'pcs', description: '', active: true,
    },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Product Name *"
        placeholder="e.g. Nasi Goreng Spesial"
        error={errors.name?.message}
        {...register('name', { required: 'Required' })}
      />
      <Select
        label="Product Group *"
        error={errors.groupId?.message}
        {...register('groupId', { required: 'Required' })}
      >
        <option value="">— Select group —</option>
        {groups.map((g) => (
          <option key={g._id} value={g._id}>{g.name}</option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Price (Rp) *"
          type="number"
          min={0}
          placeholder="15000"
          error={errors.price?.message}
          {...register('price', { required: 'Required', valueAsNumber: true, min: { value: 0, message: 'Min 0' } })}
        />
        <Input
          label="Unit"
          placeholder="pcs, kg, box…"
          {...register('unit')}
        />
      </div>
      <Textarea
        label="Description"
        placeholder="Optional description"
        rows={3}
        {...register('description')}
      />
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" className="rounded" {...register('active')} />
        Active
      </label>
      <div className="flex justify-end pt-2">
        <Btn type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save Product'}
        </Btn>
      </div>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Products() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [groupFilter, setGroupFilter] = useState('')

  const { data: groupsData } = useQuery('product-groups', () =>
    productGroupsApi.list({ limit: 500 }).then((r) => r.data),
  )

  const { data: productsData, isLoading } = useQuery(
    ['products', groupFilter],
    () =>
      productsApi
        .list({ ...(groupFilter ? { groupId: groupFilter } : {}), limit: 500 })
        .then((r) => r.data),
  )

  const groups = groupsData?.data ?? []
  const products = productsData?.data ?? []
  const invalidate = () => qc.invalidateQueries('products')

  const createMut = useMutation((d) => productsApi.create(d), {
    onSuccess: () => { toast.success('Product created'); setModal(false); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  const updateMut = useMutation(({ id, d }) => productsApi.update(id, d), {
    onSuccess: () => { toast.success('Product updated'); setEditing(null); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  const deleteMut = useMutation((id) => productsApi.remove(id), {
    onSuccess: () => { toast.success('Product deleted'); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  function handleSubmit(d) {
    if (editing) {
      updateMut.mutate({ id: editing._id, d })
    } else {
      createMut.mutate(d)
    }
  }

  function openEdit(product) {
    setEditing({ ...product, groupId: product.groupId?._id ?? product.groupId })
  }

  const defaultValues = editing
    ? {
        name: editing.name,
        groupId: editing.groupId,
        price: editing.price,
        unit: editing.unit,
        description: editing.description,
        active: editing.active,
      }
    : undefined

  return (
    <div className="p-6">
      <PageHeader
        title="Products"
        subtitle={`${productsData?.total ?? 0} products`}
        actions={
          <Btn onClick={() => setModal(true)} disabled={groups.length === 0}>
            <Plus size={16} /> New Product
          </Btn>
        }
      />

      {/* Group filter */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Groups</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>{g.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingPane />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.groupId?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.active ? 'green' : 'gray'}>
                        {p.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete product "${p.name}"?`))
                              deleteMut.mutate(p._id)
                          }}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modal || !!editing}
        onClose={() => { setModal(false); setEditing(null) }}
        title={editing ? 'Edit Product' : 'New Product'}
      >
        <ProductForm
          key={editing?._id ?? 'new'}
          defaultValues={defaultValues}
          groups={groups}
          onSubmit={handleSubmit}
          loading={createMut.isLoading || updateMut.isLoading}
        />
      </Modal>
    </div>
  )
}
