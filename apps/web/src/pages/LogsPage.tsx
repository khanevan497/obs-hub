import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { logsApi } from '../api/client'
import { Search, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const LEVEL_COLORS: Record<string, string> = {
  debug: 'text-gray-400 bg-gray-400/10',
  info: 'text-blue-400 bg-blue-400/10',
  warn: 'text-yellow-400 bg-yellow-400/10',
  error: 'text-red-400 bg-red-400/10',
  fatal: 'text-red-300 bg-red-900/30',
}

const TIME_RANGES = [
  { label: '15m', minutes: 15 },
  { label: '1h', minutes: 60 },
  { label: '6h', minutes: 360 },
  { label: '24h', minutes: 1440 },
  { label: '7d', minutes: 10080 },
]

export default function LogsPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [inputQ, setInputQ] = useState('')
  const [range, setRange] = useState(60)
  const [page, setPage] = useState(1)

  const from = new Date(Date.now() - range * 60 * 1000).toISOString()

  const { data, isLoading } = useQuery({
    queryKey: ['logs', q, from, page],
    queryFn: () => logsApi.query({ q, from, page, limit: 50 }).then(r => r.data),
    keepPreviousData: true,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQ(inputQ)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Log Explorer</h1>
        <p className="text-xs text-gray-500 mt-0.5">Query: <code className="font-mono">level:error service:payments environment:production</code></p>
      </div>

      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={inputQ} onChange={e => setInputQ(e.target.value)}
              placeholder="level:error service:api ..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-white border focus:outline-none focus:border-violet-500 transition-colors"
              style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-violet-600 hover:bg-violet-700 text-white transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-1">
          {TIME_RANGES.map(r => (
            <button
              key={r.label} onClick={() => { setRange(r.minutes); setPage(1) }}
              className={`px-3 py-2 rounded-lg text-xs transition-colors ${range === r.minutes ? 'bg-violet-600/30 text-violet-300' : 'text-gray-400 hover:text-gray-200'}`}
              style={{ background: range === r.minutes ? undefined : '#1a1a1a', border: '1px solid #2a2a2a' }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2a2a2a' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium w-40">Timestamp</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium w-20">Level</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium w-28">Service</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Message</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">Loading…</td></tr>
            ) : !data?.data?.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">No logs found</td></tr>
            ) : (
              data.data.map((log: any, i: number) => (
                <tr
                  key={log.id}
                  onClick={() => navigate(`/logs/${log.id}`)}
                  className="cursor-pointer transition-colors hover:bg-white/5"
                  style={{ borderBottom: i < data.data.length - 1 ? '1px solid #1f1f1f' : undefined }}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                    {format(new Date(log.timestamp), 'MM-dd HH:mm:ss')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${LEVEL_COLORS[log.level] || 'text-gray-400'}`}>
                      {log.level?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{log.service || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 truncate max-w-xs">{log.message}</td>
                  <td className="px-3 py-2.5"><ChevronRight className="w-3 h-3 text-gray-600" /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{data.total} total logs</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border disabled:opacity-30 hover:text-white transition-colors" style={{ borderColor: '#2a2a2a' }}>Prev</button>
            <span className="px-3 py-1">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={data.data?.length < 50} className="px-3 py-1 rounded border disabled:opacity-30 hover:text-white transition-colors" style={{ borderColor: '#2a2a2a' }}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
