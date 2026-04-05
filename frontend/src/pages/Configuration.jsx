import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'
import { configApi } from '../lib/api'
import PageHeader from '../components/PageHeader'
import { Btn } from '../components/Form'
import { LoadingPane } from '../components/Spinner'

export default function Configuration() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery('config', () =>
    configApi.get().then((r) => r.data),
  )

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { knowledgeBase: '' },
  })

  // Populate form once data is loaded
  useEffect(() => {
    if (data) reset({ knowledgeBase: data.knowledgeBase ?? '' })
  }, [data, reset])

  const saveMut = useMutation((d) => configApi.save(d), {
    onSuccess: () => {
      toast.success('Configuration saved and knowledge base re-indexed')
      qc.invalidateQueries('config')
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to save'),
  })

  if (isLoading) return <LoadingPane />

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader
        title="Configuration"
        subtitle="Manage app settings and AI knowledge base"
      />

      <form onSubmit={handleSubmit((d) => saveMut.mutate(d))} className="space-y-6">
        {/* Knowledge Base */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Knowledge Base</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              This text is the AI's knowledge about your business. Saving will clear the existing
              Qdrant index and re-index this content automatically.
            </p>
          </div>
          <textarea
            rows={20}
            placeholder="Paste your business knowledge base here…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
            {...register('knowledgeBase')}
          />
        </div>

        <div className="flex justify-end">
          <Btn type="submit" disabled={saveMut.isLoading}>
            <Save size={15} />
            {saveMut.isLoading ? 'Saving & indexing…' : 'Save & Re-index'}
          </Btn>
        </div>
      </form>
    </div>
  )
}
