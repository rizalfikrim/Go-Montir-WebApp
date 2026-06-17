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
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [socketId, setSocketId] = useState<string>('')
  
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['mechanic-profile'],
    queryFn: () => mechanicApi.getMyProfile().then(r => r.data.data),
  })

  // Fetch pending orders (WAITING_ACCEPT status)
  const { data: pendingOrders, refetch: refetchPendingOrders } = useQuery({
    queryKey: ['mechanic-pending-orders'],
    queryFn: () => mechanicApi.getMyOrders().then(r => 
      r.data.data?.orders?.filter((o: any) => o.status === 'WAITING_ACCEPT') || []
    ),
  })

  const toggleOnline = useMutation({
    mutationFn: async (status: boolean) => {
      // Jika ingin online, ambil lokasi dulu untuk verifikasi
      if (status) {

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
      const hasSubscription = profile?.subscriptions && profile.subscriptions.length > 0;
      
      // Jika terjadi error (misalnya karena belum is_verified dari backend)
      // dan mekanik belum punya subscription, kita munculkan popup
      if (!hasSubscription) {
        toast.error('Akun belum diverifikasi atau belum memiliki paket kemitraan aktif.')
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
    if (!accessToken) {
      console.log('⚠️ No access token, skipping socket connection')
      setSocketStatus('disconnected')
      return
    }
    
    setSocketStatus('connecting')
    const socket = connectSocket(accessToken)
    console.log('🔧 [MechanicDashboard] Setting up socket listeners, current socket id:', socket?.id)
    
    const handleNewOrderRequest = (data: any) => {
      console.log('📱 [MechanicDashboard] Incoming order received!', data)
      setIncomingOrder(data)
      // Refetch pending orders as well
      refetchPendingOrders()
      toast.success('Pesanan baru masuk! 🔔', { duration: 4000 })
    }

    // Set up listeners - they will work even if socket is not connected yet
    socket.on('new_order_request', handleNewOrderRequest)
    
    const handleConnect = () => {
      console.log('✅ [MechanicDashboard] Socket connected, id:', socket.id)
      setSocketStatus('connected')
      setSocketId(socket.id || '')
    }
    
    const handleConnectError = (error: any) => {
      console.error('❌ [MechanicDashboard] Socket connection error:', error)
      setSocketStatus('disconnected')
    }
    
    const handleDisconnect = (reason: string) => {
      console.log('⚠️ [MechanicDashboard] Socket disconnected, reason:', reason)
      setSocketStatus('disconnected')
    }

    socket.on('connect', handleConnect)
    socket.on('connect_error', handleConnectError)
    socket.on('disconnect', handleDisconnect)
    
    // If already connected, update state
    if (socket.connected) {
      setSocketStatus('connected')
      setSocketId(socket.id || '')
    }

    return () => {
      console.log('🧹 [MechanicDashboard] Cleaning up socket listeners')
      socket.off('new_order_request', handleNewOrderRequest)
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleConnectError)
      socket.off('disconnect', handleDisconnect)
    }
  }, [accessToken])

  useEffect(() => {
    // Show partnership popup once per session if mechanic has no active subscription
    if (!loadingProfile && profile) {
      const hasSubscription = profile.subscriptions && profile.subscriptions.length > 0;
      
      if (!hasSubscription) {
        // Tampilkan popup setiap kali dashboard di-load jika belum ada subscription
        const timer = setTimeout(() => {
          setShowPartnershipPopup(true)
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [loadingProfile, profile])

  const handleClosePartnershipPopup = () => {
    setShowPartnershipPopup(false)
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
            <p className="text-xl font-black text-white">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(profile?.totalIncome || 0)}
            </p>
            <p className="text-[10px] text-success font-bold mt-1">Total Pendapatan</p>
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

        {/* Socket Status Indicator */}
        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold">
          <div className={`w-2 h-2 rounded-full ${
            socketStatus === 'connected' ? 'bg-success animate-pulse' :
            socketStatus === 'connecting' ? 'bg-warning animate-pulse' :
            'bg-danger'
          }`} />
          <span className={`uppercase tracking-widest ${
            socketStatus === 'connected' ? 'text-success' :
            socketStatus === 'connecting' ? 'text-warning' :
            'text-danger'
          }`}>
            {socketStatus === 'connected' ? `Socket Connected (${socketId?.slice(0, 8)})` :
             socketStatus === 'connecting' ? 'Socket Connecting...' :
             'Socket Disconnected'}
          </span>
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

        {/* Pending Orders (Fallback UI) */}
        {pendingOrders && pendingOrders.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-warning animate-bounce" />
              <h2 className="text-lg font-bold text-warning">Pesanan Menunggu Konfirmasi</h2>
            </div>
            <div className="space-y-3">
              {pendingOrders.map((order: any) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4 border-warning/30 bg-warning/5 flex items-start gap-4 cursor-pointer hover:border-warning/60 transition-all"
                  onClick={() => {
                    setIncomingOrder({ order, distance: 'Terpilih' })
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center text-warning flex-shrink-0">
                    <Clock className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{order.user?.name}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{order.userAddress}</p>
                    <p className="text-xs text-warning font-bold mt-2">Tap untuk terima pesanan</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
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
          <button 
            onClick={() => {
              const socket = getSocket()
              if (socket?.connected) {
                console.log('✅ Socket test - Connected successfully')
                toast.success(`Socket Connected!\nID: ${socket.id}`)
              } else {
                console.warn('⚠️ Socket test - Not connected')
                toast.error('Socket tidak terhubung')
              }
            }}
            className="card p-4 flex flex-col items-center text-center gap-2 hover:bg-slate-700/30"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              socketStatus === 'connected' 
                ? 'bg-success/10 text-success' 
                : 'bg-danger/10 text-danger'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Test Socket</span>
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
