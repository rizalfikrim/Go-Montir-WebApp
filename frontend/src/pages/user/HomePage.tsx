import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Zap, Star, Clock, ChevronRight, AlertTriangle, Wrench } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { serviceApi } from '@/services'
import toast from 'react-hot-toast'

const statusMessages = [
  { emoji: '🔧', text: 'Ban kempes di tengah jalan?' },
  { emoji: '🚗', text: 'Mesin tiba-tiba mati?' },
  { emoji: '⛽', text: 'Kehabisan bensin?' },
  { emoji: '🔋', text: 'Aki soak mendadak?' },
]

export default function HomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [msgIdx, setMsgIdx] = useState(0)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceApi.getAll().then(r => r.data.data),
  })

  // Rotate status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(i => (i + 1) % statusMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleEmergency = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung GPS.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        navigate('/search', { state: { lat: pos.coords.latitude, lon: pos.coords.longitude } })
      },
      () => toast.error('Akses lokasi ditolak. Aktifkan GPS.')
    )
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="animate-fade-in">
        <p className="text-slate-400 text-sm">Halo,</p>
        <h1 className="text-2xl font-bold text-white">
          {user?.name?.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Emergency CTA */}
      <div className="animate-slide-up">
        <button
          id="emergency-btn"
          onClick={handleEmergency}
          className="w-full p-6 rounded-2xl border-2 border-primary/40 text-left relative overflow-hidden transition-all duration-300 hover:border-primary group"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))' }}
        >
          {/* Glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.1) 0%, transparent 70%)' }} />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse-glow">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <span className="text-primary font-bold text-sm uppercase tracking-wider">Darurat</span>
              </div>
              <h2 className="text-white text-xl font-bold mb-1">Cari Montir Sekarang</h2>
              <p className="text-slate-400 text-sm h-5 transition-all duration-500">
                {statusMessages[msgIdx].emoji} {statusMessages[msgIdx].text}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mt-1 group-hover:bg-primary/30 transition-all">
              <Wrench className="w-7 h-7 text-primary animate-spin-slow" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-primary font-semibold text-sm relative z-10">
            <span>Temukan montir terdekat</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Service Types */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Jenis Layanan</h2>
        <div className="grid grid-cols-2 gap-3">
          {services?.slice(0, 4).map((svc: any) => (
            <button
              key={svc.id}
              onClick={() => navigate('/search', { state: { serviceTypeId: svc.id } })}
              className="card p-4 text-left hover:border-primary/40 group"
            >
              <div className="text-2xl mb-2">{svc.iconUrl || '🔧'}</div>
              <p className="font-semibold text-sm text-white group-hover:text-primary transition-colors">{svc.name}</p>
              <p className="text-xs text-slate-400 mt-1">~{svc.estimatedTime} menit</p>
              <p className="text-xs text-primary font-medium mt-1">
                Mulai Rp {svc.basePrice?.toLocaleString('id-ID')}
              </p>
            </button>
          )) ?? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: MapPin, label: 'Montir Terdekat', value: '2.3 km', color: 'text-primary' },
          { icon: Star, label: 'Rating Tertinggi', value: '4.9 ★', color: 'text-warning' },
          { icon: Clock, label: 'Rata-rata Tiba', value: '< 15 mnt', color: 'text-success' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <p className={`text-sm font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Safety Tips */}
      <div className="card-glass p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-warning" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Tips Keamanan</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Selalu aktifkan lampu hazard dan berhenti di tempat aman sebelum menghubungi montir.
          </p>
        </div>
      </div>
    </div>
  )
}
