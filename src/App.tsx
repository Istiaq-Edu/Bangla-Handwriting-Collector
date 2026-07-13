import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store/useStore'
import { getTotalSampleCount } from './db/database'

const CollectionView = lazy(() => import('./components/Collection/CollectionView'))
const CollectionGrid = lazy(() => import('./components/Grid/CollectionGrid'))
const ExportView = lazy(() => import('./components/Export/ExportView'))
const SettingsView = lazy(() => import('./components/Settings/SettingsView'))

function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full items-center justify-center text-slate-400"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-600" />
        <span className="text-sm">Loading...</span>
      </div>
    </motion.div>
  )
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><CollectionView /></PageWrapper>} />
        <Route path="/grid" element={<PageWrapper><CollectionGrid /></PageWrapper>} />
        <Route path="/export" element={<PageWrapper><ExportView /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><SettingsView /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><Navigate to="/" replace /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const initSession = useStore((s) => s.initSession)
  const setTotalSamples = useStore((s) => s.setTotalSamples)

  useEffect(() => {
    initSession().then(() => {
      getTotalSampleCount().then(setTotalSamples)
    })
  }, [initSession, setTotalSamples])

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <AnimatedRoutes />
      </Suspense>
    </BrowserRouter>
  )
}
