import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { errorsApi } from '../api/client'
import { format, formatDistanceToNow } from 'date-fns'
import { ChevronRight } from 'lucide-react'

export default function ErrorsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['error-groups'],
    queryFn: () => errorsApi.groups().then(r => r.data),
    refetchInterval: 30000,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Errors</h1>
        <p className="text-sm text-gray-500 mt-0.5">Grouped by fingerprint</p>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2a2a2a' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Error</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium w-24">Count</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium w-32">First Seen</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium w-32">Last Seen</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">Loading…</td></tr>
            ) : !data?.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">No errors recorded</td></tr>
            ) : (
              data.map((group: any, i: number) => (
                <tr
                  key={group.fingerprint}
                  onClick={() => navigate(`/errors/${group.fingerprint}`)}
                  className="cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ borderBottom: i < data.length - 1 ? '1px solid #1f1f1f' : undefined }}
                >
                  <td className="px-4 py-3">
                    <div className="text-red-400 text-xs font-medium">{group.error_type}</div>
                    <div className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">{group.message}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-mono text-xs">{parseInt(group.count).toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {group.first_seen ? formatDistanceToNow(new Date(group.first_seen), { addSuffix: true }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {group.last_seen ? formatDistanceToNow(new Date(group.last_seen), { addSuffix: true }) : '—'}
                  </td>
                  <td className="px-3 py-3"><ChevronRight className="w-3 h-3 text-gray-600" /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
