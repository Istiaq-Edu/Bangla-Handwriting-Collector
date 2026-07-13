import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Share2, Copy, Check, Mail, MessageCircle,
  Send, FileArchive, ChevronUp, AlertCircle,
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

interface ShareCapabilities {
  hasShare: boolean
  canShareFiles: boolean
  hasClipboard: boolean
  canDownload: boolean
}

function detectShareCapabilities(zipFile?: File): ShareCapabilities {
  const hasShare = typeof navigator.share === 'function'
  let canShareFiles = false
  if (hasShare && typeof navigator.canShare === 'function' && zipFile) {
    try {
      canShareFiles = navigator.canShare({ files: [zipFile] })
    } catch {
      canShareFiles = false
    }
  }
  const hasClipboard = !!navigator.clipboard && !!navigator.clipboard.writeText
  return { hasShare, canShareFiles, hasClipboard, canDownload: true }
}

export default function ExportView() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })
  const [zipBlob, setZipBlob] = useState<Blob | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<ShareCapabilities>({
    hasShare: false, canShareFiles: false, hasClipboard: false, canDownload: true,
  })

  const [formats, setFormats] = useState<Set<ExportFormat>>(new Set(['folder-csv']))
  const [variants, setVariants] = useState<Set<ImageVariant>>(new Set(['raw']))
  const [colorScheme, setColorScheme] = useState<ColorScheme>('black-on-white')

  const sessionId = useStore((s) => s.sessionId)
  const sheetRef = useRef<HTMLDivElement>(null)

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

  const handleDownload = useCallback(async () => {
    let blob = zipBlob
    if (!blob) {
      blob = await generateZip()
      if (!blob) return
    }
    downloadBlob(blob, fileName)
  }, [zipBlob, generateZip, fileName])

  const handleShareClick = useCallback(async () => {
    let blob = zipBlob
    if (!blob) {
      blob = await generateZip()
      if (!blob) return
    }

    const file = new File([blob], fileName, { type: 'application/zip' })
    setZipBlob(blob)
    setZipFile(file)

    const caps = detectShareCapabilities(file)
    setCapabilities(caps)

    if (caps.canShareFiles && blob.size <= MAX_SHARE_SIZE) {
      try {
        await navigator.share({
          files: [file],
          title: 'Bangla Handwriting Dataset',
          text: `${samples.length} handwriting samples collected via Bangla Handwriting Collector`,
        })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    setShowShareSheet(true)
  }, [zipBlob, generateZip, fileName, samples.length])

  const handleNativeShareText = useCallback(async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: 'Bangla Handwriting Dataset',
        text: `I collected ${samples.length} Bangla handwriting samples. Download the ZIP and share it with me!`,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
    }
  }, [samples.length])

  const handleCopyDescription = useCallback(() => {
    const text = `Bangla Handwriting Dataset — ${samples.length} samples (${zipBlob ? (zipBlob.size / 1024 / 1024).toFixed(1) : '?'} MB). Collected via Bangla Handwriting Collector.`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }, [samples.length, zipBlob])

  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent('Bangla Handwriting Dataset')
    const body = encodeURIComponent(
      `Hi,\n\nI've collected ${samples.length} Bangla handwriting samples using Bangla Handwriting Collector.\n` +
      `The dataset ZIP is attached separately (download first, then attach to this email).\n\n` +
      `File: ${fileName}\n` +
      `Size: ${zipBlob ? (zipBlob.size / 1024 / 1024).toFixed(1) : '?'} MB\n\n` +
      `Thanks!`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }, [samples.length, fileName, zipBlob])

  const handleWhatsAppShare = useCallback(() => {
    const text = encodeURIComponent(
      `Bangla Handwriting Dataset — ${samples.length} samples. Download the ZIP file I'm sharing separately.`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }, [samples.length])

  const handleTelegramShare = useCallback(() => {
    const text = encodeURIComponent(
      `Bangla Handwriting Dataset — ${samples.length} samples. Download the ZIP file I'm sharing separately.`
    )
    window.open(`https://t.me/share/url?url=${encodeURIComponent('https://bangla-handwriting-collector.vercel.app')}&text=${text}`, '_blank')
  }, [samples.length])

  const toggleFormat = (f: ExportFormat) => {
    setFormats((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
    setZipBlob(null)
    setZipFile(null)
  }

  const toggleVariant = (v: ImageVariant) => {
    setVariants((prev) => {
      const next = new Set(prev)
      if (next.has(v)) next.delete(v)
      else next.add(v)
      return next
    })
    setZipBlob(null)
    setZipFile(null)
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
            <motion.button
              onClick={handleShareClick}
              disabled={exporting || formats.size === 0 || variants.size === 0}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              whileHover={{ scale: exporting ? 1 : 1.02 }}
              whileTap={{ scale: exporting ? 1 : 0.96 }}
            >
              <Share2 size={18} strokeWidth={2} />
              Share Dataset
            </motion.button>
          </div>
        </div>
      </div>

      {/* Share Bottom Sheet */}
      <AnimatePresence>
        {showShareSheet && (
          <ShareSheet
            onClose={() => setShowShareSheet(false)}
            capabilities={capabilities}
            zipFile={zipFile}
            fileName={fileName}
            zipSize={zipBlob?.size ?? 0}
            isOverLimit={isOverShareLimit}
            onDownload={handleDownload}
            onNativeShareText={handleNativeShareText}
            onCopyDescription={handleCopyDescription}
            onEmail={handleEmailShare}
            onWhatsApp={handleWhatsAppShare}
            onTelegram={handleTelegramShare}
            copied={copied}
            sampleCount={samples.length}
            sheetRef={sheetRef}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}

// ── Bottom Sheet Component ──
interface ShareSheetProps {
  onClose: () => void
  capabilities: ShareCapabilities
  zipFile: File | null
  fileName: string
  zipSize: number
  isOverLimit: boolean
  onDownload: () => void
  onNativeShareText: () => void
  onCopyDescription: () => void
  onEmail: () => void
  onWhatsApp: () => void
  onTelegram: () => void
  copied: boolean
  sampleCount: number
  sheetRef: React.RefObject<HTMLDivElement | null>
}

function ShareSheet({
  onClose, capabilities, zipFile, fileName, zipSize, isOverLimit,
  onDownload, onNativeShareText, onCopyDescription, onEmail,
  onWhatsApp, onTelegram, copied, sampleCount,
}: ShareSheetProps) {
  const sizeMB = (zipSize / 1024 / 1024).toFixed(1)
  const sizeKB = (zipSize / 1024).toFixed(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const shareOptions: { id: string; label: string; icon: React.ReactNode; onClick: () => void; available: boolean; color: string }[] = [
    {
      id: 'native-files',
      label: 'Share ZIP',
      icon: <Share2 size={22} strokeWidth={2} />,
      onClick: async () => {
        if (zipFile && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
          try {
            await navigator.share({ files: [zipFile], title: 'Bangla Handwriting Dataset', text: `${sampleCount} handwriting samples` })
          } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
              onDownload()
            }
          }
        }
        onClose()
      },
      available: capabilities.canShareFiles && !isOverLimit,
      color: 'bg-indigo-500',
    },
    {
      id: 'native-text',
      label: 'Share text',
      icon: <MessageCircle size={22} strokeWidth={2} />,
      onClick: () => { onNativeShareText(); onClose() },
      available: capabilities.hasShare && (!capabilities.canShareFiles || isOverLimit),
      color: 'bg-emerald-500',
    },
    {
      id: 'download',
      label: 'Download',
      icon: <Download size={22} strokeWidth={2} />,
      onClick: () => { onDownload(); onClose() },
      available: true,
      color: 'bg-slate-600',
    },
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy info',
      icon: copied ? <Check size={22} strokeWidth={2} /> : <Copy size={22} strokeWidth={2} />,
      onClick: onCopyDescription,
      available: capabilities.hasClipboard,
      color: 'bg-violet-500',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle size={22} strokeWidth={2} />,
      onClick: () => { onWhatsApp(); onClose() },
      available: true,
      color: 'bg-emerald-500',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: <Send size={22} strokeWidth={2} />,
      onClick: () => { onTelegram(); onClose() },
      available: true,
      color: 'bg-sky-500',
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail size={22} strokeWidth={2} />,
      onClick: () => { onEmail(); onClose() },
      available: true,
      color: 'bg-orange-500',
    },
  ]

  const visibleOptions = shareOptions.filter((o) => o.available)

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        role="dialog"
        aria-modal="true"
        aria-label="Share dataset"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-slate-900"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-slate-700" />
        </div>

        <div className="px-4 pb-4">
          {/* Header */}
          <div className="mb-3 mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileArchive size={20} strokeWidth={2} className="text-indigo-400" />
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Share Dataset
                </h3>
                <p className="text-xs text-slate-400">
                  {sampleCount} samples · {zipSize > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800"
            >
              <ChevronUp size={20} />
            </button>
          </div>

          {/* Large file warning */}
          {isOverLimit && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-2.5 text-xs text-orange-700">
              <AlertCircle size={16} className="shrink-0" />
              File is larger than 10 MB — native file sharing may not work on some devices. Download is recommended.
            </div>
          )}

          {/* Share options grid */}
          <div className="grid grid-cols-4 gap-3">
            {visibleOptions.map((option) => (
              <motion.button
                key={option.id}
                onClick={option.onClick}
                className="flex flex-col items-center gap-1.5"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${option.color} text-white shadow-md`}
                >
                  {option.icon}
                </div>
                <span className="text-xs font-medium text-slate-300">
                  {option.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* File name */}
          <div className="mt-3 rounded-lg bg-slate-800/50 px-3 py-2">
            <p className="truncate text-xs text-slate-400">
              {fileName}
            </p>
          </div>

          {/* Cancel */}
          <motion.button
            onClick={onClose}
            className="mt-3 w-full rounded-xl border border-slate-700 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/50"
            whileTap={{ scale: 0.97 }}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
