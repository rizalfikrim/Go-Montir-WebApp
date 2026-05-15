import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Layouts
import UserLayout from '@/layouts/UserLayout'
import AuthLayout from '@/layouts/AuthLayout'
import MechanicLayout from '@/layouts/MechanicLayout'
import AdminLayout from '@/layouts/AdminLayout'

// Pages — Auth
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

// Pages — User
import HomePage from '@/pages/user/HomePage'
import SearchMechanicPage from '@/pages/user/SearchMechanicPage'
import OrderTrackingPage from '@/pages/user/OrderTrackingPage'
import ProfilePage from '@/pages/user/ProfilePage'
import OrderHistoryPage from '@/pages/user/OrderHistoryPage'
import NotificationsPage from '@/pages/user/NotificationsPage'

// Pages — Mechanic
import MechanicDashboard from '@/pages/mechanic/MechanicDashboard'
import MechanicOrdersPage from '@/pages/mechanic/MechanicOrdersPage'
import MechanicProfilePage from '@/pages/mechanic/MechanicProfilePage'

// Pages — Admin
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage'

// Guards
const PrivateRoute = ({ children, roles }: { children: JSX.Element; roles?: string[] }) => {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  
  if (roles && user && !roles.includes(user.role)) {
    // Jika salah role, arahkan ke dashboard masing-masing
    if (user.role === 'MECHANIC') return <Navigate to="/mechanic" replace />
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }
  
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* User */}
      <Route path="/" element={
        <PrivateRoute roles={['USER']}>
          <UserLayout />
        </PrivateRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchMechanicPage />} />
        <Route path="history" element={<OrderHistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Shared Order Tracking (Accessible by both) */}
      <Route path="/order/:orderId" element={
        <PrivateRoute roles={['USER', 'MECHANIC']}>
          <OrderTrackingPage />
        </PrivateRoute>
      } />

      {/* Mechanic */}
      <Route path="/mechanic" element={
        <PrivateRoute roles={['MECHANIC']}>
          <MechanicLayout />
        </PrivateRoute>
      }>
        <Route index element={<MechanicDashboard />} />
        <Route path="orders" element={<MechanicOrdersPage />} />
        <Route path="profile" element={<MechanicProfilePage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={
        <PrivateRoute roles={['ADMIN']}>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
