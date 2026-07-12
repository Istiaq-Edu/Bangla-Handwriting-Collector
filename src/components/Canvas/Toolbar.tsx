import { motion } from 'framer-motion'
import {
  Undo2, Redo2, Eraser, Trash2, Grid3x3, Eye, RotateCw,
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
  showGuide: boolean
  onToggleGuide: () => void
}

const COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#dc2626', label: 'Red' },
  { value: '#16a34a', label: 'Green' },
]

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
  iconSize?: number
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-lg border p-2.5 transition-colors ${btnClass(active ?? false)}`}
      aria-label={label}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
    >
      <motion.div {...iconMotion}>{children}</motion.div>
    </motion.button>
  )
}

function ColorSwatch({ color, active, onClick, label }: { color: string; active: boolean; onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      className={`h-7 w-7 shrink-0 rounded-full border-2 ${active ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800' : 'border-gray-300 dark:border-gray-600'}`}
      style={{ backgroundColor: color }}
      aria-label={label}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.85 }}
    />
  )
}

function Divider({ vertical }: { vertical?: boolean }) {
  return (
    <div className={vertical ? 'mx-0.5 h-8 w-px bg-gray-200 dark:bg-gray-700' : 'my-1 h-px bg-gray-200 dark:bg-gray-700'} />
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
  showGuide,
  onToggleGuide,
}: ToolbarProps) {
  return (
    <>
      {/* ═══ Desktop/tablet: vertical sidebar ═══ */}
      <div className="hidden w-14 flex-col items-center gap-2 border-r border-gray-200 p-2 dark:border-gray-700 sm:flex">
        {/* History group */}
        <ToolButton onClick={onUndo} disabled={!canUndo} label="Undo">
          <Undo2 size={20} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRedo} disabled={!canRedo} label="Redo">
          <Redo2 size={20} strokeWidth={2} />
        </ToolButton>

        <Divider />

        {/* Tools group */}
        <ToolButton onClick={onToggleEraser} active={isErasing} label="Eraser">
          <Eraser size={20} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onClear} label="Clear all">
          <Trash2 size={20} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRotate} disabled={!canRotate} label="Rotate 90°">
          <RotateCw size={20} strokeWidth={2} />
        </ToolButton>

        <Divider />

        {/* View group */}
        <ToolButton onClick={onToggleGrid} active={showGrid} label="Toggle grid">
          <Grid3x3 size={20} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onToggleGuide} active={showGuide} label="Toggle guide">
          <Eye size={20} strokeWidth={2} />
        </ToolButton>

        <Divider />

        {/* Color swatches */}
        <div className="flex flex-col items-center gap-1.5">
          {COLORS.map((c) => (
            <ColorSwatch
              key={c.value}
              color={c.value}
              active={penColor === c.value}
              onClick={() => onPenColorChange(c.value)}
              label={c.label}
            />
          ))}
        </div>

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
            className="h-20 w-1.5 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            aria-label="Pen thickness"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {penThickness}
          </span>
        </div>
      </div>

      {/* ═══ Mobile: single horizontal control bar ═══ */}
      <div className="order-first flex items-center gap-1.5 overflow-x-auto overscroll-contain border-b border-gray-200 px-2 py-1.5 dark:border-gray-700 sm:hidden">
        {/* History group */}
        <ToolButton onClick={onUndo} disabled={!canUndo} label="Undo" iconSize={18}>
          <Undo2 size={18} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRedo} disabled={!canRedo} label="Redo" iconSize={18}>
          <Redo2 size={18} strokeWidth={2} />
        </ToolButton>

        <Divider vertical />

        {/* Tools group */}
        <ToolButton onClick={onToggleEraser} active={isErasing} label="Eraser" iconSize={18}>
          <Eraser size={18} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onClear} label="Clear" iconSize={18}>
          <Trash2 size={18} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onRotate} disabled={!canRotate} label="Rotate" iconSize={18}>
          <RotateCw size={18} strokeWidth={2} />
        </ToolButton>

        <Divider vertical />

        {/* View group */}
        <ToolButton onClick={onToggleGrid} active={showGrid} label="Grid" iconSize={18}>
          <Grid3x3 size={18} strokeWidth={2} />
        </ToolButton>
        <ToolButton onClick={onToggleGuide} active={showGuide} label="Guide" iconSize={18}>
          <Eye size={18} strokeWidth={2} />
        </ToolButton>

        <Divider vertical />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <ColorSwatch
              key={c.value}
              color={c.value}
              active={penColor === c.value}
              onClick={() => onPenColorChange(c.value)}
              label={c.label}
            />
          ))}
        </div>

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
            className="h-2 w-20 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700"
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
