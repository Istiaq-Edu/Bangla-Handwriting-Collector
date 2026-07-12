import JSZip from 'jszip'
import type { Sample, ImageVariant, ColorScheme, ExportFormat } from '../types'
import { processImage, processImageRaw, getVariantLabel } from './imageProcessing'
import { getCharacterById } from '../data/banglaChars'

interface ExportOptions {
  formats: ExportFormat[]
  imageVariants: ImageVariant[]
  colorScheme: ColorScheme
  onProgress?: (current: number, total: number, label: string) => void
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0')
}

function getFolderName(charId: number): string {
  const char = getCharacterById(charId)
  if (!char) return `char_${pad(charId, 2)}`
  return `${pad(charId, 2)}_${char.unicode}`
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

async function buildFolderClassCsv(
  zip: JSZip,
  samples: Sample[],
  options: ExportOptions,
): Promise<void> {
  const imageFolder = zip.folder('images')!
  const svgFolder = zip.folder('svg')!

  const csvRows: string[] = [
    'character,transliteration,category,strokeCount,deviceType,hasPressure,canvasWidth,canvasHeight,penThickness,createdAt,contributorId,fileName',
  ]

  const charIndexMap = new Map<number, number>()

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    const { onProgress } = options
    onProgress?.(i + 1, samples.length, `Processing ${sample.character}...`)

    const folderName = getFolderName(sample.characterId)
    const idx = (charIndexMap.get(sample.characterId) ?? 0) + 1
    charIndexMap.set(sample.characterId, idx)
    const fileName = `${pad(idx, 4)}.png`

    const imgFolder = imageFolder.folder(folderName)!
    const svgF = svgFolder.folder(folderName)!

    for (const variant of options.imageVariants) {
      let blob: Blob
      if (variant === 'raw') {
        blob = await processImageRaw(sample, options.colorScheme)
      } else {
        blob = await processImage(sample, variant, options.colorScheme)
      }
      const variantFolder = imgFolder.folder(variant)!
      variantFolder.file(`${pad(idx, 4)}.png`, blob)
    }

    svgF.file(`${pad(idx, 4)}.svg`, sample.svgString)

    csvRows.push([
      csvEscape(sample.character),
      csvEscape(sample.transliteration),
      sample.category,
      String(sample.strokeCount),
      sample.deviceType,
      String(sample.hasPressure),
      String(sample.canvasWidth),
      String(sample.canvasHeight),
      String(sample.penThickness),
      new Date(sample.createdAt).toISOString(),
      sample.contributorId.slice(0, 8),
      `${folderName}/${fileName}`,
    ].join(','))
  }

  zip.file('metadata.csv', csvRows.join('\n'))
}

async function buildFlatJsonl(
  zip: JSZip,
  samples: Sample[],
  options: ExportOptions,
): Promise<void> {
  const flatFolder = zip.folder('flat')!
  const labelsRows: string[] = []

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    options.onProgress?.(i + 1, samples.length, `Processing ${sample.character}...`)

    const fileName = `${pad(i + 1, 5)}.png`

    for (const variant of options.imageVariants) {
      let blob: Blob
      if (variant === 'raw') {
        blob = await processImageRaw(sample, options.colorScheme)
      } else {
        blob = await processImage(sample, variant, options.colorScheme)
      }
      const variantFolder = flatFolder.folder(variant)!
      variantFolder.file(fileName, blob)
    }

    labelsRows.push(JSON.stringify({
      file: fileName,
      character: sample.character,
      characterId: sample.characterId,
      transliteration: sample.transliteration,
      category: sample.category,
      strokeCount: sample.strokeCount,
      deviceType: sample.deviceType,
      hasPressure: sample.hasPressure,
      createdAt: sample.createdAt,
    }))
  }

  flatFolder.file('labels.jsonl', labelsRows.join('\n'))
}

function buildStrokesJsonl(zip: JSZip, samples: Sample[]): void {
  const rows = samples.map((s) =>
    JSON.stringify({
      id: s.id,
      character: s.character,
      characterId: s.characterId,
      transliteration: s.transliteration,
      strokes: s.strokes,
      strokeCount: s.strokeCount,
      deviceType: s.deviceType,
      hasPressure: s.hasPressure,
      canvasWidth: s.canvasWidth,
      canvasHeight: s.canvasHeight,
      penThickness: s.penThickness,
      createdAt: s.createdAt,
      contributorId: s.contributorId,
    }),
  )
  zip.file('strokes.jsonl', rows.join('\n'))
}

async function buildTfrecord(
  zip: JSZip,
  samples: Sample[],
  options: ExportOptions,
): Promise<void> {
  const tfrecordFolder = zip.folder('tfrecord')!

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    options.onProgress?.(i + 1, samples.length, `TFRecord: ${sample.character}...`)

    const variant = options.imageVariants[0] ?? 'raw'
    let blob: Blob
    if (variant === 'raw') {
      blob = await processImageRaw(sample, options.colorScheme)
    } else {
      blob = await processImage(sample, variant, options.colorScheme)
    }
    const arrayBuffer = await blob.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)

    const feature = {
      image: { bytesList: { values: [uint8] } },
      label: { bytesList: { values: [new TextEncoder().encode(sample.character)] } },
      characterId: { int64List: { values: [BigInt(sample.characterId)] } },
      strokeCount: { int64List: { values: [BigInt(sample.strokeCount)] } },
      deviceType: { bytesList: { values: [new TextEncoder().encode(sample.deviceType)] } },
    }

    const features = { feature }
    const jsonStr = JSON.stringify(features, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    )
    const featureBytes = new TextEncoder().encode(jsonStr)

    const header = new ArrayBuffer(8)
    const view = new DataView(header)
    view.setUint32(0, featureBytes.length, true)
    view.setUint32(4, 0, true)

    const record = new Uint8Array(8 + featureBytes.length)
    record.set(new Uint8Array(header), 0)
    record.set(featureBytes, 8)

    const charFolder = tfrecordFolder.folder(getFolderName(sample.characterId))!
    charFolder.file(`${pad(i + 1, 5)}.tfrecord`, record)
  }
}

async function buildHdf5(
  zip: JSZip,
  samples: Sample[],
  options: ExportOptions,
): Promise<void> {
  const hdf5Folder = zip.folder('hdf5')!

  const byChar = new Map<number, Sample[]>()
  for (const s of samples) {
    const arr = byChar.get(s.characterId) ?? []
    arr.push(s)
    byChar.set(s.characterId, arr)
  }

  let processed = 0
  for (const [charId, charSamples] of byChar) {
    const variant = options.imageVariants[0] ?? 'raw'
    const images: Uint8Array[] = []

    for (const sample of charSamples) {
      options.onProgress?.(++processed, samples.length, `HDF5: ${sample.character}...`)
      let blob: Blob
      if (variant === 'raw') {
        blob = await processImageRaw(sample, options.colorScheme)
      } else {
        blob = await processImage(sample, variant, options.colorScheme)
      }
      images.push(new Uint8Array(await blob.arrayBuffer()))
    }

    const folderName = getFolderName(charId)
    const charFolder = hdf5Folder.folder(folderName)!

    const jsonMeta = {
      character: charSamples[0].character,
      characterId: charId,
      transliteration: charSamples[0].transliteration,
      count: charSamples.length,
      variant,
      colorScheme: options.colorScheme,
      images: images.map((img, i) => ({
        index: i,
        byteLength: img.byteLength,
      })),
    }

    charFolder.file('meta.json', JSON.stringify(jsonMeta, null, 2))

    images.forEach((img, i) => {
      charFolder.file(`${pad(i + 1, 4)}.bin`, img)
    })
  }
}

function buildReadme(zip: JSZip, options: ExportOptions, sampleCount: number): void {
  const date = new Date().toISOString().slice(0, 10)
  const lines = [
    'Bangla Handwriting Dataset',
    '==========================',
    '',
    `Collection Date: ${date}`,
    `Total Samples: ${sampleCount}`,
    '',
    'Image Variants:',
    ...options.imageVariants.map((v) => `  - ${getVariantLabel(v)}`),
    '',
    `Color Scheme: ${options.colorScheme}`,
    '',
    'Export Formats:',
    ...options.formats.map((f) => `  - ${f}`),
    '',
    'Folder Structure:',
    '  images/<XX_char>/<variant>/NNNN.png  - Processed images by character and variant',
    '  svg/<XX_char>/NNNN.svg               - Vector SVG files',
    '  metadata.csv                          - Sample metadata (CSV)',
    '  strokes.jsonl                         - Raw stroke data (JSONL, one per line)',
    '  flat/<variant>/NNNNN.png             - Flat image files',
    '  flat/labels.jsonl                     - Labels for flat images',
    '  tfrecord/<XX_char>/NNNNN.tfrecord     - TFRecord format',
    '  hdf5/<XX_char>/meta.json + .bin files - HDF5-style format',
    '',
    'Note: TFRecord and HDF5 formats use simplified serialization.',
    'TFRecord uses JSON-based feature encoding.',
    'HDF5 uses binary blobs with JSON metadata (read with h5py or custom loader).',
  ]
  zip.file('README.txt', lines.join('\n'))
}

export async function buildZip(
  samples: Sample[],
  options: ExportOptions,
): Promise<Blob> {
  const zip = new JSZip()

  buildStrokesJsonl(zip, samples)

  for (const format of options.formats) {
    switch (format) {
      case 'folder-csv':
        await buildFolderClassCsv(zip, samples, options)
        break
      case 'flat-jsonl':
        await buildFlatJsonl(zip, samples, options)
        break
      case 'tfrecord':
        await buildTfrecord(zip, samples, options)
        break
      case 'hdf5':
        await buildHdf5(zip, samples, options)
        break
    }
  }

  buildReadme(zip, options, samples.length)

  return zip.generateAsync({ type: 'blob' })
}

export async function shareZip(zipBlob: Blob, fileName: string): Promise<boolean> {
  if (!navigator.share) return false
  const file = new File([zipBlob], fileName, { type: 'application/zip' })
  if (!navigator.canShare({ files: [file] })) return false
  await navigator.share({ files: [file], title: 'Bangla Handwriting Dataset' })
  return true
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
