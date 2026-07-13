import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PenLine, LayoutGrid, Download, Settings as SettingsIcon } from 'lucide-react'
import { NavItemIcon } from './Icons'

const NAV_ITEMS = [
  { path: '/', label: 'Draw', icon: PenLine },
  { path: '/grid', label: 'Preview', icon: LayoutGrid },
  { path: '/export', label: 'Export', icon: Download },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
] as const

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <header style={{ paddingTop: 'env(safe-area-inset-top)' }} className="landscape-compact-header flex items-center justify-between border-b border-slate-700 px-4 py-2.5">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Link to="/" className="truncate whitespace-nowrap text-base font-bold tracking-tight">
            <span className="text-indigo-400">Bangla</span> Handwriting
          </Link>
        </div>
      </header>

      <main className="main-scroll flex-1 overflow-y-auto">{children}</main>

      {/* Live region for dynamic status announcements (screen readers) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="live-status" />

      <nav style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} className="landscape-compact-nav flex items-center justify-around border-t border-slate-700 bg-slate-900">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? 'text-indigo-400'
                    : 'text-slate-400'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-indigo-600"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <NavItemIcon icon={item.icon} active={active} />
                <span className="whitespace-nowrap font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
