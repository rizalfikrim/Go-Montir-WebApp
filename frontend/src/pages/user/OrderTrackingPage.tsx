import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Phone, MessageSquare, XCircle, MapPin,
  Clock, CreditCard, CheckCircle2, Loader2, Navigation,
  Wrench, AlertCircle, ShieldCheck, Zap, ChevronRight, Download, Star
} from 'lucide-react'
import { orderApi, paymentApi } from '@/services'
import { getSocket, connectSocket } from '@/lib/socket'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Map from '@/components/common/Map'
import ChatDrawer from '@/components/common/ChatDrawer'

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  PENDING:           { label: 'Menunggu', icon: Clock, color: 'text-warning', desc: 'Pesanan Anda telah masuk sistem.' },
  SEARCHING:         { label: 'Mencari Montir', icon: Loader2, color: 'text-info', desc: 'Kami sedang mencarikan montir terdekat.' },
  WAITING_ACCEPT:    { label: 'Menunggu Konfirmasi', icon: Clock, color: 'text-info', desc: 'Mengirim permintaan ke montir...' },
  MECHANIC_ACCEPTED: { label: 'Montir Ditemukan', icon: ShieldCheck, color: 'text-success', desc: 'Montir telah menyetujui pesanan Anda.' },
  OTW:               { label: 'Dalam Perjalanan', icon: Navigation, color: 'text-primary', desc: 'Montir sedang menuju lokasi Anda.' },
  ARRIVED:           { label: 'Montir Sampai', icon: MapPin, color: 'text-success', desc: 'Montir sudah berada di lokasi Anda.' },
  IN_PROGRESS:       { label: 'Sedang Dikerjakan', icon: Wrench, color: 'text-primary', desc: 'Kendaraan Anda sedang diperbaiki.' },
  COMPLETED:         { label: 'Selesai', icon: CheckCircle2, color: 'text-success', desc: 'Pekerjaan telah selesai. Terima kasih!' },
  CANCELLED:         { label: 'Dibatalkan', icon: XCircle, color: 'text-danger', desc: 'Pesanan telah dibatalkan.' },
  FAILED:            { label: 'Gagal', icon: AlertCircle, color: 'text-danger', desc: 'Tidak berhasil menemukan montir.' },
}

const STEPS = ['SEARCHING', 'MECHANIC_ACCEPTED', 'OTW', 'IN_PROGRESS', 'COMPLETED']

export default function OrderTrackingPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const [order, setOrder] = useState<any>(null)
  const [mechanicPos, setMechanicPos] = useState<[number, number] | null>(null)
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [socketInstance, setSocketInstance] = useState<any>(null)

  const { data: initialOrder, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getDetail(orderId!).then(r => r.data.data),
  })

  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder)
    }
  }, [initialOrder])

  useEffect(() => {
    if (!orderId || !accessToken) return

    const socket = connectSocket(accessToken)
    setSocketInstance(socket)
    socket.emit('join_order', orderId)

    socket.on('order_status_changed', (updated: any) => {
      // Re-fetch or update state
      setOrder((prev: any) => ({ ...prev, ...updated }))
      toast.success(`Status: ${STATUS_CONFIG[updated.status]?.label || updated.status}`)
    })

    socket.on('order_auto_cancelled', (data: any) => {
      toast.error(`Pesanan dibatalkan: ${data.reason}`)
      setOrder((prev: any) => ({ ...prev, status: 'FAILED' }))
      setTimeout(() => navigate('/'), 2000)
    })

    socket.on('mechanic_location', (data: any) => {
      console.log('Mechanic location update:', data)
      if (data.lat && data.lon) {
        setMechanicPos([data.lat, data.lon])
      }
    })

    return () => {
      socket.emit('leave_order', orderId)
      socket.off('order_status_changed')
      socket.off('order_auto_cancelled')
      socket.off('mechanic_location')
    }
  }, [orderId, accessToken])

  // Fallback polling untuk detect auto-cancel jika socket tidak bekerja (polling every 5 seconds saat WAITING_ACCEPT)
  useEffect(() => {
    if (!orderId || !order || order.status !== 'WAITING_ACCEPT') return

    const interval = setInterval(async () => {
      try {
        const res = await orderApi.getDetail(orderId)
        const latestOrder = res.data.data
        if (latestOrder.status !== order.status) {
          setOrder(latestOrder)
          if (latestOrder.status === 'FAILED') {
            toast.error('Pesanan dibatalkan otomatis karena montir tidak merespons')
            setTimeout(() => navigate('/'), 2000)
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [orderId, order?.status])


  const cancelMutation = useMutation({
    mutationFn: () => orderApi.updateStatus(orderId!, 'CANCELLED', 'Dibatalkan oleh pengguna'),
    onSuccess: () => {
      toast.success('Pesanan dibatalkan.')
      navigate('/')
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => orderApi.updateStatus(orderId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status')
    }
  })

  const loadSnapScript = (clientKey: string, isProduction: boolean) => {
    return new Promise<void>((resolve, reject) => {
      const scriptId = 'midtrans-snap-script';
      if (document.getElementById(scriptId)) {
        // If script is already there, we might need to recreate it if the mode changes,
        // but normally it stays the same. To be safe, resolve directly.
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = isProduction 
        ? 'https://app.midtrans.com/snap/snap.js' 
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', clientKey);
      script.id = scriptId;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap SDK'));
      document.body.appendChild(script);
    });
  };

  const paymentMutation = useMutation({
    mutationFn: (method: 'QRIS' | 'COD') => paymentApi.createTransaction(orderId!, method),
    onSuccess: async (res, method) => {
      if (method === 'COD') {
        toast.success('Metode Pembayaran Tunai (COD) dipilih. Silakan bayar ke montir.')
        setShowPaymentOptions(false)
        queryClient.invalidateQueries({ queryKey: ['order', orderId] })
        return
      }

      const { snapPayload, clientKey, isProduction } = res.data.data
      if (!snapPayload || !snapPayload.token) {
        toast.error('Gagal mendapatkan token pembayaran dari server.')
        return
      }

      try {
        await loadSnapScript(clientKey || '', !!isProduction);
        if ((window as any).snap) {
          (window as any).snap.pay(snapPayload.token, {
            onSuccess: (result: any) => {
              toast.success('Pembayaran Berhasil!')
              queryClient.invalidateQueries({ queryKey: ['order', orderId] })
              setShowPaymentOptions(false)
            },
            onPending: (result: any) => {
              toast.success('Menunggu Pembayaran...')
              setShowPaymentOptions(false)
            },
            onError: (result: any) => {
              toast.error('Pembayaran Gagal.')
            },
            onClose: () => {
              toast('Modal pembayaran ditutup.', { icon: 'ℹ️' })
            }
          })
        } else {
          toast.error('Sistem pembayaran belum siap.')
        }
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat sistem pembayaran.')
      }
    }
  })

  // Action for Mechanic to confirm manual payment
  const confirmPaymentMutation = useMutation({
    mutationFn: (transactionId: string) => paymentApi.confirm(transactionId),
    onSuccess: () => {
      toast.success('Pembayaran dikonfirmasi! Pesanan lunas.')
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal mengonfirmasi pembayaran.'
      toast.error(msg)
    }
  })

  const submitReviewMutation = useMutation({
    mutationFn: (data: { rating: number; comment?: string }) => orderApi.submitReview(orderId!, data),
    onSuccess: () => {
      toast.success('Terima kasih atas ulasan Anda!');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulasan.');
    }
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  if (isLoading || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Memuat detail pesanan...</p>
      </div>
    )
  }

  const isUser = useAuthStore.getState().user?.role === 'USER'
  const isMechanic = useAuthStore.getState().user?.role === 'MECHANIC' && order.mechanic?.userId === useAuthStore.getState().user?.id

  // Menunggu konfirmasi pembayaran COD (untuk User)
  if (isUser && order.status === 'COMPLETED' && order.transaction?.method === 'TUNAI' && order.transaction?.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
          <CreditCard className="w-10 h-10 text-success relative z-10" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Menunggu Konfirmasi</h2>
        <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">
          Silakan serahkan uang tunai sebesar <strong>Rp {order.transaction.amount.toLocaleString('id-ID')}</strong> kepada montir. 
          Montir akan mengonfirmasi pembayaran Anda sebentar lagi.
        </p>
        <Loader2 className="w-6 h-6 text-slate-600 animate-spin mt-8" />
      </div>
    )
  }

  const currentStatus = STATUS_CONFIG[order.status] || { label: order.status, icon: Info, color: 'text-slate-400', desc: '' }
  const StatusIcon = currentStatus.icon

  // Layar Tunggu jika belum di-acc montir
  if (order.status === 'WAITING_ACCEPT' || order.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-primary/20 rounded-full animate-ping absolute inset-0" />
          <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center relative z-10 border-2 border-primary/50">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Menunggu Konfirmasi</h2>
        <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">
          Pesanan Anda sudah terkirim ke <strong>{order.mechanic?.user.name || 'Montir'}</strong>. Mohon tunggu sebentar ya!
        </p>
        
        <div className="mt-12 w-full max-w-xs space-y-4">
           <div className="card p-4 bg-slate-800/50 border-slate-700">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">ID Pesanan</p>
              <p className="font-mono text-white text-sm">#{order.id.slice(-8).toUpperCase()}</p>
           </div>
           <button 
             onClick={() => { if(window.confirm('Batalkan pesanan?')) cancelMutation.mutate() }}
             className="text-sm font-bold text-danger/70 hover:text-danger"
           >
             Batalkan Pesanan
           </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Tracking Pesanan</h1>
            <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">ID: {order.id.slice(-8)}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${currentStatus.color.replace('text-', 'bg-')}/20 ${currentStatus.color}`}>
          {currentStatus.label}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Status Card */}
        <section className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <StatusIcon className="w-24 h-24" />
          </div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl bg-slate-700/50 flex items-center justify-center ${currentStatus.color}`}>
              <StatusIcon className={`w-6 h-6 ${order.status === 'SEARCHING' || order.status === 'WAITING_ACCEPT' ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-black ${currentStatus.color}`}>{currentStatus.label}</h2>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                {currentStatus.desc}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-8 flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-1000" 
              style={{ width: `${(STEPS.indexOf(STEPS.find(s => s === order.status) || 'SEARCHING') / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((s, i) => {
              const isPast = STEPS.indexOf(order.status) >= i
              const isCurrent = order.status === s
              return (
                <div key={s} className="relative z-10 flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                    isPast ? 'bg-primary border-primary shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-slate-800 border-slate-600'
                  } ${isCurrent ? 'scale-150' : ''}`} />
                </div>
              )
            })}
          </div>
        </section>

        {/* Live Map Tracking */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary" />
              Live Tracking
            </h2>
            {(order.status === 'OTW' || order.status === 'IN_PROGRESS') && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-success animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Live Update
              </span>
            )}
          </div>
          <Map 
            center={[order.userLatitude, order.userLongitude]} 
            userPos={[order.userLatitude, order.userLongitude]}
            mechanicPos={mechanicPos || (order.mechanic?.lastLatitude ? [order.mechanic.lastLatitude, order.mechanic.lastLongitude] : undefined)}
            zoom={14}
            className="h-[250px] w-full"
          />
        </section>

        {/* Rating Section */}
        {isUser && order.status === 'COMPLETED' && !order.review && (
          <section className="card p-6 space-y-4">
            <h3 className="font-bold text-white">Beri Penilaian untuk Montir</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 transition-transform hover:scale-110 ${star <= rating ? 'text-warning' : 'text-slate-600'}`}
                >
                  <Star className={`w-8 h-8 ${star <= rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            <textarea
              className="w-full p-3 bg-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="Berikan ulasan Anda (opsional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <button
              onClick={() => submitReviewMutation.mutate({ rating, comment })}
              disabled={rating === 0 || submitReviewMutation.isPending}
              className="btn-primary w-full py-3"
            >
              {submitReviewMutation.isPending ? <Loader2 className="animate-spin" /> : 'Kirim Ulasan'}
            </button>
          </section>
        )}

        {/* Display Submitted Review */}
        {order.review && (
          <section className="card p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ulasan Anda</h3>
            <div className="flex gap-1 text-warning">
              {[...Array(order.review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-sm text-slate-300 italic">"{order.review.comment || 'Tanpa ulasan'}"</p>
          </section>
        )}

        {/* Mechanic/User Card */}
        <AnimatePresence>
          {isUser && order.mechanic && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-700 overflow-hidden border border-slate-600">
                  {order.mechanic.user.avatarUrl ? (
                    <img 
                      src={order.mechanic.user.avatarUrl} 
                      alt={order.mechanic.user.name} 
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.log(`❌ [Order Mechanic Avatar] Failed to load:`, order.mechanic.user.avatarUrl)
                        const img = e.target as HTMLImageElement
                        img.style.display = 'none'
                        const parent = img.parentElement
                        if (parent && parent.querySelector('div') === null) {
                          const fallback = document.createElement('div')
                          fallback.className = 'w-full h-full flex items-center justify-center text-primary text-2xl font-black'
                          fallback.textContent = order.mechanic.user.name.charAt(0)
                          parent.appendChild(fallback)
                        }
                      }}
                      onLoad={() => {
                        console.log(`✅ [Order Mechanic Avatar] Loaded:`, order.mechanic.user.name)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary text-2xl font-black">
                      {order.mechanic.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Montir Anda</p>
                  <h3 className="text-lg font-bold text-white">{order.mechanic.user.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs font-bold text-warning">
                      <ShieldCheck className="w-3 h-3" />
                      Terverifikasi
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-600" />
                    <div className="text-xs text-slate-400 font-medium">★ {order.mechanic.rating.toFixed(1)}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <a href={`tel:${order.mechanic.user.phone}`} className="p-3 bg-success/20 text-success rounded-xl hover:bg-success/30 transition-all">
                    <Phone className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsChatOpen(true)}
                  className="flex-1 btn-secondary py-3 text-sm gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat Montir
                </button>
              </div>
            </motion.section>
          )}

          {isMechanic && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-700 overflow-hidden border border-slate-600">
                  {order.user.avatarUrl ? (
                    <img 
                      src={order.user.avatarUrl} 
                      alt={order.user.name} 
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.log(`❌ [Order User Avatar] Failed to load:`, order.user.avatarUrl)
                        const img = e.target as HTMLImageElement
                        img.style.display = 'none'
                        const parent = img.parentElement
                        if (parent && parent.querySelector('div') === null) {
                          const fallback = document.createElement('div')
                          fallback.className = 'w-full h-full flex items-center justify-center text-primary text-2xl font-black'
                          fallback.textContent = order.user.name.charAt(0)
                          parent.appendChild(fallback)
                        }
                      }}
                      onLoad={() => {
                        console.log(`✅ [Order User Avatar] Loaded:`, order.user.name)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary text-2xl font-black">
                      {order.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Pelanggan</p>
                  <h3 className="text-lg font-bold text-white">{order.user.name}</h3>
                  <p className="text-xs text-slate-400">{order.user.phone}</p>
                </div>
                <a href={`tel:${order.user.phone}`} className="p-3 bg-primary/20 text-primary rounded-xl">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsChatOpen(true)}
                  className="flex-1 btn-secondary py-3 text-sm gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat Pelanggan
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Service & Vehicle Details */}
        <section className="grid grid-cols-1 gap-3">
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-primary">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Layanan</p>
              <p className="font-bold text-white">{order.serviceType?.name || 'Layanan Umum'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Biaya</p>
              <p className="font-bold text-primary">Rp {order.estimatedCost?.toLocaleString('id-ID') || '50.000'}</p>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-info">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Kendaraan</p>
              <p className="font-bold text-white">
                {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : (order.vehicleName || 'Kendaraan Umum')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Plat</p>
              <p className="font-bold text-slate-300">{order.vehicle?.plateNumber || '-'}</p>
            </div>
          </div>
        </section>

        {/* Address Card */}
        <section className="card p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-danger flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lokasi {isMechanic ? 'User' : 'Anda'}</p>
            <p className="text-sm font-medium text-slate-200 mt-1 leading-relaxed">
              {order.userAddress || 'Lokasi Terdeteksi GPS'}
            </p>
          </div>
        </section>

        {/* Mechanic Actions */}
        {isMechanic && (
          <section className="pt-4 space-y-3">
             {order.status === 'MECHANIC_ACCEPTED' && (
               <button onClick={() => updateStatusMutation.mutate('OTW')} className="btn-primary w-full py-4 font-black">
                 SAYA BERANGKAT SEKARANG
               </button>
             )}
             {order.status === 'OTW' && (
               <button onClick={() => updateStatusMutation.mutate('ARRIVED')} className="btn-primary w-full py-4 font-black">
                 SAYA SUDAH SAMPAI DI LOKASI
               </button>
             )}
             {order.status === 'ARRIVED' && (
               <button onClick={() => updateStatusMutation.mutate('IN_PROGRESS')} className="btn-primary w-full py-4 font-black bg-info border-info text-white">
                 MULAI PENGERJAAN
               </button>
             )}
             {order.status === 'IN_PROGRESS' && (
               <button onClick={() => updateStatusMutation.mutate('COMPLETED')} className="btn-primary w-full py-4 font-black bg-success border-success text-white">
                 PENGERJAAN SELESAI
               </button>
             )}
             
             {/* Konfirmasi Pembayaran Tunai (Hanya untuk Montir) */}
             {order.status === 'COMPLETED' && order.transaction?.method === 'TUNAI' && order.transaction?.status === 'PENDING' && (
               <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                 <p className="text-sm font-bold text-primary text-center mb-3 animate-pulse">KONFIRMASI TERIMA UANG TUNAI</p>
                 <button 
                   onClick={() => confirmPaymentMutation.mutate(order.transaction.id)}
                   disabled={confirmPaymentMutation.isPending}
                   className="btn-primary w-full py-4 font-black bg-primary border-primary"
                 >
                   {confirmPaymentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                   SAYA SUDAH TERIMA RP {order.transaction.amount.toLocaleString('id-ID')}
                 </button>
               </div>
             )}
          </section>
        )}

        {/* View Receipt Button (When Paid) */}
        {order.transaction?.status === 'PAID' && (
          <button 
            onClick={() => setShowReceipt(true)}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-xl"
          >
            <Download className="w-5 h-5 text-primary" />
            LIHAT STRUK PEMBAYARAN
          </button>
        )}

        {/* User Cancel Button */}
        {isUser && ['PENDING', 'SEARCHING', 'WAITING_ACCEPT', 'MECHANIC_ACCEPTED'].includes(order.status) && (
          <button 
            onClick={() => {
              if (window.confirm('Yakin ingin membatalkan pesanan?')) cancelMutation.mutate()
            }}
            disabled={cancelMutation.isPending}
            className="w-full py-4 text-sm font-bold text-danger hover:bg-danger/5 rounded-xl transition-all border border-transparent hover:border-danger/20 flex items-center justify-center gap-2"
          >
            {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Batalkan Pesanan
          </button>
        )}
      </div>

      {/* Payment Action for User (Completed Order) */}
      {isUser && order.status === 'COMPLETED' && !order.transaction?.status && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 z-40">
          <div className="max-w-lg mx-auto">
            <button 
              onClick={() => setShowPaymentOptions(true)}
              className="btn-primary w-full py-4 shadow-glow"
            >
              <CreditCard className="w-5 h-5 fill-current" />
              Bayar Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Payment Options Modal */}
      <AnimatePresence>
        {showPaymentOptions && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentOptions(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-800 p-6 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6 sm:hidden" />
              <h3 className="text-xl font-black text-white mb-2">Pilih Metode Pembayaran</h3>
              <p className="text-sm text-slate-400 mb-6">Silakan pilih metode pembayaran yang paling nyaman untuk Anda.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => paymentMutation.mutate('QRIS')}
                  disabled={paymentMutation.isPending}
                  className="w-full p-4 flex items-center gap-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-white">QRIS / Transfer Bank</p>
                    <p className="text-xs text-slate-500">Otomatis & Real-time via Midtrans</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>

                <button 
                  onClick={() => paymentMutation.mutate('COD')}
                  disabled={paymentMutation.isPending}
                  className="w-full p-4 flex items-center gap-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-white">Tunai (COD)</p>
                    <p className="text-xs text-slate-500">Bayar langsung ke montir di lokasi</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <button 
                onClick={() => setShowPaymentOptions(false)}
                className="w-full mt-6 py-4 text-sm font-bold text-slate-500 hover:text-white transition-colors"
              >
                Batal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceipt(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Receipt Header */}
              <div className="p-8 text-center border-b border-dashed border-slate-200">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg shadow-primary/20">
                  <Zap className="w-8 h-8 text-white fill-current" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">GoMontir</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Struk Pembayaran Digital</p>
              </div>

              {/* Receipt Body */}
              <div className="p-8 space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">No. Referensi</span>
                  <span className="font-bold font-mono">#{order.transaction?.gatewayRef.slice(0, 12)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Tanggal</span>
                  <span className="font-bold">{new Date(order.transaction?.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Metode</span>
                  <span className="font-bold uppercase">{order.transaction?.method}</span>
                </div>
                
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">{order.serviceType?.name || 'Layanan'}</span>
                    <span className="font-bold">Rp {order.transaction?.amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-slate-100 flex justify-between items-end">
                   <div>
                     <p className="text-[10px] text-slate-400 font-black uppercase">Total Bayar</p>
                     <p className="text-3xl font-black text-slate-900 leading-none">Rp {order.transaction?.amount.toLocaleString('id-ID')}</p>
                   </div>
                   <div className="px-3 py-1 bg-success/10 border border-success/30 rounded-lg -rotate-12">
                      <span className="text-xs font-black text-success uppercase">LUNAS</span>
                   </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-6 flex items-center justify-center gap-2">
                <button 
                  onClick={() => setShowReceipt(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm"
                >
                  Tutup Struk
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <ChatDrawer 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderId={orderId!}
        socket={socketInstance}
        recipientName={isUser ? (order.mechanic?.user.name || 'Montir') : (order.user?.name || 'Pelanggan')}
      />
    </div>
  )
}

function Info(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
