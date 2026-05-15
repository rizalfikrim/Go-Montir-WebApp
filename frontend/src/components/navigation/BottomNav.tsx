import { NavLink } from 'react-router-dom'
import { Home, Search, ClipboardList, Bell, User, LayoutDashboard, Wrench } from 'lucide-react'

const userNav = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/search', label: 'Cari Montir', icon: Search },
  { to: '/history', label: 'Riwayat', icon: ClipboardList },
  { to: '/notifications', label: 'Notifikasi', icon: Bell },
  { to: '/profile', label: 'Profil', icon: User },
]

const mechanicNav = [
  { to: '/mechanic', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/mechanic/orders', label: 'Pesanan', icon: ClipboardList },
  { to: '/mechanic/profile', label: 'Profil', icon: Wrench },
]

interface Props {
  role: 'USER' | 'MECHANIC'
}

export default function BottomNav({ role }: Props) {
  const items = role === 'USER' ? userNav : mechanicNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/50"
      style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive
                  ? 'text-primary'
                  : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary/15' : ''
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
