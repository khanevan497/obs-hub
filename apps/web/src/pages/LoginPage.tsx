import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { Activity } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@demo.com')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await authApi.login(email, password)
      localStorage.setItem('token', res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await fetch('/api/v1/demo/seed', { method: 'POST' })
      setError('')
      alert('Demo data seeded! Login with admin@demo.com / demo123')
    } catch {
      setError('Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f0f' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Activity className="w-7 h-7 text-violet-400" />
            <span className="text-2xl font-bold text-white">ObsHub</span>
          </div>
          <p className="text-gray-500 text-sm">Developer Observability Platform</p>
        </div>

        <div className="rounded-xl p-6 border" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <h2 className="text-lg font-semibold text-white mb-5">Sign in</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white border focus:outline-none focus:border-violet-500 transition-colors"
                style={{ background: '#0f0f0f', borderColor: '#2a2a2a' }}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white border focus:outline-none focus:border-violet-500 transition-colors"
                style={{ background: '#0f0f0f', borderColor: '#2a2a2a' }}
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#2a2a2a' }}>
            <button
              onClick={handleSeed} disabled={seeding}
              className="w-full py-2 rounded-lg text-sm text-gray-400 border hover:text-white hover:border-gray-500 disabled:opacity-50 transition-colors"
              style={{ borderColor: '#2a2a2a' }}
            >
              {seeding ? 'Seeding…' : 'Seed demo data'}
            </button>
            <p className="text-xs text-gray-600 mt-2 text-center">Creates demo org with sample logs, metrics & errors</p>
          </div>
        </div>
      </div>
    </div>
  )
}
