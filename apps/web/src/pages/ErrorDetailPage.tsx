import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { errorsApi } from '../api/client'
import { ArrowLeft } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function ErrorDetailPage() {
  const { fingerprint } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['error-group', fingerprint],
    queryFn: () => errorsApi.group(fingerprint!).then(r => r.data),
  })

  if (isLoading) return <div className="text-gray-500 text-sm">Loading…</div>
  if (!data) return <div className="text-gray-500 text-sm">Error group not found</div>

  return (
    <div className="space-y-4 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to errors
      </button>

      <div className="rounded-xl border p-5 space-y-4" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
        <div>
          <div className="text-red-400 font-medium">{data.error_type}</div>
          <p className="text-gray-300 text-sm mt-1">{data.message}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-500">Occurrences</span>
            <p className="text-white font-semibold mt-0.5">{data.count?.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">First seen</span>
            <p className="text-gray-300 text-xs mt-0.5">{formatDistanceToNow(new Date(data.first_seen), { addSuffix: true })}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Last seen</span>
            <p className="text-gray-300 text-xs mt-0.5">{formatDistanceToNow(new Date(data.last_seen), { addSuffix: true })}</p>
          </div>
        </div>

        {data.stack_trace && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Stack Trace</p>
            <pre className="text-xs text-gray-300 font-mono rounded-lg p-3 overflow-auto max-h-48" style={{ background: '#0f0f0f' }}>
              {data.stack_trace}
            </pre>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Recent Events</h3>
        <div className="space-y-2">
          {data.recent_events?.slice(0, 10).map((ev: any) => (
            <div key={ev.id} className="rounded-lg px-4 py-2.5 text-xs flex items-center justify-between" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <span className="text-gray-400">{ev.service || '—'} · {ev.environment || '—'}</span>
              <span className="text-gray-600 font-mono">{format(new Date(ev.created_at), 'MM-dd HH:mm:ss')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
