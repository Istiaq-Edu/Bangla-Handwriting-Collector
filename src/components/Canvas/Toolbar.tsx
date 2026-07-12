import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Undo2, Redo2, Eraser, Trash2, RotateCw, ChevronDown,
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

function ColorDropdown({ penColor, onPenColorChange }: { penColor: string; onPenColorChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 6,
      left: rect.left,
    })
  }, [])

  const handleOpen = () => {
    updatePos()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleScroll = () => updatePos()
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePos])

  return (
    <>
      <motion.button
        ref={btnRef}
        onClick={open ? () => setOpen(false) : handleOpen}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        aria-label="Color picker"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="h-5 w-5 rounded-full border border-gray-300 shadow-sm dark:border-gray-600" style={{ backgroundColor: penColor }} />
        <ChevronDown size={12} strokeWidth={2.5} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      {open && (
        <div
          ref={panelRef}
          className="fixed z-50"
          style={{ top: pos.top, left: pos.left }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="rounded-xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex flex-col gap-1">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    onPenColorChange(c.value)
                    setOpen(false)
                  }}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    penColor === c.value ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full border-2 shadow-sm ${penColor === c.value ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-300 dark:border-gray-600'}`} style={{ backgroundColor: c.value }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{c.label}</span>
                  {penColor === c.value && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </>
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

        <ColorDropdown penColor={penColor} onPenColorChange={onPenColorChange} />
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

        <ColorDropdown penColor={penColor} onPenColorChange={onPenColorChange} />
      </div>
    </>
  )
}
