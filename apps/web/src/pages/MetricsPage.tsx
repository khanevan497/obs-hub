import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { metricsApi } from '../api/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'

const TIME_RANGES = [
  { label: '15m', minutes: 15 }, { label: '1h', minutes: 60 },
  { label: '6h', minutes: 360 }, { label: '24h', minutes: 1440 }, { label: '7d', minutes: 10080 },
]
const AGG = ['avg', 'sum', 'count', 'min', 'max']
const LINE_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e']

export default function MetricsPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [range, setRange] = useState(60)
  const [agg, setAgg] = useState('avg')

  const from = new Date(Date.now() - range * 60 * 1000).toISOString()

  const { data: names } = useQuery({
    queryKey: ['metric-names'],
    queryFn: () => metricsApi.names().then(r => r.data),
  })

  const queries = selected.map(name =>
    useQuery({
      queryKey: ['metric', name, from, agg],
      queryFn: () => metricsApi.query({ name, from, aggregation: agg }).then(r => r.data),
      enabled: !!name,
    })
  )

  const chartData = (() => {
    if (!selected.length) return []
    const buckets: Record<string, any> = {}
    queries.forEach((q, i) => {
      if (!q.data) return
      q.data.forEach((d: any) => {
        const key = format(new Date(d.bucket), 'HH:mm')
        if (!buckets[key]) buckets[key] = { time: key }
        buckets[key][selected[i]] = parseFloat(d.value).toFixed(2)
      })
    })
    return Object.values(buckets).sort((a: any, b: any) => a.time.localeCompare(b.time))
  })()

  const toggleMetric = (name: string) => {
    setSelected(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name])
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Metrics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Time-series metric explorer</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1">
          {TIME_RANGES.map(r => (
            <button key={r.label} onClick={() => setRange(r.minutes)}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${range === r.minutes ? 'bg-violet-600/30 text-violet-300' : 'text-gray-400 hover:text-gray-200'}`}
              style={{ background: range === r.minutes ? undefined : '#1a1a1a', border: '1px solid #2a2a2a' }}
            >{r.label}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {AGG.map(a => (
            <button key={a} onClick={() => setAgg(a)}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${agg === a ? 'bg-blue-600/30 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
              style={{ background: agg === a ? undefined : '#1a1a1a', border: '1px solid #2a2a2a' }}
            >{a.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-52 shrink-0 rounded-xl border p-3" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <p className="text-xs text-gray-500 mb-2">Metrics</p>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {!names?.length ? (
              <p className="text-xs text-gray-600">No metrics yet</p>
            ) : (
              names.map((name: string, i: number) => (
                <button key={name} onClick={() => toggleMetric(name)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${selected.includes(name) ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                  style={{ background: selected.includes(name) ? `${LINE_COLORS[i % LINE_COLORS.length]}20` : undefined, border: selected.includes(name) ? `1px solid ${LINE_COLORS[i % LINE_COLORS.length]}40` : '1px solid transparent' }}
                >
                  {name}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 rounded-xl border p-4" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
          {!selected.length ? (
            <div className="h-64 flex items-center justify-center text-gray-600 text-sm">Select metrics from the left panel</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e5e7eb' }} />
                {selected.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={false} name={name} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
