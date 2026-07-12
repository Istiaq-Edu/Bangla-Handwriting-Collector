import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Contributor, PresentationMode, Theme, Stroke, Sample } from '../types'
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

function getStoredTheme(): Theme {
  const stored = localStorage.getItem('bangla-hw-theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface EditState {
  sampleId: string | null
  initialStrokes: Stroke[] | null
  sample: Sample | null
}

interface AppState {
  sessionId: string
  contributor: Contributor | null
  presentationMode: PresentationMode
  theme: Theme
  penThickness: number
  penColor: string
  showGrid: boolean
  showGuide: boolean
  totalSamples: number
  editState: EditState
  initSession: () => Promise<void>
  setPresentationMode: (mode: PresentationMode) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setPenThickness: (thickness: number) => void
  setPenColor: (color: string) => void
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
  presentationMode: (localStorage.getItem('bangla-hw-presentation-mode') as PresentationMode) || 'sequential',
  theme: getStoredTheme(),
  penThickness: Number(localStorage.getItem('bangla-hw-pen-thickness')) || 4,
  penColor: localStorage.getItem('bangla-hw-pen-color') || '#000000',
  showGrid: false,
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

    document.documentElement.classList.toggle('dark', get().theme === 'dark')

    set({ contributor })
  },

  setPresentationMode: (mode) => {
    localStorage.setItem('bangla-hw-presentation-mode', mode)
    set({ presentationMode: mode })
  },

  setTheme: (theme) => {
    localStorage.setItem('bangla-hw-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },

  toggleTheme: () => {
    const current = get().theme
    get().setTheme(current === 'light' ? 'dark' : 'light')
  },

  setPenThickness: (thickness) => {
    localStorage.setItem('bangla-hw-pen-thickness', String(thickness))
    set({ penThickness: thickness })
  },

  setPenColor: (color) => {
    localStorage.setItem('bangla-hw-pen-color', color)
    set({ penColor: color })
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
