import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '../api/client'
import { Plus, Trash2, Zap, CheckCircle } from 'lucide-react'

const SEV_COLORS: Record<string, string> = {
  critical: 'text-red-400', warning: 'text-yellow-400', info: 'text-blue-400',
}

function CreateAlertModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', metric_name: 'api.request.duration', condition: 'gt',
    threshold: 500, window_seconds: 300, severity: 'warning', project_id: '',
  })

  const mutation = useMutation({
    mutationFn: () => alertsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl border p-6 w-full max-w-md" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
        <h2 className="text-white font-semibold mb-4">Create Alert Rule</h2>
        <div className="space-y-3">
          {[
            { label: 'Name', key: 'name', type: 'text' },
            { label: 'Metric Name', key: 'metric_name', type: 'text' },
            { label: 'Threshold', key: 'threshold', type: 'number' },
            { label: 'Window (seconds)', key: 'window_seconds', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input
                type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white border focus:outline-none focus:border-violet-500"
                style={{ background: '#0f0f0f', borderColor: '#2a2a2a' }}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Condition</label>
              <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white border focus:outline-none" style={{ background: '#0f0f0f', borderColor: '#2a2a2a' }}>
                <option value="gt">&gt; greater than</option>
                <option value="lt">&lt; less than</option>
                <option value="gte">&ge; gte</option>
                <option value="lte">&le; lte</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white border focus:outline-none" style={{ background: '#0f0f0f', borderColor: '#2a2a2a' }}>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm border text-gray-400 hover:text-white transition-colors" style={{ borderColor: '#2a2a2a' }}>Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}
            className="flex-1 py-2 rounded-lg text-sm bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-colors">
            {mutation.isPending ? 'Creating…' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list().then(r => r.data),
    refetchInterval: 15000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Alert rules & active incidents</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-violet-600 hover:bg-violet-700 text-white transition-colors">
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </div>

      {isLoading ? <div className="text-gray-500 text-sm">Loading…</div> : (
        <div className="space-y-2">
          {!alerts?.length ? (
            <div className="rounded-xl border p-8 text-center text-gray-500 text-sm" style={{ borderColor: '#2a2a2a' }}>
              No alert rules yet. Create your first one.
            </div>
          ) : (
            alerts.map((alert: any) => (
              <div key={alert.id} className="rounded-xl border p-4 flex items-center justify-between" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                <div className="flex items-center gap-3">
                  {alert.active_incident ? (
                    <Zap className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  <div>
                    <div className="text-sm text-white font-medium">{alert.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 font-mono">
                      {alert.metric_name} {alert.condition} {alert.threshold} over {alert.window_seconds}s
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${SEV_COLORS[alert.severity] || 'text-gray-400'}`}>
                    {alert.severity?.toUpperCase()}
                  </span>
                  {alert.active_incident && (
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">TRIGGERED</span>
                  )}
                  <button onClick={() => deleteMutation.mutate(alert.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showCreate && <CreateAlertModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
