import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface GoogleLoginButtonProps {
  variant?: 'login' | 'register'
  role?: 'USER' | 'MECHANIC'
  className?: string
}

export default function GoogleLoginButton({ 
  variant = 'login', 
  role = 'USER',
  className = '' 
}: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuthStore()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setIsProcessing(true)

      // Decode JWT token dari Google
      const token = credentialResponse.credential
      if (!token) {
        toast.error('Google authentication gagal')
        return
      }

      // Parse JWT (simple decoding tanpa verification, server akan verify)
      const parts = token.split('.')
      const payload = JSON.parse(atob(parts[1]))

      console.log('🔐 [GOOGLE LOGIN] JWT Payload received')
      console.log(`   Name: ${payload.name}`)
      console.log(`   Email: ${payload.email}`)
      console.log(`   Picture: ${payload.picture ? '✓ Present' : '✗ Missing'}`)

      const googleData = {
        googleId: payload.sub,
        displayName: payload.name,
        email: payload.email,
        photoUrl: payload.picture,
        role,
      }

      console.log(`📤 [GOOGLE LOGIN] Sending to backend: photoUrl=${googleData.photoUrl ? 'Yes' : 'No'}`)

      // Call backend via Zustand store
      await loginWithGoogle(googleData)

      console.log('✅ [GOOGLE LOGIN] Success!')

      toast.success(
        variant === 'register' 
          ? 'Akun berhasil dibuat dengan Google! 🎉' 
          : 'Selamat datang kembali! 👋'
      )
      navigate('/')
    } catch (error) {
      console.error('❌ [GOOGLE LOGIN] Error:', error)
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
      toast.error(message)
    } finally {
      setIsProcessing(false)
    }
  }


  const handleGoogleError = () => {
    toast.error('Google login dibatalkan atau gagal')
  }

  return (
    <div className={`flex justify-center ${className}`}>
      {isProcessing ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Sedang memproses...</span>
        </div>
      ) : (
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          type="standard"
          theme="filled_blue"
          text={variant === 'register' ? 'signup_with' : 'signin_with'}
          width="350"
        />
      )}
    </div>
  )
}
