import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trash2, AlertTriangle, Grid3x3 } from 'lucide-react'
import { Layout } from '../Layout'
import { useStore } from '../../store/useStore'
import { deleteAllSamples } from '../../db/database'

export default function SettingsView() {
  const contributor = useStore((s) => s.contributor)
  const totalSamples = useStore((s) => s.totalSamples)
  const setTotalSamples = useStore((s) => s.setTotalSamples)
  const showGrid = useStore((s) => s.showGrid)
  const setShowGrid = useStore((s) => s.setShowGrid)

  const [storageEstimate, setStorageEstimate] = useState<string>('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const refreshStorage = useCallback(async () => {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate()
      const usageMB = (est.usage ?? 0) / (1024 * 1024)
      const quotaMB = (est.quota ?? 0) / (1024 * 1024)
      setStorageEstimate(`${usageMB.toFixed(1)} MB / ${quotaMB.toFixed(0)} MB`)
    }
  }, [])

  useEffect(() => {
    refreshStorage()
  }, [refreshStorage, totalSamples])

  const handleClearAll = useCallback(async () => {
    await deleteAllSamples()
    setTotalSamples(0)
    setShowClearConfirm(false)
    refreshStorage()
  }, [setTotalSamples, refreshStorage])

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-md space-y-5 p-4 sm:max-w-lg md:max-w-xl">
          {/* Canvas */}
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-1 text-base font-semibold text-slate-100">Canvas</h2>
            <p className="mb-3 text-xs text-slate-400">Drawing surface preferences</p>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 shadow-sm">
                  <Grid3x3 size={18} strokeWidth={2} className="text-slate-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-100">Grid overlay</div>
                  <div className="text-xs text-slate-400">Show alignment grid on canvas</div>
                </div>
              </div>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`relative h-6 w-11 rounded-full transition-colors ${showGrid ? 'bg-indigo-600' : 'bg-slate-700'}`}
                aria-label="Toggle grid"
              >
                <motion.div
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  animate={{ left: showGrid ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </section>

          {/* Contributor Info */}
          {contributor && (
            <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h2 className="mb-3 text-base font-semibold text-slate-100">Contributor Info</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                  <dt className="text-slate-400">ID</dt>
                  <dd className="font-mono text-xs text-slate-300">
                    {contributor.id.slice(0, 8)}...
                  </dd>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                  <dt className="text-slate-400">Device</dt>
                  <dd className="text-slate-300">{contributor.deviceType}</dd>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                  <dt className="text-slate-400">Samples</dt>
                  <dd className="font-semibold text-slate-100">{totalSamples}</dd>
                </div>
                {storageEstimate && (
                  <div className="flex justify-between rounded-lg bg-slate-800/50 px-3 py-2">
                    <dt className="text-slate-400">Storage</dt>
                    <dd className="text-slate-300">{storageEstimate}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Danger Zone */}
          <section className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-rose-400">
              <AlertTriangle size={18} strokeWidth={2} />
              Danger Zone
            </h2>
            {showClearConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-400">
                  Delete all <span className="font-semibold">{totalSamples}</span> samples? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleClearAll}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-500"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                    Yes, delete all
                  </motion.button>
                  <motion.button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowClearConfirm(true)}
                disabled={totalSamples === 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-slate-900 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-40"
                whileHover={{ scale: totalSamples === 0 ? 1 : 1.01 }}
                whileTap={{ scale: totalSamples === 0 ? 1 : 0.97 }}
              >
                <Trash2 size={16} strokeWidth={2} />
                Clear all data
              </motion.button>
            )}
          </section>
        </div>
      </div>
    </Layout>
  )
}
