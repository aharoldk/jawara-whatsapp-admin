import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { productGroupsApi } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { Btn, Input, Textarea } from '../components/Form'
import { LoadingPane } from '../components/Spinner'

function GroupForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues ?? { name: '', description: '', active: true },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Group Name *"
        placeholder="e.g. Makanan, Minuman"
        error={errors.name?.message}
        {...register('name', { required: 'Required' })}
      />
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
          {loading ? 'Saving…' : 'Save Group'}
        </Btn>
      </div>
    </form>
  )
}

export default function ProductGroups() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery('product-groups', () =>
    productGroupsApi.list({ limit: 500 }).then((r) => r.data),
  )

  const groups = data?.data ?? []
  const invalidate = () => qc.invalidateQueries('product-groups')

  const createMut = useMutation((d) => productGroupsApi.create(d), {
    onSuccess: () => { toast.success('Group created'); setModal(false); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  const updateMut = useMutation(({ id, d }) => productGroupsApi.update(id, d), {
    onSuccess: () => { toast.success('Group updated'); setEditing(null); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  const deleteMut = useMutation((id) => productGroupsApi.remove(id), {
    onSuccess: () => { toast.success('Group deleted'); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  function handleSubmit(d) {
    if (editing) {
      updateMut.mutate({ id: editing._id, d })
    } else {
      createMut.mutate(d)
    }
  }

  const defaultValues = editing
    ? { name: editing.name, description: editing.description, active: editing.active }
    : undefined

  return (
    <div className="p-6">
      <PageHeader
        title="Product Groups"
        subtitle={`${data?.total ?? 0} groups`}
        actions={
          <Btn onClick={() => setModal(true)}>
            <Plus size={16} /> New Group
          </Btn>
        }
      />

      {isLoading ? (
        <LoadingPane />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No product groups yet.
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                    <td className="px-4 py-3 text-gray-500">{g.description || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={g.active ? 'green' : 'gray'}>
                        {g.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing(g)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete group "${g.name}"?`))
                              deleteMut.mutate(g._id)
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
        title={editing ? 'Edit Product Group' : 'New Product Group'}
      >
        <GroupForm
          key={editing?._id ?? 'new'}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          loading={createMut.isLoading || updateMut.isLoading}
        />
      </Modal>
    </div>
  )
}
