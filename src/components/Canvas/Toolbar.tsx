import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Undo2, Redo2, Eraser, Trash2, Grid3x3, RotateCw,
  ChevronDown,
} from 'lucide-react'

interface ToolbarProps {
  penThickness: number
  penColor: string
  isErasing: boolean
  onToggleEraser: () => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onRotate: () => void
  canRotate: boolean
  onPenThicknessChange: (thickness: number) => void
  onPenColorChange: (color: string) => void
  canUndo: boolean
  canRedo: boolean
  showGrid: boolean
  onToggleGrid: () => void
}

const COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#dc2626', label: 'Red' },
  { value: '#16a34a', label: 'Green' },
]

const btnBase = (active: boolean) =>
  active
    ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    : 'border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'

const dangerBtn = 'border-red-300 text-red-500 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20'

const iconMotion = {
  whileHover: { scale: 1.15 },
  whileTap: { scale: 0.85 },
  transition: { type: 'spring' as const, stiffness: 500, damping: 15 },
}

function ToolButton({
  onClick, disabled, active, label, children, danger,
}: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  label: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-lg border p-2.5 transition-colors ${danger ? dangerBtn : btnBase(active ?? false)}`}
      aria-label={label}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
    >
      <motion.div {...iconMotion}>{children}</motion.div>
    </motion.button>
  )
}

function Divider({ vertical }: { vertical?: boolean }) {
  return (
    <div className={vertical ? 'mx-0.5 h-8 w-px bg-gray-200 dark:bg-gray-700' : 'my-1 h-px bg-gray-200 dark:bg-gray-700'} />
  )
}

function ColorDropdown({ penColor, onPenColorChange, layout }: { penColor: string; onPenColorChange: (c: string) => void; layout: 'vertical' | 'horizontal' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <motion.button
        onClick={() => setOpen(!open)}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        aria-label="Color picker"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: penColor }} />
        <ChevronDown size={14} strokeWidth={2} className="text-gray-400" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`absolute z-50 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800 ${
              layout === 'vertical' ? 'left-full top-0 ml-2' : 'bottom-full left-1/2 mb-2 -translate-x-1/2'
            }`}
          >
            <div className={layout === 'vertical' ? 'flex flex-col gap-2' : 'flex gap-2'}>
              {COLORS.map((c) => (
                <motion.button
                  key={c.value}
                  onClick={() => {
                    onPenColorChange(c.value)
                    setOpen(false)
                  }}
                  className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    penColor === c.value ? 'ring-2 ring-blue-500' : ''
                  }`}
                  aria-label={c.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="h-6 w-6 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: c.value }} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Toolbar({
  isErasing,
  onToggleEraser,
  onUndo,
  onRedo,
  onClear,
  onRotate,
  canRotate,
  penThickness,
  penColor,
  onPenColorChange,
  onPenThicknessChange,
  canUndo,
  canRedo,
  showGrid,
  onToggleGrid,
}: ToolbarProps) {
  return (
    <>
      {/* ═══ Desktop/tablet: vertical sidebar ═══ */}
      <div className="hidden w-12 flex-col items-center gap-1.5 border-r border-gray-200 p-1.5 dark:border-gray-700 sm:flex">
        {/* History group */}
        <ToolButton onClick={onUndo} disabled={!canUndo} label="Undo">
          <Undo2 size={18} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRedo} disabled={!canRedo} label="Redo">
          <Redo2 size={18} strokeWidth={2} />
        </ToolButton>

        <Divider />

        {/* Tools group */}
        <ToolButton onClick={onToggleEraser} active={isErasing} label="Eraser">
          <Eraser size={18} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onClear} label="Clear all" danger>
          <Trash2 size={18} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRotate} disabled={!canRotate} label="Rotate 90°">
          <RotateCw size={18} strokeWidth={2} />
        </ToolButton>

        <Divider />

        {/* View */}
        <ToolButton onClick={onToggleGrid} active={showGrid} label="Toggle grid">
          <Grid3x3 size={18} strokeWidth={2} />
        </ToolButton>

        <Divider />

        {/* Color dropdown */}
        <ColorDropdown penColor={penColor} onPenColorChange={onPenColorChange} layout="vertical" />

        <Divider />

        {/* Thickness slider */}
        <div className="flex flex-col items-center gap-1">
          <motion.div
            className="rounded-full"
            style={{ backgroundColor: penColor }}
            animate={{ width: Math.max(4, penThickness), height: Math.max(4, penThickness) }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
          <input
            type="range"
            min="1"
            max="20"
            value={penThickness}
            onChange={(e) => onPenThicknessChange(Number(e.target.value))}
            className="h-16 w-1.5 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            aria-label="Pen thickness"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {penThickness}
          </span>
        </div>
      </div>

      {/* ═══ Mobile: single horizontal control bar ═══ */}
      <div className="order-first flex items-center gap-1 overflow-x-auto overscroll-contain border-b border-gray-200 px-2 py-1.5 dark:border-gray-700 sm:hidden">
        {/* History */}
        <ToolButton onClick={onUndo} disabled={!canUndo} label="Undo">
          <Undo2 size={16} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRedo} disabled={!canRedo} label="Redo">
          <Redo2 size={16} strokeWidth={2} />
        </ToolButton>

        <Divider vertical />

        {/* Tools */}
        <ToolButton onClick={onToggleEraser} active={isErasing} label="Eraser">
          <Eraser size={16} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onClear} label="Clear" danger>
          <Trash2 size={16} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRotate} disabled={!canRotate} label="Rotate">
          <RotateCw size={16} strokeWidth={2} />
        </ToolButton>

        <Divider vertical />

        {/* View */}
        <ToolButton onClick={onToggleGrid} active={showGrid} label="Grid">
          <Grid3x3 size={16} strokeWidth={2} />
        </ToolButton>

        <Divider vertical />

        {/* Color dropdown */}
        <ColorDropdown penColor={penColor} onPenColorChange={onPenColorChange} layout="horizontal" />

        <Divider vertical />

        {/* Thickness */}
        <div className="flex items-center gap-1.5">
          <motion.div
            className="shrink-0 rounded-full"
            style={{ backgroundColor: penColor }}
            animate={{ width: Math.max(4, penThickness), height: Math.max(4, penThickness) }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
          <input
            type="range"
            min="1"
            max="20"
            value={penThickness}
            onChange={(e) => onPenThicknessChange(Number(e.target.value))}
            className="h-2 w-16 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700"
            aria-label="Pen thickness"
          />
          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {penThickness}
          </span>
        </div>
      </div>
    </>
  )
}
