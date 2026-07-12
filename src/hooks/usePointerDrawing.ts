import { useCallback, useRef, useMemo } from 'react'
import type { Point, Stroke } from '../types'
import {
  type PointerDrawingState,
  createPointerDrawingState,
  getPointerType,
  createPoint,
  startStroke,
  continueStroke,
  endStroke,
  undoStroke,
  redoStroke,
  clearAll,
  eraseStrokeAt,
  rotateStrokes90CW,
} from './pointerDrawing'

export interface UsePointerDrawingReturn {
  stateRef: React.RefObject<PointerDrawingState>
  getState: () => PointerDrawingState
  setState: (updater: (prev: PointerDrawingState) => PointerDrawingState) => void
  handlePointerDown: (e: PointerEvent, canvas: HTMLCanvasElement) => void
  handlePointerMove: (e: PointerEvent, canvas: HTMLCanvasElement) => void
  handlePointerUp: () => void
  handleUndo: () => void
  handleRedo: () => void
  handleClear: () => void
  handleEraseAt: (x: number, y: number, threshold: number) => void
  handleRotate: (canvasWidth: number, canvasHeight: number) => void
  getStrokes: () => Stroke[]
  getPoints: () => Point[]
  hasStrokes: () => boolean
  reset: (deviceType?: 'mouse' | 'touch' | 'pen') => void
}

export function usePointerDrawing(
  renderCallback: () => void,
  deviceType: 'mouse' | 'touch' | 'pen',
  isErasing: boolean,
): UsePointerDrawingReturn {
  const stateRef = useRef<PointerDrawingState>(createPointerDrawingState(deviceType))
  const renderCallbackRef = useRef(renderCallback)
  const isErasingRef = useRef(isErasing)

  renderCallbackRef.current = renderCallback
  isErasingRef.current = isErasing

  const getState = useCallback(() => stateRef.current, [])

  const setState = useCallback(
    (updater: (prev: PointerDrawingState) => PointerDrawingState) => {
      stateRef.current = updater(stateRef.current)
      renderCallbackRef.current()
    },
    [],
  )

  const handlePointerDown = useCallback(
    (e: PointerEvent, canvas: HTMLCanvasElement) => {
      if (isErasingRef.current) {
        const point = createPoint(e, canvas, Date.now())
        setState((prev) => eraseStrokeAt(prev, point.x, point.y, 30))
        return
      }
      const detectedType = getPointerType(e.pointerType)
      if (stateRef.current.deviceType !== detectedType) {
        stateRef.current = { ...stateRef.current, deviceType: detectedType }
      }
      const point = createPoint(e, canvas, Date.now())
      setState((prev) => startStroke(prev, point))
    },
    [setState],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent, canvas: HTMLCanvasElement) => {
      if (isErasingRef.current && (e.buttons & 1) === 1) {
        const point = createPoint(e, canvas, Date.now())
        setState((prev) => eraseStrokeAt(prev, point.x, point.y, 30))
        return
      }
      if (!stateRef.current.isDrawing) return
      const point = createPoint(e, canvas, stateRef.current.startTime)
      setState((prev) => continueStroke(prev, point))
    },
    [setState],
  )

  const handlePointerUp = useCallback(() => {
    if (isErasingRef.current) return
    setState((prev) => endStroke(prev))
  }, [setState])

  const handleUndo = useCallback(() => {
    setState((prev) => undoStroke(prev))
  }, [setState])

  const handleRedo = useCallback(() => {
    setState((prev) => redoStroke(prev))
  }, [setState])

  const handleClear = useCallback(() => {
    setState((prev) => clearAll(prev))
  }, [setState])

  const handleEraseAt = useCallback(
    (x: number, y: number, threshold: number) => {
      setState((prev) => eraseStrokeAt(prev, x, y, threshold))
    },
    [setState],
  )

  const handleRotate = useCallback(
    (canvasWidth: number, canvasHeight: number) => {
      setState((prev) => rotateStrokes90CW(prev, canvasWidth, canvasHeight))
    },
    [setState],
  )

  const getStrokes = useCallback(() => stateRef.current.strokes, [])

  const getPoints = useCallback(() => {
    const allPoints: Point[] = []
    for (const stroke of stateRef.current.strokes) {
      allPoints.push(...stroke.points)
    }
    if (stateRef.current.currentStroke) {
      allPoints.push(...stateRef.current.currentStroke.points)
    }
    return allPoints
  }, [])

  const hasStrokes = useCallback(() => {
    return stateRef.current.strokes.length > 0
  }, [])

  const reset = useCallback((newDevice?: 'mouse' | 'touch' | 'pen') => {
    stateRef.current = createPointerDrawingState(newDevice ?? deviceType)
    renderCallbackRef.current()
  }, [deviceType])

  return useMemo(
    () => ({
      stateRef,
      getState,
      setState,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleUndo,
      handleRedo,
      handleClear,
      handleEraseAt,
      handleRotate,
      getStrokes,
      getPoints,
      hasStrokes,
      reset,
    }),
    [
      getState,
      setState,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleUndo,
      handleRedo,
      handleClear,
      handleEraseAt,
      handleRotate,
      getStrokes,
      getPoints,
      hasStrokes,
      reset,
    ],
  )
}
