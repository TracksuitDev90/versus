// Fixed design space. Everything is laid out in these coordinates; the on-screen
// stage is this base multiplied by a responsive scale, and export multiplies it
// by a pixelRatio. This keeps the exported PNG identical to the screen, only sharper.
export const BASE_WIDTH = 1920
export const BASE_HEIGHT = 1080

// Bowlby One is the default display face across every text element.
export const FONT_FAMILY = 'Bowlby One'

// The "VS" centerpiece shares the same heavy, rounded display face.
export const VS_FONT_FAMILY = 'Bowlby One'

// Curated bold display set, all loaded from Google Fonts (see index.html).
export const FONT_OPTIONS = [
  { label: 'Bowlby One (default)', value: 'Bowlby One' },
  { label: 'Anton (condensed)', value: 'Anton' },
  { label: 'Archivo Black', value: 'Archivo Black' },
  { label: 'Bebas Neue (tall)', value: 'Bebas Neue' },
  { label: 'Bungee (blocky)', value: 'Bungee' },
  { label: 'Russo One', value: 'Russo One' },
  { label: 'Luckiest Guy (cartoon)', value: 'Luckiest Guy' },
]

// Export resolution presets. pixelRatio is derived as targetWidth / BASE_WIDTH.
export const EXPORT_PRESETS = [
  { label: 'Full HD — 1920 × 1080', width: 1920 },
  { label: 'QHD — 2560 × 1440', width: 2560 },
  { label: '4K — 3840 × 2160', width: 3840 },
] as const

export type SideId = 'left' | 'right'
