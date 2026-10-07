import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ScrollText, AlertTriangle, BarChart2,
  Bell, FolderKanban, Settings, LogOut, Activity
} from 'lucide-react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
  { to: '/errors', icon: AlertTriangle, label: 'Errors' },
  { to: '/metrics', icon: BarChart2, label: 'Metrics' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <aside className="w-56 flex flex-col border-r shrink-0" style={{ background: '#111', borderColor: '#2a2a2a' }}>
      <div className="p-4 border-b" style={{ borderColor: '#2a2a2a' }}>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-400" />
          <span className="font-semibold text-sm text-white">ObsHub</span>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t" style={{ borderColor: '#2a2a2a' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
