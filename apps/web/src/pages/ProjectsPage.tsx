import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/client'
import { Plus, Copy, Check, FolderKanban } from 'lucide-react'
import { format } from 'date-fns'

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', environment: 'production' })
  const [newApiKey, setNewApiKey] = useState<{ projectName: string, key: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => projectsApi.create(form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setShowCreate(false)
      setNewApiKey({ projectName: form.name, key: res.data.api_key })
      setForm({ name: '', environment: 'production' })
    },
  })

  const copyKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage ingestion projects</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-violet-600 hover:bg-violet-700 text-white transition-colors">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {newApiKey && (
        <div className="rounded-xl border p-4" style={{ background: '#0a1a0a', borderColor: '#1a4a1a' }}>
          <p className="text-green-400 text-sm font-medium mb-1">Project "{newApiKey.projectName}" created</p>
          <p className="text-xs text-gray-400 mb-2">Copy this API key — it won't be shown again:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xs text-green-300 px-3 py-2 rounded" style={{ background: '#0f0f0f' }}>
              {newApiKey.key}
            </code>
            <button onClick={copyKey} className="p-2 rounded hover:bg-white/5 transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          <button onClick={() => setNewApiKey(null)} className="text-xs text-gray-600 mt-2 hover:text-gray-400">Dismiss</button>
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border p-4 space-y-3" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <h3 className="text-sm font-medium text-white">New Project</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Project Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="My App"
                className="w-full px-3 py-2 rounded-lg text-sm text-white border focus:outline-none focus:border-violet-500"
                style={{ background: '#0f0f0f', borderColor: '#2a2a2a' }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Environment</label>
              <select value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white border focus:outline-none"
                style={{ background: '#0f0f0f', borderColor: '#2a2a2a' }}>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 rounded text-sm text-gray-400 border hover:text-white transition-colors" style={{ borderColor: '#2a2a2a' }}>Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}
              className="px-4 py-1.5 rounded text-sm bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-colors">
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-gray-500 text-sm">Loading…</div>
        ) : !projects?.length ? (
          <div className="rounded-xl border p-8 text-center text-gray-500 text-sm" style={{ borderColor: '#2a2a2a' }}>
            No projects yet.
          </div>
        ) : (
          projects.map((project: any) => (
            <div key={project.id} className="rounded-xl border p-4 flex items-center justify-between" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
              <div className="flex items-center gap-3">
                <FolderKanban className="w-5 h-5 text-violet-400" />
                <div>
                  <div className="text-sm text-white font-medium">{project.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{project.environment} · Created {format(new Date(project.created_at), 'MMM d, yyyy')}</div>
                </div>
              </div>
              <span className="text-xs font-mono text-gray-600">{project.id.slice(0, 8)}…</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
