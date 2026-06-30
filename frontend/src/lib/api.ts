import axios from 'axios'
import toast from 'react-hot-toast'

const apiBaseUrl = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : '/api';

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor
api.interceptors.request.use((config) => {
  try {
    const authStorage = localStorage.getItem('gomontir-auth')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      const token = parsed?.state?.accessToken
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch (error) {
    console.error('Failed to parse auth token from localStorage', error)
  }
  return config
})

// Response interceptor — auto refresh token
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/auth/refresh')
        processQueue(null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // Redirect to login
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Show error toast for non-401
    const message = error.response?.data?.message || 'Terjadi kesalahan. Coba lagi.'
    if (error.response?.status !== 401) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api
