import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { PenLine, LayoutGrid, Download, Settings as SettingsIcon } from 'lucide-react'
import { NavItemIcon, ThemeToggleIcon } from './Icons'

const NAV_ITEMS = [
  { path: '/', label: 'Draw', icon: PenLine },
  { path: '/grid', label: 'Grid', icon: LayoutGrid },
  { path: '/export', label: 'Export', icon: Download },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
] as const

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)

  return (
    <div className="flex h-full flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header style={{ paddingTop: 'env(safe-area-inset-top)' }} className="landscape-compact-header flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Link to="/" className="truncate whitespace-nowrap text-base font-bold tracking-tight">
            <span className="text-blue-600 dark:text-blue-400">Bangla</span> Handwriting
          </Link>
          <motion.button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
          >
            <ThemeToggleIcon isDark={theme === 'dark'} size={18} />
          </motion.button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">{children}</main>
      <nav style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} className="landscape-compact-nav flex items-center justify-around border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
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
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-400"
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
