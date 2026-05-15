import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services'
import { 
  Users, ShoppingBag, DollarSign, TrendingUp, 
  Wrench, User as UserIcon, Clock, ChevronRight, 
  AlertCircle, CheckCircle2, Loader2, ArrowUpRight 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboard().then(r => r.data.data),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-primary" /></div>
  }

  const { stats, recentOrders } = data

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-white">Ringkasan Sistem</h1>
        <p className="text-slate-400 mt-1">Pantau performa GoMontir secara real-time.</p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 card p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <DollarSign className="w-24 h-24" />
          </div>
          <p className="text-sm font-bold text-primary uppercase tracking-widest">Total Pendapatan</p>
          <h2 className="text-4xl font-black text-white mt-2">Rp {stats.totalRevenue.toLocaleString('id-ID')}</h2>
          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-success">
            <ArrowUpRight className="w-4 h-4" />
            +24% dari bulan lalu
          </div>
        </div>

        <div className="card p-6 border-slate-700/50 hover:border-slate-500/50 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total User</p>
          <h2 className="text-2xl font-black text-white mt-1">{stats.totalUsers}</h2>
        </div>

        <div className="card p-6 border-slate-700/50 hover:border-slate-500/50 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning mb-4">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Order</p>
          <h2 className="text-2xl font-black text-white mt-1">{stats.totalOrders}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" /> Pesanan Terbaru
            </h2>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
            >
              LIHAT SEMUA <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="card p-0 overflow-hidden border-slate-700/50">
            <table className="w-full text-left">
              <thead className="bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">ID & Layanan</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-700/20 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-primary">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white truncate max-w-[150px]">{order.serviceType?.name || 'Umum'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {order.user?.name.charAt(0)}
                        </div>
                        <p className="text-xs text-slate-300 font-medium">{order.user?.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`status-${order.status.toLowerCase()} scale-75 origin-left`}>
                        {order.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/admin/orders?id=${order.id}`)}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Alerts / Tips */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Insight</h2>
          
          <div className="card p-4 bg-warning/5 border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              <p className="text-xs font-bold text-warning uppercase">Butuh Perhatian</p>
            </div>
            <p className="text-sm text-slate-200 font-bold">5 Montir Baru Menunggu Verifikasi</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Harap segera periksa dokumen sertifikasi mereka untuk menjaga standar layanan.</p>
            <button className="btn-secondary w-full mt-4 py-2 text-xs">Periksa Sekarang</button>
          </div>

          <div className="card p-4 bg-success/5 border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <p className="text-xs font-bold text-success uppercase">Sistem Sehat</p>
            </div>
            <p className="text-sm text-slate-200 font-bold">Uptime 99.9% (7 Hari Terakhir)</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Semua layanan backend dan socket server berjalan normal tanpa kendala.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
