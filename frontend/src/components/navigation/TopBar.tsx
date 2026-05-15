import { Bell, Wrench, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Link } from 'react-router-dom'

export default function TopBar() {
  const { user, logout } = useAuthStore()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 border-b border-slate-700/50"
      style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Wrench className="w-4 h-4 text-primary" />
        </div>
        <span className="font-black text-lg hidden sm:block" style={{ fontFamily: 'Montserrat' }}>
          Go<span className="text-primary">Montir</span>
        </span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition-all"
        >
          <Bell className="w-5 h-5" />
          {/* Unread badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </Link>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-500 hover:text-danger hover:bg-danger/10 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
