import { useQuery } from '@tanstack/react-query'
import { mechanicApi } from '@/services'
import { 
  ClipboardList, ArrowLeft, ChevronRight, 
  User, MapPin, Calendar, Wrench, 
  CheckCircle2, XCircle, Clock, Loader2 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function MechanicOrdersPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['mechanic-orders'],
    queryFn: () => mechanicApi.getMyOrders().then(r => r.data.data),
  })

  return (
    <div className="min-h-full bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-4">
        <button onClick={() => navigate('/mechanic')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Riwayat Kerja</h1>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
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
                className="card p-4 w-full text-left flex flex-col gap-3 group hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-primary">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {format(new Date(order.createdAt), 'dd MMM yyyy • HH:mm', { locale: id })}
                      </p>
                      <h3 className="font-bold text-white group-hover:text-primary transition-colors">
                        {order.serviceType?.name || 'Layanan Umum'}
                      </h3>
                    </div>
                  </div>
                  <div className={`status-${order.status.toLowerCase()} scale-75 origin-right`}>
                    {order.status}
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2 border-y border-slate-700/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Pelanggan</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {order.user?.name.charAt(0)}
                      </div>
                      <p className="text-sm font-semibold text-slate-200 truncate">{order.user?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Biaya</p>
                    <p className="text-sm font-black text-white">Rp {order.totalCost?.toLocaleString('id-ID') || order.estimatedCost?.toLocaleString('id-ID') || '0'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-danger" />
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{order.userAddress || 'Alamat tidak tersedia'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-primary group-hover:translate-x-1 transition-transform">
                    DETAIL <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
              <ClipboardList className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-white">Belum Ada Riwayat</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Selesaikan order pertama Anda untuk mulai mengisi riwayat kerja!
            </p>
            <button 
              onClick={() => navigate('/mechanic')}
              className="btn-primary mt-6 px-8"
            >
              Cari Order
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
