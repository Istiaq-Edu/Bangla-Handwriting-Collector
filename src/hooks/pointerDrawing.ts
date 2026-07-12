import type { Point, Stroke } from '../types'

export interface PointerDrawingState {
  strokes: Stroke[]
  redoStack: Stroke[]
  isDrawing: boolean
  currentStroke: Stroke | null
  startTime: number
  deviceType: 'mouse' | 'touch' | 'pen'
  hasPressure: boolean
}

export function createPointerDrawingState(
  deviceType: 'mouse' | 'touch' | 'pen',
): PointerDrawingState {
  return {
    strokes: [],
    redoStack: [],
    isDrawing: false,
    currentStroke: null,
    startTime: 0,
    deviceType,
    hasPressure: false,
  }
}

export function getPointerType(
  pointerType: string,
): 'mouse' | 'touch' | 'pen' {
  if (pointerType === 'pen') return 'pen'
  if (pointerType === 'touch') return 'touch'
  return 'mouse'
}

export function createPoint(
  e: PointerEvent,
  canvas: HTMLCanvasElement,
  startTime: number,
): Point {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
  const t = Date.now() - startTime
  const p = e.pressure > 0 && e.pressure < 1 ? e.pressure : null

  return { x, y, t, p }
}

export function startStroke(
  state: PointerDrawingState,
  point: Point,
  thickness: number,
  color: string,
): PointerDrawingState {
  const newStroke: Stroke = { points: [point], thickness, color }
  return {
    ...state,
    isDrawing: true,
    currentStroke: newStroke,
    startTime: Date.now(),
    hasPressure: state.hasPressure || point.p !== null,
  }
}

export function continueStroke(
  state: PointerDrawingState,
  point: Point,
): PointerDrawingState {
  if (!state.isDrawing || !state.currentStroke) return state
  const pts = state.currentStroke.points
  const last = pts[pts.length - 1]

  // Minimum distance filter — skip points too close together (reduces noise)
  const dist = Math.hypot(point.x - last.x, point.y - last.y)
  if (dist < 1) return state

  // Exponential smoothing (low-pass filter) to reduce hand tremor jitter.
  // Blend the new point toward the previous one — factor 0.65 keeps it responsive.
  const smoothing = 0.35
  const smoothedPoint: Point = {
    x: last.x * smoothing + point.x * (1 - smoothing),
    y: last.y * smoothing + point.y * (1 - smoothing),
    t: point.t,
    p: point.p,
  }

  const updatedStroke: Stroke = {
    points: [...pts, smoothedPoint],
    thickness: state.currentStroke.thickness,
    color: state.currentStroke.color,
  }
  return {
    ...state,
    currentStroke: updatedStroke,
    hasPressure: state.hasPressure || point.p !== null,
  }
}

export function endStroke(
  state: PointerDrawingState,
): PointerDrawingState {
  if (!state.currentStroke) {
    return { ...state, isDrawing: false, currentStroke: null }
  }
  return {
    ...state,
    strokes: [...state.strokes, state.currentStroke],
    redoStack: [],
    isDrawing: false,
    currentStroke: null,
  }
}

export function undoStroke(
  state: PointerDrawingState,
): PointerDrawingState {
  if (state.strokes.length === 0) return state
  const lastStroke = state.strokes[state.strokes.length - 1]
  return {
    ...state,
    strokes: state.strokes.slice(0, -1),
    redoStack: [...state.redoStack, lastStroke],
  }
}

export function redoStroke(
  state: PointerDrawingState,
): PointerDrawingState {
  if (state.redoStack.length === 0) return state
  const stroke = state.redoStack[state.redoStack.length - 1]
  return {
    ...state,
    strokes: [...state.strokes, stroke],
    redoStack: state.redoStack.slice(0, -1),
  }
}

export function clearAll(state: PointerDrawingState): PointerDrawingState {
  return {
    ...state,
    strokes: [],
    redoStack: [],
    isDrawing: false,
    currentStroke: null,
  }
}

export function eraseStrokeAt(
  state: PointerDrawingState,
  x: number,
  y: number,
  threshold: number,
): PointerDrawingState {
  const remaining = state.strokes.filter((stroke) => {
    return !stroke.points.some(
      (point) => Math.abs(point.x - x) < threshold && Math.abs(point.y - y) < threshold,
    )
  })
  const removed = state.strokes.length - remaining.length
  if (removed === 0) return state
  return {
    ...state,
    strokes: remaining,
  }
}

export function rotateStrokes90CW(
  state: PointerDrawingState,
  canvasWidth: number,
  canvasHeight: number,
): PointerDrawingState {
  if (state.strokes.length === 0 && !state.currentStroke) return state

  // 90° CW rotation: new_x = H - y, new_y = x
  // After rotation, the drawing fits in a H×W space (swapped dimensions)
  const rotatePoint = (p: Point): Point => ({
    x: canvasHeight - p.y,
    y: p.x,
    t: p.t,
    p: p.p,
  })

  void canvasWidth

  const rotatedStrokes = state.strokes.map((stroke) => ({
    points: stroke.points.map(rotatePoint),
    thickness: stroke.thickness,
    color: stroke.color,
  }))

  const rotatedCurrent = state.currentStroke
    ? { points: state.currentStroke.points.map(rotatePoint), thickness: state.currentStroke.thickness, color: state.currentStroke.color }
    : null

  return {
    ...state,
    strokes: rotatedStrokes,
    currentStroke: rotatedCurrent,
    redoStack: [],
  }
}
