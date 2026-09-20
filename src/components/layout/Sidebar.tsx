import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.ts'

interface SidebarProps {
  onCloseMobile?: () => void
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const navItems = [
    {
      label: 'Visão geral',
      to: '/dashboard',
      isActive: location.pathname === '/' || location.pathname === '/dashboard',
    },
    {
      label: 'Projetos',
      to: '/projetos',
      isActive: location.pathname.startsWith('/projetos'),
    },
    {
      label: 'Clientes',
      to: '/clientes',
      isActive: location.pathname.startsWith('/clientes'),
    },
    {
      label: 'Comentários',
      to: '/comentarios',
      isActive: location.pathname.startsWith('/comentarios'),
    },
  ]

  // Initials for avatar
  const userName = user?.nome || 'Lucas Bordignon'
  const userRole = user?.plano ? `${user.plano} Plan` : 'Filmmaker Pro'
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'LB'

  return (
    <aside className="w-[248px] h-screen bg-[#12151C] border-r border-[#343946]/30 flex flex-col justify-between shrink-0 select-none">
      {/* Top Header & Brand */}
      <div className="flex flex-col">
        {/* Logo */}
        <div className="px-6 pt-7 pb-8 flex items-center gap-3">
          <Link
            to="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 p-1.5 flex items-center justify-center shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="TakeToo Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to geometric icon if logo image not found
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            </div>
            <span className="font-bold text-[20px] text-[#F8FAFC] tracking-tight">
              TakeToo
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 flex flex-col gap-1.5" aria-label="Menu Principal">
          {navItems.map((item) => {
            if (item.isActive) {
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={onCloseMobile}
                  className="h-[44px] rounded-[10px] bg-[#242832] px-4 flex items-center gap-3 transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA] shrink-0" />
                  <span className="font-semibold text-[14px] text-[#F8FAFC]">
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={onCloseMobile}
                className="h-[44px] rounded-[10px] px-4 flex items-center gap-3 hover:bg-[#242832]/60 hover:text-[#F8FAFC] transition-colors group"
              >
                <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#667085] group-hover:border-[#A8B0C0] shrink-0" />
                <span className="font-medium text-[14px] text-[#A8B0C0] group-hover:text-[#F8FAFC]">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#343946]/20">
        <div className="flex items-center justify-between gap-3 p-2 rounded-[10px] hover:bg-[#1A1D24] transition-colors group">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar circle 36x36 */}
            <div className="w-9 h-9 rounded-full bg-[#6366F1] flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
              <span className="text-[13px] font-semibold text-white">
                {initials}
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className="font-semibold text-[13px] text-[#F8FAFC] truncate leading-tight"
                title={userName}
              >
                {userName}
              </span>
              <span className="font-normal text-[11px] text-[#A8B0C0] truncate mt-0.5 leading-tight">
                {userRole}
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={logout}
            title="Sair da conta"
            className="p-1.5 rounded-md text-[#667085] hover:text-[#EF4444] hover:bg-[#242832] transition-colors cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
