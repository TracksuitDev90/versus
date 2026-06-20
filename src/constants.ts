// Fixed design space. Everything is laid out in these coordinates; the on-screen
// stage is this base multiplied by a responsive scale, and export multiplies it
// by a pixelRatio. This keeps the exported PNG identical to the screen, only sharper.
export const BASE_WIDTH = 1280
export const BASE_HEIGHT = 720

export const FONT_FAMILY = 'Anton'

// The "VS" centerpiece uses a heavier, rounder display face than the labels.
export const VS_FONT_FAMILY = 'Bowlby One'

export const FONT_OPTIONS = [
  { label: 'Anton (bold display)', value: 'Anton' },
  { label: 'Bowlby One (heavy)', value: 'Bowlby One' },
  { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
  { label: 'Arial Black', value: '"Arial Black", Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
]

// Export resolution presets. pixelRatio is derived as targetWidth / BASE_WIDTH.
export const EXPORT_PRESETS = [
  { label: 'Standard — 1280 × 720', width: 1280 },
  { label: 'HD — 2560 × 1440', width: 2560 },
  { label: '4K — 3840 × 2160', width: 3840 },
] as const

export type SideId = 'left' | 'right'
