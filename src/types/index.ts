export interface Point {
  x: number
  y: number
  t: number
  p: number | null
}

export interface Stroke {
  points: Point[]
}

export interface Sample {
  id: string
  character: string
  characterId: number
  transliteration: string
  category: 'vowel' | 'consonant' | 'numeral'
  strokes: Stroke[]
  strokeCount: number
  deviceType: 'mouse' | 'touch' | 'pen'
  hasPressure: boolean
  canvasWidth: number
  canvasHeight: number
  penThickness: number
  penColor?: string
  pngBlob: Blob
  svgString: string
  createdAt: number
  contributorId: string
}

export interface Contributor {
  id: string
  deviceType: string
  userAgent: string
  createdAt: number
  lastActive: number
  sampleCount: number
}

export type PresentationMode = 'sequential' | 'randomized' | 'adaptive' | 'user-select'

export type Theme = 'light' | 'dark'

export type DeviceType = 'mouse' | 'touch' | 'pen'

export interface Settings {
  presentationMode: PresentationMode
  theme: Theme
  penThickness: number
}

export type ExportFormat = 'folder-csv' | 'flat-jsonl' | 'tfrecord' | 'hdf5'

export type ImageVariant =
  | 'raw'
  | 'cropped'
  | 'centered'
  | '28x28'
  | '64x64'
  | '128x128'

export type ColorScheme = 'black-on-white' | 'white-on-black'
