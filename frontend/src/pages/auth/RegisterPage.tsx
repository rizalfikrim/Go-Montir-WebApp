import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, Wrench, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import GoogleLoginButton from '@/components/common/GoogleLoginButton'


const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format HP tidak valid (contoh: 08123456789)'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['USER', 'MECHANIC']),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'USER' | 'MECHANIC'>('USER')
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: { role: 'USER' },
  })

  const handleRoleSelect = (role: 'USER' | 'MECHANIC') => {
    setSelectedRole(role)
    setValue('role', role)
  }

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data)
      toast.success('Akun berhasil dibuat! Silakan login.')
      navigate('/auth/login')
    } catch {
      // error handled by interceptor
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Buat Akun Baru</h2>
        <p className="text-slate-400 mt-1">Sudah punya akun?{' '}
          <Link to="/auth/login" className="text-primary hover:underline font-medium">Masuk di sini</Link>
        </p>
      </div>

      {/* Role Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {([
          { role: 'USER', label: 'Saya Pengguna', icon: User, desc: 'Butuh bantuan montir' },
          { role: 'MECHANIC', label: 'Saya Montir', icon: Wrench, desc: 'Mau jadi mitra' },
        ] as const).map(({ role, label, icon: Icon, desc }) => (
          <button
            key={role}
            type="button"
            onClick={() => handleRoleSelect(role)}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              selectedRole === role
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Icon className="w-5 h-5 mb-2" />
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs opacity-70 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="input-label">Nama Lengkap</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('name')} placeholder="Budi Santoso" className="input pl-10" id="reg-name" />
          </div>
          {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="input-label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('email')} type="email" placeholder="nama@email.com" className="input pl-10" id="reg-email" />
          </div>
          {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="input-label">Nomor HP</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('phone')} placeholder="08123456789" className="input pl-10" id="reg-phone" />
          </div>
          {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="input-label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 8 karakter + angka + kapital"
              className="input pl-10 pr-10"
              id="reg-password"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" id="reg-submit" disabled={isLoading} className="btn-primary w-full py-3.5 mt-2">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftar Sekarang'}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-700/60" />
        </div>
        <div className="relative flex justify-center text-xs text-slate-400 uppercase">
          <span className="bg-slate-900 px-3 font-medium">atau daftar dengan</span>
        </div>
      </div>

      <GoogleLoginButton variant="register" role={selectedRole} className="w-full" />

    </div>
  )
}
