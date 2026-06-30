import { useAuthStore } from '@/stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mechanicApi, subscriptionApi } from '@/services'
import { 
  User as UserIcon, Mail, Phone, Settings, LogOut, 
  Wrench, ShieldCheck, Star, Award, 
  CreditCard, ChevronRight, ArrowLeft, 
  Loader2, BadgeCheck, Activity, Briefcase
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function MechanicProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['mechanic-profile-detail'],
    queryFn: () => mechanicApi.getProfile(user!.id).then(r => r.data.data),
  })

  const { data: subs } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => subscriptionApi.getMy().then(r => r.data.data),
  })

  const handleLogout = async () => {
    if (window.confirm('Yakin ingin keluar?')) {
      await logout()
      toast.success('Berhasil keluar.')
      navigate('/auth/login')
    }
  }

  return (
    <div className="min-h-full bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/mechanic')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Profil Montir</h1>
        </div>
        <button className="btn-ghost p-2">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
        {/* Profile Info */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-[2rem] bg-primary/20 border-4 border-slate-800 flex items-center justify-center text-3xl font-black text-primary shadow-glow overflow-hidden">
              {profile?.user.avatarUrl ? (
                <img 
                  src={profile.user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.log('❌ [Avatar] Image failed to load:', profile.user.avatarUrl)
                    // Fallback to initial
                    const img = e.target as HTMLImageElement
                    img.style.display = 'none'
                    const parent = img.parentElement
                    if (parent && !parent.textContent?.includes(user?.name?.charAt(0) ?? '')) {
                      parent.innerHTML = (user?.name?.charAt(0) ?? 'U').toUpperCase()
                    }
                  }}
                  onLoad={() => {
                    console.log('✅ [Avatar] Image loaded successfully:', profile.user.avatarUrl)
                  }}
                />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success border-4 border-slate-900 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-warning font-bold flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" /> {profile?.rating.toFixed(1)}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-medium">{profile?.totalOrdersDone || 0} Order Selesai</span>
            </div>
          </div>
        </section>

        {/* Specialized Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 bg-slate-800/40 border-slate-700/50">
            <Award className="w-5 h-5 text-primary mb-2" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Keahlian</p>
            <p className="text-sm font-bold text-slate-100 mt-1">
              {profile?.specializations?.join(', ') || 'Umum'}
            </p>
          </div>
          <div className="card p-4 bg-slate-800/40 border-slate-700/50">
            <Activity className="w-5 h-5 text-success mb-2" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Status Akun</p>
            <p className="text-sm font-bold text-success mt-1 uppercase">Aktif & Terverifikasi</p>
          </div>
        </div>

        {/* Bio Section */}
        <section className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tentang Saya</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed italic">
            "{profile?.bio || 'Belum ada bio. Tambahkan bio menarik agar pelanggan lebih percaya!'}"
          </p>
        </section>

        {/* Subscription Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-info" />
            </div>
            <h3 className="text-lg font-bold text-white">Paket Kemitraan</h3>
          </div>

          <div className="card p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-info/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-info/20 flex items-center justify-center text-info shadow-lg">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-info font-bold uppercase tracking-widest">Paket Aktif</p>
                <h4 className="font-black text-white text-lg">GoMontir Pro</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Berlaku sampai 12 Des 2026</p>
              </div>
            </div>
            <button className="text-xs font-bold text-info hover:underline">Kelola</button>
          </div>
        </section>

        {/* Menu Grid */}
        <section className="card divide-y divide-slate-700/50 p-0 overflow-hidden">
          {[
            { icon: UserIcon, label: 'Informasi Pribadi', color: 'text-slate-400' },
            { icon: Award, label: 'Sertifikasi & Izin', color: 'text-slate-400' },
            { icon: Settings, label: 'Pengaturan Notifikasi', color: 'text-slate-400' },
          ].map((item, i) => (
            <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-all text-left">
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm font-semibold text-slate-200">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          ))}
        </section>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 text-danger font-bold hover:bg-danger/5 rounded-2xl border border-transparent hover:border-danger/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Keluar dari Aplikasi
        </button>
      </div>
    </div>
  )
}
