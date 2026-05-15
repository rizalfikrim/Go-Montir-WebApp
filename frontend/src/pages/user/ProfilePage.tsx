import { useAuthStore } from '@/stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/services'
import { 
  User as UserIcon, Mail, Phone, Settings, LogOut, 
  Car, Plus, Trash2, Shield, ChevronRight, ArrowLeft, 
  Loader2, BadgeCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile().then(r => r.data.data),
  })

  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => userApi.getVehicles().then(r => r.data.data),
  })

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Kendaraan dihapus.')
    }
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
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Profil Saya</h1>
        </div>
        <button className="btn-ghost p-2">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
        {/* User Card */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-slate-800 flex items-center justify-center text-3xl font-black text-primary shadow-glow">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {profile?.isVerified && (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-success border-4 border-slate-900 rounded-full flex items-center justify-center">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 mt-3">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{user?.role} ACCOUNT</span>
            </div>
          </div>
        </section>

        {/* Info Grid */}
        <section className="card p-4 grid grid-cols-1 gap-4 divide-y divide-slate-700/50">
          <div className="flex items-center gap-4 pt-0">
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Email</p>
              <p className="text-sm font-semibold text-slate-200">{user?.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nomor HP</p>
              <p className="text-sm font-semibold text-slate-200">{user?.phone || '-'}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </div>
        </section>

        {/* Vehicles Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Car className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">Kendaraan Saya</h3>
            </div>
            <button className="text-primary font-bold text-xs flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" /> TAMBAH
            </button>
          </div>

          <div className="space-y-3">
            {loadingVehicles ? (
              [1, 2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)
            ) : vehicles?.length > 0 ? (
              vehicles.map((v: any) => (
                <div key={v.id} className="card p-4 flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-primary border border-slate-600/30">
                    <Car className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">{v.brand} {v.model}</h4>
                      {v.isDefault && <span className="text-[9px] px-1.5 py-0.5 bg-primary/20 text-primary rounded font-black">DEFAULT</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{v.plateNumber || 'TIDAK ADA PLAT'}</p>
                  </div>
                  <button 
                    onClick={() => deleteVehicleMutation.mutate(v.id)}
                    className="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center">
                <p className="text-sm text-slate-500">Belum ada kendaraan.</p>
              </div>
            )}
          </div>
        </section>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 text-danger font-bold hover:bg-danger/5 rounded-2xl border border-transparent hover:border-danger/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Keluar dari Aplikasi
        </button>

        <div className="text-center">
          <p className="text-[10px] text-slate-600 font-bold tracking-[0.2em] uppercase">GoMontir v1.0.0 (Production)</p>
        </div>
      </div>
    </div>
  )
}
