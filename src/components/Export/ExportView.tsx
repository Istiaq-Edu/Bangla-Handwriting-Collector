import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Download, Share2, FileArchive, AlertCircle,
} from 'lucide-react'
import { Layout } from '../Layout'
import { getAllSamples } from '../../db/database'
import { buildZip, downloadBlob } from '../../utils/zipBuilder'
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

const MAX_SHARE_SIZE = 10 * 1024 * 1024

export default function ExportView() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })
  const [zipBlob, setZipBlob] = useState<Blob | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

  const [formats, setFormats] = useState<Set<ExportFormat>>(new Set(['folder-csv']))
  const [variants, setVariants] = useState<Set<ImageVariant>>(new Set(['raw']))
  const [colorScheme, setColorScheme] = useState<ColorScheme>('black-on-white')

  const sessionId = useStore((s) => s.sessionId)

  const fileName = `bangla-handwriting-${new Date().toISOString().slice(0, 10)}-${sessionId.slice(0, 8)}.zip`

  const refresh = useCallback(async () => {
    setLoading(true)
    const all = await getAllSamples()
    setSamples(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isOverShareLimit = zipBlob ? zipBlob.size > MAX_SHARE_SIZE : false

  const generateZip = useCallback(async (): Promise<Blob | null> => {
    if (samples.length === 0 || formats.size === 0 || variants.size === 0) return null

    setExporting(true)
    setShareError(null)
    setProgress({ current: 0, total: samples.length, label: 'Starting...' })

    try {
      const blob = await buildZip(samples, {
        formats: Array.from(formats),
        imageVariants: Array.from(variants),
        colorScheme,
        onProgress: (current, total, label) => {
          setProgress({ current, total, label })
        },
      })
      return blob
    } catch (err) {
      console.error('Export failed:', err)
      setShareError('Failed to generate ZIP. Try reducing the number of samples or variants.')
      return null
    } finally {
      setExporting(false)
    }
  }, [samples, formats, variants, colorScheme])

  // Pre-generate ZIP whenever settings change (so share is instant — preserves user gesture)
  useEffect(() => {
    if (samples.length === 0 || formats.size === 0 || variants.size === 0) return
    let cancelled = false
    ;(async () => {
      const blob = await generateZip()
      if (!cancelled && blob) setZipBlob(blob)
    })()
    return () => { cancelled = true }
  }, [generateZip])

  const handleDownload = useCallback(async () => {
    let blob = zipBlob
    if (!blob) {
      blob = await generateZip()
      if (!blob) return
    }
    downloadBlob(blob, fileName)
  }, [zipBlob, generateZip, fileName])

  // Use a ref + native event listener to bypass React's synthetic event system.
  // React's event delegation was consuming transient activation, causing
  // NotAllowedError on navigator.share(). Native listener preserves the gesture.
  const shareBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const btn = shareBtnRef.current
    if (!btn) return

    const handleClick = () => {
      if (!zipBlob) {
        setShareError('ZIP is still being prepared. Please wait a moment.')
        return
      }

      if (!window.isSecureContext || typeof navigator.share !== 'function') {
        downloadBlob(zipBlob, fileName)
        return
      }

      const title = 'Bangla Handwriting Dataset'
      const text = `${samples.length} handwriting samples collected via Bangla Handwriting Collector`

      // Use canShare() to decide payload — does NOT consume transient activation.
      // Only call navigator.share() once (it consumes activation).
      const canShareFiles =
        zipBlob.size <= MAX_SHARE_SIZE &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [new File([zipBlob], fileName, { type: 'application/zip' })] })

      const shareData = canShareFiles
        ? { files: [new File([zipBlob], fileName, { type: 'application/zip' })], title, text }
        : { title, text }

      navigator.share(shareData).catch((err: unknown) => {
        const name = (err as { name?: string })?.name ?? ''
        if (name === 'AbortError') return
        downloadBlob(zipBlob, fileName)
        setShareError(`Share failed (${name}). Downloaded instead.`)
      })
    }

    btn.addEventListener('click', handleClick)
    return () => btn.removeEventListener('click', handleClick)
  }, [zipBlob, fileName, samples.length])

  const toggleFormat = (f: ExportFormat) => {
    setFormats((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
    setZipBlob(null)
  }

  const toggleVariant = (v: ImageVariant) => {
    setVariants((prev) => {
      const next = new Set(prev)
      if (next.has(v)) next.delete(v)
      else next.add(v)
      return next
    })
    setZipBlob(null)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-slate-400">
          Loading...
        </div>
      </Layout>
    )
  }

  if (samples.length === 0) {
    return (
      <Layout>
        <div className="flex h-full flex-col items-center justify-center text-slate-400">
          <FileArchive size={48} strokeWidth={1.5} className="mb-3 text-slate-600" />
          <p>No samples to export yet.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-4 overscroll-contain">
        <div className="mx-auto max-w-md space-y-5 sm:max-w-lg md:max-w-xl">
          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-700 bg-gradient-to-br from-indigo-500/10 to-slate-900 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-600 p-2.5 text-white">
                <FileArchive size={24} strokeWidth={2} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">
                  {samples.length}
                </div>
                <div className="text-xs text-slate-400">
                  samples ready for export
                </div>
              </div>
            </div>
          </motion.div>

          {/* Formats */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-300">
              Export Formats
            </h2>
            <div className="space-y-2">
              {FORMATS.map((f) => (
                <label
                  key={f.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    formats.has(f.value)
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formats.has(f.value)}
                    onChange={() => toggleFormat(f.value)}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-100">
                      {f.label}
                    </div>
                    <div className="text-xs text-slate-400">
                      {f.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Image Variants */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-300">
              Image Variants
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {VARIANTS.map((v) => (
                <label
                  key={v}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors ${
                    variants.has(v)
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={variants.has(v)}
                    onChange={() => toggleVariant(v)}
                    className="accent-blue-600"
                  />
                  <span className="text-xs text-slate-300">
                    {getVariantLabel(v)}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Color Scheme */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-300">
              Color Scheme
            </h2>
            <div className="flex gap-2">
              {(['black-on-white', 'white-on-black'] as ColorScheme[]).map((cs) => (
                <button
                  key={cs}
                  onClick={() => {
                    setColorScheme(cs)
                    setZipBlob(null)
                  }}
                  className={`flex-1 rounded-lg border p-3 text-sm transition-colors ${
                    colorScheme === cs
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700'
                  }`}
                >
                  {cs === 'black-on-white' ? 'Black on White' : 'White on Black'}
                </button>
              ))}
            </div>
          </section>

          {/* Error */}
          {shareError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400"
            >
              <AlertCircle size={18} strokeWidth={2} className="shrink-0" />
              {shareError}
            </motion.div>
          )}

          {/* Progress */}
          {exporting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3"
            >
              <div className="mb-1 text-sm text-indigo-300">
                {progress.label}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-indigo-500/20">
                <motion.div
                  className="h-full rounded-full bg-indigo-600"
                  animate={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-indigo-400">
                {progress.current} / {progress.total}
              </div>
            </motion.div>
          )}

          {/* ZIP info */}
          {zipBlob && !exporting && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm"
            >
              <span className="text-emerald-400">
                ZIP ready: {(zipBlob.size / 1024 / 1024).toFixed(1)} MB
              </span>
              {isOverShareLimit && (
                <span className="flex items-center gap-1 text-xs text-orange-400">
                  <AlertCircle size={14} />
                  Large file — use download
                </span>
              )}
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pb-4">
            <motion.button
              onClick={handleDownload}
              disabled={exporting || formats.size === 0 || variants.size === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-40"
              whileHover={{ scale: exporting ? 1 : 1.02 }}
              whileTap={{ scale: exporting ? 1 : 0.96 }}
            >
              <Download size={18} strokeWidth={2} />
              Download
            </motion.button>
            <button
              ref={shareBtnRef}
              type="button"
              disabled={exporting || formats.size === 0 || variants.size === 0}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              <Share2 size={18} strokeWidth={2} />
              Share Dataset
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
