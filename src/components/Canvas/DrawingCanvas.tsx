import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, RotateCw } from 'lucide-react'
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
  currentIdx,
  totalChars,
  initialStrokes,
  submitLabel,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const penThickness = useStore((s) => s.penThickness)
  const setPenThickness = useStore((s) => s.setPenThickness)
  const [isErasing, setIsErasing] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)
  const [strokeCount, setStrokeCount] = useState(0)
  const [redoCount, setRedoCount] = useState(0)
  const [showSaved, setShowSaved] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [currentStrokeActive, setCurrentStrokeActive] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  // Render callback — draws strokes on canvas. Does NOT call setState.
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const state = stateRef.current
    renderStrokes(ctx, state.strokes, state.currentStroke, penThicknessRef.current, isErasingRef.current)
  }, [])

  const drawing = usePointerDrawing(render, 'mouse', isErasing)

  // Draw grid + tracing guide on the overlay canvas (never captured in PNG export)
  const renderOverlay = useCallback(() => {
    const overlay = overlayRef.current
    const main = canvasRef.current
    if (!overlay || !main) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return

    // Match overlay size to main canvas (CSS pixels)
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

    if (showGuide && targetCharacter) {
      ctx.save()
      ctx.globalAlpha = 0.07
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const fontSize = Math.min(w, h) * 0.8
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillText(targetCharacter, w / 2, h / 2 + fontSize * 0.05)
      ctx.restore()
    }
  }, [showGrid, showGuide, targetCharacter])

  // Keep refs in sync for use inside render and event handlers
  const penThicknessRef = useRef(penThickness)
  const isErasingRef = useRef(isErasing)
  const stateRef = drawing.stateRef
  const drawingRef = useRef(drawing)
  penThicknessRef.current = penThickness
  isErasingRef.current = isErasing
  drawingRef.current = drawing

  // Sync stroke/redo counts to state (for button enable/disable)
  // Called only after stroke operations, NOT during pointermove
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

  // Clear canvas when character changes, or pre-load strokes for edit mode
  useEffect(() => {
    if (initialStrokes && initialStrokes.length > 0) {
      // Pre-load existing strokes into the drawing state
      const stateRef = drawingRef.current.stateRef
      stateRef.current = {
        ...stateRef.current,
        strokes: initialStrokes,
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

  // Initial setup
  useEffect(() => {
    setupAndRender()
  }, [setupAndRender])

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setupAndRender()
      renderOverlay()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setupAndRender, renderOverlay])

  // Redraw overlay when grid/guide toggles change
  useEffect(() => {
    renderOverlay()
  }, [renderOverlay])

  // Bind pointer events ONCE — use refs, not drawing object
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

  // Undo/Redo/Clear handlers that sync counts after
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

    // AWAIT the parent's handler — ensures advance() runs before we reset
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
    })

    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 600)

    // reset + render happens via the targetCharacter useEffect
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
      {/* Reference card - top right */}
      <div className="flex items-start justify-between px-4 pt-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {currentIdx + 1}
          </span>
          /{totalChars}
        </div>
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {targetCharacter}
          </span>
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {targetTransliteration}
          </span>
        </div>
      </div>

      {/* Canvas + Toolbar: column on mobile, row on desktop */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex min-h-0 flex-1 items-center justify-center p-3 sm:order-2 sm:p-4"
        >
          <div className="relative aspect-[4/3] max-h-full max-w-full sm:aspect-square">
            <canvas
              ref={canvasRef}
              className="h-full w-full touch-none rounded-xl border-2 border-gray-200 bg-white shadow-md dark:border-gray-700"
            />
            <canvas
              ref={overlayRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            />

            {/* Empty state hint */}
            {isEmpty && !currentStrokeActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="select-none text-2xl font-medium text-gray-300 dark:text-gray-600">
                  Draw {targetCharacter} here
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
                    <Check size={36} strokeWidth={3} className="text-white" />
                  </div>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    Saved!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toolbar */}
        <Toolbar
          isErasing={isErasing}
          onToggleEraser={() => setIsErasing(!isErasing)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          penThickness={penThickness}
          onPenThicknessChange={setPenThickness}
          canRedo={redoCount > 0}
          canUndo={strokeCount > 0}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid((v) => !v)}
          showGuide={showGuide}
          onToggleGuide={() => setShowGuide((v) => !v)}
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-2 px-4 pb-4">
        <motion.button
          onClick={handlePrevClick}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          Prev
        </motion.button>
        <motion.button
          onClick={handleSkipClick}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          Skip
          <ChevronRight size={18} strokeWidth={2.5} />
        </motion.button>
        <motion.button
          onClick={handleRotate}
          disabled={strokeCount === 0}
          className="flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          whileHover={{ scale: strokeCount > 0 ? 1.05 : 1 }}
          whileTap={{ scale: strokeCount > 0 ? 0.9 : 1 }}
          aria-label="Rotate 90° clockwise"
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <RotateCw size={18} strokeWidth={2.5} />
          </motion.div>
        </motion.button>
        <motion.button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
          whileHover={{ scale: canSubmit ? 1.02 : 1 }}
          whileTap={{ scale: canSubmit ? 0.96 : 1 }}
        >
          <Check size={18} strokeWidth={2.5} />
          {submitLabel ?? 'OK'}
        </motion.button>
      </div>
    </div>
  )
}
