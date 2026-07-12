import { motion } from 'framer-motion'
import { Undo2, Redo2, Eraser, Trash2, Grid3x3, Eye } from 'lucide-react'

interface ToolbarProps {
  penThickness: number
  isErasing: boolean
  onToggleEraser: () => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onPenThicknessChange: (thickness: number) => void
  canUndo: boolean
  canRedo: boolean
  showGrid: boolean
  onToggleGrid: () => void
  showGuide: boolean
  onToggleGuide: () => void
}

const btnClass = (active: boolean) =>
  active
    ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    : 'border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'

const iconMotion = {
  whileHover: { scale: 1.15 },
  whileTap: { scale: 0.85 },
  transition: { type: 'spring' as const, stiffness: 500, damping: 15 },
}

function ToolButton({
  onClick, disabled, active, label, children,
}: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border p-2.5 transition-colors ${btnClass(active ?? false)}`}
      aria-label={label}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
    >
      <motion.div {...iconMotion}>{children}</motion.div>
    </motion.button>
  )
}

export default function Toolbar({
  isErasing,
  onToggleEraser,
  onUndo,
  onRedo,
  onClear,
  penThickness,
  onPenThicknessChange,
  canUndo,
  canRedo,
  showGrid,
  onToggleGrid,
  showGuide,
  onToggleGuide,
}: ToolbarProps) {
  return (
    <>
      {/* Desktop/tablet: vertical sidebar */}
      <div className="hidden flex-col gap-2 border-r border-gray-200 p-2 dark:border-gray-700 sm:flex">
        <ToolButton onClick={onUndo} disabled={!canUndo} label="Undo">
          <Undo2 size={20} strokeWidth={2} />
        </ToolButton>

        <ToolButton onClick={onRedo} disabled={!canRedo} label="Redo">
          <Redo2 size={20} strokeWidth={2} />
        </ToolButton>

        <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

        <ToolButton onClick={onToggleEraser} active={isErasing} label="Eraser">
          <Eraser size={20} strokeWidth={2} />
        </ToolButton>

        <ToolButton onClick={onClear} label="Clear all">
          <Trash2 size={20} strokeWidth={2} />
        </ToolButton>

        <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

        <ToolButton onClick={onToggleGrid} active={showGrid} label="Toggle grid overlay">
          <Grid3x3 size={20} strokeWidth={2} />
        </ToolButton>

        <ToolButton onClick={onToggleGuide} active={showGuide} label="Toggle tracing guide">
          <Eye size={20} strokeWidth={2} />
        </ToolButton>

        <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

        {/* Thickness slider - vertical */}
        <div className="flex flex-col items-center gap-1">
          <motion.div
            className="rounded-full bg-black dark:bg-white"
            animate={{ width: Math.max(4, penThickness), height: Math.max(4, penThickness) }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
          <input
            type="range"
            min="1"
            max="20"
            value={penThickness}
            onChange={(e) => onPenThicknessChange(Number(e.target.value))}
            className="h-24 w-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            aria-label="Pen thickness"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {penThickness}
          </span>
        </div>
      </div>

      {/* Mobile: horizontal bar */}
      <div className="order-first flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700 sm:hidden">
        <ToolButton onClick={onUndo} disabled={!canUndo} label="Undo">
          <Undo2 size={18} strokeWidth={2} />
        </ToolButton>

        <ToolButton onClick={onRedo} disabled={!canRedo} label="Redo">
          <Redo2 size={18} strokeWidth={2} />
        </ToolButton>

        <ToolButton onClick={onClear} label="Clear all">
          <Trash2 size={18} strokeWidth={2} />
        </ToolButton>

        <ToolButton onClick={onToggleEraser} active={isErasing} label="Eraser">
          <Eraser size={18} strokeWidth={2} />
        </ToolButton>

        <ToolButton onClick={onToggleGrid} active={showGrid} label="Toggle grid overlay">
          <Grid3x3 size={18} strokeWidth={2} />
        </ToolButton>

        <ToolButton onClick={onToggleGuide} active={showGuide} label="Toggle tracing guide">
          <Eye size={18} strokeWidth={2} />
        </ToolButton>

        <div className="ml-1 flex flex-1 items-center gap-2">
          <motion.div
            className="shrink-0 rounded-full bg-black dark:bg-white"
            animate={{ width: Math.max(4, penThickness), height: Math.max(4, penThickness) }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
          <input
            type="range"
            min="1"
            max="20"
            value={penThickness}
            onChange={(e) => onPenThicknessChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700"
            aria-label="Pen thickness"
          />
          <span className="w-7 shrink-0 text-right text-xs text-gray-500 dark:text-gray-400">
            {penThickness}px
          </span>
        </div>
      </div>
    </>
  )
}
