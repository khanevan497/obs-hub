import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { logsApi } from '../api/client'
import { ArrowLeft, Link } from 'lucide-react'
import { format } from 'date-fns'

const LEVEL_COLORS: Record<string, string> = {
  debug: 'text-gray-400', info: 'text-blue-400', warn: 'text-yellow-400', error: 'text-red-400', fatal: 'text-red-300',
}

export default function LogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: log, isLoading } = useQuery({
    queryKey: ['log', id],
    queryFn: () => logsApi.get(id!).then(r => r.data),
  })

  if (isLoading) return <div className="text-gray-500 text-sm">Loading…</div>
  if (!log) return <div className="text-gray-500 text-sm">Log not found</div>

  return (
    <div className="space-y-4 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to logs
      </button>

      <div className="rounded-xl border p-5 space-y-4" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
        <div className="flex items-start gap-3">
          <span className={`text-sm font-medium ${LEVEL_COLORS[log.level] || 'text-gray-400'}`}>{log.level?.toUpperCase()}</span>
          <span className="text-xs text-gray-500 font-mono">{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}</span>
        </div>

        <p className="text-white text-sm leading-relaxed">{log.message}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Service', log.service], ['Environment', log.environment],
            ['Trace ID', log.trace_id], ['Request ID', log.request_id],
          ].map(([label, val]) => val ? (
            <div key={label as string}>
              <span className="text-xs text-gray-500">{label}</span>
              <p className="text-gray-300 font-mono text-xs mt-0.5">{val}</p>
            </div>
          ) : null)}
        </div>

        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Metadata</p>
            <pre className="text-xs text-gray-300 font-mono rounded-lg p-3 overflow-auto" style={{ background: '#0f0f0f' }}>
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}

        {log.trace_id && (
          <button
            onClick={() => navigate(`/logs?q=trace_id:${log.trace_id}`)}
            className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Link className="w-3 h-3" /> View related events with trace_id: {log.trace_id}
          </button>
        )}
      </div>
    </div>
  )
}
