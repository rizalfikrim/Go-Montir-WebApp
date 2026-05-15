import api from '@/lib/api'

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: object) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
}

// User
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: object) => api.patch('/users/profile', data),
  getVehicles: () => api.get('/users/vehicles'),
  addVehicle: (data: object) => api.post('/users/vehicles', data),
  deleteVehicle: (id: string) => api.delete(`/users/vehicles/${id}`),
  getOrderHistory: (page = 1) => api.get(`/users/orders?page=${page}`),
}

// Mechanic
export const mechanicApi = {
  getNearby: (lat: number, lon: number, radius = 50) =>
    api.get(`/mechanics/nearby?lat=${lat}&lon=${lon}&radius=${radius}`),
  getProfile: (id: string) => api.get(`/mechanics/${id}`),
  getMyProfile: () => api.get('/mechanics/me/profile'),
  updateMyProfile: (data: object) => api.patch('/mechanics/me/profile', data),
  setOnlineStatus: (isOnline: boolean) => api.patch('/mechanics/me/online', { isOnline }),
  updateLocation: (lat: number, lon: number) => api.patch('/mechanics/me/location', { lat, lon }),
  getMyOrders: (page = 1) => api.get(`/mechanics/me/orders?page=${page}`),
}

// Order
export const orderApi = {
  create: (data: object) => api.post('/orders', data),
  getDetail: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string, cancelReason?: string) =>
    api.patch(`/orders/${id}/status`, { status, cancelReason }),
  accept: (id: string) => api.post(`/orders/${id}/accept`),
  submitReview: (id: string, data: object) => api.post(`/orders/${id}/review`, data),
}

// Service Types
export const serviceApi = {
  getAll: () => api.get('/services'),
}

// Subscriptions
export const subscriptionApi = {
  getPackages: () => api.get('/subscriptions'),
  purchase: (packageId: string) => api.post('/subscriptions/purchase', { packageId }),
  getMy: () => api.get('/subscriptions/my'),
}

// Notifications
export const notificationApi = {
  getAll: (page = 1) => api.get(`/notifications?page=${page}`),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (page = 1, search?: string) =>
    api.get(`/admin/users?page=${page}${search ? `&search=${search}` : ''}`),
  toggleUserActive: (id: string) => api.patch(`/admin/users/${id}/toggle-active`),
  getOrders: (page = 1, status?: string) =>
    api.get(`/admin/orders?page=${page}${status ? `&status=${status}` : ''}`),
}

// Payment
export const paymentApi = {
  createTransaction: (orderId: string, method?: string) => api.post('/payments/create', { orderId, method }),
  confirm: (transactionId: string) => api.post(`/payments/confirm/${transactionId}`),
}
