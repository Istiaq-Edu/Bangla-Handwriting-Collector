import { motion } from 'framer-motion'
import {
  PenLine, LayoutGrid, Download, Settings as SettingsIcon,
  Undo2, Redo2, Eraser, Trash2,
  ChevronLeft, ChevronRight, Check, X, AlertCircle,
  Pencil, Share2, Image, Inbox,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  className?: string
}

const baseMotion = {
  whileHover: { scale: 1.15 },
  whileTap: { scale: 0.9 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
}

const tapMotion = {
  whileTap: { scale: 0.85 },
  transition: { type: 'spring' as const, stiffness: 600, damping: 15 },
}

// ── Nav icons ──
export const DrawIcon = ({ size = 22, className = '' }: IconProps) => (
  <motion.div {...baseMotion}>
    <PenLine size={size} className={className} strokeWidth={2} />
  </motion.div>
)

export const GridIcon = ({ size = 22, className = '' }: IconProps) => (
  <motion.div {...baseMotion}>
    <LayoutGrid size={size} className={className} strokeWidth={2} />
  </motion.div>
)

export const ExportIcon = ({ size = 22, className = '' }: IconProps) => (
  <motion.div {...baseMotion}>
    <Download size={size} className={className} strokeWidth={2} />
  </motion.div>
)

export const SettingsGearIcon = ({ size = 22, className = '' }: IconProps) => (
  <motion.div {...baseMotion}>
    <SettingsIcon size={size} className={className} strokeWidth={2} />
  </motion.div>
)

// ── Toolbar icons ──
export const UndoIcon = ({ size = 20, className = '' }: IconProps) => (
  <motion.div {...tapMotion}>
    <Undo2 size={size} className={className} strokeWidth={2} />
  </motion.div>
)

export const RedoIcon = ({ size = 20, className = '' }: IconProps) => (
  <motion.div {...tapMotion}>
    <Redo2 size={size} className={className} strokeWidth={2} />
  </motion.div>
)

export const EraserIcon = ({ size = 20, className = '' }: IconProps) => (
  <motion.div {...tapMotion}>
    <Eraser size={size} className={className} strokeWidth={2} />
  </motion.div>
)

export const ClearIcon = ({ size = 20, className = '' }: IconProps) => (
  <motion.div {...tapMotion}>
    <Trash2 size={size} className={className} strokeWidth={2} />
  </motion.div>
)

// ── Navigation icons ──
export const PrevIcon = ({ size = 18 }: IconProps) => (
  <motion.div {...tapMotion}>
    <ChevronLeft size={size} strokeWidth={2.5} />
  </motion.div>
)

export const NextIcon = ({ size = 18 }: IconProps) => (
  <motion.div {...tapMotion}>
    <ChevronRight size={size} strokeWidth={2.5} />
  </motion.div>
)

export const CheckIcon = ({ size = 18 }: IconProps) => (
  <motion.div {...tapMotion}>
    <Check size={size} strokeWidth={2.5} />
  </motion.div>
)

export const CloseIcon = ({ size = 16 }: IconProps) => (
  <motion.div {...tapMotion}>
    <X size={size} strokeWidth={2.5} />
  </motion.div>
)

export const AlertIcon = ({ size = 18, className = '' }: IconProps) => (
  <AlertCircle size={size} className={className} strokeWidth={2} />
)

export const PencilIcon = ({ size = 16, className = '' }: IconProps) => (
  <Pencil size={size} className={className} strokeWidth={2} />
)

export const ShareIcon = ({ size = 18, className = '' }: IconProps) => (
  <motion.div {...baseMotion}>
    <Share2 size={size} className={className} strokeWidth={2} />
  </motion.div>
)

export const ImageIcon = ({ size = 40, className = '' }: IconProps) => (
  <Image size={size} className={className} strokeWidth={1.5} />
)

export const InboxIcon = ({ size = 40, className = '' }: IconProps) => (
  <Inbox size={size} className={className} strokeWidth={1.5} />
)

// ── Wrapper for animated button content ──
export function AnimatedButton({ children, ...props }: { children: ReactNode } & React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// ── Animated nav item ──
export function NavItemIcon({ icon, active }: { icon: LucideIcon; active: boolean }) {
  const Icon = icon
  return (
    <motion.div
      animate={{
        scale: active ? 1.1 : 1,
        y: active ? -2 : 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    </motion.div>
  )
}
