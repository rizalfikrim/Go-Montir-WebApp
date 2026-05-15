import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ChevronRight, Calendar, Wrench, Car, ArrowLeft, Loader2 } from 'lucide-react'
import { userApi } from '@/services'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function OrderHistoryPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['order-history'],
    queryFn: () => userApi.getOrderHistory().then(r => r.data.data),
  })

  return (
    <div className="min-h-full bg-slate-900">
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Riwayat Pesanan</h1>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
          </div>
        ) : data?.orders?.length > 0 ? (
          <div className="space-y-4">
            {data.orders.map((order: any) => (
              <button
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="card p-4 w-full text-left flex items-start gap-4 hover:border-primary/30 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  order.status === 'COMPLETED' ? 'bg-success/10 text-success' : 
                  order.status === 'CANCELLED' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
                }`}>
                  <Wrench className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: id })}
                    </p>
                    <div className={`status-${order.status.toLowerCase()} scale-75 origin-right`}>
                      {order.status}
                    </div>
                  </div>
                  <h3 className="font-bold text-white group-hover:text-primary transition-colors truncate">
                    {order.serviceType?.name || 'Layanan Umum'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Car className="w-3 h-3 text-slate-500" />
                    <p className="text-xs text-slate-400 truncate">
                      {order.vehicle?.brand} {order.vehicle?.model}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-black text-slate-200">
                      Rp {order.transaction?.amount?.toLocaleString('id-ID') || '0'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary group-hover:translate-x-1 transition-transform">
                      DETAIL <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
              <ClipboardList className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-white">Belum Ada Pesanan</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Kamu belum pernah melakukan pemesanan montir. Pesan sekarang untuk mendapatkan bantuan darurat!
            </p>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary mt-6 px-8"
            >
              Cari Montir Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
