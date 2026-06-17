import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import GoogleLoginButton from '@/components/common/GoogleLoginButton'


const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      toast.success('Selamat datang kembali! 👋')
      navigate('/')
    } catch {
      // error handled by api interceptor
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Masuk ke Akun</h2>
        <p className="text-slate-400 mt-1">Belum punya akun?{' '}
          <Link to="/auth/register" className="text-primary hover:underline font-medium">Daftar sekarang</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="input-label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="nama@email.com"
              className="input pl-10"
              id="login-email"
            />
          </div>
          {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="input-label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              className="input pl-10 pr-10"
              id="login-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          id="login-submit"
          disabled={isLoading}
          className="btn-primary w-full text-base py-3.5"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-700/60" />
        </div>
        <div className="relative flex justify-center text-xs text-slate-400 uppercase">
          <span className="bg-slate-900 px-3 font-medium">atau masuk dengan</span>
        </div>
      </div>

      <GoogleLoginButton variant="login" role="USER" className="w-full" />


      {/* Demo credentials */}
      <div className="mt-6 p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
        <p className="text-xs text-slate-400 font-medium mb-2">Demo Credentials (Seeded):</p>
        <div className="space-y-1 text-xs text-slate-300">
          <p>👤 User: <span className="text-primary">user1@gmail.com</span> / password123</p>
          <p>🔧 Montir: <span className="text-primary">mekanik1@gmail.com</span> / password123</p>
          <p>⚙️ Admin: <span className="text-primary">admin@gomontir.com</span> / password123</p>
        </div>
      </div>
    </div>
  )
}
