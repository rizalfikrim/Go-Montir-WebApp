import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services'
import { 
  ShoppingBag, Search, Filter, Calendar, 
  MapPin, User as UserIcon, Wrench, CreditCard,
  ChevronLeft, ChevronRight, Loader2, ArrowRight
} from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const STATUS_LIST = ['PENDING', 'SEARCHING', 'WAITING_ACCEPT', 'MECHANIC_ACCEPTED', 'OTW', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED']

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, selectedStatus],
    queryFn: () => adminApi.getOrders(page, selectedStatus).then(r => r.data.data),
    placeholderData: (previousData) => previousData,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Monitoring Pesanan</h1>
          <p className="text-sm text-slate-400">Total {data?.total || 0} pesanan di seluruh sistem.</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <select 
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="input py-2 text-sm w-44"
          >
            <option value="">Semua Status</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-secondary py-2 px-3 whitespace-nowrap">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)
        ) : data?.orders?.length > 0 ? (
          data.orders.map((order: any) => (
            <div key={order.id} className="card p-5 border-slate-700/50 hover:border-primary/20 transition-all flex flex-col md:flex-row gap-6">
              {/* Order Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">{order.serviceType?.name || 'Umum'}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-tighter">ID: {order.id}</p>
                    </div>
                  </div>
                  <div className={`status-${order.status.toLowerCase()} scale-90`}>
                    {order.status}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 line-clamp-2">{order.userAddress || 'Alamat tidak tersedia'}</p>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}</div>
                  <div className="flex items-center gap-1.5 text-primary"><CreditCard className="w-3.5 h-3.5" /> Rp {order.transaction?.amount?.toLocaleString('id-ID') || '0'}</div>
                </div>
              </div>

              {/* Parties Info */}
              <div className="md:w-72 bg-slate-800/40 rounded-xl p-4 flex flex-col justify-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-info">
                    {order.user?.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">User</p>
                    <p className="text-xs font-bold text-white truncate">{order.user?.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center py-1 opacity-20">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-primary">
                    {order.mechanic?.user?.name.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Mechanic</p>
                    <p className="text-xs font-bold text-white truncate">{order.mechanic?.user?.name || 'BELUM ADA'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center card bg-slate-800/30 border-dashed">
            <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Tidak ada pesanan ditemukan.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between py-4">
          <p className="text-xs text-slate-500 font-medium">Halaman {page} dari {data?.totalPages || 1}</p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="btn-secondary p-2 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={page === data?.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary p-2 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
