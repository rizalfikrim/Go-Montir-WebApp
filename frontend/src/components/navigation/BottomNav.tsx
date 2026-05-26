import { NavLink } from 'react-router-dom'
import { Home, Search, History, Bot, User, LayoutDashboard, Wrench } from 'lucide-react'

const userNav = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/search', label: 'Cari Montir', icon: Search },
  { to: '/chatbot', label: 'Chatbot', icon: Bot, isSpecial: true },
  { to: '/history', label: 'Riwayat', icon: History },
  { to: '/profile', label: 'Profil', icon: User },
]

const mechanicNav = [
  { to: '/mechanic', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/mechanic/orders', label: 'Pesanan', icon: ClipboardList },
  { to: '/mechanic/profile', label: 'Profil', icon: Wrench },
]

// Import ClipboardList specifically for mechanicNav
import { ClipboardList } from 'lucide-react'

interface Props {
  role: 'USER' | 'MECHANIC'
}

export default function BottomNav({ role }: Props) {
  const items = role === 'USER' ? userNav : mechanicNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/50 overflow-visible"
      style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-around px-2 py-2 overflow-visible relative">
        {items.map((item) => {
          const { to, label, icon: Icon, end, isSpecial } = item as any
          if (isSpecial) {
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative -mt-8 flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-lg border-4 border-slate-900 z-50 ${
                    isActive
                      ? 'text-white scale-110 shadow-primary/30'
                      : 'text-slate-300 hover:text-white hover:scale-105 active:scale-95'
                  }`
                }
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                  boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)'
                }}
              >
                <Icon className="w-6 h-6 animate-pulse-glow" />
              </NavLink>
            )
          }

          return (
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
          )
        })}
      </div>
    </nav>
  )
}
