import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import { connectSocket, disconnectSocket } from '@/lib/socket'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'USER' | 'MECHANIC' | 'ADMIN'
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  hydrate: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  role?: 'USER' | 'MECHANIC'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          const { user, accessToken } = data.data
          set({ user, accessToken, isAuthenticated: true })
          connectSocket(accessToken)
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (registerData) => {
        set({ isLoading: true })
        try {
          await api.post('/auth/register', registerData)
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch { /* ignore */ } finally {
          disconnectSocket()
          set({ user: null, accessToken: null, isAuthenticated: false })
        }
      },

      setUser: (user) => set({ user }),

      hydrate: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.data, isAuthenticated: true })
          const token = get().accessToken
          if (token) connectSocket(token)
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'gomontir-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
