import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/services'
import { 
  Users, Search, Filter, MoreHorizontal, 
  ChevronLeft, ChevronRight, UserX, UserCheck, 
  Shield, Mail, Phone, Loader2, CheckCircle2, XCircle
} from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: () => adminApi.getUsers(page, search, roleFilter).then(r => r.data.data),
    placeholderData: (previousData) => previousData,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserActive(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(res.data.message)
    }
  })

  const toggleVerifyMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserVerify(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(res.data.message)
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Manajemen Pengguna</h1>
          <p className="text-sm text-slate-400">Total {data?.total || 0} akun terdaftar dalam sistem.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10 py-2 w-full md:w-64 text-sm"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="input py-2 text-sm bg-slate-800 border-slate-700"
          >
            <option value="ALL">Semua Role</option>
            <option value="USER">User (Pelanggan)</option>
            <option value="MECHANIC">Mechanic (Montir)</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-slate-700/50">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700/50">
            <tr>
              <th className="px-6 py-4">Nama & Kontak</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status Akun</th>
              <th className="px-6 py-4">Tgl Gabung</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="p-6"><div className="skeleton h-12 w-full" /></td></tr>
              ))
            ) : data?.users?.map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-700/10 transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-primary">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{u.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Mail className="w-3 h-3" /> {u.email}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Phone className="w-3 h-3" /> {u.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border ${
                    u.role === 'ADMIN' ? 'bg-danger/10 text-danger border-danger/20' :
                    u.role === 'MECHANIC' ? 'bg-primary/10 text-primary border-primary/20' :
                    'bg-info/10 text-info border-info/20'
                  }`}>
                    {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                    {u.role}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1.5 ${u.isActive ? 'text-success' : 'text-danger'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-success' : 'bg-danger'} shadow-[0_0_8px_currentColor]`} />
                    <span className="text-xs font-bold uppercase">{u.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                  {u.role === 'MECHANIC' && (
                    <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold ${u.isVerified ? 'text-info' : 'text-warning'}`}>
                      {u.isVerified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {u.isVerified ? 'TERVERIFIKASI' : 'BELUM VERIFIKASI'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-slate-400 font-medium">{format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: id })}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {u.role === 'MECHANIC' && (
                      <button 
                        onClick={() => toggleVerifyMutation.mutate(u.id)}
                        disabled={toggleVerifyMutation.isPending}
                        className={`p-2 rounded-lg transition-all ${
                          u.isVerified 
                            ? 'text-warning hover:bg-warning/10' 
                            : 'text-info hover:bg-info/10'
                        }`}
                        title={u.isVerified ? 'Cabut Verifikasi' : 'Verifikasi Montir'}
                      >
                        {toggleVerifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                          u.isVerified ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />
                        }
                      </button>
                    )}
                    <button 
                      onClick={() => toggleActiveMutation.mutate(u.id)}
                      disabled={toggleActiveMutation.isPending}
                      className={`p-2 rounded-lg transition-all ${
                        u.isActive 
                          ? 'text-danger hover:bg-danger/10' 
                          : 'text-success hover:bg-success/10'
                      }`}
                      title={u.isActive ? 'Nonaktifkan User' : 'Aktifkan User'}
                    >
                      {toggleActiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                        u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-slate-800/30 px-6 py-4 flex items-center justify-between border-t border-slate-700/50">
          <p className="text-xs text-slate-500 font-medium">Halaman {page} dari {data?.totalPages || 1}</p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border border-slate-700 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={page === data?.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border border-slate-700 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
