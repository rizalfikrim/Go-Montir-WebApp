import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/services'
import { Bell, CheckCircle, Info, Zap, CreditCard, ArrowLeft, MoreVertical, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const ICON_MAP: Record<string, any> = {
  ORDER_UPDATE: Zap,
  PAYMENT_UPDATE: CreditCard,
  PROMO: Bell,
  SYSTEM: Info,
}

const COLOR_MAP: Record<string, string> = {
  ORDER_UPDATE: 'text-primary bg-primary/10',
  PAYMENT_UPDATE: 'text-success bg-success/10',
  PROMO: 'text-warning bg-warning/10',
  SYSTEM: 'text-info bg-info/10',
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll().then(r => r.data.data),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Semua ditandai sudah dibaca.')
    }
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) markReadMutation.mutate(notif.id)
    if (notif.data?.orderId) {
      navigate(`/order/${notif.data.orderId}`)
    }
  }

  return (
    <div className="min-h-full bg-slate-900">
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Notifikasi</h1>
        </div>
        {data?.unreadCount > 0 && (
          <button 
            onClick={() => markAllReadMutation.mutate()}
            className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
            title="Tandai semua dibaca"
          >
            <CheckCheck className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : data?.notifications?.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {data.notifications.map((notif: any) => {
              const Icon = ICON_MAP[notif.type] || Info
              return (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full p-4 flex items-start gap-4 transition-all text-left ${
                    notif.isRead ? 'bg-transparent' : 'bg-primary/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${COLOR_MAP[notif.type] || 'bg-slate-700 text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-bold truncate ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${notif.isRead ? 'text-slate-500' : 'text-slate-300'}`}>
                      {notif.body}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-2 font-medium">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
              <Bell className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-white">Sepi Nih...</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Belum ada notifikasi baru untuk kamu saat ini. Semua update pesanan akan muncul di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
