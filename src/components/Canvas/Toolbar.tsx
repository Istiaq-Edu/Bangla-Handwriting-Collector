import { motion } from 'framer-motion'
import {
  Undo2, Redo2, Eraser, Trash2, RotateCw,
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

function ColorSwatches({ penColor, onPenColorChange, layout }: { penColor: string; onPenColorChange: (c: string) => void; layout: 'vertical' | 'horizontal' }) {
  return (
    <div className={layout === 'vertical' ? 'flex flex-col items-center gap-1.5' : 'flex items-center gap-1'}>
      {COLORS.map((c) => (
        <motion.button
          key={c.value}
          onClick={() => onPenColorChange(c.value)}
          className={`h-6 w-6 shrink-0 rounded-full border-2 transition-all ${penColor === c.value ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800 scale-110 border-transparent' : 'border-gray-300 dark:border-gray-600'}`}
          style={{ backgroundColor: c.value }}
          aria-label={c.label}
          whileHover={{ scale: 1.25 }}
          whileTap={{ scale: 0.8 }}
        />
      ))}
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

        <ColorSwatches penColor={penColor} onPenColorChange={onPenColorChange} layout="vertical" />
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

        <ColorSwatches penColor={penColor} onPenColorChange={onPenColorChange} layout="horizontal" />
      </div>
    </>
  )
}
