import { Outlet } from 'react-router-dom'
import BottomNav from '@/components/navigation/BottomNav'
import TopBar from '@/components/navigation/TopBar'

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <TopBar />
      <main className="flex-1 pb-20 pt-16 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav role="USER" />
    </div>
  )
}
