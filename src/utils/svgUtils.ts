import type { Stroke } from '../types'

export function strokesToSvg(
  strokes: Stroke[],
  width: number,
  height: number,
  penThickness: number,
): string {
  const paths = strokes.map((stroke) => strokeToPath(stroke, penThickness))

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <g fill="none" stroke="#000000" stroke-width="${penThickness}" stroke-linecap="round" stroke-linejoin="round">
${paths.map((p) => `    ${p}`).join('\n')}
  </g>
</svg>`
}

function strokeToPath(stroke: Stroke, penThickness: number): string {
  if (stroke.points.length === 0) return ''

  if (stroke.points.length === 1) {
    const p = stroke.points[0]
    return `<circle cx="${p.x}" cy="${p.y}" r="${penThickness / 2}" fill="#000000"/>`
  }

  const d: string[] = []
  d.push(`M ${stroke.points[0].x} ${stroke.points[0].y}`)

  for (let i = 1; i < stroke.points.length - 1; i++) {
    const p1 = stroke.points[i]
    const p2 = stroke.points[i + 1]
    const midX = (p1.x + p2.x) / 2
    const midY = (p1.y + p2.y) / 2
    d.push(`Q ${p1.x} ${p1.y} ${midX} ${midY}`)
  }

  const last = stroke.points[stroke.points.length - 1]
  d.push(`L ${last.x} ${last.y}`)

  return `<path d="${d.join(' ')}"/>`
}
