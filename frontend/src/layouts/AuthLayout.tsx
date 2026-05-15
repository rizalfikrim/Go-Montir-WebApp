import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Wrench } from 'lucide-react'

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    if (user.role === 'MECHANIC') return <Navigate to="/mechanic" replace />
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(249,115,22,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.08) 0%, transparent 50%)',
        }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center animate-pulse-glow">
              <Wrench className="w-7 h-7 text-primary" />
            </div>
            <span className="text-3xl font-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Go<span className="text-primary">Montir</span>
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Montir Darurat <br />
            <span className="text-primary">Dalam Genggaman</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Temukan montir profesional terdekat dalam hitungan menit. Siap membantu 24/7 di seluruh Indonesia.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { value: '5.000+', label: 'Montir Aktif' },
              { value: '50K+', label: 'Pesanan Selesai' },
              { value: '4.9★', label: 'Rating Rata-rata' },
            ].map((stat) => (
              <div key={stat.label} className="card-glass text-center p-4">
                <div className="text-xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <span className="text-2xl font-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Go<span className="text-primary">Montir</span>
            </span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
