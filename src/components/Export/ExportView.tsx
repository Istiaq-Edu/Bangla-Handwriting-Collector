import { useState, useCallback, useEffect } from 'react'
import { Layout } from '../Layout'
import { getAllSamples } from '../../db/database'
import { buildZip, shareZip, downloadBlob } from '../../utils/zipBuilder'
import { getVariantLabel } from '../../utils/imageProcessing'
import { useStore } from '../../store/useStore'
import type { ExportFormat, ImageVariant, ColorScheme, Sample } from '../../types'

const FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'folder-csv', label: 'Folder-per-class + CSV', description: 'Images organized by character folders + metadata.csv' },
  { value: 'flat-jsonl', label: 'Flat images + JSONL', description: 'All images flat + labels in JSONL file' },
  { value: 'tfrecord', label: 'TFRecord', description: 'TensorFlow-compatible format' },
  { value: 'hdf5', label: 'HDF5', description: 'PyTorch-compatible format' },
]

const VARIANTS: ImageVariant[] = ['raw', 'cropped', 'centered', '28x28', '64x64', '128x128']

export default function ExportView() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })

  const [formats, setFormats] = useState<Set<ExportFormat>>(new Set(['folder-csv']))
  const [variants, setVariants] = useState<Set<ImageVariant>>(new Set(['raw']))
  const [colorScheme, setColorScheme] = useState<ColorScheme>('black-on-white')

  const sessionId = useStore((s) => s.sessionId)

  const refresh = useCallback(async () => {
    setLoading(true)
    const all = await getAllSamples()
    setSamples(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggleFormat = (f: ExportFormat) => {
    setFormats((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  const toggleVariant = (v: ImageVariant) => {
    setVariants((prev) => {
      const next = new Set(prev)
      if (next.has(v)) next.delete(v)
      else next.add(v)
      return next
    })
  }

  const handleExport = useCallback(async () => {
    if (samples.length === 0 || formats.size === 0 || variants.size === 0) return

    setExporting(true)
    setProgress({ current: 0, total: samples.length, label: 'Starting...' })

    try {
      const zipBlob = await buildZip(samples, {
        formats: Array.from(formats),
        imageVariants: Array.from(variants),
        colorScheme,
        onProgress: (current, total, label) => {
          setProgress({ current, total, label })
        },
      })

      const date = new Date().toISOString().slice(0, 10)
      const fileName = `bangla-handwriting-${date}-${sessionId.slice(0, 8)}.zip`

      downloadBlob(zipBlob, fileName)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [samples, formats, variants, colorScheme, sessionId])

  const handleShare = useCallback(async () => {
    if (samples.length === 0 || formats.size === 0 || variants.size === 0) return

    setExporting(true)
    setProgress({ current: 0, total: samples.length, label: 'Starting...' })

    try {
      const zipBlob = await buildZip(samples, {
        formats: Array.from(formats),
        imageVariants: Array.from(variants),
        colorScheme,
        onProgress: (current, total, label) => {
          setProgress({ current, total, label })
        },
      })

      const date = new Date().toISOString().slice(0, 10)
      const fileName = `bangla-handwriting-${date}.zip`

      const shared = await shareZip(zipBlob, fileName)
      if (!shared) {
        downloadBlob(zipBlob, fileName)
      }
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setExporting(false)
    }
  }, [samples, formats, variants, colorScheme])

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-gray-500">
          Loading...
        </div>
      </Layout>
    )
  }

  if (samples.length === 0) {
    return (
      <Layout>
        <div className="flex h-full flex-col items-center justify-center text-gray-500">
          <span className="mb-2 text-4xl">💾</span>
          <p>No samples to export yet.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-4">
        <div className="mx-auto max-w-md space-y-5">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {samples.length} samples ready for export
          </div>

          {/* Formats */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Export Formats
            </h2>
            <div className="space-y-2">
              {FORMATS.map((f) => (
                <label
                  key={f.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    formats.has(f.value)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formats.has(f.value)}
                    onChange={() => toggleFormat(f.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {f.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {f.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Image Variants */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Image Variants
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {VARIANTS.map((v) => (
                <label
                  key={v}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors ${
                    variants.has(v)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={variants.has(v)}
                    onChange={() => toggleVariant(v)}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {getVariantLabel(v)}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Color Scheme */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Color Scheme
            </h2>
            <div className="flex gap-2">
              {(['black-on-white', 'white-on-black'] as ColorScheme[]).map((cs) => (
                <button
                  key={cs}
                  onClick={() => setColorScheme(cs)}
                  className={`flex-1 rounded-lg border p-3 text-sm transition-colors ${
                    colorScheme === cs
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {cs === 'black-on-white' ? 'Black on White' : 'White on Black'}
                </button>
              ))}
            </div>
          </section>

          {/* Progress */}
          {exporting && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {progress.label}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {progress.current} / {progress.total}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pb-4">
            <button
              onClick={handleExport}
              disabled={exporting || formats.size === 0 || variants.size === 0}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
            >
              {exporting ? 'Exporting...' : 'Download ZIP'}
            </button>
            <button
              onClick={handleShare}
              disabled={exporting || formats.size === 0 || variants.size === 0}
              className="flex-1 rounded-xl border border-blue-600 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 dark:hover:bg-blue-900/20"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
