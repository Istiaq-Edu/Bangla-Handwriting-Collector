import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { getTotalSampleCount } from './db/database'

const CollectionView = lazy(() => import('./components/Collection/CollectionView'))
const CollectionGrid = lazy(() => import('./components/Grid/CollectionGrid'))
const ExportView = lazy(() => import('./components/Export/ExportView'))
const SettingsView = lazy(() => import('./components/Settings/SettingsView'))

function Loading() {
  return (
    <div className="flex h-full items-center justify-center text-gray-500">
      Loading...
    </div>
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
        <Routes>
          <Route path="/" element={<CollectionView />} />
          <Route path="/grid" element={<CollectionGrid />} />
          <Route path="/export" element={<ExportView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
