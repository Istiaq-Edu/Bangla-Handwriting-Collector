import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ArrowRight, CircleCheck } from 'lucide-react'
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
    const observer = new ResizeObserver(() => setupAndRender())
    observer.observe(container)
    return () => observer.disconnect()
  }, [setupAndRender])

  useEffect(() => {
    renderOverlay()
  }, [renderOverlay])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      } else if (e.key === 'Escape' && isErasingRef.current) {
        setIsErasing(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncCounts])

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

  return (
    <div className="flex h-full flex-col">
      {/* Canvas + Toolbar: column on mobile, row on desktop */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
        {/* Mobile toolbar (top, scrollable) */}
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

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex min-h-0 flex-1 items-center justify-center p-2 sm:order-2 sm:p-4"
        >
          <div className="relative aspect-square max-h-full max-w-full overflow-hidden sm:max-w-[600px]">
            <canvas
              ref={canvasRef}
              className="h-full w-full touch-none rounded-xl border-2 border-gray-200 bg-white shadow-md dark:border-gray-700"
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
                className="pointer-events-none absolute rounded-full border border-gray-400 opacity-50"
                style={{
                  left: cursorPos.x - penThickness / 2 + 2,
                  top: cursorPos.y - penThickness / 2 + 2,
                  width: penThickness,
                  height: penThickness,
                  backgroundColor: penColor + '30',
                }}
              />
            )}

            {/* Empty state — target character as subtle hint in center */}
            {isEmpty && !currentStrokeActive && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="select-none text-5xl font-bold text-gray-200 dark:text-gray-700 sm:text-6xl">
                  {targetCharacter}
                </span>
                <span className="select-none text-sm text-gray-300 dark:text-gray-600">
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg">
                    <CircleCheck size={36} strokeWidth={3} className="text-white" />
                  </div>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    Saved!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating thickness slider — hides while drawing */}
            <AnimatePresence>
              {!currentStrokeActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.12 }}
                  className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2"
                >
                  <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white/95 px-4 py-2 shadow-xl backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/95">
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
                      className="thickness-slider h-2 w-28 cursor-pointer appearance-none rounded-full sm:w-40"
                      style={{
                        background: `linear-gradient(to right, ${penColor} 0%, ${penColor} ${((penThickness - 1) / 19) * 100}%, #e5e7eb ${((penThickness - 1) / 19) * 100}%, #e5e7eb 100%)`,
                      }}
                      aria-label="Pen thickness"
                    />
                    <span className="w-7 shrink-0 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {penThickness}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="flex gap-2 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
        <motion.button
          onClick={handlePrevClick}
          className="flex flex-1 items-center justify-center whitespace-nowrap gap-1 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          Prev
        </motion.button>
        <motion.button
          onClick={handleSkipClick}
          className="flex flex-1 items-center justify-center whitespace-nowrap gap-1 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
        >
          Skip
          <ArrowRight size={18} strokeWidth={2.5} />
        </motion.button>
        <motion.button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex flex-[2] items-center justify-center whitespace-nowrap gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-200 disabled:shadow-none dark:disabled:bg-gray-700"
          whileHover={{ scale: canSubmit ? 1.02 : 1 }}
          whileTap={{ scale: canSubmit ? 0.96 : 1 }}
        >
          <CircleCheck size={18} strokeWidth={2.5} />
          {submitLabel ?? 'OK'}
        </motion.button>
      </div>
    </div>
  )
}
