import type { BanglaCharacter } from '../data/banglaChars'
import type { PresentationMode } from '../types'

export function getSequentialOrder(chars: BanglaCharacter[]): number[] {
  return chars.map((c) => c.id)
}

export function getRandomizedOrder(chars: BanglaCharacter[]): number[] {
  const ids = chars.map((c) => c.id)
  const shuffled = [...ids]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function getAdaptiveOrder(
  chars: BanglaCharacter[],
  counts: Map<number, number>,
): number[] {
  return [...chars]
    .map((c) => ({ id: c.id, count: counts.get(c.id) ?? 0 }))
    .sort((a, b) => a.count - b.count)
    .map((c) => c.id)
}

export function getOrderForMode(
  mode: PresentationMode,
  chars: BanglaCharacter[],
  counts?: Map<number, number>,
): number[] {
  switch (mode) {
    case 'sequential':
      return getSequentialOrder(chars)
    case 'randomized':
      return getRandomizedOrder(chars)
    case 'adaptive':
      return getAdaptiveOrder(chars, counts ?? new Map())
    case 'user-select':
      return getSequentialOrder(chars)
    default:
      return getSequentialOrder(chars)
  }
}
