import { Layout } from '../Layout'
import { BANGLA_CHARACTERS, VOWELS, CONSONANTS, NUMERALS, getCharacterById } from '../../data/banglaChars'
import { getAllSampleCounts, getSamplesByCharacter, deleteSample, type SampleData } from '../../db/database'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { motion } from 'framer-motion'
import { ChevronLeft, Trash2, X, Pencil, Image as ImageIcon, ArrowRight, Check } from 'lucide-react'

type FilterCategory = 'all' | 'vowel' | 'consonant' | 'numeral'

const FILTERS: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'vowel', label: 'Vowels' },
  { value: 'consonant', label: 'Consonants' },
  { value: 'numeral', label: 'Numerals' },
]

function getCountColor(count: number): string {
  if (count === 0) return 'bg-rose-500/10'
  if (count <= 5) return 'bg-orange-500/10'
  if (count <= 20) return 'bg-amber-500/10'
  return 'bg-emerald-500/10'
}

function getCountTextColor(count: number): string {
  if (count === 0) return 'text-rose-400'
  if (count <= 5) return 'text-orange-400'
  if (count <= 20) return 'text-amber-400'
  return 'text-emerald-400'
}

function useObjectUrl(blob: Blob | null | undefined): string {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!blob || blob.size === 0) {
      setUrl('')
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

export default function CollectionGrid() {
  const [counts, setCounts] = useState<Map<number, number>>(new Map())
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null)
  const [samples, setSamples] = useState<SampleData[]>([])
  const [loadingSamples, setLoadingSamples] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lightboxSample, setLightboxSample] = useState<SampleData | null>(null)
  const navigate = useNavigate()
  const setTotalSamples = useStore((s) => s.setTotalSamples)

  const refreshCounts = useCallback(async () => {
    try {
      const c = await getAllSampleCounts()
      setCounts(c)
      let total = 0
      c.forEach((v) => { total += v })
      setTotalSamples(total)
    } catch (err) {
      console.error('[Grid] Failed to refresh counts:', err)
    }
  }, [setTotalSamples])

  useEffect(() => {
    if (selectedCharId === null) {
      refreshCounts()
    }
  }, [selectedCharId, refreshCounts])

  const loadSamples = useCallback(async (charId: number) => {
    setLoadingSamples(true)
    try {
      const s = await getSamplesByCharacter(charId)
      setSamples(s)
    } catch (err) {
      console.error('[Grid] Failed to load samples:', err)
      setSamples([])
    }
    setLoadingSamples(false)
  }, [])

  useEffect(() => {
    if (selectedCharId !== null) {
      loadSamples(selectedCharId)
    } else {
      setSamples([])
    }
  }, [selectedCharId, loadSamples])

  const handleDelete = useCallback(async (sampleId: string) => {
    setDeletingId(sampleId)
    try {
      await deleteSample(sampleId)
      setSamples((prev) => prev.filter((s) => s.id !== sampleId))
      setLightboxSample(null)
      await refreshCounts()
    } catch (err) {
      console.error('[Grid] Failed to delete sample:', err)
    }
    setDeletingId(null)
  }, [refreshCounts])

  const chars = (() => {
    switch (filter) {
      case 'vowel': return VOWELS
      case 'consonant': return CONSONANTS
      case 'numeral': return NUMERALS
      default: return BANGLA_CHARACTERS
    }
  })()

  const handleDrawThis = () => {
    if (selectedCharId !== null) {
      navigate('/')
    }
  }

  const maxCount = Math.max(1, ...Array.from(counts.values()))

  // ── Lightbox / fullscreen modal ──
  if (lightboxSample) {
    return (
      <Lightbox
        sample={lightboxSample}
        onClose={() => setLightboxSample(null)}
        onDelete={handleDelete}
        deleting={deletingId === lightboxSample.id}
      />
    )
  }

  // ── Sample viewer mode (character selected) ──
  if (selectedCharId !== null) {
    const char = getCharacterById(selectedCharId)
    return (
      <Layout>
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <button
              onClick={() => setSelectedCharId(null)}
              className="flex items-center gap-1 text-sm text-slate-400"
            >
              <ChevronLeft size={16} strokeWidth={2} />
              Back to grid
            </button>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-100">
                {char?.unicode}
              </span>
              <span className="whitespace-nowrap text-sm text-slate-400">
                {char?.transliteration} ({loadingSamples ? '...' : samples.length} samples)
              </span>
            </div>
            <motion.button
              onClick={handleDrawThis}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
            >
              Draw this
              <ArrowRight size={16} strokeWidth={2} />
            </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
            {loadingSamples ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                Loading samples...
              </div>
            ) : samples.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                 <span className="mb-2 text-slate-600">
                   <ImageIcon strokeWidth={1.5} className="size-8 sm:size-10" />
                 </span>
                <p>No samples yet for {char?.unicode}</p>
                <motion.button
                  onClick={handleDrawThis}
                  className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                >
                  <Pencil size={16} strokeWidth={2} />
                  Draw {char?.unicode} now
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {samples.map((sample, idx) => (
                  <SampleCard
                    key={sample.id}
                    sample={sample}
                    index={idx}
                    onClick={() => setLightboxSample(sample)}
                    onDelete={handleDelete}
                    deleting={deletingId === sample.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    )
  }

  // ── Grid mode ──
  return (
    <Layout>
      <div className="h-full overflow-y-auto p-4 overscroll-contain">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {chars.map((char) => {
            const count = counts.get(char.id) ?? 0
            const progress = maxCount > 0 ? (count / maxCount) * 100 : 0
            return (
              <motion.button
                key={char.id}
                onClick={() => setSelectedCharId(char.id)}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex flex-col items-center rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-sm transition-shadow hover:shadow-md ${getCountColor(count)}`}
              >
                <span className="text-3xl font-bold text-slate-100">
                  {char.unicode}
                </span>
                <span className="mt-1 block w-full truncate text-center text-xs text-slate-400">
                  {char.transliteration}
                </span>
                <span className={`mt-1 text-sm font-semibold ${getCountTextColor(count)}`}>
                  {count}
                </span>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-indigo-500"
                  />
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}

// ── Sample card in the grid ──
function SampleCard({
  sample,
  index,
  onClick,
  onDelete,
  deleting,
}: {
  sample: SampleData
  index: number
  onClick: () => void
  onDelete: (id: string) => void
  deleting: boolean
}) {
  const imgUrl = useObjectUrl(sample.pngBlob)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(!sample.pngBlob || sample.pngBlob.size === 0)
  }, [sample.pngBlob])

  return (
    <div className="group relative flex flex-col items-center rounded-lg border border-slate-700 bg-slate-900 p-2">
      {/* Quick delete button (top-right, always visible) */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(sample.id)
        }}
        disabled={deleting}
              className="absolute right-1 top-1 z-10 rounded-full bg-rose-500/90 p-1.5 text-white opacity-100 transition-opacity hover:bg-rose-600 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Delete sample"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
      >
        <Trash2 size={14} strokeWidth={2.5} />
      </motion.button>

      {/* Click to open lightbox */}
      <button
        onClick={onClick}
        aria-label={`Sample ${index + 1} — click to enlarge`}
        className="aspect-square w-full overflow-hidden rounded bg-slate-800/50"
      >
        {imgError ? (
          <div className="flex h-full flex-col items-center justify-center text-xs text-rose-400">
            <span>No image</span>
          </div>
        ) : imgUrl ? (
          <img
            src={imgUrl}
            alt={`Sample ${index + 1}`}
            className="h-full w-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Loading...
          </div>
        )}
      </button>

      <div className="mt-1.5 w-full text-center">
        <div className="text-xs font-medium text-slate-400">
          #{index + 1}
        </div>
        <div className="text-xs text-slate-500">
          {new Date(sample.createdAt).toLocaleDateString()}
        </div>
        <div className="text-xs text-slate-500">
          {sample.strokeCount} strokes · {sample.deviceType}
        </div>
      </div>
    </div>
  )
}

// ── Full-screen lightbox modal ──
function Lightbox({
  sample,
  onClose,
  onDelete,
  deleting,
}: {
  sample: SampleData
  onClose: () => void
  onDelete: (id: string) => void
  deleting: boolean
}) {
  const imgUrl = useObjectUrl(sample.pngBlob)
  const [imgError, setImgError] = useState(false)
  const startEdit = useStore((s) => s.startEdit)
  const navigate = useNavigate()

  useEffect(() => {
    setImgError(!sample.pngBlob || sample.pngBlob.size === 0)
  }, [sample.pngBlob])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const char = getCharacterById(sample.characterId)

  const handleModify = () => {
    startEdit(sample)
    onClose()
    navigate('/')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sample viewer"
      className="fixed inset-0 z-50 flex flex-col bg-black/80"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-white/80 hover:text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={18} strokeWidth={2} />
          Close
        </motion.button>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold text-white">
            {char?.unicode}
          </span>
          <span className="text-sm text-white/60">
            {char?.transliteration}
          </span>
        </div>
        <div className="w-20" />
      </div>

      {/* Image area */}
      <div
        className="flex flex-1 items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {imgError ? (
          <div className="flex flex-col items-center text-white/50">
            <span className="mb-1">
              <ImageIcon size={48} strokeWidth={1.5} />
            </span>
            <p>No image data</p>
          </div>
        ) : imgUrl ? (
          <img
            src={imgUrl}
            alt={char?.unicode}
            className="max-h-full max-w-full rounded-lg bg-white object-contain shadow-2xl"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-white/50">Loading...</div>
        )}
      </div>

      {/* Bottom action bar */}
      <div
        className="flex gap-2 px-4 pb-6 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          onClick={onClose}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/30 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          <Check size={18} strokeWidth={2.5} />
          Keep
        </motion.button>
        <motion.button
          onClick={handleModify}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-400 py-3 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          <Pencil size={18} strokeWidth={2} />
          Modify
        </motion.button>
        <motion.button
          onClick={() => onDelete(sample.id)}
          disabled={deleting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
          whileHover={{ scale: deleting ? 1 : 1.02 }}
          whileTap={{ scale: deleting ? 1 : 0.96 }}
        >
          <Trash2 size={18} strokeWidth={2} />
          {deleting ? 'Deleting...' : 'Delete'}
        </motion.button>
      </div>

      {/* Info */}
      <div
        className="truncate px-4 pb-4 text-center text-xs text-white/40"
        onClick={(e) => e.stopPropagation()}
      >
        {sample.strokeCount} strokes · {sample.deviceType} · {sample.hasPressure ? 'with pressure' : 'no pressure'} · {new Date(sample.createdAt).toLocaleString()}
      </div>
    </div>
  )
}
