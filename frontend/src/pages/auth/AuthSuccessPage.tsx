import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    const accessToken = searchParams.get('access_token')

    if (accessToken) {
      // Set access token directly in the store state
      useAuthStore.setState({ accessToken, isAuthenticated: true })

      // Load user profile information
      hydrate()
        .then(() => {
          toast.success('Login berhasil! 👋')
          navigate('/')
        })
        .catch((err) => {
          console.error('Failed to hydrate user session:', err)
          toast.error('Gagal memuat sesi pengguna')
          navigate('/auth/login')
        })
    } else {
      toast.error('Token otentikasi tidak ditemukan')
      navigate('/auth/login')
    }
  }, [searchParams, navigate, hydrate])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-200">
      <div className="p-8 bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl rounded-2xl flex flex-col items-center max-w-sm w-full text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Menghubungkan Akun...</h3>
        <p className="text-sm text-slate-400">Mohon tunggu sebentar selagi kami mengamankan sesi Anda.</p>
      </div>
    </div>
  )
}
