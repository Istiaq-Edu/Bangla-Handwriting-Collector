import type { Stroke } from '../types'

export function setupCanvas(
  canvas: HTMLCanvasElement,
  dpr: number,
): { ctx: CanvasRenderingContext2D; width: number; height: number } {
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width * dpr))
  const height = Math.max(1, Math.floor(rect.height * dpr))

  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Failed to get 2D canvas context')

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#000000'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  return { ctx, width: canvas.width, height: canvas.height }
}

export function renderStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  currentStroke: Stroke | null,
  isErasing: boolean,
): void {
  const canvas = ctx.canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const stroke of strokes) {
    drawStroke(ctx, stroke)
  }

  if (currentStroke && !isErasing) {
    drawStroke(ctx, currentStroke)
  }
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
): void {
  const pts = stroke.points
  if (pts.length === 0) return

  const dpr = window.devicePixelRatio || 1
  const thickness = stroke.thickness * dpr
  const color = stroke.color || '#000000'
  ctx.lineWidth = thickness
  ctx.strokeStyle = color
  ctx.fillStyle = color

  if (pts.length === 1) {
    const p = pts[0]
    ctx.beginPath()
    ctx.arc(p.x, p.y, thickness / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  if (pts.length === 2) {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    ctx.lineTo(pts[1].x, pts[1].y)
    ctx.stroke()
    return
  }

  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }

  ctx.stroke()
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to convert canvas to PNG'))
      },
      'image/png',
    )
  })
}

export function clearCanvas(ctx: CanvasRenderingContext2D): void {
  const canvas = ctx.canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

export function getCanvasDpr(): number {
  return window.devicePixelRatio || 1
}
