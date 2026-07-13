import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ArrowRight, Check, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePointerDrawing } from '../../hooks/usePointerDrawing'
import { renderStrokes, setupCanvas, canvasToPng } from '../../utils/canvasUtils'
import { strokesToSvg } from '../../utils/svgUtils'
import Toolbar from './Toolbar'
import type { Stroke } from '../../types'

interface DrawingCanvasProps {
  onSubmit: (data: {
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
  }) => void
  onSkip: () => void
  onPrevious: () => void
  targetCharacter: string
  targetTransliteration: string
  currentIdx: number
  totalChars: number
  initialStrokes?: Stroke[] | null
  submitLabel?: string
}

export default function DrawingCanvas({
  onSubmit,
  onSkip,
  onPrevious,
  targetCharacter,
  targetTransliteration,
  currentIdx: _currentIdx,
  totalChars: _totalChars,
  initialStrokes,
  submitLabel,
}: DrawingCanvasProps) {
  void _currentIdx
  void _totalChars
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const penThickness = useStore((s) => s.penThickness)
  const setPenThickness = useStore((s) => s.setPenThickness)
  const penColor = useStore((s) => s.penColor)
  const setPenColor = useStore((s) => s.setPenColor)
  const showGrid = useStore((s) => s.showGrid)
  const [isErasing, setIsErasing] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)
  const [strokeCount, setStrokeCount] = useState(0)
  const [redoCount, setRedoCount] = useState(0)
  const [showSaved, setShowSaved] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [currentStrokeActive, setCurrentStrokeActive] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const state = stateRef.current
    renderStrokes(ctx, state.strokes, state.currentStroke, isErasingRef.current)
  }, [])

  const drawing = usePointerDrawing(render, 'mouse', isErasing, penThickness, penColor)

  const renderOverlay = useCallback(() => {
    const overlay = overlayRef.current
    const main = canvasRef.current
    if (!overlay || !main) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return

    const rect = main.getBoundingClientRect()
    overlay.width = rect.width
    overlay.height = rect.height
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    const w = overlay.width
    const h = overlay.height

    if (showGrid) {
      ctx.save()
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 6])
      const cols = 4
      const rows = 4
      for (let i = 1; i < cols; i++) {
        const x = (w / cols) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let j = 1; j < rows; j++) {
        const y = (h / rows) * j
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [showGrid])

  const penThicknessRef = useRef(penThickness)
  const isErasingRef = useRef(isErasing)
  const penColorRef = useRef(penColor)
  const stateRef = drawing.stateRef
  const drawingRef = useRef(drawing)
  penThicknessRef.current = penThickness
  isErasingRef.current = isErasing
  penColorRef.current = penColor
  drawingRef.current = drawing

  const syncCounts = useCallback(() => {
    const s = stateRef.current
    setCanSubmit(s.strokes.length > 0)
    setStrokeCount(s.strokes.length)
    setRedoCount(s.redoStack.length)
    setIsEmpty(s.strokes.length === 0 && !s.currentStroke)
  }, [stateRef])

  const setupAndRender = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    setupCanvas(canvas, dpr)
    render()
    syncCounts()
  }, [render, syncCounts])

  const vibrate = useCallback((pattern: number) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern)
  }, [])

  useEffect(() => {
    if (initialStrokes && initialStrokes.length > 0) {
      const stateRef = drawingRef.current.stateRef
      const normalizedStrokes = initialStrokes.map(s => ({
        points: s.points,
        thickness: s.thickness ?? 4,
        color: s.color ?? '#000000',
      }))
      stateRef.current = {
        ...stateRef.current,
        strokes: normalizedStrokes,
        redoStack: [],
        isDrawing: false,
        currentStroke: null,
      }
      setupAndRender()
    } else {
      drawingRef.current.reset()
      setupAndRender()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCharacter, initialStrokes])

  useEffect(() => {
    setupAndRender()
  }, [setupAndRender])

  useEffect(() => {
    const handleResize = () => {
      setupAndRender()
      renderOverlay()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setupAndRender, renderOverlay])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      setupAndRender()
      renderOverlay()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [setupAndRender, renderOverlay])

  useEffect(() => {
    renderOverlay()
  }, [renderOverlay])

  // Re-render on fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      setupAndRender()
      renderOverlay()
    }, 50)
    return () => clearTimeout(timer)
  }, [isFullscreen, setupAndRender, renderOverlay])

  const pendingPointerMoveRef = useRef<PointerEvent | null>(null)
  const rafMoveRef = useRef<number | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      drawingRef.current.handlePointerDown(e, canvas)
      setCurrentStrokeActive(true)
      if (e.pointerType === 'touch') vibrate(10)
      syncCounts()
    }
    const onPointerMove = (e: PointerEvent) => {
      pendingPointerMoveRef.current = e
      if (rafMoveRef.current === null) {
        rafMoveRef.current = requestAnimationFrame(() => {
          rafMoveRef.current = null
          const ev = pendingPointerMoveRef.current
          if (ev) {
            drawingRef.current.handlePointerMove(ev, canvas)
          }
        })
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      if (rafMoveRef.current !== null) {
        cancelAnimationFrame(rafMoveRef.current)
        rafMoveRef.current = null
      }
      pendingPointerMoveRef.current = null
      canvas.releasePointerCapture(e.pointerId)
      drawingRef.current.handlePointerUp()
      setCurrentStrokeActive(false)
      syncCounts()
    }
    const onPointerLeave = () => {
      if (rafMoveRef.current !== null) {
        cancelAnimationFrame(rafMoveRef.current)
        rafMoveRef.current = null
      }
      pendingPointerMoveRef.current = null
      drawingRef.current.handlePointerUp()
      setCurrentStrokeActive(false)
      syncCounts()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [isFullscreen, syncCounts, vibrate])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        drawingRef.current.handleUndo()
        syncCounts()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault()
        drawingRef.current.handleRedo()
        syncCounts()
      } else if (e.key === 'Escape') {
        if (isErasingRef.current) {
          setIsErasing(false)
        } else if (isFullscreen) {
          setIsFullscreen(false)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncCounts, isFullscreen])

  const handlePointerMoveCursor = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const handlePointerLeaveCursor = useCallback(() => {
    setCursorPos(null)
  }, [])

  const handleUndo = useCallback(() => {
    drawingRef.current.handleUndo()
    syncCounts()
  }, [syncCounts])

  const handleRedo = useCallback(() => {
    drawingRef.current.handleRedo()
    syncCounts()
  }, [syncCounts])

  const handleClear = useCallback(() => {
    drawingRef.current.handleClear()
    syncCounts()
  }, [syncCounts])

  const handleRotate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawingRef.current.handleRotate(canvas.width, canvas.height)
    render()
    syncCounts()
  }, [render, syncCounts])

  const handleSubmit = useCallback(async () => {
    const canvas = canvasRef.current
    const drawingApi = drawingRef.current
    if (!canvas || !drawingApi.hasStrokes()) return

    vibrate(15)
    const state = drawingApi.getState()
    const dpr = window.devicePixelRatio || 1

    const pngBlob = await canvasToPng(canvas)
    const svgString = strokesToSvg(
      state.strokes,
      canvas.width,
      canvas.height,
      penThickness * dpr,
    )

    await onSubmit({
      strokes: state.strokes,
      strokeCount: state.strokes.length,
      deviceType: state.deviceType,
      hasPressure: state.hasPressure,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      pngBlob,
      svgString,
      penThickness,
      penColor,
    })

    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 600)

    syncCounts()
  }, [onSubmit, penThickness, syncCounts, vibrate])

  const handleSkipClick = useCallback(() => {
    vibrate(5)
    drawingRef.current.reset()
    syncCounts()
    onSkip()
  }, [onSkip, syncCounts, vibrate])

  const handlePrevClick = useCallback(() => {
    vibrate(5)
    drawingRef.current.reset()
    syncCounts()
    onPrevious()
  }, [onPrevious, syncCounts, vibrate])

  // Canvas content (shared between normal + fullscreen)
  const canvasContent = (
    <>
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none rounded-xl border-2 border-slate-700 bg-white shadow-md"
        onPointerMove={handlePointerMoveCursor}
        onPointerLeave={handlePointerLeaveCursor}
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      {/* Brush cursor preview */}
      {cursorPos && !isErasing && (
        <div
          className="pointer-events-none absolute rounded-full border border-slate-400 opacity-50"
          style={{
            left: cursorPos.x - penThickness / 2 + 2,
            top: cursorPos.y - penThickness / 2 + 2,
            width: penThickness,
            height: penThickness,
            backgroundColor: penColor + '30',
          }}
        />
      )}

      {/* Empty state */}
      {isEmpty && !currentStrokeActive && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="select-none text-5xl font-bold text-slate-200 sm:text-6xl">
            {targetCharacter}
          </span>
          <span className="select-none text-sm text-slate-300">
            Draw {targetTransliteration} here
          </span>
        </div>
      )}

      {/* Saved confirmation overlay */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
              <CheckCircle2 size={36} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-emerald-400">
              Saved!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: floating thickness slider at bottom — hides while drawing */}
      <AnimatePresence>
        {!currentStrokeActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 sm:hidden"
          >
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-2 shadow-xl backdrop-blur-md">
              <motion.div
                className="shrink-0 rounded-full"
                style={{ backgroundColor: penColor }}
                animate={{ width: Math.max(6, penThickness), height: Math.max(6, penThickness) }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
              <input
                type="range"
                min="1"
                max="20"
                value={penThickness}
                onChange={(e) => setPenThickness(Number(e.target.value))}
                className="thickness-slider h-2 w-28 cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, ${penColor} 0%, ${penColor} ${((penThickness - 1) / 19) * 100}%, #334155 ${((penThickness - 1) / 19) * 100}%, #334155 100%)`,
                }}
                aria-label="Pen thickness"
              />
              <span className="w-7 shrink-0 text-center text-sm font-semibold text-slate-300">
                {penThickness}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: floating thickness slider on left side — hides while drawing */}
      <AnimatePresence>
        {!currentStrokeActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-auto absolute left-3 top-1/2 hidden -translate-y-1/2 sm:block"
          >
            <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-900/95 px-2 py-3 shadow-xl backdrop-blur-md">
              <motion.div
                className="shrink-0 rounded-full"
                style={{ backgroundColor: penColor }}
                animate={{ width: Math.max(6, penThickness), height: Math.max(6, penThickness) }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
              <input
                type="range"
                min="1"
                max="20"
                value={penThickness}
                onChange={(e) => setPenThickness(Number(e.target.value))}
                className="thickness-slider h-28 w-2 cursor-pointer appearance-none rounded-full"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl',
                  background: `linear-gradient(to top, ${penColor} 0%, ${penColor} ${((penThickness - 1) / 19) * 100}%, #334155 ${((penThickness - 1) / 19) * 100}%, #334155 100%)`,
                }}
                aria-label="Pen thickness"
              />
              <span className="shrink-0 text-center text-sm font-semibold text-slate-300">
                {penThickness}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  // ── FULLSCREEN / ZOOM MODE ──
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-900" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Top bar — exit + tools */}
        <div className="flex items-center justify-between px-3 py-2">
          <motion.button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-slate-400"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
          >
            <Minimize2 size={18} strokeWidth={2.5} />
            Exit
          </motion.button>

          {/* Inline tools for fullscreen */}
          <div className="flex items-center gap-1.5">
            <Toolbar
              isErasing={isErasing}
              onToggleEraser={() => setIsErasing((v) => !v)}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              onRotate={handleRotate}
              canRotate={strokeCount > 0}
              penColor={penColor}
              onPenColorChange={setPenColor}
              canRedo={redoCount > 0}
              canUndo={strokeCount > 0}
            />
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-1.5">
            <motion.button
              onClick={handlePrevClick}
              className="flex items-center justify-center rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-slate-400"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </motion.button>
            <motion.button
              onClick={handleSkipClick}
              className="flex items-center justify-center rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-slate-400"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRight size={18} strokeWidth={2.5} />
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
              whileHover={{ scale: canSubmit ? 1.03 : 1 }}
              whileTap={{ scale: canSubmit ? 0.95 : 1 }}
            >
              <Check size={18} strokeWidth={2.5} />
              {submitLabel ?? 'Submit'}
            </motion.button>
          </div>
        </div>

        {/* Canvas — fills ALL remaining space */}
        <div ref={containerRef} className="flex min-h-0 flex-1 items-center justify-center p-2">
          <div className="relative h-full w-full max-h-full max-w-full overflow-hidden">
            {canvasContent}
          </div>
        </div>
      </div>
    )
  }

  // ── NORMAL MODE ──
  return (
    <div className="flex h-full flex-col">
      {/* Canvas + Toolbar */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
        <Toolbar
          isErasing={isErasing}
          onToggleEraser={() => setIsErasing((v) => !v)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onRotate={handleRotate}
          canRotate={strokeCount > 0}
          penColor={penColor}
          onPenColorChange={setPenColor}
          canRedo={redoCount > 0}
          canUndo={strokeCount > 0}
        />

        {/* Canvas — fills all available space */}
        <div
          ref={containerRef}
          className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center p-2 sm:order-2 sm:p-3"
        >
          <div className="relative h-full max-h-full max-w-full overflow-hidden">
            {canvasContent}

            {/* Zoom button — top right of canvas */}
            <motion.button
              onClick={() => setIsFullscreen(true)}
              className="pointer-events-auto absolute right-2 top-2 z-10 flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-slate-400 shadow-sm backdrop-blur-sm hover:bg-slate-800/50"
              aria-label="Enter fullscreen"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Maximize2 size={16} strokeWidth={2} />
            </motion.button>
            </div>
          </div>
        </div>

      {/* Navigation bar */}
      <div className="flex gap-2 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
        <motion.button
          onClick={handlePrevClick}
          className="flex flex-1 items-center justify-center whitespace-nowrap gap-1 rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          Prev
        </motion.button>
        <motion.button
          onClick={handleSkipClick}
          className="flex flex-1 items-center justify-center whitespace-nowrap gap-1 rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
        >
          Skip
          <ArrowRight size={18} strokeWidth={2.5} />
        </motion.button>
        <motion.button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex flex-[2] items-center justify-center whitespace-nowrap gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
          whileHover={{ scale: canSubmit ? 1.02 : 1 }}
          whileTap={{ scale: canSubmit ? 0.96 : 1 }}
        >
          <Check size={18} strokeWidth={2.5} />
          {submitLabel ?? 'Submit'}
        </motion.button>
      </div>
    </div>
  )
}
