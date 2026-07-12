import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Trash2, AlertTriangle } from 'lucide-react'
import { Layout } from '../Layout'
import { useStore } from '../../store/useStore'
import { deleteAllSamples } from '../../db/database'
import type { PresentationMode } from '../../types'

const MODES: { value: PresentationMode; label: string }[] = [
  { value: 'sequential', label: 'Sequential' },
  { value: 'randomized', label: 'Randomized' },
  { value: 'adaptive', label: 'Adaptive' },
  { value: 'user-select', label: 'User Select' },
]

export default function SettingsView() {
  const presentationMode = useStore((s) => s.presentationMode)
  const setPresentationMode = useStore((s) => s.setPresentationMode)
  const penThickness = useStore((s) => s.penThickness)
  const setPenThickness = useStore((s) => s.setPenThickness)
  const contributor = useStore((s) => s.contributor)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const totalSamples = useStore((s) => s.totalSamples)
  const setTotalSamples = useStore((s) => s.setTotalSamples)

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
      <div className="mx-auto max-w-md space-y-6 p-4">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Presentation Mode</h2>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setPresentationMode(mode.value)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  presentationMode === mode.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Theme</h2>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sun size={18} strokeWidth={2} />
              Light
            </motion.button>
            <motion.button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              <Moon size={18} strokeWidth={2} />
              Dark
            </motion.button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Pen Thickness: {penThickness}px
          </h2>
          <input
            type="range"
            min="1"
            max="20"
            value={penThickness}
            onChange={(e) => setPenThickness(Number(e.target.value))}
            className="w-full"
          />
        </section>

        {contributor && (
          <section className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
            <h2 className="mb-2 font-semibold">Contributor Info</h2>
            <dl className="space-y-1 text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <dt>ID</dt>
                <dd className="font-mono text-xs">
                  {contributor.id.slice(0, 8)}...
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Device</dt>
                <dd>{contributor.deviceType}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Samples</dt>
                <dd>{totalSamples}</dd>
              </div>
              {storageEstimate && (
                <div className="flex justify-between">
                  <dt>Storage</dt>
                  <dd>{storageEstimate}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section className="rounded-lg border border-red-200 p-3 dark:border-red-800">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
            <AlertTriangle size={18} strokeWidth={2} />
            Danger Zone
          </h2>
          {showClearConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Delete all {totalSamples} samples? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <motion.button
                  onClick={handleClearAll}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 size={16} strokeWidth={2} />
                  Yes, delete all
                </motion.button>
                <motion.button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm dark:border-gray-700"
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
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:border-red-800 dark:hover:bg-red-900/20"
              whileHover={{ scale: totalSamples === 0 ? 1 : 1.02 }}
              whileTap={{ scale: totalSamples === 0 ? 1 : 0.95 }}
            >
              <Trash2 size={16} strokeWidth={2} />
              Clear all data
            </motion.button>
          )}
        </section>
      </div>
    </Layout>
  )
}
