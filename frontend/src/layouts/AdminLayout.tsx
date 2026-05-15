import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShoppingBag, Wrench,
  LogOut, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Pengguna', icon: Users },
  { to: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { logout, user } = useAuthStore()

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-slate-800 border-r border-slate-700/50 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          {sidebarOpen && (
            <span className="font-black text-xl" style={{ fontFamily: 'Montserrat' }}>
              Go<span className="text-primary">Montir</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium text-sm">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-slate-700/50">
          {sidebarOpen && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs text-slate-400">Login sebagai</p>
              <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-danger/10 hover:text-danger transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-slate-800/50 border-b border-slate-700/50 flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-ghost p-2"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="font-semibold text-slate-100">Admin Panel</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
