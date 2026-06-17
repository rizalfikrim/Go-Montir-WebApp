import { useAuthStore } from '@/stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/services'
import { 
  User as UserIcon, Mail, Phone, Settings, LogOut, 
  Car, Plus, Trash2, Shield, ChevronRight, ArrowLeft, 
  Loader2, BadgeCheck, X, Edit2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // State untuk modals
  const [isEditPhoneOpen, setIsEditPhoneOpen] = useState(false)
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false)
  const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState<any>(null)
  const [newPhone, setNewPhone] = useState(user?.phone || '')
  const [newName, setNewName] = useState(user?.name || '')
  const [vehicleForm, setVehicleForm] = useState({
    type: 'MOTOR' as 'MOTOR' | 'MOBIL' | 'TRUK',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    plateNumber: '',
    color: '',
    isDefault: false,
  })

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile().then(r => r.data.data),
  })

  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => userApi.getVehicles().then(r => r.data.data),
  })

  // Mutation untuk update phone
  const updatePhoneMutation = useMutation({
    mutationFn: (phone: string) => userApi.updateProfile({ phone }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      const updatedUser = res.data?.data
      if (updatedUser) {
        useAuthStore.setState(state => ({
          user: state.user ? { ...state.user, ...updatedUser } : null
        }))
      }
      toast.success('Nomor HP berhasil diperbarui.')
      setIsEditPhoneOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal update nomor HP.')
    }
  })

  // Mutation untuk update name (username)
  const updateNameMutation = useMutation({
    mutationFn: (name: string) => userApi.updateProfile({ name }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      const updatedUser = res.data?.data
      if (updatedUser) {
        useAuthStore.setState(state => ({
          user: state.user ? { ...state.user, ...updatedUser } : null
        }))
      }
      toast.success('Nama lengkap berhasil diperbarui.')
      setIsEditNameOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal update nama.')
    }
  })

  // Mutation untuk add vehicle
  const addVehicleMutation = useMutation({
    mutationFn: (data: any) => userApi.addVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Kendaraan berhasil ditambahkan.')
      setIsAddVehicleOpen(false)
      resetVehicleForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal tambah kendaraan.')
    }
  })

  // Mutation untuk update vehicle
  const updateVehicleMutation = useMutation({
    mutationFn: (data: any) => userApi.updateVehicle(selectedVehicleForEdit.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Kendaraan berhasil diperbarui.')
      setIsEditVehicleOpen(false)
      resetVehicleForm()
      setSelectedVehicleForEdit(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal update kendaraan.')
    }
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

  const resetVehicleForm = () => {
    setVehicleForm({
      type: 'MOTOR',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      plateNumber: '',
      color: '',
      isDefault: false,
    })
  }

  const handleEditVehicle = (vehicle: any) => {
    setSelectedVehicleForEdit(vehicle)
    setVehicleForm({
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      plateNumber: vehicle.plateNumber || '',
      color: vehicle.color || '',
      isDefault: vehicle.isDefault,
    })
    setIsEditVehicleOpen(true)
  }

  const handleSavePhone = () => {
    if (!newPhone.trim()) {
      toast.error('Nomor HP tidak boleh kosong.')
      return
    }
    updatePhoneMutation.mutate(newPhone)
  }

  const handleSaveName = () => {
    if (!newName.trim()) {
      toast.error('Nama lengkap tidak boleh kosong.')
      return
    }
    updateNameMutation.mutate(newName)
  }

  const handleSaveVehicle = () => {
    if (!vehicleForm.brand.trim()) {
      toast.error('Merek kendaraan wajib diisi.')
      return
    }
    if (!vehicleForm.model.trim()) {
      toast.error('Model kendaraan wajib diisi.')
      return
    }

    if (selectedVehicleForEdit) {
      updateVehicleMutation.mutate(vehicleForm)
    } else {
      addVehicleMutation.mutate(vehicleForm)
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
          <button 
            onClick={() => {
              setNewName(profile?.name || user?.name || '')
              setIsEditNameOpen(true)
            }}
            className="flex items-center gap-4 pt-0 hover:opacity-80 transition-opacity text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nama Lengkap</p>
              <p className="text-sm font-semibold text-slate-200">{profile?.name || user?.name || '-'}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
          <button 
            onClick={() => {
              setIsEmailModalOpen(true)
            }}
            className="flex items-center gap-4 pt-4 hover:opacity-80 transition-opacity text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Email</p>
              <p className="text-sm font-semibold text-slate-200">{user?.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
          <button 
            onClick={() => {
              setNewPhone(profile?.phone || '')
              setIsEditPhoneOpen(true)
            }}
            className="flex items-center gap-4 pt-4 hover:opacity-80 transition-opacity text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nomor HP</p>
              <p className="text-sm font-semibold text-slate-200">{profile?.phone || '-'}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
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
            <button 
              onClick={() => {
                resetVehicleForm()
                setSelectedVehicleForEdit(null)
                setIsAddVehicleOpen(true)
              }}
              className="text-primary font-bold text-xs flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3 h-3" /> TAMBAH
            </button>
          </div>

          <div className="space-y-3">
            {loadingVehicles ? (
              [1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)
            ) : vehicles?.length > 0 ? (
              vehicles.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => handleEditVehicle(v)}
                  className="card p-4 flex items-center gap-4 group w-full text-left hover:border-primary/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-primary border border-slate-600/30">
                    {v.type === 'MOTOR' ? (
                      <span className="text-lg">🏍️</span>
                    ) : v.type === 'MOBIL' ? (
                      <span className="text-lg">🚗</span>
                    ) : (
                      <Car className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white">{v.brand} {v.model} ({v.year})</h4>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest ${
                        v.type === 'MOTOR' 
                          ? 'bg-primary/20 text-primary'
                          : v.type === 'MOBIL'
                          ? 'bg-info/20 text-info'
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {v.type}
                      </span>
                      {v.isDefault && <span className="text-[8px] px-1.5 py-0.5 bg-success/20 text-success rounded font-black">DEFAULT</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{v.plateNumber || 'BELUM ADA PLAT'}</p>
                    {v.color && <p className="text-xs text-slate-500">Warna: {v.color}</p>}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteVehicleMutation.mutate(v.id)
                    }}
                    className="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
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

      {/* Modal Edit Phone */}
      {isEditPhoneOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 animate-scale-in border border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Edit Nomor HP</h2>
              <button 
                onClick={() => setIsEditPhoneOpen(false)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nomor Telepon</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="input mt-2"
                />
                <p className="text-[10px] text-slate-500 mt-1">Format: +62 atau 0 diikuti 8, misal: 08123456789</p>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setIsEditPhoneOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSavePhone}
                disabled={updatePhoneMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatePhoneMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Vehicle */}
      {(isAddVehicleOpen || isEditVehicleOpen) && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm space-y-4 animate-slide-up sm:animate-scale-in border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-slate-800">
              <h2 className="text-lg font-bold text-white">
                {selectedVehicleForEdit ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
              </h2>
              <button 
                onClick={() => {
                  setIsAddVehicleOpen(false)
                  setIsEditVehicleOpen(false)
                  resetVehicleForm()
                  setSelectedVehicleForEdit(null)
                }}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Jenis Kendaraan */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jenis Kendaraan</label>
                <div className="flex gap-2 mt-2">
                  {['MOTOR', 'MOBIL'].map(type => (
                    <button
                      key={type}
                      onClick={() => setVehicleForm({ ...vehicleForm, type: type as any })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        vehicleForm.type === type
                          ? 'bg-primary text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {type === 'MOTOR' ? '🏍️ Motor' : '🚗 Mobil'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Merek */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Merek Kendaraan</label>
                <input
                  type="text"
                  value={vehicleForm.brand}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                  placeholder="Contoh: Honda, Toyota"
                  className="input mt-2"
                />
              </div>

              {/* Model */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Model</label>
                <input
                  type="text"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  placeholder="Contoh: Vario, Avanza"
                  className="input mt-2"
                />
              </div>

              {/* Tahun */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tahun</label>
                <input
                  type="number"
                  value={vehicleForm.year}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  className="input mt-2"
                />
              </div>

              {/* Plat Nomor */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plat Nomor (Opsional)</label>
                <input
                  type="text"
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                  placeholder="Contoh: B 1234 ABC"
                  className="input mt-2"
                />
              </div>

              {/* Warna */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Warna (Opsional)</label>
                <input
                  type="text"
                  value={vehicleForm.color}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                  placeholder="Contoh: Hitam, Merah"
                  className="input mt-2"
                />
              </div>

              {/* Default */}
              <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                <input
                  type="checkbox"
                  id="is-default"
                  checked={vehicleForm.isDefault}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, isDefault: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is-default" className="text-sm font-medium text-slate-200 cursor-pointer">
                  Jadikan kendaraan default
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setIsAddVehicleOpen(false)
                  setIsEditVehicleOpen(false)
                  resetVehicleForm()
                  setSelectedVehicleForEdit(null)
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveVehicle}
                disabled={addVehicleMutation.isPending || updateVehicleMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(addVehicleMutation.isPending || updateVehicleMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {selectedVehicleForEdit ? 'Perbarui' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Edit Name */}
      {isEditNameOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 animate-scale-in border border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Edit Nama Lengkap</h2>
              <button 
                onClick={() => setIsEditNameOpen(false)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="input mt-2"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setIsEditNameOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveName}
                disabled={updateNameMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updateNameMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Email (Read-Only) */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 animate-scale-in border border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Alamat Email</h2>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alamat Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="input mt-2 bg-slate-700/50 text-slate-400 border-slate-600/50 cursor-not-allowed select-all"
                />
                <p className="text-[10px] text-slate-500 mt-2">Email tidak dapat diubah demi keamanan akun Anda.</p>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
