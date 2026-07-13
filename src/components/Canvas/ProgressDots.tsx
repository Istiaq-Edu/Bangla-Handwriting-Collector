import { BANGLA_CHARACTERS } from '../../data/banglaChars'

interface ProgressDotsProps {
  currentIdx: number
  total: number
}

export default function ProgressDots({ currentIdx, total }: ProgressDotsProps) {
  const visibleDots = 15
  const start = Math.max(0, Math.min(currentIdx - Math.floor(visibleDots / 2), total - visibleDots))

  const dots = []
  for (let i = start; i < Math.min(start + visibleDots, total); i++) {
    const isActive = i === currentIdx
    const isPast = i < currentIdx
    dots.push(
      <div
        key={i}
        className={`h-2 rounded-full transition-all ${
          isActive
            ? 'w-6 bg-indigo-600'
            : isPast
              ? 'w-2 bg-indigo-400'
              : 'w-2 bg-slate-700'
        }`}
      />,
    )
  }

  return (
    <div className="flex items-center gap-1">
      {start > 0 && <span className="text-xs text-slate-500">...</span>}
      {dots}
      {start + visibleDots < total && <span className="text-xs text-slate-500">...</span>}
      <span className="ml-2 whitespace-nowrap text-xs font-medium text-slate-400">
        {currentIdx + 1}/{total}
      </span>
    </div>
  )
}

export { BANGLA_CHARACTERS }
