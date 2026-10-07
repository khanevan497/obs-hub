import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { dashboardApi } from '../api/client'
import { Activity, AlertTriangle, TrendingUp, Clock, Zap } from 'lucide-react'
import { format, parseISO } from 'date-fns'

function StatCard({ label, value, icon: Icon, color = 'violet' }: any) {
  const colors: any = {
    violet: 'text-violet-400 bg-violet-400/10',
    red: 'text-red-400 bg-red-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10',
    green: 'text-green-400 bg-green-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
  }
  return (
    <div className="rounded-xl p-5 border" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-semibold text-white">{value ?? '—'}</p>
        </div>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.summary().then(r => r.data),
    refetchInterval: 30000,
  })

  const chartData = (data?.logs_timeseries || []).map((d: any) => ({
    time: format(new Date(d.bucket), 'HH:mm'),
    events: parseInt(d.count),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform overview</p>
        </div>
        <button onClick={() => refetch()} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Events Today" value={data?.events_today?.toLocaleString()} icon={Activity} color="violet" />
            <StatCard label="Errors Today" value={data?.errors_today?.toLocaleString()} icon={AlertTriangle} color="red" />
            <StatCard label="Error Rate" value={`${data?.error_rate ?? 0}%`} icon={TrendingUp} color="yellow" />
            <StatCard label="P95 Latency" value={`${data?.p95_latency ?? 0}ms`} icon={Clock} color="blue" />
            <StatCard label="Active Incidents" value={data?.active_incidents ?? 0} icon={Zap} color={data?.active_incidents > 0 ? 'red' : 'green'} />
          </div>

          <div className="rounded-xl p-5 border" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
            <h2 className="text-sm font-medium text-white mb-4">Events (last 24h)</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e5e7eb' }} />
                  <Line type="monotone" dataKey="events" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">No data yet — seed some demo data</div>
            )}
          </div>

          {data?.incidents?.length > 0 && (
            <div className="rounded-xl p-5 border border-red-900/50" style={{ background: '#1a0a0a' }}>
              <h2 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Active Incidents ({data.incidents.length})
              </h2>
              <div className="space-y-2">
                {data.incidents.map((inc: any) => (
                  <div key={inc.id} className="flex items-center justify-between text-sm p-3 rounded-lg" style={{ background: '#2a0a0a' }}>
                    <span className="text-gray-300">{inc.message || 'Alert triggered'}</span>
                    <span className="text-red-400 text-xs">● TRIGGERED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
