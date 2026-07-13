import { motion } from 'framer-motion'

export function SkeletonPulse({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-slate-700 ${className}`}
      style={style}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ translateX: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
      />
    </div>
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <SkeletonPulse className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonPulse key={i} className="h-3 w-full" />
      ))}
    </div>
  )
}

export function SkeletonText({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
  return <SkeletonPulse style={{ width, height }} />
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center rounded-xl border border-slate-700 p-3">
          <SkeletonPulse className="mb-2 h-10 w-10 rounded-full" />
          <SkeletonPulse className="mb-1 h-3 w-16" />
          <SkeletonPulse className="h-2 w-8" />
          <SkeletonPulse className="mt-2 h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <SkeletonCard lines={1} />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={3} />
      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  )
}

export function SkeletonExport() {
  return (
    <div className="mx-auto max-w-md space-y-5 p-4 sm:max-w-lg md:max-w-xl">
      <SkeletonCard lines={1} />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
      <div className="flex gap-2">
        <SkeletonPulse className="h-12 flex-1 rounded-xl" />
        <SkeletonPulse className="h-12 flex-[2] rounded-xl" />
      </div>
    </div>
  )
}
