import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Sidebar } from './Sidebar.tsx'

export function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F8FAFC] flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar (hidden on mobile, fixed 248px on md+) */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile Top Header (only on < md) */}
      <header className="md:hidden h-14 bg-[#12151C] border-b border-[#343946]/40 px-4 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 p-1 flex items-center justify-center shadow">
            <img src="/logo.png" alt="TakeToo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg text-[#F8FAFC] tracking-tight">
            TakeToo
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 rounded-lg text-[#A8B0C0] hover:text-[#F8FAFC] hover:bg-[#242832] transition-colors cursor-pointer"
          aria-label="Abrir menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Mobile Sidebar Drawer Modal */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Sidebar Drawer */}
          <div className="relative z-10 w-[248px] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-[#0F1117] px-4 sm:px-8 py-8 md:py-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
