import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Pencil, X } from 'lucide-react'
import { Layout } from '../Layout'
import DrawingCanvas from '../Canvas/DrawingCanvas'
import ProgressDots from '../Canvas/ProgressDots'
import { BANGLA_CHARACTERS, VOWELS, CONSONANTS, NUMERALS, getCharacterById, type BanglaCharacter } from '../../data/banglaChars'
import { useStore } from '../../store/useStore'
import { saveSample } from '../../db/database'
import { v4 as uuidv4 } from 'uuid'
import type { Stroke } from '../../types'

type CategoryFilter = 'all' | 'vowel' | 'consonant' | 'numeral'

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'vowel', label: 'Vowels' },
  { value: 'consonant', label: 'Consonants' },
  { value: 'numeral', label: 'Numerals' },
]

function getFilteredChars(category: CategoryFilter): BanglaCharacter[] {
  switch (category) {
    case 'vowel': return VOWELS
    case 'consonant': return CONSONANTS
    case 'numeral': return NUMERALS
    default: return BANGLA_CHARACTERS
  }
}

export default function CollectionView() {
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [order, setOrder] = useState<number[]>(() => BANGLA_CHARACTERS.map((c) => c.id))
  const [position, setPosition] = useState(0)

  const sessionId = useStore((s) => s.sessionId)
  const incrementTotalSamples = useStore((s) => s.incrementTotalSamples)
  const editState = useStore((s) => s.editState)
  const clearEdit = useStore((s) => s.clearEdit)
  const navigate = useNavigate()

  const currentCharRef = useRef<BanglaCharacter>(BANGLA_CHARACTERS[0])
  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

  // Rebuild order when category changes
  useEffect(() => {
    const chars = getFilteredChars(category)
    setOrder(chars.map((c) => c.id))
    setPosition(0)
  }, [category])

  const currentCharId = useMemo(() => {
    if (editState.sample) return editState.sample.characterId
    return order[position] ?? BANGLA_CHARACTERS[0].id
  }, [order, position, editState.sample])

  const currentChar = useMemo(() => {
    const c = getCharacterById(currentCharId) ?? BANGLA_CHARACTERS[0]
    currentCharRef.current = c
    return c
  }, [currentCharId])

  const advance = useCallback(() => {
    setPosition((prev) => {
      if (order.length === 0) return 0
      return (prev + 1) % order.length
    })
  }, [order.length])

  const goPrevious = useCallback(() => {
    setPosition((prev) => {
      if (order.length === 0) return 0
      return (prev - 1 + order.length) % order.length
    })
  }, [order.length])

  const handleSubmit = useCallback(
    async (data: {
      strokes: Stroke[]
      strokeCount: number
      deviceType: 'mouse' | 'touch' | 'pen'
      hasPressure: boolean
      canvasWidth: number
      canvasHeight: number
      pngBlob: Blob
      svgString: string
      penThickness: number
      penColor: string
    }) => {
      const char = currentCharRef.current
      try {
        if (editState.sampleId && editState.sample) {
          // Edit mode: replace existing sample
          const updated = {
            ...editState.sample,
            strokes: data.strokes,
            strokeCount: data.strokeCount,
            deviceType: data.deviceType,
            hasPressure: data.hasPressure,
            canvasWidth: data.canvasWidth,
            canvasHeight: data.canvasHeight,
            penThickness: data.penThickness,
            penColor: data.penColor,
            pngBlob: data.pngBlob,
            svgString: data.svgString,
            createdAt: Date.now(),
          }
          await saveSample(updated)
          clearEdit()
        } else {
          // Normal mode: save new sample
          const sample = {
            id: uuidv4(),
            character: char.unicode,
            characterId: char.id,
            transliteration: char.transliteration,
            category: char.category,
            strokes: data.strokes,
            strokeCount: data.strokeCount,
            deviceType: data.deviceType,
            hasPressure: data.hasPressure,
            canvasWidth: data.canvasWidth,
            canvasHeight: data.canvasHeight,
            penThickness: data.penThickness,
            penColor: data.penColor,
            pngBlob: data.pngBlob,
            svgString: data.svgString,
            createdAt: Date.now(),
            contributorId: sessionIdRef.current,
          }
          await saveSample(sample)
          incrementTotalSamples()
        }
      } catch (err) {
        console.error('[Submit] Failed to save sample:', err)
      }
      advance()
    },
    [editState, clearEdit, incrementTotalSamples, advance],
  )

  const handleSkip = useCallback(() => {
    if (editState.sampleId) {
      clearEdit()
    }
    advance()
  }, [editState.sampleId, clearEdit, advance])

  const handlePrevious = useCallback(() => {
    if (editState.sampleId) {
      clearEdit()
    }
    goPrevious()
  }, [editState.sampleId, clearEdit, goPrevious])

  const isEditMode = editState.sampleId !== null

  return (
    <Layout>
      <div className="flex h-full flex-col">
        {isEditMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-between gap-3 bg-indigo-500/10 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Pencil size={18} strokeWidth={2} className="shrink-0 text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-indigo-300">
                  Editing sample
                </span>
                <span className="text-xs text-blue-500">
                  Changes will replace the original
                </span>
              </div>
            </div>
            <motion.button
              onClick={() => {
                clearEdit()
                navigate('/grid')
              }}
              className="flex items-center gap-1.5 rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/15"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.93 }}
            >
              <X size={16} strokeWidth={2.5} />
              Cancel
            </motion.button>
          </motion.div>
        )}

        {/* Category toggle tabs (hidden in edit mode) */}
        {!isEditMode && (
          <div className="flex gap-1.5 px-3 pt-2">
            {CATEGORY_TABS.map((tab) => (
              <motion.button
                key={tab.value}
                onClick={() => setCategory(tab.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                  category === tab.value
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        )}

        <DrawingCanvas
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          onPrevious={handlePrevious}
          targetCharacter={currentChar.unicode}
          targetTransliteration={currentChar.transliteration}
          currentIdx={isEditMode ? 0 : position}
          totalChars={isEditMode ? 1 : order.length}
          initialStrokes={isEditMode ? editState.initialStrokes : null}
          submitLabel={isEditMode ? 'Save' : 'OK'}
        />
        {!isEditMode && (
          <div className="landscape-compact flex items-center justify-center border-t border-slate-700 px-4 py-2">
            <ProgressDots
              currentIdx={position}
              total={order.length}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}
