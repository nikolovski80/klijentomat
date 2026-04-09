import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { LayoutDashboard, Search, Mail, Brain, BarChart2, Settings, LogOut, Zap } from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Pregled', exact: true },
  { to: '/tehnicar', icon: Search, label: 'Tehničar' },
  { to: '/komercijalista', icon: Mail, label: 'Komercijalista' },
  { to: '/mozak', icon: Brain, label: 'Mozak firme' },
  { to: '/izvestaj', icon: BarChart2, label: 'Izveštaj' },
  { to: '/podesavanja', icon: Settings, label: 'Podešavanja' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-dark text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-panel border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="text-xs text-slate-600 tracking-widest mb-1">SISTEM</div>
          <div className="text-xl font-bold">
            Klijento<span className="text-brand-500">mat</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">AI Tim Radnika</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-all ` +
                (isActive
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-transparent text-slate-500 hover:text-slate-300')
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-5 py-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 mt-2"
          >
            <LogOut size={12} /> Odjava
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
