import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Undo2, Redo2, Eraser, Trash2, Grid3x3, RotateCw, ChevronDown,
} from 'lucide-react'

interface ToolbarProps {
  penColor: string
  isErasing: boolean
  onToggleEraser: () => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onRotate: () => void
  canRotate: boolean
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
    <div className={vertical ? 'mx-0.5 h-8 w-px shrink-0 bg-gray-200 dark:bg-gray-700' : 'my-1 h-px bg-gray-200 dark:bg-gray-700'} />
  )
}

function ColorPicker({ penColor, onPenColorChange }: { penColor: string; onPenColorChange: (c: string) => void }) {
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
    <div ref={ref} className="relative shrink-0">
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        aria-label="Color picker"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: penColor }} />
        <ChevronDown size={12} strokeWidth={2} className="text-gray-400" />
      </motion.button>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Pick color</div>
              <div className="grid grid-cols-2 gap-2">
                {COLORS.map((c) => (
                  <motion.button
                    key={c.value}
                    onClick={() => {
                      onPenColorChange(c.value)
                      setOpen(false)
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      penColor === c.value ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200 dark:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <div className="h-8 w-8 rounded-full border-2 border-white shadow-md dark:border-gray-600" style={{ backgroundColor: c.value }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{c.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}
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
  penColor,
  onPenColorChange,
  canUndo,
  canRedo,
  showGrid,
  onToggleGrid,
}: ToolbarProps) {
  return (
    <>
      {/* ═══ Desktop: vertical sidebar ═══ */}
      <div className="hidden w-12 flex-col items-center gap-1.5 border-r border-gray-200 p-1.5 dark:border-gray-700 sm:flex">
        <ToolButton onClick={onUndo} disabled={!canUndo} label="Undo">
          <Undo2 size={18} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRedo} disabled={!canRedo} label="Redo">
          <Redo2 size={18} strokeWidth={2} />
        </ToolButton>

        <Divider />

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

        <ToolButton onClick={onToggleGrid} active={showGrid} label="Toggle grid">
          <Grid3x3 size={18} strokeWidth={2} />
        </ToolButton>

        <Divider />

        <ColorPicker penColor={penColor} onPenColorChange={onPenColorChange} />
      </div>

      {/* ═══ Mobile: horizontal bar ═══ */}
      <div className="order-first flex items-center gap-1 overflow-x-auto overscroll-contain border-b border-gray-200 px-2 py-1.5 dark:border-gray-700 sm:hidden">
        <ToolButton onClick={onUndo} disabled={!canUndo} label="Undo">
          <Undo2 size={16} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRedo} disabled={!canRedo} label="Redo">
          <Redo2 size={16} strokeWidth={2} />
        </ToolButton>

        <Divider vertical />

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

        <ToolButton onClick={onToggleGrid} active={showGrid} label="Grid">
          <Grid3x3 size={16} strokeWidth={2} />
        </ToolButton>

        <Divider vertical />

        <ColorPicker penColor={penColor} onPenColorChange={onPenColorChange} />
      </div>
    </>
  )
}
