import type { Sample, ImageVariant, ColorScheme } from '../types'

export async function pngBlobToImage(pngBlob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(pngBlob)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load PNG'))
      img.src = url
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function getBoundingbox(
  img: HTMLImageElement,
): { x: number; y: number; w: number; h: number } {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  let minX = canvas.width
  let minY = canvas.height
  let maxX = 0
  let maxY = 0
  let found = false

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      if (r < 128 || g < 128 || b < 128) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
        found = true
      }
    }
  }

  if (!found) return { x: 0, y: 0, w: img.width, h: img.height }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

export async function processImage(
  sample: Sample,
  variant: ImageVariant,
  colorScheme: ColorScheme,
): Promise<Blob> {
  const img = await pngBlobToImage(sample.pngBlob)
  const padding = 10

  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height

  if (variant === 'cropped' || variant === 'centered') {
    const bbox = getBoundingbox(img)
    if (variant === 'cropped') {
      sx = bbox.x
      sy = bbox.y
      sw = bbox.w
      sh = bbox.h
    } else {
      const maxDim = Math.max(bbox.w, bbox.h)
      sx = bbox.x + bbox.w / 2 - maxDim / 2
      sy = bbox.y + bbox.h / 2 - maxDim / 2
      sw = maxDim
      sh = maxDim
    }
  }

  let outputW = sw
  let outputH = sh
  if (variant === '28x28') { outputW = 28; outputH = 28 }
  else if (variant === '64x64') { outputW = 64; outputH = 64 }
  else if (variant === '128x128') { outputW = 128; outputH = 128 }

  if (variant === '28x28' || variant === '64x64' || variant === '128x128') {
    const aspect = sw / sh
    if (aspect > 1) {
      sh = sw / aspect
    } else {
      sw = sh * aspect
    }
  }

  const paddedW = outputW + padding * 2
  const paddedH = outputH + padding * 2

  const canvas = document.createElement('canvas')
  canvas.width = paddedW
  canvas.height = paddedH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  const bgColor = colorScheme === 'black-on-white' ? '#ffffff' : '#000000'
  const strokeColor = colorScheme === 'black-on-white' ? '#000000' : '#ffffff'

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, paddedW, paddedH)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sw, sh, padding, padding, outputW, outputH)

  if (colorScheme === 'white-on-black') {
    const imageData = ctx.getImageData(0, 0, paddedW, paddedH)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]
      data[i + 1] = 255 - data[i + 1]
      data[i + 2] = 255 - data[i + 2]
    }
    ctx.putImageData(imageData, 0, 0)
  }

  void strokeColor

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
      'image/png',
    )
  })
}

export async function processImageRaw(
  sample: Sample,
  colorScheme: ColorScheme,
): Promise<Blob> {
  const img = await pngBlobToImage(sample.pngBlob)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  ctx.fillStyle = colorScheme === 'black-on-white' ? '#ffffff' : '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)

  if (colorScheme === 'white-on-black') {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]
      data[i + 1] = 255 - data[i + 1]
      data[i + 2] = 255 - data[i + 2]
    }
    ctx.putImageData(imageData, 0, 0)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
      'image/png',
    )
  })
}

export function getVariantLabel(variant: ImageVariant): string {
  const labels: Record<ImageVariant, string> = {
    'raw': 'Raw (as drawn)',
    'cropped': 'Cropped to content',
    'centered': 'Centered',
    '28x28': '28x28 (MNIST)',
    '64x64': '64x64',
    '128x128': '128x128',
  }
  return labels[variant]
}
