import { useQuery } from '@tanstack/react-query'
import { authApi } from '../api/client'

export default function SettingsPage() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then(r => r.data),
  })

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Account & organization</p>
      </div>

      <div className="rounded-xl border p-5 space-y-4" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
        <h2 className="text-sm font-medium text-white">Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Name', me?.name],
            ['Email', me?.email],
            ['Role', me?.role],
            ['Organization', me?.organization?.name],
          ].map(([label, value]) => (
            <div key={label as string}>
              <span className="text-xs text-gray-500">{label}</span>
              <p className="text-gray-300 mt-0.5">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border p-5 space-y-3" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
        <h2 className="text-sm font-medium text-white">Organization</h2>
        <div className="text-sm">
          <span className="text-xs text-gray-500">ID</span>
          <p className="text-gray-300 font-mono text-xs mt-0.5">{me?.organization_id}</p>
        </div>
      </div>
    </div>
  )
}
