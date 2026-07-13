import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Contributor, Stroke, Sample } from '../types'
import { getContributor, saveContributor } from '../db/database'

const STORAGE_KEY_SESSION = 'bangla-hw-session-id'

function getSessionId(): string {
  let id = localStorage.getItem(STORAGE_KEY_SESSION)
  if (!id) {
    id = uuidv4()
    localStorage.setItem(STORAGE_KEY_SESSION, id)
  }
  return id
}

function detectDeviceType(): 'mouse' | 'touch' | 'pen' {
  if (window.matchMedia('(pointer: coarse)').matches) {
    return 'touch'
  }
  return 'mouse'
}

interface EditState {
  sampleId: string | null
  initialStrokes: Stroke[] | null
  sample: Sample | null
}

interface AppState {
  sessionId: string
  contributor: Contributor | null
  penThickness: number
  penColor: string
  showGrid: boolean
  showGuide: boolean
  totalSamples: number
  editState: EditState
  initSession: () => Promise<void>
  setPenThickness: (thickness: number) => void
  setPenColor: (color: string) => void
  setShowGrid: (show: boolean) => void
  toggleGrid: () => void
  toggleGuide: () => void
  incrementTotalSamples: () => void
  setTotalSamples: (count: number) => void
  startEdit: (sample: Sample) => void
  clearEdit: () => void
}

export const useStore = create<AppState>((set, get) => ({
  sessionId: getSessionId(),
  contributor: null,
  penThickness: Number(localStorage.getItem('bangla-hw-pen-thickness')) || 4,
  penColor: localStorage.getItem('bangla-hw-pen-color') || '#000000',
  showGrid: true,
  showGuide: false,
  totalSamples: 0,
  editState: { sampleId: null, initialStrokes: null, sample: null },

  initSession: async () => {
    const sessionId = get().sessionId
    let contributor = await getContributor(sessionId)

    if (!contributor) {
      contributor = {
        id: sessionId,
        deviceType: detectDeviceType(),
        userAgent: navigator.userAgent,
        createdAt: Date.now(),
        lastActive: Date.now(),
        sampleCount: 0,
      }
      await saveContributor(contributor)
    } else {
      contributor.lastActive = Date.now()
      await saveContributor(contributor)
    }

    set({ contributor })
  },

  setPenThickness: (thickness) => {
    localStorage.setItem('bangla-hw-pen-thickness', String(thickness))
    set({ penThickness: thickness })
  },

  setPenColor: (color) => {
    localStorage.setItem('bangla-hw-pen-color', color)
    set({ penColor: color })
  },

  setShowGrid: (show) => {
    set({ showGrid: show })
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }))
  },

  toggleGuide: () => {
    set((state) => ({ showGuide: !state.showGuide }))
  },

  incrementTotalSamples: () => {
    set((state) => ({ totalSamples: state.totalSamples + 1 }))
  },

  setTotalSamples: (count) => {
    set({ totalSamples: count })
  },

  startEdit: (sample) => {
    set({ editState: { sampleId: sample.id, initialStrokes: sample.strokes, sample } })
  },

  clearEdit: () => {
    set({ editState: { sampleId: null, initialStrokes: null, sample: null } })
  },
}))
