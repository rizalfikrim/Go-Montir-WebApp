import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mechanicApi, orderApi } from '@/services'
import { 
  Zap, Wrench, MapPin, Star, TrendingUp, 
  Activity, Power, AlertCircle, CheckCircle, 
  ArrowUpRight, Clock, Map as MapIcon, 
  Loader2, BellRing, ChevronRight
} from 'lucide-react'
import { getSocket, connectSocket } from '@/lib/socket'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocationTracker } from '@/hooks/useLocationTracker'
import PartnershipPopup from '@/components/mechanic/PartnershipPopup'

export default function MechanicDashboard() {
  const { user, accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [incomingOrder, setIncomingOrder] = useState<any>(null)
  const [showPartnershipPopup, setShowPartnershipPopup] = useState(false)
  
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['mechanic-profile'],
    queryFn: () => mechanicApi.getMyProfile().then(r => r.data.data),
  })

  const toggleOnline = useMutation({
    mutationFn: async (status: boolean) => {
      // Jika ingin online, ambil lokasi dulu untuk verifikasi
      if (status) {
        const hasSubscription = profile?.subscriptions && profile.subscriptions.length > 0;
        if (!hasSubscription) {
          throw new Error('SUBSCRIPTION_REQUIRED');
        }

        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            return reject(new Error('Browser tidak mendukung GPS.'))
          }
          
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords
              try {
                // Update status online & lokasi secara berurutan
                await mechanicApi.setOnlineStatus(true)
                await mechanicApi.updateLocation(latitude, longitude)
                resolve(true)
              } catch (err) {
                reject(err)
              }
            },
            (err) => {
              reject(new Error('Gagal mendapatkan lokasi. Pastikan GPS aktif.'))
            }
          )
        })
      } else {
        // Jika offline, cukup update status saja
        return mechanicApi.setOnlineStatus(false)
      }
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['mechanic-profile'] })
      toast.success(status ? 'Verifikasi lokasi berhasil. Anda sekarang ONLINE!' : 'Anda sekarang OFFLINE.')
    },
    onError: (err: any) => {
      if (err.message === 'SUBSCRIPTION_REQUIRED') {
        toast.error('Anda harus berlangganan paket kemitraan untuk bisa online!')
        setShowPartnershipPopup(true)
      } else {
        toast.error(err.message || 'Terjadi kesalahan')
      }
    }
  })

  const acceptOrder = useMutation({
    mutationFn: (id: string) => orderApi.accept(id),
    onSuccess: (res) => {
      toast.success('Pesanan diterima! Segera berangkat.')
      setIncomingOrder(null)
      navigate(`/order/${res.data.data.id}`)
    }
  })

  // Start tracking location if online
  useLocationTracker({
    accessToken,
    isOnline: profile?.isOnline ?? false,
    enabled: !!accessToken && !!profile,
  })

  useEffect(() => {
    if (!accessToken) return
    const socket = connectSocket(accessToken)
    
    socket.on('new_order_request', (data: any) => {
      console.log('Incoming order!', data)
      setIncomingOrder(data)
      // Play sound notification if possible
    })

    return () => {
      socket.off('new_order_request')
    }
  }, [accessToken])

  useEffect(() => {
    // Show partnership popup once per session if mechanic has no active subscription
    if (!loadingProfile && profile) {
      const hasSubscription = profile.subscriptions && profile.subscriptions.length > 0;
      
      if (!hasSubscription) {
        const hasSeen = sessionStorage.getItem('hasSeenPartnershipPopup')
        if (!hasSeen) {
          const timer = setTimeout(() => {
            setShowPartnershipPopup(true)
          }, 1500)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [loadingProfile, profile])

  const handleClosePartnershipPopup = () => {
    setShowPartnershipPopup(false)
    sessionStorage.setItem('hasSeenPartnershipPopup', 'true')
  }

  if (loadingProfile) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-full bg-slate-900 pb-24">
      {/* Hero Stats */}
      <div className="bg-slate-800/50 p-6 rounded-b-[2rem] border-b border-slate-700/50 shadow-2xl relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-slate-400 text-sm font-medium">Dashboard Montir</p>
            <h1 className="text-2xl font-black text-white">{user?.name}</h1>
          </div>
          <button 
            onClick={() => toggleOnline.mutate(!profile?.isOnline)}
            disabled={toggleOnline.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              profile?.isOnline 
                ? 'bg-success/20 text-success border border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            {toggleOnline.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            {profile?.isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card-glass p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendapatan</span>
            </div>
            <p className="text-xl font-black text-white">Rp 1.250.000</p>
            <p className="text-[10px] text-success font-bold mt-1">+12% dari kemarin</p>
          </div>
          <div className="card-glass p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-info" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Selesai</span>
            </div>
            <p className="text-xl font-black text-white">{profile?.totalOrdersDone || 0}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-warning fill-current" />
              <span className="text-[10px] text-slate-300 font-bold">{profile?.rating.toFixed(1)} Rating</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Status Mode */}
        {profile?.isOnline ? (
          <div className="p-8 rounded-3xl bg-slate-800/30 border border-primary/20 flex flex-col items-center justify-center text-center animate-pulse-glow">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <MapIcon className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">Sedang Mencari Order...</h3>
            <p className="text-sm text-slate-500 mt-1">Tetap buka aplikasi agar kami bisa mengirimkan pesanan di sekitarmu.</p>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-800/30 border border-slate-700/50 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4 text-slate-500">
              <Power className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">Anda Sedang Istirahat</h3>
            <p className="text-sm text-slate-500 mt-1">Aktifkan status online untuk mulai menerima pesanan hari ini.</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="card p-4 flex flex-col items-center text-center gap-2 hover:bg-slate-700/30">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Riwayat Kerja</span>
          </button>
          <button className="card p-4 flex flex-col items-center text-center gap-2 hover:bg-slate-700/30">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Ulasan User</span>
          </button>
        </div>

        {/* Tips Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Tips Hari Ini</h2>
          </div>
          <div className="card p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Prioritaskan Kecepatan</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tiba di lokasi di bawah 15 menit meningkatkan peluang mendapatkan tip dan rating bintang 5!
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Incoming Order Modal Overlay */}
      <AnimatePresence>
        {incomingOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md p-6 flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm card-glass border-primary/50 border-2 overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.3)]"
            >
              <div className="bg-primary p-4 text-center">
                <BellRing className="w-10 h-10 text-white mx-auto animate-bounce mb-2" />
                <h2 className="text-2xl font-black text-white">ORDER MASUK!</h2>
                <p className="text-primary-dark font-bold text-xs uppercase tracking-widest">Segera ambil sebelum hilang</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Jenis Masalah</p>
                    <p className="text-lg font-black text-white">{incomingOrder.order.serviceType?.name || 'Layanan Umum'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Jarak</p>
                    <p className="text-lg font-black text-primary">{incomingOrder.distance} KM</p>
                  </div>
                </div>

                <div className="card bg-slate-800/50 p-3 flex items-start gap-3 border-slate-700/50">
                  <MapPin className="w-4 h-4 text-danger flex-shrink-0 mt-1" />
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {incomingOrder.order.userAddress || 'Lokasi tidak tersedia'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIncomingOrder(null)}
                    className="flex-1 py-4 text-sm font-bold text-slate-400 hover:bg-slate-800 rounded-2xl transition-all"
                  >
                    Tolak
                  </button>
                  <button 
                    onClick={() => acceptOrder.mutate(incomingOrder.order.id)}
                    disabled={acceptOrder.isPending}
                    className="flex-[2] btn-primary py-4 text-base font-black shadow-glow"
                  >
                    {acceptOrder.isPending ? <Loader2 className="animate-spin" /> : 'TERIMA ORDER'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PartnershipPopup 
        isOpen={showPartnershipPopup} 
        onClose={handleClosePartnershipPopup} 
      />
    </div>
  )
}
